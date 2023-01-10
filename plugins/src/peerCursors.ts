import type { PeerID, RoomPlugin, Vector2D } from "types";

import type { SyncMessage, NamePeerExtension } from "./names";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

// @ts-ignore
import drag from "../assets/drag.png";
// @ts-ignore
import point from "../assets/point.png";

import namePlugin from "./names";
import viewportAnchorPlugin from "./viewportAnchor";

export type CursorData = Vector2D & {
    pressed: boolean;
};

export type MouseMessage =
    | {
        type: "mouse_position";
        position: Vector2D;
    }
    | {
        type: "mouse_press";
        pressed: boolean;
    };

type CursorElements = {
    cursorElement: HTMLElement;
    cursorImage: HTMLImageElement;
    nameElement: HTMLParagraphElement;
};

export type CursorPeerExtension = CursorElements & {
    cursor: CursorData;
} & NamePeerExtension;

export type CursorRoomExtension = {
    cursorPlugin: {
        cursorContainer?: HTMLElement;
        createCursor: () => CursorElements;
        moveCursor: (pos: Vector2D, id: PeerID, isSelf?: boolean) => void;
    };
} & ViewportAnchorRoomExtension;

export default <RoomPlugin<CursorPeerExtension, CursorRoomExtension>>{
    name: "peerCursors",
    dependencies: [viewportAnchorPlugin.name, namePlugin.name],
    processMessage(room, data: MouseMessage | SyncMessage, peerId) {
        if (data?.type === "identification") {
            room.peers[peerId].nameElement.innerHTML = data.name;
        } else if (data?.type === "mouse_position") {
            room.cursorPlugin.moveCursor(data.position, peerId);
        } else if (data?.type === "mouse_press") {
            room.peers[peerId].cursor.pressed = data.pressed;
            room.peers[peerId].cursorImage.src = data.pressed ? drag : point;
        }
    },
    initialize(room) {
        const cursorContainer = document.createElement("div");
        if (!room.viewportAnchorPlugin.elementRef) throw Error("anchor not initialized!");
        room.viewportAnchorPlugin.elementRef.appendChild(cursorContainer);

        // ROOM DATA INITIALIZED
        room.cursorPlugin = {
            cursorContainer,
            createCursor: () => {
                const cursorElement = document.createElement("div");
                const cursorImage = document.createElement("img");
                const nameElement = document.createElement("p");

                cursorElement.className = "cursor";
                cursorElement.style.left = cursorImage.style.top = "-99px";
                cursorImage.src = point;
                cursorImage.width = 24;

                cursorElement.appendChild(cursorImage);
                cursorElement.appendChild(nameElement);

                room.cursorPlugin.cursorContainer?.appendChild(cursorElement);

                return {
                    cursorElement,
                    cursorImage,
                    nameElement,
                };
            },
            moveCursor: ({ x, y }: Vector2D, id: string, isSelf = false) => {
                const ref = isSelf ? room.self : room.peers[id];

                ref.cursor.x = x;
                ref.cursor.y = y;

                const anchorRef = room.viewportAnchorPlugin.elementRef;
                if (anchorRef) {
                    ref.cursorElement.style.left = ref.cursor.x + (isSelf ? -anchorRef.offsetLeft : 0) + "px";
                    ref.cursorElement.style.top = ref.cursor.y + (isSelf ? -anchorRef.offsetTop : 0) + "px";
                }
            },
        };

        room.self.cursor = { x: 0, y: 0, pressed: false };

        const cursorData = room.cursorPlugin.createCursor();
        cursorData.nameElement.innerHTML = "me";
        cursorData.nameElement.style.color = "#F2A07B";
        room.self = { ...room.self, ...cursorData };

        // hacky way to remove the cursor in all cases
        const cursorStyle = document.createElement("style");
        cursorStyle.innerHTML = `
        * { cursor: none; }

        .cursor {
            display: flex;
            flex-direction: row;
            position: absolute;
            user-select: none;
            pointer-events: none;

            margin-left: -7px;
            margin-top: -4px;

            align-items: center;
            z-index: 99;
        } .cursor > p {
            margin: 0;
        }
        `;
        document.head.appendChild(cursorStyle);

        window.addEventListener("mousemove", ({ clientX, clientY }) => {
            room.self.cursor.x = clientX;
            room.self.cursor.y = clientY;

            const message: MouseMessage = {
                type: "mouse_position",
                position: {
                    x: room.self.cursor.x - room.viewportAnchorPlugin.position.x,
                    y: room.self.cursor.y - room.viewportAnchorPlugin.position.y,
                },
            };
            for (const id in room.peers) {
                room.peers[id].connection.send(message);
            }

            room.cursorPlugin.moveCursor({ x: clientX, y: clientY }, room.self.id, true);
        });

        window.addEventListener("mousedown", () => {
            room.self.cursorImage.src = drag;

            const message: MouseMessage = {
                type: "mouse_press",
                pressed: true,
            };
            for (const id in room.peers) {
                room.peers[id].connection.send(message);
            }
        });

        window.addEventListener("mouseup", () => {
            room.self.cursorImage.src = point;

            const message: MouseMessage = {
                type: "mouse_press",
                pressed: false,
            };
            for (const id in room.peers) {
                room.peers[id].connection.send(message);
            }
        });

    },
    peerSetup(room, peerId) {
        room.peers[peerId].cursor = { x: 0, y: 0, pressed: false };

        const cursorData = room.cursorPlugin.createCursor();
        room.peers[peerId] = { ...room.peers[peerId], ...cursorData };

        const message: MouseMessage = {
            type: "mouse_position",
            position: {
                x: room.self.cursor.x - room.viewportAnchorPlugin.position.x,
                y: room.self.cursor.y - room.viewportAnchorPlugin.position.y,
            },
        };
        room.peers[peerId].connection.send(message);
    },
    handlePeerDisconnect(room, peerId) {
        room.peers[peerId].cursorElement.remove();
    },
    cleanup(room) {
        room.cursorPlugin.cursorContainer?.remove();
    },
};
