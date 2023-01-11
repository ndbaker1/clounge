import type { RoomPlugin } from "types";
import type { ObjectLoaderObjectExtension, OBJECT_ID_ATTRIBUTE } from "./objectLoader";
import type { CursorPeerExtension } from "./peerCursors";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

import viewportAnchor from "./viewportAnchor";

export type ContextOptionHandler = (objectId: number) => void;

export type ObjectContextMenuRoomExtension<H extends string = string> = ViewportAnchorRoomExtension & {
    objectContextMenuPlugin: {
        menu: HTMLElement;
        optionHandlers: Record<H, ContextOptionHandler>,
    }
};

export default <RoomPlugin<CursorPeerExtension, ObjectContextMenuRoomExtension, ObjectLoaderObjectExtension>>{
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
            optionHandlers: {},
        };

        window.addEventListener("contextmenu", (e) => {
            e.preventDefault(); // dont show context menu

            if (Object.keys(room.objectContextMenuPlugin.optionHandlers).length === 0) return;

            const hoveredElement = document.elementFromPoint(room.self.cursor.x, room.self.cursor.y);
            const elementId = parseInt(hoveredElement?.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id") ?? "0");
            if (elementId > 0) {
                const { clientX, clientY } = e;

                const optionContainer = document.createElement("div");
                optionContainer.style.padding = "0.5rem 0.2rem";
                optionContainer.style.backgroundColor = "#322F3D";
                optionContainer.style.borderRadius = "1px";
                optionContainer.style.border = "1px solid #4B5D67";

                room.objectContextMenuPlugin.menu.replaceChildren(optionContainer);

                for (const optionText in room.objectContextMenuPlugin.optionHandlers) {
                    const optionRef = document.createElement("button");
                    optionRef.style.padding = "0.2rem 0.6rem";
                    const text = document.createElement("small");
                    text.textContent = optionText;
                    optionRef.appendChild(text);
                    optionRef.onclick = () => room.objectContextMenuPlugin.optionHandlers[optionText](elementId);
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
