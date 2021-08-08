import { RemoteInfo, Socket } from 'dgram';
import Timeout = NodeJS.Timeout;
import { ArtDmx, ArtNetPacket, ArtPoll, ArtPollReply, decode } from './protocol';
import { DP_ALL } from './opcodes';
import * as dgram from 'dgram';
import * as ip6addr from 'ip6addr';
import * as os from 'os';
import EventEmitter = require('events');

const PORT = 6454;
const FRAMES_PER_SECOND = 44;

export class ArtNetController extends EventEmitter {

    private readonly interfacePrefixes: { [key: string]: ip6addr.CIDR };
    private readonly isController: boolean;

    socketUnicast?: Socket;
    socketBroadcast?: Socket;

    private broadcastAddress?: string;
    private unicastAddress?: string;

    private universes: ArtNetUniverse[];

    private intervalArtPoll?: Timeout;

    constructor(isController: boolean = false) {
        super();

        this.isController = isController;

        const interfaces = os.networkInterfaces();
        const prefixes: { [key: string]: ip6addr.CIDR }  = {};
        Object.entries(interfaces).forEach(([ifName, addresses]) => {
            if (!addresses) {
                return;
            }
            addresses.forEach(addressInfo => {
                prefixes[addressInfo.cidr as string] = ip6addr.createCIDR(addressInfo.cidr as string);
            });
        });
        this.interfacePrefixes = prefixes;

        this.universes = [];
    }

    public bind(host?: string) {
        if (host === '0.0.0.0' || host === '::') {
            host = undefined;
        }
        let prefixInfo: ip6addr.CIDR | undefined = undefined;
        let broadcastAddress: string | undefined = undefined;
        let unicastAddress: string | undefined = undefined;
        if (host != null) {
            Object.keys(this.interfacePrefixes).forEach((cidr) => {
                const prefix = this.interfacePrefixes[cidr];
                if (prefix.contains(host as string)) {
                    prefixInfo = prefix;
                }
            });
            if (prefixInfo) {
                broadcastAddress = (prefixInfo as ip6addr.CIDR).broadcast().toString();
                unicastAddress = host;
            } else {
                throw Error('Bind host ' + host + ' does not match any network interface')
            }
        } else {
            broadcastAddress = '0.0.0.0';
        }

        if (broadcastAddress !== null) {
            console.log("Binding broadcast address " + broadcastAddress + ":6454");
            this.broadcastAddress = broadcastAddress;
            const socketBroadcast = dgram.createSocket({type: 'udp4', reuseAddr: true});
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
            const socketUnicast = dgram.createSocket({type: 'udp4', reuseAddr: true});
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

        // Send ArtPollReply message to interface on startup, announcing ShowMaster as a controller.
        if (this.unicastAddress != null) {
            this.sendBroadcastPacket(new ArtPollReply(this.unicastAddress, PORT, 0, 0, 0, 0xffff, 0));
        }
    }

    public createUniverse(index: number) {
        const universe = new ArtNetUniverse(this, index);
        this.universes.push(universe);
        return universe;
    }

    public sendBroadcastPacket(packet: ArtNetPacket) {
        if (this.socketBroadcast == null) {
            return;
        }
        const buffer = packet.encode();
        this.socketBroadcast.send(buffer, 0, buffer.length, PORT, this.broadcastAddress);
    }

    private artPollTimer() {
        this.sendBroadcastPacket(new ArtPoll(14, true, true, true, false, DP_ALL));
    }

    public async close() {
        if (this.intervalArtPoll) {
            clearInterval(this.intervalArtPoll);
        }
        await Promise.all([
            new Promise((resolve) => this.socketBroadcast?.close(() => resolve(undefined))),
            new Promise((resolve) => this.socketUnicast?.close(() => resolve(undefined))),
        ]);
    }

    private onSocketError(err: Error) {

    }

    private onSocketBroadcastListening() {
        if (this.socketBroadcast == null) {
            return;
        }
        this.socketBroadcast.setBroadcast(true);
        this.universes.forEach(universe => universe.start());
    }

    private onSocketMessage(socketType: string, msg: Buffer, rinfo: RemoteInfo) {
        const packet = decode(msg);
        if (!packet) {
            return;
        }

        if (packet instanceof ArtDmx) {
            this.emit("dmx", packet);
        } else if (packet instanceof ArtPoll) {
            console.log('ArtPoll', packet);
        } else if (packet instanceof ArtPollReply) {
            console.log('ArtPollReply', packet);
        }

        // TODO: Reply to all incoming ArtPoll packets
        // if (!(packet instanceof protocol.ArtDmx)) {
        //     console.log(packet.toString());
        // }
    }

    public getUniverse(id: number) {
        return this.universes[id];
    }
}

export class ArtNetUniverse {

    private readonly controller: ArtNetController;
    private readonly universe: number;
    private readonly size: number;
    private sequence: number;

    private renderInterval?: Timeout;

    private readonly renderCache: number[] = [];

    constructor(controller: ArtNetController, universe: number, size?: number) {
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
        // const channels = new Uint8Array(this.size);
        // channels.fill(0);
        // channels[1] = 255;
        // channels[0] = 100;

        const packet = new ArtDmx(14, this._nextSequence(), 0, this.universe, this.renderCache);
        this.controller.sendBroadcastPacket(packet);
    }

    _nextSequence() {
        if (this.sequence > 255) {
            this.sequence = 1;
        }
        return this.sequence++;
    }

    public getChannel(channel: number) {
        return this.renderCache[channel];
    }

    public setChannel(channel: number, value: number) {
        this.renderCache[channel] = value;
    }
}

class ArtNetChannel {
    
}
