/// <reference types="node" />
import { ArtNetPacket } from './protocol';
import EventEmitter = require('events');
export declare class ArtNetController extends EventEmitter {
    private readonly interfacePrefixes;
    private readonly isController;
    private socketUnicast?;
    private socketBroadcast?;
    private broadcastAddress?;
    private unicastAddress?;
    private intervalArtPoll?;
    nameShort: string;
    nameLong: string;
    constructor(isController?: boolean);
    bind(host?: string): void;
    sendBroadcastPacket(packet: ArtNetPacket): void;
    private artPollTimer;
    close(): Promise<void>;
    private onSocketError;
    private onSocketBroadcastListening;
    private sendArtPollReply;
    private onSocketMessage;
}
