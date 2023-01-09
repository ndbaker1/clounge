import type { RoomPlugin } from "clounge";

export type RoomExtension = {};
export type PeerExtension = {};
export type ObjectExtension = {};

export default <RoomPlugin<PeerExtension, RoomExtension, ObjectExtension>>{
    name: "PLUGIN_NAME@VERSION",
    dependencies: [],
    load() { },
    unload() { },
    selfSetup(room) { },
    peerSetup(room, peerId) { },
    processMessage(room, data, peerId) { },
    handlePeerDisconnect(room, peerId) { },
};

