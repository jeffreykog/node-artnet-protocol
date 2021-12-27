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
exports.ArtNetController = void 0;
const protocol_1 = require("./protocol");
const opcodes_1 = require("./opcodes");
const dgram = require("dgram");
const ip6addr = require("ip6addr");
const os = require("os");
const EventEmitter = require("events");
const PORT = 6454;
class ArtNetController extends EventEmitter {
    constructor(isController = false) {
        super();
        this.nameShort = 'NodeArtNetProto';
        this.nameLong = 'https://github.com/jeffreykog/node-artnet-protocol';
        this.isController = isController;
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
        if (this.isController) {
            this.intervalArtPoll = setInterval(this.artPollTimer.bind(this), 5000);
        }
        if (this.unicastAddress != null) {
            this.sendArtPollReply();
        }
    }
    sendBroadcastPacket(packet) {
        if (this.socketBroadcast == null) {
            return;
        }
        const buffer = packet.encode();
        this.socketBroadcast.send(buffer, 0, buffer.length, PORT, this.broadcastAddress);
    }
    artPollTimer() {
        this.sendBroadcastPacket(new protocol_1.ArtPoll(true, true, true, false, opcodes_1.DP_ALL));
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.intervalArtPoll) {
                clearInterval(this.intervalArtPoll);
            }
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
    }
    sendArtPollReply() {
        const packet = new protocol_1.ArtPollReply(this.unicastAddress, PORT, 0, 0, 0, 0xffff, 0, 1);
        packet.nameShort = this.nameShort;
        packet.nameLong = this.nameLong;
        packet.portInfo[0] = new protocol_1.PortInfo(false, true, opcodes_1.PROTOCOL_DMX512);
        this.sendBroadcastPacket(packet);
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
            this.sendArtPollReply();
        }
        else if (packet instanceof protocol_1.ArtPollReply) {
        }
        else {
            console.log(packet.toString());
        }
    }
}
exports.ArtNetController = ArtNetController;
//# sourceMappingURL=controller.js.map