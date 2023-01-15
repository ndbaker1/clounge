import type { RoomPlugin } from "types";

import type { ObjectPropertiesObjectExtension, ObjectPropertiesRoomExtension, OBJECT_ID_ATTRIBUTE } from "./objectProperties";
import type { CursorPeerExtension } from "./peerCursors";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

import viewportAnchor from "./viewportAnchor";

type ContextOptionsMap = Map<string, ContextOptionsMap | ContextOptionHandler>;
type ContextOptionHandler = (objectIds: number[]) => void;

export type ObjectContextMenuRoomExtension = {
    objectContextMenuPlugin: {
        menu: HTMLElement;
        menuOptions: ContextOptionsMap;
    }
};

export default <RoomPlugin<
    CursorPeerExtension,
    ObjectContextMenuRoomExtension & ViewportAnchorRoomExtension & ObjectPropertiesRoomExtension,
    ObjectPropertiesObjectExtension
>
    >{
        name: "objectContextMenu",
        dependencies: [viewportAnchor.name],
        initialize(room) {
            const menu = document.createElement("div");
            menu.style.zIndex = String(999);
            menu.style.display = "none";
            menu.style.position = "fixed";

            room.viewportAnchorPlugin.elementRef.appendChild(menu);

            // ROOM DATA INITIALIZED
            room.objectContextMenuPlugin = {
                menu,
                menuOptions: new Map(Object.entries({
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
                    "flip 🃏": new Map(Object.entries({
                        "all face up 🔼": (ids) => {
                            for (const id of ids) {
                                room.objectPropertiesPlugin.flipObject(id, "front", true);
                            }
                        },
                        "all face down 🔽": (ids) => {
                            for (const id of ids) {
                                room.objectPropertiesPlugin.flipObject(id, "back", true);
                            }
                        },
                        "reverse all 🔀": (ids) => {
                            for (const id of ids) {
                                room.objectPropertiesPlugin.flipObject(id, "back", true);
                            }
                        },
                    })),
                    "rotate 🔄": new Map(Object.entries({
                        "all straight": (ids) => {
                            for (const id of ids) {
                                room.objectPropertiesPlugin.setObjectRotation(id, 0, true);
                            }
                        },
                        "clockwise ↩": (ids) => {
                            for (const id of ids) {
                                room.objectPropertiesPlugin.setObjectRotation(
                                    id,
                                    (room.objects[id].descriptors.rotationDeg + 90) % 360,
                                    true,
                                );
                            }
                        },
                        "counter-clockwise ↪": (ids) => {
                            for (const id of ids) {
                                room.objectPropertiesPlugin.setObjectRotation(
                                    id,
                                    (room.objects[id].descriptors.rotationDeg - 90) % 360,
                                    true,
                                );
                            }
                        },
                    })),
                    "delete ❌": (ids) => {
                        for (const id of ids) {
                            room.objectPropertiesPlugin.deleteObject(id, true);
                        }
                    },
                })),
            };

            /**
             * Recursively load menus
             */
            function loadMenuFromHandlers(handlers: ContextOptionsMap, ids: number[]) {
                const optionContainer = document.createElement("div");
                optionContainer.style.display = "flex";
                optionContainer.style.flexDirection = "column";

                room.objectContextMenuPlugin.menu.replaceChildren(optionContainer);

                for (const [optionText, optionEntry] of handlers.entries()) {
                    const optionRef = document.createElement("button");
                    optionRef.style.padding = "0.2rem 0.6rem";
                    const text = document.createElement("small");
                    text.textContent = optionText;
                    optionRef.appendChild(text);

                    if (typeof (optionEntry) == "function") {
                        optionRef.onclick = () => optionEntry(ids);
                    } else {
                        optionRef.onclick = () => loadMenuFromHandlers(optionEntry, ids);
                    }

                    optionContainer.appendChild(optionRef);
                }

                room.objectContextMenuPlugin.menu.style.display = "block";

                // self cleaning window handler
                window.addEventListener("mouseup", function closeContextMenu() {
                    room.objectContextMenuPlugin.menu.style.display = "none";
                    window.removeEventListener("mouseup", closeContextMenu);
                });
            }

            window.addEventListener("contextmenu", (e) => {
                e.preventDefault(); // dont show context menu

                if (room.objectContextMenuPlugin.menuOptions.size === 0) return;

                const hoveredElementIds = document.elementsFromPoint(room.self.cursorScreen.x, room.self.cursorScreen.y)
                    .filter(ele => ele.hasAttribute(<OBJECT_ID_ATTRIBUTE>"object-id"))
                    .map(ele => parseInt(ele.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id") ?? ""));

                if (hoveredElementIds.length > 0) {
                    room.objectContextMenuPlugin.menu.style.left = room.self.cursorScreen.x + "px";
                    room.objectContextMenuPlugin.menu.style.top = room.self.cursorScreen.y + "px";
                    loadMenuFromHandlers(room.objectContextMenuPlugin.menuOptions, hoveredElementIds);
                }
            });
        },
        cleanup(room) {
            room.objectContextMenuPlugin.menu.remove();
        },
    };
