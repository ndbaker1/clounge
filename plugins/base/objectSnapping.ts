import type { RoomPlugin } from "types";
import type { ObjectDescriptors, ObjectPropertiesObjectExtension, ObjectPropertiesRoomExtension, OBJECT_ID_ATTRIBUTE } from "./objectProperties";
import type { CursorPeerExtension } from "./peerCursors";
import type { ObjectContextMenuRoomExtension } from "./objectContextMenu";

import peerCursors from "./peerCursors";
import objectProperties from "./objectProperties";
import objectContextMenu from "./objectContextMenu";

export type ObjectSnappingObjectExtension = ObjectDescriptors<{
    snap?: boolean,
}>;

export default <RoomPlugin<
    CursorPeerExtension,
    ObjectPropertiesRoomExtension & ObjectContextMenuRoomExtension,
    ObjectSnappingObjectExtension & ObjectPropertiesObjectExtension
>
    >{
        name: "objectSnapping",
        dependencies: [peerCursors.name, objectProperties.name, objectContextMenu.name],
        initialize(room) {
            room.objectContextMenuPlugin.optionHandlers["snapping on"] = (ids) => {
                for (const id of ids) {
                    room.objects[id].descriptors.snap = true;
                }
            };
            room.objectContextMenuPlugin.optionHandlers["snapping off"] = (ids) => {
                for (const id of ids) {
                    room.objects[id].descriptors.snap = false;
                }
            };

            window.addEventListener("mouseup", ({ button }) => {
                if (button === 0) { // left button up after drag
                    const hoveredElements = document
                        .elementsFromPoint(room.self.cursorScreen.x, room.self.cursorScreen.y)
                        .filter(ele => ele.hasAttribute(<OBJECT_ID_ATTRIBUTE>"object-id"));

                    const [top, stack] = [hoveredElements.shift(), hoveredElements.shift()];

                    const stackIdString = stack?.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
                    const topIdString = top?.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
                    if (stackIdString != null && topIdString != null) {
                        const topId = parseInt(topIdString);
                        const topRoomObjectDescriptors = room.objects[topId].descriptors;
                        if (topRoomObjectDescriptors.snap != null && topRoomObjectDescriptors.snap) {
                            const stackId = parseInt(stackIdString);

                            room.objectPropertiesPlugin.setObjectPosition(
                                topId,
                                room.objects[stackId].descriptors,
                                true,
                            );
                        }
                    }
                }
            });
        },
    };
