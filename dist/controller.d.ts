/// <reference types="node" />
import { Socket } from 'dgram';
import { ArtNetPacket } from './protocol';
import EventEmitter = require('events');
export declare class ArtNetController extends EventEmitter {
    private readonly interfacePrefixes;
    socketUnicast?: Socket;
    socketBroadcast?: Socket;
    private broadcastAddress?;
    private unicastAddress?;
    private universes;
    private intervalArtPoll?;
    constructor();
    bind(host?: string): void;
    createUniverse(index: number): ArtNetUniverse;
    sendBroadcastPacket(packet: ArtNetPacket): void;
    private artPollTimer;
    close(): Promise<void>;
    private onSocketError;
    private onSocketBroadcastListening;
    private onSocketMessage;
    getUniverse(id: number): ArtNetUniverse;
}
export declare class ArtNetUniverse {
    private readonly controller;
    private readonly universe;
    private readonly size;
    private sequence;
    private renderInterval?;
    private readonly renderCache;
    constructor(controller: ArtNetController, universe: number, size?: number);
    start(): void;
    _renderLoop(): void;
    _nextSequence(): number;
    getChannel(channel: number): number;
    setChannel(channel: number, value: number): void;
}
