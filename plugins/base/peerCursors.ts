import type { Message, PeerID, RoomPlugin, Vector2D } from "types";

import type { SyncMessage, NamePeerExtension } from "./names";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

// @ts-ignore
import drag from "../assets/drag.png";
// @ts-ignore
import point from "../assets/point.png";

import namePlugin from "./names";
import viewportAnchorPlugin from "./viewportAnchor";
import infoWindow from "./infoWindow";

export type MouseMessage =
    | Message<"mouse_position", {
        position: Vector2D;
    }>
    | Message<"mouse_press", {
        pressed: boolean;
    }>;

type CursorElements = {
    cursorElement: HTMLElement;
    cursorImage: HTMLImageElement;
    nameElement: HTMLParagraphElement;
};

export type CursorPeerExtension = CursorElements & {
    /**
     * The Cursor Position relaive to the window.
     */
    cursorScreen: Vector2D;
    /**
     * The Cursor Position relative to the (infinite) board space.
     */
    cursorWorld: Vector2D;
    mousePressed: boolean;
} & NamePeerExtension;

export type CursorRoomExtension = {
    cursorPlugin: {
        cursorContainer: HTMLElement;
        createCursor: () => CursorElements;
        moveCursor: (pos: Vector2D, id: PeerID) => void;
    };
};

let mouseCoordinateElement: HTMLElement;

export default <RoomPlugin<CursorPeerExtension, CursorRoomExtension & ViewportAnchorRoomExtension>>{
    name: "peerCursors",
    dependencies: [viewportAnchorPlugin.name, namePlugin.name, infoWindow.name],
    processMessage(room, data: MouseMessage | SyncMessage, peerId) {
        if (data?.type === "identification") {
            room.peers[peerId].nameElement.innerHTML = data.name;
        } else if (data?.type === "mouse_position") {
            room.cursorPlugin.moveCursor(data.position, peerId);
        } else if (data?.type === "mouse_press") {
            room.peers[peerId].mousePressed = data.pressed;
            room.peers[peerId].cursorImage.src = data.pressed ? drag : point;
        }
    },
    initialize(room) {
        const cursorContainer = document.createElement("div");
        cursorContainer.style.position = "relative";
        cursorContainer.style.zIndex = String(9999);
        room.viewportAnchorPlugin.elementRef.appendChild(cursorContainer);

        mouseCoordinateElement = document.createElement("p");
        room.infoWindowPlugin.element.prepend(mouseCoordinateElement);

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
                cursorImage.width = 16;

                cursorElement.appendChild(cursorImage);
                cursorElement.appendChild(nameElement);

                room.cursorPlugin.cursorContainer?.appendChild(cursorElement);

                return {
                    cursorElement,
                    cursorImage,
                    nameElement,
                };
            },
            moveCursor: ({ x, y }, id) => {
                const isSelf = room.self.id === id;
                const ref = isSelf ? room.self : room.peers[id];

                ref.cursorWorld = {
                    x: x - (isSelf ? room.viewportAnchorPlugin.position.x : 0),
                    y: y - (isSelf ? room.viewportAnchorPlugin.position.y : 0),
                };
                if (isSelf) {
                    ref.cursorScreen = { x, y };
                }

                ref.cursorElement.style.left = ref.cursorWorld.x + "px";
                ref.cursorElement.style.top = ref.cursorWorld.y + "px";

                if (isSelf) {
                    const message: MouseMessage = {
                        type: "mouse_position",
                        position: room.self.cursorWorld,
                    };
                    for (const id in room.peers) {
                        room.peers[id].connection.send(message);
                    }
                }
            },
        };

        room.self.cursorWorld = { x: 0, y: 0 };
        room.self.cursorScreen = { x: 0, y: 0 };
        room.self.mousePressed = false;

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

                margin-left: -12px;
                margin-top: -8px;

                align-items: center;
                z-index: 99;
            } .cursor > p {
                margin: 0;
            }
        `;
        document.head.appendChild(cursorStyle);

        window.addEventListener("mousemove", ({ clientX, clientY }) => {
            room.cursorPlugin.moveCursor({ x: clientX, y: clientY }, room.self.id);
            mouseCoordinateElement.textContent = `Mouse Coords: (${room.self.cursorWorld.x}, ${room.self.cursorWorld.y})`;
        });

        window.addEventListener("mousedown", () => {
            room.self.cursorImage.src = drag;

            const message: MouseMessage = {
                type: "mouse_press",
                pressed: true,
            };

            for (const id in room.peers) {
                room.peers[id].connection.send<MouseMessage>(message);
            }
        });

        window.addEventListener("mouseup", () => {
            room.self.cursorImage.src = point;

            const message: MouseMessage = {
                type: "mouse_press",
                pressed: false,
            };

            for (const id in room.peers) {
                room.peers[id].connection.send<MouseMessage>(message);
            }
        });
    },
    peerSetup(room, peerId) {
        room.peers[peerId].cursorWorld = { x: 0, y: 0 };
        room.peers[peerId].mousePressed = false;

        const cursorData = room.cursorPlugin.createCursor();
        room.peers[peerId] = { ...room.peers[peerId], ...cursorData };

        room.cursorPlugin.moveCursor(room.self.cursorScreen, room.self.id);
    },
    handlePeerDisconnect(room, peerId) {
        room.peers[peerId].cursorElement.remove();
    },
    cleanup(room) {
        room.cursorPlugin.cursorContainer.remove();
        mouseCoordinateElement?.remove();
    },
};
