import type { RoomPlugin } from "types";

export type RoomExtension = object
export type PeerExtension = object
export type ObjectExtension = object

export default <RoomPlugin<PeerExtension, RoomExtension, ObjectExtension>>{
    // change the plugin name to something unique
    name: "PLUGIN_NAME@VERSION",
    // The remaining fields are optional:
    dependencies: [
        // place the names of dependencies this plugin may have,
        // such as "viewportAnchor" from the default plugins
    ],
    cleanup(room) { return; },
    initialize(room) {
        /*
        If you implement this, it helps to mark/comment the point
        where all Room extension fields become usable.
        
        Use something obvious like:

        // ROOM DATA INITIALIZED
        room.pluginFields = { ... }
        */
    },
    peerSetup(room, peerId) { return; },
    processMessage(room, data, peerId) { return; },
    handlePeerDisconnect(room, peerId) { return; },
};
