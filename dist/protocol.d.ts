/// <reference types="node" />
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
    constructor(ipAddress: string, port: number, version: number, netSwitch: number, subSwitch: number, oem: number, ubeaVersion: number);
    static decode(data: Buffer): ArtPollReply;
    encode(): Buffer;
    private encodeStatus;
}
export declare class ArtDmx extends ArtNetPacket {
    opcode: number;
    protocolVersion: number;
    sequence: number;
    physical: number;
    universe: number;
    data: number[];
    constructor(protocolVersion: number, sequence: number, physical: number, universe: number, data: number[]);
    isSequenceEnabled(): boolean;
    static decode(data: Buffer): ArtDmx;
    encode(): Buffer;
}
export declare function decode(msg: Buffer): ArtNetPacket | null;
