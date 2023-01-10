import type { RoomPlugin } from "types";

export type RoomExtension = object
export type PeerExtension = object
export type ObjectExtension = object

export default <RoomPlugin<PeerExtension, RoomExtension, ObjectExtension>>{
    name: "PLUGIN_NAME@VERSION",
    // all of the following fields are optional
    dependencies: [],
    cleanup() { return; },
    initialize(room) { return; },
    peerSetup(room, peerId) { return; },
    processMessage(room, data, peerId) { return; },
    handlePeerDisconnect(room, peerId) { return; },
};
