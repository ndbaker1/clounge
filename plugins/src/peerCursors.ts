import type { RoomData, RoomPlugin, Vector2D } from "types";

import type { SyncMessage, RoomExtension as NameRoomExtension } from "./names";
import anchorPlugin, { Anchor } from "./viewportAnchor";

// @ts-ignore
import drag from "../assets/drag.png";
// @ts-ignore
import point from "../assets/point.png";

import namePlugin from "./names";

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

export type RoomExtension = CursorElements & {
    cursor: CursorData;
} & NameRoomExtension;

const state = {
    cursorContainer: <HTMLElement | null>null,
};

export default <RoomPlugin<RoomExtension>>{
    name: "peerCursors",
    dependencies: [anchorPlugin.name, namePlugin.name],
    load() {
        state.cursorContainer = document.createElement("div");
        if (!Anchor.element) throw Error("anchor not initialized!");
        Anchor.element.appendChild(state.cursorContainer);
    },
    unload() {
        state.cursorContainer?.remove();
    },
    processMessage(room, data: MouseMessage | SyncMessage, peerId) {
        if (data?.type === "identification") {
            room.peers[peerId].nameElement.innerHTML = data.name;
        } else if (data?.type === "mouse_position") {
            moveCursor(data.position, peerId, room);
        } else if (data?.type === "mouse_press") {
            room.peers[peerId].cursor.pressed = data.pressed;
            room.peers[peerId].cursorImage.src = data.pressed ? drag : point;
        }
    },
    selfSetup(room) {
        room.self.cursor = { x: 0, y: 0, pressed: false };

        const cursorData = createCursor();
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

            const anchorPosition = Anchor.getPosition();
            const message: MouseMessage = {
                type: "mouse_position",
                position: {
                    x: room.self.cursor.x - anchorPosition.x,
                    y: room.self.cursor.y - anchorPosition.y,
                },
            };
            for (const id in room.peers) {
                room.peers[id].connection.send(message);
            }

            moveCursor({ x: clientX, y: clientY }, room.self.id, room, true);
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

        const cursorData = createCursor();
        room.peers[peerId] = { ...room.peers[peerId], ...cursorData };

        const anchorPosition = Anchor.getPosition();
        const message: MouseMessage = {
            type: "mouse_position",
            position: {
                x: room.self.cursor.x - anchorPosition.x,
                y: room.self.cursor.y - anchorPosition.y,
            },
        };
        room.peers[peerId].connection.send(message);
    },
    handlePeerDisconnect(room, peerId) {
        room.peers[peerId].cursorElement.remove();
    },
};

function moveCursor({ x, y }: Vector2D, id: string, room: RoomData<RoomExtension>, isSelf = false) {
    const ref = isSelf ? room.self : room.peers[id];

    ref.cursor.x = x;
    ref.cursor.y = y;

    if (Anchor.element) {
        ref.cursorElement.style.left = ref.cursor.x + (isSelf ? -Anchor.element.offsetLeft : 0) + "px";
        ref.cursorElement.style.top = ref.cursor.y + (isSelf ? -Anchor.element.offsetTop : 0) + "px";
    }
}

function createCursor(): CursorElements {
    const cursorElement = document.createElement("div");
    const cursorImage = document.createElement("img");
    const nameElement = document.createElement("p");

    cursorElement.className = "cursor";
    cursorElement.style.left = cursorImage.style.top = "-99px";
    cursorImage.src = point;
    cursorImage.width = 24;

    cursorElement.appendChild(cursorImage);
    cursorElement.appendChild(nameElement);

    state.cursorContainer?.appendChild(cursorElement);

    return {
        cursorElement,
        cursorImage,
        nameElement,
    };
}
