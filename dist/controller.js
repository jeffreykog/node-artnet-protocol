"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtNetUniverse = exports.ArtNetController = void 0;
const protocol_1 = require("./protocol");
const opcodes_1 = require("./opcodes");
const dgram = require("dgram");
const ip6addr = require("ip6addr");
const os = require("os");
const EventEmitter = require("events");
const PORT = 6454;
const FRAMES_PER_SECOND = 44;
class ArtNetController extends EventEmitter {
    constructor() {
        super();
        const interfaces = os.networkInterfaces();
        const prefixes = {};
        Object.entries(interfaces).forEach(([ifName, addresses]) => {
            if (!addresses) {
                return;
            }
            addresses.forEach(addressInfo => {
                prefixes[addressInfo.cidr] = ip6addr.createCIDR(addressInfo.cidr);
            });
        });
        this.interfacePrefixes = prefixes;
        this.universes = [];
    }
    bind(host) {
        if (host === '0.0.0.0' || host === '::') {
            host = undefined;
        }
        let prefixInfo = undefined;
        let broadcastAddress = undefined;
        let unicastAddress = undefined;
        if (host != null) {
            Object.keys(this.interfacePrefixes).forEach((cidr) => {
                const prefix = this.interfacePrefixes[cidr];
                if (prefix.contains(host)) {
                    prefixInfo = prefix;
                }
            });
            if (prefixInfo) {
                broadcastAddress = prefixInfo.broadcast().toString();
                unicastAddress = host;
            }
            else {
                throw Error('Bind host ' + host + ' does not match any network interface');
            }
        }
        else {
            broadcastAddress = '0.0.0.0';
        }
        if (broadcastAddress !== null) {
            console.log("Binding broadcast address " + broadcastAddress + ":6454");
            this.broadcastAddress = broadcastAddress;
            const socketBroadcast = dgram.createSocket({ type: 'udp4', reuseAddr: true });
            socketBroadcast.on('error', this.onSocketError);
            socketBroadcast.on('message', (message, rinfo) => {
                this.onSocketMessage('broadcast', message, rinfo);
            });
            socketBroadcast.on('listening', this.onSocketBroadcastListening.bind(this));
            socketBroadcast.bind(PORT, broadcastAddress);
            this.socketBroadcast = socketBroadcast;
        }
        if (unicastAddress !== null) {
            console.log("Binding unicast address " + unicastAddress + ":6454");
            this.unicastAddress = unicastAddress;
            const socketUnicast = dgram.createSocket({ type: 'udp4', reuseAddr: true });
            socketUnicast.on('error', this.onSocketError);
            socketUnicast.on('message', (message, rinfo) => {
                this.onSocketMessage('unicast', message, rinfo);
            });
            socketUnicast.bind(PORT, unicastAddress);
            this.socketUnicast = socketUnicast;
        }
        this.intervalArtPoll = setInterval(this.artPollTimer.bind(this), 5000);
        if (this.unicastAddress != null) {
            this.sendBroadcastPacket(new protocol_1.ArtPollReply(this.unicastAddress, PORT, 0, 0, 0, 0xffff, 0));
        }
    }
    createUniverse(index) {
        const universe = new ArtNetUniverse(this, index);
        this.universes.push(universe);
        return universe;
    }
    sendBroadcastPacket(packet) {
        if (this.socketBroadcast == null) {
            return;
        }
        const buffer = packet.encode();
        this.socketBroadcast.send(buffer, 0, buffer.length, PORT, this.broadcastAddress);
    }
    artPollTimer() {
        this.sendBroadcastPacket(new protocol_1.ArtPoll(14, true, true, true, false, opcodes_1.DP_ALL));
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([
                new Promise((resolve) => { var _a; return (_a = this.socketBroadcast) === null || _a === void 0 ? void 0 : _a.close(() => resolve(undefined)); }),
                new Promise((resolve) => { var _a; return (_a = this.socketUnicast) === null || _a === void 0 ? void 0 : _a.close(() => resolve(undefined)); }),
            ]);
        });
    }
    onSocketError(err) {
    }
    onSocketBroadcastListening() {
        if (this.socketBroadcast == null) {
            return;
        }
        this.socketBroadcast.setBroadcast(true);
        this.universes.forEach(universe => universe.start());
    }
    onSocketMessage(socketType, msg, rinfo) {
        const packet = protocol_1.decode(msg);
        if (!packet) {
            return;
        }
        if (packet instanceof protocol_1.ArtDmx) {
            this.emit("dmx", packet);
        }
        else if (packet instanceof protocol_1.ArtPoll) {
            console.log('ArtPoll', packet);
        }
        else if (packet instanceof protocol_1.ArtPollReply) {
            console.log('ArtPollReply', packet);
        }
    }
    getUniverse(id) {
        return this.universes[id];
    }
}
exports.ArtNetController = ArtNetController;
class ArtNetUniverse {
    constructor(controller, universe, size) {
        this.renderCache = [];
        this.controller = controller;
        this.universe = universe;
        this.size = size || 512;
        this.sequence = 1;
        this.renderCache.fill(0);
    }
    start() {
        if (this.renderInterval == null) {
            this.renderInterval = setInterval(this._renderLoop.bind(this), 1000 / FRAMES_PER_SECOND);
        }
    }
    _renderLoop() {
        const packet = new protocol_1.ArtDmx(14, this._nextSequence(), 0, this.universe, this.renderCache);
        this.controller.sendBroadcastPacket(packet);
    }
    _nextSequence() {
        if (this.sequence > 255) {
            this.sequence = 1;
        }
        return this.sequence++;
    }
    getChannel(channel) {
        return this.renderCache[channel];
    }
    setChannel(channel, value) {
        this.renderCache[channel] = value;
    }
}
exports.ArtNetUniverse = ArtNetUniverse;
class ArtNetChannel {
}
//# sourceMappingURL=controller.js.map