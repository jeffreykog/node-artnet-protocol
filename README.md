# Node ArtNet Protocol

[![GitHub release](https://img.shields.io/github/release/jeffreykog/artnet-protocol.svg)](https://github.com/jeffreykog/node-artnet-protocol/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)
[![npm](https://img.shields.io/npm/v/artnet-protocol.svg)](https://www.npmjs.com/package/artnet-protocol)

ArtNet protocol implementation in Nodejs. The goal is to make a protocol implementation
that is as complete and usable as possible.
Use-cases for this library are virtual ArtNet clients such as [ArtNet Hue Entertainment](https://github.com/jeffreykog/artnet-hue-entertainment),
or full ArtNet/DMX controllers.

## Features
* Automatic discovery using `ArtPoll` / `ArtPollReply`
* Low-level packet encoder/decoder which can be used as a binary protocol library without all other functionality.
* Sending/receiving of DMX data (`ArtDmx`)

## Usage
Install Node ArtNet Protocol using NPM:
```shell
$ npm install --save node-artnet-protocol
```

Code usage:
```javascript
import { ArtNetController } from 'artnet-protocol/dist';
import { ArtDmx } from 'artnet-protocol/dist/protocol';

const controller = new ArtNetController();
controller.bind('0.0.0.0');
// The controller is now listening and responding to discovery traffic

// Send DMX data (Sequence 0, Physical port 0, Universe 0.
controller.sendBroadcastPacket(new ArtDmx(0, 0, 0, [255, 0, 0]));

// Or if you want to receive DMX data
controller.on('dmx', (dmx) => {
    // dmx contains an ArtDmx object
    console.log(dmx.universe, dmx.data);
});
```
