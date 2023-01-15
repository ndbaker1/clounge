import type { RoomPlugin } from "types";

import type { ObjectPropertiesObjectExtension, ObjectPropertiesRoomExtension, OBJECT_ID_ATTRIBUTE } from "./objectProperties";
import type { CursorPeerExtension } from "./peerCursors";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

import viewportAnchor from "./viewportAnchor";

export type ContextOptionHandler = (objectIds: number[]) => void;

export type ObjectContextMenuRoomExtension<H extends string = string> = {
    objectContextMenuPlugin: {
        menu: HTMLElement;
        optionHandlers: Record<H, ContextOptionHandler>,
    }
};

export default <RoomPlugin<CursorPeerExtension, ObjectContextMenuRoomExtension & ViewportAnchorRoomExtension & ObjectPropertiesRoomExtension, ObjectPropertiesObjectExtension>>{
    name: "objectContextMenu",
    dependencies: [viewportAnchor.name],
    cleanup(room) {
        room.objectContextMenuPlugin.menu.remove();
    },
    initialize(room) {
        const menu = document.createElement("div");
        menu.style.zIndex = String(999);
        menu.style.display = "none";
        menu.style.position = "fixed";

        room.viewportAnchorPlugin.elementRef.appendChild(menu);

        // ROOM DATA INITIALIZED
        room.objectContextMenuPlugin = {
            menu,
            optionHandlers: {
                "move ✋": (ids) => {
                    const status = document.createElement("h3");
                    status.textContent = "left-click to move selected group.";
                    room.infoWindowPlugin.element.prepend(status);

                    window.addEventListener("mouseup", function moveObjects({ button }) {
                        if (button === 0) { // left click
                            for (const id of ids) {
                                room.objectPropertiesPlugin.setObjectPosition(id, room.self.cursorWorld, true);
                            }
                            status.remove();
                            window.removeEventListener("mouseup", moveObjects);
                        }
                    });
                },
                "shuffle 🔀": (ids) => {
                    for (const id of ids) {
                        if (Math.random() > 0.5) {
                            room.objectPropertiesPlugin.moveElementToFront(id, true);
                        }
                    }
                },
                "face up 🔼": (ids) => {
                    for (const id of ids) {
                        room.objectPropertiesPlugin.flipObject(id, "front", true);
                    }
                },
                "face down 🔽": (ids) => {
                    for (const id of ids) {
                        room.objectPropertiesPlugin.flipObject(id, "back", true);
                    }
                },
                "rotate clockwise ↩": (ids) => {
                    for (const id of ids) {
                        room.objectPropertiesPlugin.setObjectRotation(
                            id,
                            (room.objects[id].descriptors.rotationDeg + 90) % 360,
                            true,
                        );
                    }
                },
                "rotate counter-clockwise ↪": (ids) => {
                    for (const id of ids) {
                        room.objectPropertiesPlugin.setObjectRotation(
                            id,
                            (room.objects[id].descriptors.rotationDeg - 90) % 360,
                            true,
                        );
                    }
                },
                "delete ❌": (ids) => {
                    for (const id of ids) {
                        room.objectPropertiesPlugin.deleteObject(id, true);
                    }
                }
            },
        };

        window.addEventListener("contextmenu", (e) => {
            e.preventDefault(); // dont show context menu

            if (Object.keys(room.objectContextMenuPlugin.optionHandlers).length === 0) return;

            const hoveredElementIds = document.elementsFromPoint(room.self.cursorScreen.x, room.self.cursorScreen.y)
                .filter(ele => ele.hasAttribute(<OBJECT_ID_ATTRIBUTE>"object-id"))
                .map(ele => parseInt(ele.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id") ?? ""));

            if (hoveredElementIds.length > 0) {
                const { clientX, clientY } = e;

                const optionContainer = document.createElement("div");
                optionContainer.style.display = "flex";
                optionContainer.style.flexDirection = "column";

                room.objectContextMenuPlugin.menu.replaceChildren(optionContainer);

                for (const optionText in room.objectContextMenuPlugin.optionHandlers) {
                    const optionRef = document.createElement("button");
                    optionRef.style.padding = "0.2rem 0.6rem";
                    const text = document.createElement("small");
                    text.textContent = optionText;
                    optionRef.appendChild(text);
                    optionRef.onclick = () => room.objectContextMenuPlugin.optionHandlers[optionText](hoveredElementIds);
                    optionContainer.appendChild(optionRef);
                }

                room.objectContextMenuPlugin.menu.style.left = clientX + "px";
                room.objectContextMenuPlugin.menu.style.top = clientY + "px";
                room.objectContextMenuPlugin.menu.style.display = "block";

                // self cleaning window handler
                window.addEventListener("mouseup", function closeContextMenu() {
                    room.objectContextMenuPlugin.menu.style.display = "none";
                    window.removeEventListener("mouseup", closeContextMenu);
                });
            }
        });
    },
};
