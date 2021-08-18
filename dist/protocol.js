"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.ArtDmx = exports.ArtPollReply = exports.ArtPoll = exports.ArtNetPacket = exports.OutputPortStatus = exports.InputPortStatus = exports.PortInfo = void 0;
const opcodes_1 = require("./opcodes");
const header = Buffer.from([65, 114, 116, 45, 78, 101, 116, 0]);
class PortInfo {
    constructor(isInput, isOutput, protocol) {
        this.isInput = isInput;
        this.isOutput = isOutput;
        this.protocol = protocol;
    }
    static decode(data) {
        const isInput = (data & 0b10000000) === 0b10000000;
        const isOutput = (data & 0b01000000) === 0b01000000;
        const protocol = data & 0b00111111;
        return new PortInfo(isInput, isOutput, protocol);
    }
    encode() {
        let result = 0;
        if (this.isOutput) {
            result |= 0b10000000;
        }
        if (this.isInput) {
            result |= 0b01000000;
        }
        result |= (this.protocol & 0b00111111);
        return result;
    }
}
exports.PortInfo = PortInfo;
class InputPortStatus {
    constructor(dataReceived, dmxTestPacketsSupported, dmxSipSupported, dmxTextPacketsSupported, inputDisabled, receiveErrorsDetected) {
        this.dataReceived = dataReceived;
        this.dmxTestPacketsSupported = dmxTestPacketsSupported;
        this.dmxSipSupported = dmxSipSupported;
        this.dmxTextPacketsSupported = dmxTextPacketsSupported;
        this.inputDisabled = inputDisabled;
        this.receiveErrorsDetected = receiveErrorsDetected;
    }
    static decode(data) {
        const dataReceived = (data & 0b10000000) === 0b10000000;
        const dmxTestPacketsSupported = (data & 0b01000000) === 0b01000000;
        const dmxSipSupported = (data & 0b00100000) === 0b00100000;
        const dmxTextPacketsSupported = (data & 0b00010000) === 0b00010000;
        const inputDisabled = (data & 0b00001000) === 0b00001000;
        const receiveErrorsDetected = (data & 0b00000100) === 0b00000100;
        return new InputPortStatus(dataReceived, dmxTestPacketsSupported, dmxSipSupported, dmxTextPacketsSupported, inputDisabled, receiveErrorsDetected);
    }
    encode() {
        let result = 0;
        if (this.dataReceived) {
            result |= 0b10000000;
        }
        if (this.dmxTestPacketsSupported) {
            result |= 0b01000000;
        }
        if (this.dmxSipSupported) {
            result |= 0b00100000;
        }
        if (this.dmxTextPacketsSupported) {
            result |= 0b00010000;
        }
        if (this.inputDisabled) {
            result |= 0b00001000;
        }
        if (this.receiveErrorsDetected) {
            result |= 0b00000100;
        }
        return result;
    }
}
exports.InputPortStatus = InputPortStatus;
class OutputPortStatus {
    constructor(dataTransmitted, dmxTestPacketsSupported, dmxSipSupported, dmxTextPacketsSupported, mergingData, dmxOutputShortCircuit, mergeModeLTP, transmittingSAcn, rdmDisabled, outputStyleContinuous) {
        this.dataTransmitted = dataTransmitted;
        this.dmxTestPacketsSupported = dmxTestPacketsSupported;
        this.dmxSipSupported = dmxSipSupported;
        this.dmxTextPacketsSupported = dmxTextPacketsSupported;
        this.mergingData = mergingData;
        this.dmxOutputShortCircuit = dmxOutputShortCircuit;
        this.mergeModeLTP = mergeModeLTP;
        this.transmittingSAcn = transmittingSAcn;
        this.rdmDisabled = rdmDisabled;
        this.outputStyleContinuous = outputStyleContinuous;
    }
    static decode(dataA, dataB) {
        const dataTransmitted = (dataA & 0b10000000) === 0b10000000;
        const dmxTestPacketsSupported = (dataA & 0b01000000) === 0b01000000;
        const dmxSipSupported = (dataA & 0b00100000) === 0b00100000;
        const dmxTextPacketsSupported = (dataA & 0b00010000) === 0b00010000;
        const mergingData = (dataA & 0b00001000) === 0b00001000;
        const dmxOutputShortCircuit = (dataA & 0b00000100) === 0b00000100;
        const mergeModeLTP = (dataA & 0b00000010) === 0b00000010;
        const transmittingSAcn = (dataA & 0b00000001) === 0b00000001;
        const rdmDisabled = (dataB & 0b10000000) === 0b10000000;
        const outputStyleContinuous = (dataB & 0b01000000) === 0b01000000;
        return new OutputPortStatus(dataTransmitted, dmxTestPacketsSupported, dmxSipSupported, dmxTextPacketsSupported, mergingData, dmxOutputShortCircuit, mergeModeLTP, transmittingSAcn, rdmDisabled, outputStyleContinuous);
    }
    encodeA() {
        let result = 0;
        if (this.dataTransmitted) {
            result |= 0b10000000;
        }
        if (this.dmxTestPacketsSupported) {
            result |= 0b01000000;
        }
        if (this.dmxSipSupported) {
            result |= 0b00100000;
        }
        if (this.dmxTextPacketsSupported) {
            result |= 0b00010000;
        }
        if (this.mergingData) {
            result |= 0b00001000;
        }
        if (this.dmxOutputShortCircuit) {
            result |= 0b00000100;
        }
        if (this.mergeModeLTP) {
            result |= 0b00000010;
        }
        if (this.transmittingSAcn) {
            result |= 0b00000001;
        }
        return result;
    }
    encodeB() {
        let result = 0;
        if (this.rdmDisabled) {
            result |= 0b10000000;
        }
        if (this.outputStyleContinuous) {
            result |= 0b01000000;
        }
        return result;
    }
}
exports.OutputPortStatus = OutputPortStatus;
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
    constructor(ipAddress, port, version, netSwitch, subSwitch, oem, ubeaVersion, numberOfPorts) {
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
        this.style = opcodes_1.STYLE_NODE;
        this.macAddress = '00:00:00:00:00:00';
        this.bindIp = '0.0.0.0';
        this.bindIndex = 0;
        this.webConfigSupported = false;
        this.dhcpUsed = false;
        this.dhcpSupported = true;
        this.supportsSAcn = false;
        this.squawking = false;
        this.supportsOutputStyleArtCommand = false;
        this.supportsRdmControlArtCommand = false;
        this.failOverState = opcodes_1.FOS_HOLD;
        this.supportsFailover = false;
        this.ipAddress = ipAddress;
        this.port = port;
        this.version = version;
        this.netSwitch = netSwitch;
        this.subSwitch = subSwitch;
        this.oem = oem;
        this.ubeaVersion = ubeaVersion;
        this.numberOfPorts = numberOfPorts;
        this.portInfo = [
            new PortInfo(false, false, opcodes_1.PROTOCOL_DMX512),
            new PortInfo(false, false, opcodes_1.PROTOCOL_DMX512),
            new PortInfo(false, false, opcodes_1.PROTOCOL_DMX512),
            new PortInfo(false, false, opcodes_1.PROTOCOL_DMX512),
        ];
        this.inputPortStatus = [
            new InputPortStatus(false, false, false, false, true, false),
            new InputPortStatus(false, false, false, false, true, false),
            new InputPortStatus(false, false, false, false, true, false),
            new InputPortStatus(false, false, false, false, true, false),
        ];
        this.outputPortStatus = [
            new OutputPortStatus(false, false, false, false, false, false, false, false, true, true),
            new OutputPortStatus(false, false, false, false, false, false, false, false, true, true),
            new OutputPortStatus(false, false, false, false, false, false, false, false, true, true),
            new OutputPortStatus(false, false, false, false, false, false, false, false, true, true),
        ];
        this.inputUniverse = [0, 0, 0, 0];
        this.outputUniverse = [0, 0, 0, 0];
        this.swMacros = [false, false, false, false, false, false, false, false];
        this.swRemote = [false, false, false, false, false, false, false, false];
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
        const numberOfPorts = data.readUInt16BE(162);
        const result = new ArtPollReply(ip, port, version, netSwitch, subSwitch, oem, ubeaVersion, numberOfPorts);
        result.statusIndicatorState = (status & 0b11000000) >> 6;
        result.statusPortAddressProgrammingAuthority = (status & 0b00110000) >> 4;
        result.statusRomBooted = (status & 0b00000100) === 0b00000100;
        result.statusRdmSupported = (status & 0b00000010) === 0b00000010;
        result.statusUbeaPresent = (status & 0b00000001) === 0b00000001;
        result.estaCode = data.readUInt16LE(14);
        result.nameShort = data.toString('ascii', 16, 33).replace(/\0.*$/g, '').trim();
        result.nameLong = data.toString('ascii', 34, 97).replace(/\0.*$/g, '').trim();
        result.nodeReport = data.toString('ascii', 98, 161).replace(/\0.*$/g, '').trim();
        result.numberOfPorts = data.readUInt16BE(162);
        result.portInfo[0] = PortInfo.decode(data.readUInt8(164));
        result.portInfo[1] = PortInfo.decode(data.readUInt8(165));
        result.portInfo[2] = PortInfo.decode(data.readUInt8(166));
        result.portInfo[3] = PortInfo.decode(data.readUInt8(167));
        result.inputPortStatus[0] = InputPortStatus.decode(data.readUInt8(168));
        result.inputPortStatus[1] = InputPortStatus.decode(data.readUInt8(169));
        result.inputPortStatus[2] = InputPortStatus.decode(data.readUInt8(170));
        result.inputPortStatus[3] = InputPortStatus.decode(data.readUInt8(171));
        result.outputPortStatus[0] = OutputPortStatus.decode(data.readUInt8(172), data.readUInt8(203));
        result.outputPortStatus[1] = OutputPortStatus.decode(data.readUInt8(173), data.readUInt8(204));
        result.outputPortStatus[2] = OutputPortStatus.decode(data.readUInt8(174), data.readUInt8(205));
        result.outputPortStatus[3] = OutputPortStatus.decode(data.readUInt8(175), data.readUInt8(206));
        result.inputUniverse[0] = data.readUInt8(176);
        result.inputUniverse[1] = data.readUInt8(177);
        result.inputUniverse[2] = data.readUInt8(178);
        result.inputUniverse[3] = data.readUInt8(179);
        result.outputUniverse[0] = data.readUInt8(180);
        result.outputUniverse[1] = data.readUInt8(181);
        result.outputUniverse[2] = data.readUInt8(182);
        result.outputUniverse[3] = data.readUInt8(183);
        const swMacros = data.readUInt8(185);
        for (let i = 0; i < 8; ++i) {
            result.swMacros[i] = (swMacros & (1 << i)) !== 0;
        }
        const swRemote = data.readUInt8(186);
        for (let i = 0; i < 8; ++i) {
            result.swRemote[i] = (swRemote & (1 << i)) !== 0;
        }
        result.style = data.readUInt8(190);
        result.macAddress = ArtPollReply.readMacAddress(data, 191);
        result.bindIp = data.readUInt8(197) + '.' + data.readUInt8(198) + '.' + data.readUInt8(199) + '.' + data.readUInt8(200);
        result.bindIndex = data.readUInt8(201);
        const status2 = data.readUInt8(202);
        result.webConfigSupported = (status2 & 0b00000001) === 0b00000001;
        result.dhcpUsed = (status2 & 0b00000010) === 0b00000010;
        result.dhcpSupported = (status2 & 0b00000100) === 0b00000100;
        result.supportsSAcn = (status2 & 0b00010000) === 0b00010000;
        result.squawking = (status2 & 0b00100000) === 0b00100000;
        result.supportsOutputStyleArtCommand = (status2 & 0b01000000) === 0b01000000;
        result.supportsRdmControlArtCommand = (status2 & 0b10000000) === 0b10000000;
        const status3 = data.readUInt8(207);
        result.failOverState = status3 & 0b00000100;
        result.supportsFailover = (status3 & 0b00000100) === 0b00000100;
        return result;
    }
    encode() {
        const header = super.encode();
        const buffer = Buffer.alloc(229);
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
        buffer.writeUInt16BE(this.numberOfPorts, 162);
        buffer.writeUInt8(this.portInfo[0].encode(), 164);
        buffer.writeUInt8(this.portInfo[1].encode(), 165);
        buffer.writeUInt8(this.portInfo[2].encode(), 166);
        buffer.writeUInt8(this.portInfo[3].encode(), 167);
        buffer.writeUInt8(this.inputPortStatus[0].encode(), 168);
        buffer.writeUInt8(this.inputPortStatus[1].encode(), 169);
        buffer.writeUInt8(this.inputPortStatus[2].encode(), 170);
        buffer.writeUInt8(this.inputPortStatus[3].encode(), 171);
        buffer.writeUInt8(this.outputPortStatus[0].encodeA(), 172);
        buffer.writeUInt8(this.outputPortStatus[1].encodeA(), 173);
        buffer.writeUInt8(this.outputPortStatus[2].encodeA(), 174);
        buffer.writeUInt8(this.outputPortStatus[3].encodeA(), 175);
        buffer.writeUInt8(this.inputUniverse[0], 176);
        buffer.writeUInt8(this.inputUniverse[1], 177);
        buffer.writeUInt8(this.inputUniverse[2], 178);
        buffer.writeUInt8(this.inputUniverse[3], 179);
        buffer.writeUInt8(this.outputUniverse[0], 180);
        buffer.writeUInt8(this.outputUniverse[1], 181);
        buffer.writeUInt8(this.outputUniverse[2], 182);
        buffer.writeUInt8(this.outputUniverse[3], 183);
        buffer.writeUInt8(0, 184);
        buffer.writeUInt8(ArtPollReply.encodeBooleanArray(this.swMacros), 185);
        buffer.writeUInt8(ArtPollReply.encodeBooleanArray(this.swRemote), 186);
        buffer.writeUInt8(0, 187);
        buffer.writeUInt8(0, 188);
        buffer.writeUInt8(0, 189);
        buffer.writeUInt8(this.style, 190);
        this.writeMacAddress(buffer, 191);
        const bindIpParts = this.bindIp.split('.');
        buffer.writeUInt8(parseInt(bindIpParts[0], 10), 197);
        buffer.writeUInt8(parseInt(bindIpParts[1], 10), 198);
        buffer.writeUInt8(parseInt(bindIpParts[2], 10), 199);
        buffer.writeUInt8(parseInt(bindIpParts[3], 10), 200);
        buffer.writeUInt8(this.bindIndex, 201);
        buffer.writeUInt8(this.encodeStatus2(), 202);
        buffer.writeUInt8(this.outputPortStatus[0].encodeB(), 203);
        buffer.writeUInt8(this.outputPortStatus[1].encodeB(), 204);
        buffer.writeUInt8(this.outputPortStatus[2].encodeB(), 205);
        buffer.writeUInt8(this.outputPortStatus[3].encodeB(), 206);
        buffer.writeUInt8(this.encodeStatus3(), 207);
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
    encodeStatus2() {
        let status = 0b00001000;
        if (this.webConfigSupported) {
            status |= 0b00000001;
        }
        if (this.dhcpUsed) {
            status |= 0b00000010;
        }
        if (this.dhcpSupported) {
            status |= 0b00000100;
        }
        if (this.squawking) {
            status |= 0b00010000;
        }
        if (this.squawking) {
            status |= 0b00100000;
        }
        if (this.supportsOutputStyleArtCommand) {
            status |= 0b01000000;
        }
        if (this.supportsRdmControlArtCommand) {
            status |= 0b10000000;
        }
        return status;
    }
    encodeStatus3() {
        let status = 0;
        status |= this.failOverState & 0b00000011;
        if (this.supportsFailover) {
            status |= 0b00000100;
        }
        return status;
    }
    static encodeBooleanArray(data) {
        let result = 0;
        for (let i = 0; i < 8; ++i) {
            if (data[i]) {
                result |= 1 << i;
            }
        }
        return result;
    }
    writeMacAddress(data, offset) {
        const parts = this.macAddress.split(':');
        for (let i = 0; i < parts.length; i++) {
            data.writeUInt8(parseInt(parts[i], 16), offset + i);
        }
    }
    static readMacAddress(data, offset) {
        let result = [];
        for (let i = 0; i < 6; i++) {
            let byte = data.readUInt8(offset + i).toString(16);
            if (byte.length < 2) {
                byte = '0' + byte;
            }
            result.push(byte);
        }
        return result.join(':');
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