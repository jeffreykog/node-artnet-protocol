import { INDICATOR_NORMAL, OP_OUTPUT, OP_POLL, OP_POLL_REPLY, PAPA_UNUSED } from './opcodes';

const header = Buffer.from([65, 114, 116, 45, 78, 101, 116, 0]);

// https://artisticlicence.com/WebSiteMaster/User%20Guides/art-net.pdf

export class ArtNetPacket {

    opcode = 0;

    toString() {
        let parameters = JSON.stringify(this);
        parameters = parameters.replace('"', '');
        parameters = parameters.replace(':', '=');
        return this.constructor.name + " " + parameters;
    }

    encode() {
        const opcodeBuffer = Buffer.alloc(2);
        opcodeBuffer.writeUInt16LE(this.opcode);
        return Buffer.concat([header, opcodeBuffer])
    }
}

export class ArtPoll extends ArtNetPacket {

    opcode = OP_POLL;

    protocolVersion: number;
    sendPollReplyOnChange: boolean;
    sendDiagnostics: boolean;
    sendDiagnosticsUnicast: boolean;
    disableVlc: boolean;
    priority: number;

    constructor(protocolVersion: number, sendPollReplyOnChange: boolean,
                sendDiagnostics: boolean, sendDiagnosticsUnicast: boolean,
                disableVlc: boolean, priority: number) {
        super();
        this.protocolVersion = protocolVersion;
        this.sendPollReplyOnChange = sendPollReplyOnChange;
        this.sendDiagnostics = sendDiagnostics;
        this.sendDiagnosticsUnicast = sendDiagnosticsUnicast;
        this.disableVlc = disableVlc;
        this.priority = priority;
    }

    static decode(data: Buffer) {
        const version = data.readUInt16BE(0);
        const talkToMe = data.readUInt8(2);
        const sendPollReplyOnChange = (talkToMe & 0b00000010) === 0b00000010;
        const sendDiagnostics = (talkToMe & 0b00000100) === 0b00000100;
        const sendDiagnosticsUnicast = (talkToMe & 0b00001000) === 0b00001000;
        const disableVlc = (talkToMe & 0b00010000) === 0b00010000;
        const priority = data.readUInt8(3);
        return new ArtPoll(version, sendPollReplyOnChange, sendDiagnostics, sendDiagnosticsUnicast, disableVlc, priority);
    }

    encode() {
        const header = super.encode();
        const buffer = Buffer.alloc(4);
        buffer.writeUInt16BE(this.protocolVersion, 0);
        let talkToMe = 0;
        if (this.sendPollReplyOnChange) {
            talkToMe = talkToMe | 0b00000010;
        }
        if (this.sendDiagnostics) {
            talkToMe = talkToMe | 0b00000100;
            if (this.sendDiagnosticsUnicast) {
                talkToMe = talkToMe | 0b00001000;
            }
        }
        if (this.disableVlc) {
            talkToMe = talkToMe | 0b00010000;
        }
        buffer.writeUInt8(talkToMe, 2);
        buffer.writeUInt8(this.priority, 3);
        return Buffer.concat([header, buffer]);
    }
}

export class ArtPollReply extends ArtNetPacket {

    opcode = OP_POLL_REPLY;

    ipAddress: string;
    port: number;
    version = 0;
    netSwitch = 0;
    subSwitch = 0;
    oem = 0;
    ubeaVersion = 0;

    statusUbeaPresent = false;
    statusRdmSupported = false;
    statusRomBooted = false;
    statusPortAddressProgrammingAuthority = PAPA_UNUSED;
    statusIndicatorState = INDICATOR_NORMAL;

    estaCode = 0;

    constructor(ipAddress: string, port: number, version: number,
                netSwitch: number, subSwitch: number, oem: number,
                ubeaVersion: number) {
        super();
        this.ipAddress = ipAddress;
        this.port = port;
        this.version = version;
        this.netSwitch = netSwitch;
        this.subSwitch = subSwitch;
        this.oem = oem;
        this.ubeaVersion = ubeaVersion;
    }

