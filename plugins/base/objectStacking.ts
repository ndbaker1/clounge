import type { RoomPlugin } from "types";
import type { RoomObjectDescriptors, ObjectLoaderObjectExtension, ObjectLoaderRoomExtension, ObjectMessage, OBJECT_ID_ATTRIBUTE } from "./objectLoader";
import type { CursorPeerExtension } from "./peerCursors";
import type { ObjectContextMenuRoomExtension } from "./objectContextMenu";

import objectLoader from "./objectLoader";
import peerCursors from "./peerCursors";

export type ObjectStackingObjectExtension = RoomObjectDescriptors<{
    parentId?: number,
    stackable?: boolean,
}>;
export type ObjectStackingRoomExtension = {
    objectStackingPlugin: {
        stackRecursor: (id: number, func: (id: number) => void) => void;
    }
};

export default <RoomPlugin<
    CursorPeerExtension,
    ObjectStackingRoomExtension & ObjectLoaderRoomExtension & ObjectContextMenuRoomExtension,
    ObjectStackingObjectExtension & ObjectLoaderObjectExtension
>
    >{
        name: "objectStacking",
        dependencies: [peerCursors.name, objectLoader.name],
        processMessage(room, data: ObjectMessage) {
            if (data?.type === "object_position") {
                room.objectStackingPlugin.stackRecursor(data.id,
                    (id) => room.objectLoaderPlugin.setObjectPosition(id, data.position, false)
                );
            } else if (data?.type === "object_rotation") {
                room.objectStackingPlugin.stackRecursor(data.id,
                    (id) => room.objectLoaderPlugin.setObjectRotation(id, data.rotation, false),
                );
            } else if (data?.type === "object_move_front") {
                room.objectStackingPlugin.stackRecursor(data.id,
                    (id) => room.objectLoaderPlugin.moveElementToFront(id, false),
                );
            } else if (data?.type === "object_flip") {
                room.objectStackingPlugin.stackRecursor(data.id,
                    (id) => room.objectLoaderPlugin.flipObject(id, data.side, false),
                );
            } else if (data?.type === "object_spawn") {
                room.objectLoaderPlugin.spawnObject(data.descriptors);
            }
        },
        initialize(room) {

            // ROOM DATA INITIALIZED
            room.objectStackingPlugin = {
                // this is really just a helper function attached to the plugin
                stackRecursor: (id, func) => {
                    let next = id;
                    while (next > 0) {
                        func(next);
                        next = room.objects[next].descriptors.parentId ?? 0;
                    }
                },
            };

            room.objectContextMenuPlugin.optionHandlers["toggle stacking"] = (id) => {
                room.objects[id].descriptors.stackable = !(room.objects[id].descriptors.stackable ?? false);
            };

            window.addEventListener("mouseup", () => {
                const hoveredElements = document.elementsFromPoint(room.self.cursor.x, room.self.cursor.y);
                const [top, stack] = [hoveredElements.shift(), hoveredElements.shift()];

                const stackIdString = stack?.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
                const topIdString = top?.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
                if (stackIdString != null && topIdString != null) {
                    const topId = parseInt(topIdString);
                    const topRoomObjectDescriptors = room.objects[topId].descriptors;
                    if (topRoomObjectDescriptors.stackable != null && topRoomObjectDescriptors.stackable) {
                        const stackId = parseInt(stackIdString);
                        topRoomObjectDescriptors.parentId = stackId;

                        room.objectLoaderPlugin.setObjectPosition(
                            topId,
                            room.objects[stackId].descriptors,
                            true
                        );
                    }
                }
            });
        },
    };
