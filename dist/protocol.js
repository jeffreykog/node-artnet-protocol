"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.ArtDmx = exports.ArtPollReply = exports.ArtPoll = exports.ArtNetPacket = void 0;
const opcodes_1 = require("./opcodes");
const header = Buffer.from([65, 114, 116, 45, 78, 101, 116, 0]);
class ArtNetPacket {
    constructor() {
        this.opcode = 0;
    }
    toString() {
        let parameters = JSON.stringify(this);
        parameters = parameters.replace('"', '');
        parameters = parameters.replace(':', '=');
        return this.constructor.name + " " + parameters;
    }
    encode() {
        const opcodeBuffer = Buffer.alloc(2);
        opcodeBuffer.writeUInt16LE(this.opcode);
        return Buffer.concat([header, opcodeBuffer]);
    }
}
exports.ArtNetPacket = ArtNetPacket;
class ArtPoll extends ArtNetPacket {
    constructor(protocolVersion, sendPollReplyOnChange, sendDiagnostics, sendDiagnosticsUnicast, disableVlc, priority) {
        super();
        this.opcode = opcodes_1.OP_POLL;
        this.protocolVersion = protocolVersion;
        this.sendPollReplyOnChange = sendPollReplyOnChange;
        this.sendDiagnostics = sendDiagnostics;
        this.sendDiagnosticsUnicast = sendDiagnosticsUnicast;
        this.disableVlc = disableVlc;
        this.priority = priority;
    }
    static decode(data) {
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
exports.ArtPoll = ArtPoll;
class ArtPollReply extends ArtNetPacket {
    constructor(ipAddress, port, version, netSwitch, subSwitch, oem, ubeaVersion) {
        super();
        this.opcode = opcodes_1.OP_POLL_REPLY;
        this.version = 0;
        this.netSwitch = 0;
        this.subSwitch = 0;
        this.oem = 0;
        this.ubeaVersion = 0;
        this.statusUbeaPresent = false;
        this.statusRdmSupported = false;
        this.statusRomBooted = false;
        this.statusPortAddressProgrammingAuthority = opcodes_1.PAPA_UNUSED;
        this.statusIndicatorState = opcodes_1.INDICATOR_NORMAL;
        this.estaCode = opcodes_1.ESTA_EXPERIMENTAL;
        this.nameShort = "";
        this.nameLong = "";
        this.nodeReport = "";
        this.ipAddress = ipAddress;
        this.port = port;
        this.version = version;
        this.netSwitch = netSwitch;
        this.subSwitch = subSwitch;
        this.oem = oem;
        this.ubeaVersion = ubeaVersion;
    }
    static decode(data) {
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
        const status = data.readUInt8(13);
        const result = new ArtPollReply(ip, port, version, netSwitch, subSwitch, oem, ubeaVersion);
        result.statusIndicatorState = (status & 0b11000000) >> 6;
        result.statusPortAddressProgrammingAuthority = (status & 0b00110000) >> 4;
        result.statusRomBooted = (status & 0b00000100) === 0b00000100;
        result.statusRdmSupported = (status & 0b00000010) === 0b00000010;
        result.statusUbeaPresent = (status & 0b00000001) === 0b00000001;
        result.estaCode = data.readUInt16LE(14);
        result.nameShort = data.toString('ascii', 16, 33).replace(/\0.*$/g, '').trim();
        result.nameLong = data.toString('ascii', 34, 97).replace(/\0.*$/g, '').trim();
        result.nodeReport = data.toString('ascii', 98, 161).replace(/\0.*$/g, '').trim();
        return result;
    }
    encode() {
        const header = super.encode();
        const buffer = Buffer.alloc(162);
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
        buffer.writeUInt8(this.encodeStatus(), 13);
        buffer.writeUInt16LE(this.estaCode, 14);
        buffer.write(this.nameShort, 16, 17, 'ascii');
        buffer.writeUInt8(0, 33);
        buffer.write(this.nameLong, 34, 63, 'ascii');
        buffer.writeUInt8(0, 97);
        buffer.write(this.nodeReport, 98, 63, 'ascii');
        buffer.writeUInt8(0, 161);
        return Buffer.concat([header, buffer]);
    }
    encodeStatus() {
        let status = 0;
        status |= this.statusIndicatorState << 6;
        status |= this.statusPortAddressProgrammingAuthority << 4;
        if (this.statusRomBooted) {
            status |= 0b00000100;
        }
        if (this.statusRdmSupported) {
            status |= 0b00000010;
        }
        if (this.statusUbeaPresent) {
            status |= 0b00000001;
        }
        return status;
    }
}
exports.ArtPollReply = ArtPollReply;
class ArtDmx extends ArtNetPacket {
    constructor(protocolVersion, sequence, physical, universe, data) {
        super();
        this.opcode = opcodes_1.OP_OUTPUT;
        this.protocolVersion = protocolVersion;
        this.sequence = sequence;
        this.physical = physical;
        this.universe = universe;
        this.data = data;
    }
    isSequenceEnabled() {
        return this.sequence !== 0;
    }
    static decode(data) {
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
exports.ArtDmx = ArtDmx;
function decode(msg) {
    if (msg.length < 10) {
        return null;
    }
    if (msg.toString('ascii', 0, 7) !== 'Art-Net') {
        return null;
    }
    const opCode = msg.readUInt16LE(8);
    const packetData = msg.subarray(10);
    switch (opCode) {
        case opcodes_1.OP_POLL:
            return ArtPoll.decode(packetData);
        case opcodes_1.OP_POLL_REPLY:
            return ArtPollReply.decode(packetData);
        case opcodes_1.OP_OUTPUT:
            return ArtDmx.decode(packetData);
        default:
            console.log("Unknown packet type:", opCode);
            return null;
    }
}
exports.decode = decode;
//# sourceMappingURL=protocol.js.map