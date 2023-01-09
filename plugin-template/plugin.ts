import type { RoomPlugin } from "core";

export type RoomExtension = object
export type PeerExtension = object
export type ObjectExtension = object

export default <RoomPlugin<PeerExtension, RoomExtension, ObjectExtension>>{
	name: "PLUGIN_NAME@VERSION",
	dependencies: [],
	load() { return; },
	unload() { return; },
	selfSetup(room) { return; },
	peerSetup(room, peerId) { return; },
	processMessage(room, data, peerId) { return; },
	handlePeerDisconnect(room, peerId) { return; },
};