    static decode(data: Buffer) {
        const ip1 = data.readUInt8(0);
        const ip2 = data.readUInt8(1);
        const ip3 = data.readUInt8(2);
        const ip4 = data.readUInt8(3);
        const ip = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
        const port = data.readUInt16LE(4);
        const version = data.readUInt16LE(6);
        const netSwitch = data.readUInt8(8);
        const subSwitch = data.readUInt8(9);
        const oem = data.readUInt16LE(10);
        const ubeaVersion = data.readUInt8(12);
        return new ArtPollReply(ip, port, version, netSwitch, subSwitch, oem, ubeaVersion);
    }

    encode() {
        const header = super.encode();
        const buffer = Buffer.alloc(13);  // 229
        const ipParts = this.ipAddress.split('.');
        buffer.writeUInt8(parseInt(ipParts[0], 10), 0);
        buffer.writeUInt8(parseInt(ipParts[1], 10), 1);
        buffer.writeUInt8(parseInt(ipParts[2], 10), 2);
        buffer.writeUInt8(parseInt(ipParts[3], 10), 3);
        buffer.writeUInt16LE(this.port, 4);
        buffer.writeUInt16LE(this.version, 6);
        buffer.writeUInt8(this.netSwitch, 8);
        buffer.writeUInt8(this.subSwitch, 9);
        buffer.writeUInt16LE(this.oem, 10);
        buffer.writeUInt8(this.ubeaVersion, 12);
        return Buffer.concat([header, buffer]);
    }
}

export class ArtDmx extends ArtNetPacket {

    opcode = OP_OUTPUT;
    protocolVersion: number;
    sequence: number;
    physical: number;
    universe: number;
    data: number[] | Uint8Array;

    constructor(protocolVersion: number, sequence: number, physical: number, universe: number, data: number[] | Uint8Array) {
        super();
        this.protocolVersion = protocolVersion;
        this.sequence = sequence;
        this.physical = physical;
        this.universe = universe;
        this.data = data;
    }

    isSequenceEnabled() {
        return this.sequence !== 0;
    }

    static decode(data: Buffer) {
        const version = data.readUInt16BE(0);
        const sequence = data.readUInt8(2);
        const physical = data.readUInt8(3);
        const universe = data.readUInt16LE(4);
        const length = data.readUInt16BE(6);
        const dmxData = [];
        for (let i = 0; i < length; i++) {
            dmxData.push(data.readUInt8(8 + i));
        }
        return new ArtDmx(version, sequence, physical, universe, dmxData);
    }

    encode() {
        const header = super.encode();
        const buffer = Buffer.alloc(8 + this.data.length);
        buffer.writeUInt16BE(this.protocolVersion, 0);
        buffer.writeUInt8(this.sequence, 2);
        buffer.writeUInt8(this.physical, 3);
        buffer.writeUInt16LE(this.universe, 4);
        buffer.writeUInt16BE(this.data.length, 6);
        for (let i = 0; i < this.data.length; i++) {
            buffer.writeUInt8(this.data[i], 8 + i);
        }
        return Buffer.concat([header, buffer]);
    }
}

export function decode(msg: Buffer): ArtNetPacket | null {
    if (msg.length < 10) {
        return null;
    }
    if (msg.toString('ascii', 0, 7) !== 'Art-Net') {
        return null;
    }
    const opCode = msg.readUInt16LE(8);
    const packetData = msg.subarray(10);
    switch (opCode) {
        case OP_POLL:
            return ArtPoll.decode(packetData);

        case OP_POLL_REPLY:
            return ArtPollReply.decode(packetData);

        case OP_OUTPUT:
            return ArtDmx.decode(packetData);

        default:
            console.log("Unknown packet type:", opCode);
            return null;
    }
}
