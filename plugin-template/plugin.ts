import type { RoomPlugin } from "types";

export type RoomExtension = object
export type PeerExtension = object
export type ObjectExtension = object

export default <RoomPlugin<PeerExtension, RoomExtension, ObjectExtension>>{
    // change the plugin name to something unique
    name: "PLUGIN_NAME@VERSION",
    // The following fields are optional:
    dependencies: [
        // place the names of dependencies this plugin may have,
        // such as "viewportAnchor" from the default plugins
    ],
    cleanup(room) { return; },
    initialize(room) { return; },
    peerSetup(room, peerId) { return; },
    processMessage(room, data, peerId) { return; },
    handlePeerDisconnect(room, peerId) { return; },
};
