/// <reference types="node" />
export declare class PortInfo {
    isInput: boolean;
    isOutput: boolean;
    protocol: number;
    constructor(isInput: boolean, isOutput: boolean, protocol: number);
    static decode(data: number): PortInfo;
    encode(): number;
}
export declare class InputPortStatus {
    dataReceived: boolean;
    dmxTestPacketsSupported: boolean;
    dmxSipSupported: boolean;
    dmxTextPacketsSupported: boolean;
    inputDisabled: boolean;
    receiveErrorsDetected: boolean;
    constructor(dataReceived: boolean, dmxTestPacketsSupported: boolean, dmxSipSupported: boolean, dmxTextPacketsSupported: boolean, inputDisabled: boolean, receiveErrorsDetected: boolean);
    static decode(data: number): InputPortStatus;
    encode(): number;
}
export declare class OutputPortStatus {
    dataTransmitted: boolean;
    dmxTestPacketsSupported: boolean;
    dmxSipSupported: boolean;
    dmxTextPacketsSupported: boolean;
    mergingData: boolean;
    dmxOutputShortCircuit: boolean;
    mergeModeLTP: boolean;
    transmittingSAcn: boolean;
    rdmDisabled: boolean;
    outputStyleContinuous: boolean;
    constructor(dataTransmitted: boolean, dmxTestPacketsSupported: boolean, dmxSipSupported: boolean, dmxTextPacketsSupported: boolean, mergingData: boolean, dmxOutputShortCircuit: boolean, mergeModeLTP: boolean, transmittingSAcn: boolean, rdmDisabled: boolean, outputStyleContinuous: boolean);
    static decode(dataA: number, dataB: number): OutputPortStatus;
    encodeA(): number;
    encodeB(): number;
}
export declare class ArtNetPacket {
    opcode: number;
    toString(): string;
    encode(): Buffer;
}
export declare class ArtPoll extends ArtNetPacket {
    opcode: number;
    protocolVersion: number;
    sendPollReplyOnChange: boolean;
    sendDiagnostics: boolean;
    sendDiagnosticsUnicast: boolean;
    disableVlc: boolean;
    priority: number;
    constructor(protocolVersion: number, sendPollReplyOnChange: boolean, sendDiagnostics: boolean, sendDiagnosticsUnicast: boolean, disableVlc: boolean, priority: number);
    static decode(data: Buffer): ArtPoll;
    encode(): Buffer;
}
export declare class ArtPollReply extends ArtNetPacket {
    opcode: number;
    ipAddress: string;
    port: number;
    version: number;
    netSwitch: number;
    subSwitch: number;
    oem: number;
    ubeaVersion: number;
    statusUbeaPresent: boolean;
    statusRdmSupported: boolean;
    statusRomBooted: boolean;
    statusPortAddressProgrammingAuthority: number;
    statusIndicatorState: number;
    estaCode: number;
    nameShort: string;
    nameLong: string;
    nodeReport: string;
    numberOfPorts: number;
    portInfo: [PortInfo, PortInfo, PortInfo, PortInfo];
    inputPortStatus: [InputPortStatus, InputPortStatus, InputPortStatus, InputPortStatus];
    outputPortStatus: [OutputPortStatus, OutputPortStatus, OutputPortStatus, OutputPortStatus];
    inputUniverse: [number, number, number, number];
    outputUniverse: [number, number, number, number];
    swMacros: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
    swRemote: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
    style: number;
    macAddress: string;
    bindIp: string;
    bindIndex: number;
    webConfigSupported: boolean;
    dhcpUsed: boolean;
    dhcpSupported: boolean;
    supportsSAcn: boolean;
    squawking: boolean;
    supportsOutputStyleArtCommand: boolean;
    supportsRdmControlArtCommand: boolean;
    failOverState: number;
    supportsFailover: boolean;
    constructor(ipAddress: string, port: number, version: number, netSwitch: number, subSwitch: number, oem: number, ubeaVersion: number, numberOfPorts: number);
    static decode(data: Buffer): ArtPollReply;
    encode(): Buffer;
    private encodeStatus;
    private encodeStatus2;
    private encodeStatus3;
    private static encodeBooleanArray;
    private writeMacAddress;
    private static readMacAddress;
}
export declare class ArtDmx extends ArtNetPacket {
    opcode: number;
    protocolVersion: number;
    sequence: number;
    physical: number;
    universe: number;
    data: number[];
    constructor(sequence: number, physical: number, universe: number, data: number[]);
    isSequenceEnabled(): boolean;
    static decode(data: Buffer): ArtDmx;
    encode(): Buffer;
}
export declare function decode(msg: Buffer): ArtNetPacket | null;
