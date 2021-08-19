import { RemoteInfo, Socket } from 'dgram';
import Timeout = NodeJS.Timeout;
import { ArtDmx, ArtNetPacket, ArtPoll, ArtPollReply, decode, PortInfo } from './protocol';
import { DP_ALL, PROTOCOL_DMX512 } from './opcodes';
import * as dgram from 'dgram';
import * as ip6addr from 'ip6addr';
import * as os from 'os';
import EventEmitter = require('events');

const PORT = 6454;

export class ArtNetController extends EventEmitter {

    private readonly interfacePrefixes: { [key: string]: ip6addr.CIDR };
    private readonly isController: boolean;

    private socketUnicast?: Socket;
    private socketBroadcast?: Socket;

    private broadcastAddress?: string;
    private unicastAddress?: string;

    private intervalArtPoll?: Timeout;

    public nameShort: string = 'NodeArtNetProto';
    public nameLong: string = 'https://github.com/jeffreykog/node-artnet-protocol';

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
            this.sendArtPollReply();
        }
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
    }

    private sendArtPollReply() {
        const packet = new ArtPollReply(this.unicastAddress!, PORT, 0, 0, 0, 0xffff, 0, 1);
        packet.nameShort = this.nameShort;
        packet.nameLong = this.nameLong;
        packet.portInfo[0] = new PortInfo(false, true, PROTOCOL_DMX512);
        this.sendBroadcastPacket(packet);
    }

    private onSocketMessage(socketType: string, msg: Buffer, rinfo: RemoteInfo) {
        const packet = decode(msg);
        if (!packet) {
            return;
        }

        if (packet instanceof ArtDmx) {
            this.emit("dmx", packet);
        } else if (packet instanceof ArtPoll) {
            this.sendArtPollReply();
        } else if (packet instanceof ArtPollReply) {
        } else {
            console.log(packet.toString());
        }
    }
}
