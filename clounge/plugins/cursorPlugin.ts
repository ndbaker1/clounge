import type { RoomData, RoomPlugin, Vector2D } from "types";
import type {
  SyncMessage,
  RoomExtension as NameRoomExtension,
} from "./namePlugin";

// @ts-ignore
import drag from '../assets/drag.png';
// @ts-ignore
import point from '../assets/point.png';


export type CursorData = {
  pressed: boolean;
} & Vector2D;

export type MouseMessage =
  | {
    type: "mouse_pos";
    position: Vector2D;
  }
  | {
    type: "mouse_press";
    pressed: boolean;
  };

type CursorElements = { cursorElement: HTMLElement, cursorImage: HTMLImageElement };

type CursorPluginData = CursorElements & { cursor: CursorData };

export type RoomExtension = CursorPluginData & NameRoomExtension;

export default function plugin(): RoomPlugin<null, RoomExtension> {
  const cursorContainer = document.createElement("div");
  document.body.appendChild(cursorContainer);

  return {
    processData(room, data: MouseMessage | SyncMessage, peerId) {
      if (data?.type === "identification") {
        const { cursorElement, cursorImage } = createCursorElement(data.name);
        cursorContainer.appendChild(cursorElement);
        room.peers[peerId].cursorElement = cursorElement;
        room.peers[peerId].cursorImage = cursorImage;
      } else if (data?.type === "mouse_pos") {
        moveCursor(data.position, peerId, room);
      } else if (data?.type === "mouse_press") {
        room.peers[peerId].cursor.pressed = data.pressed;
        room.peers[peerId].cursorImage.src = data.pressed ? drag : point;
      }
    },
    selfSetup(room) {
      room.self.cursor = { x: 0, y: 0, pressed: false };

      const { cursorElement, cursorImage } = createCursorElement(room.self.name);
      cursorContainer.appendChild(cursorElement);
      room.self.cursorElement = cursorElement;
      room.self.cursorImage = cursorImage;

      // hacky way to remove the cursor in all cases
      document.head.innerHTML += `
            <style type="text/css">
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
            </style>
            `;

      window.addEventListener("mousemove", ({ clientX, clientY }) => {
        room.self.cursor.x = clientX;
        room.self.cursor.y = clientY;

        const message: MouseMessage = {
          type: "mouse_pos",
          position: room.self.cursor,
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
    },
  };
}

function moveCursor(
  { x, y }: Vector2D,
  id: string,
  room: RoomData<RoomExtension>,
  isSelf = false
) {
  const ref = isSelf ? room.self : room.peers[id];

  ref.cursor.x = x;
  ref.cursor.y = y;

  if (ref.cursorElement) {
    ref.cursorElement.style.left = `${x}px`;
    ref.cursorElement.style.top = `${y}px`;
  }
}

function createCursorElement(name: string): CursorElements {
  const cursorElement = document.createElement("div");
  const cursorImage = document.createElement("img");
  const txt = document.createElement("p");

  cursorElement.className = `cursor`;
  cursorElement.style.left = cursorImage.style.top = "-99px";
  cursorImage.src = point;
  cursorImage.width = 24;

  txt.innerHTML = name;
  cursorElement.appendChild(cursorImage);
  cursorElement.appendChild(txt);

  return {
    cursorElement,
    cursorImage,
  };
}
