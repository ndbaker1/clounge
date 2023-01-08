import type { RoomData, RoomPlugin, Vector2D } from "index";
import type {
  SyncMessage,
  RoomExtension as NameRoomExtension,
} from "./namePlugin";
import { Anchor } from "./anchorPlugin";

// @ts-ignore
import drag from "../assets/drag.png";
// @ts-ignore
import point from "../assets/point.png";

export type CursorData = {
  pressed: boolean;
} & Vector2D;

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

type CursorPluginData = CursorElements & { cursor: CursorData };

export type RoomExtension = CursorPluginData & NameRoomExtension;

export default function plugin(): RoomPlugin<null, RoomExtension> {
  const cursorContainer = document.createElement("div");
  Anchor.element.appendChild(cursorContainer);

  function createCursor(): CursorElements {
    const cursorElement = document.createElement("div");
    const cursorImage = document.createElement("img");
    const nameElement = document.createElement("p");

    cursorElement.className = `cursor`;
    cursorElement.style.left = cursorImage.style.top = "-99px";
    cursorElement.style.zIndex = String(99);
    cursorImage.src = point;
    cursorImage.width = 24;

    cursorElement.appendChild(cursorImage);
    cursorElement.appendChild(nameElement);

    cursorContainer.appendChild(cursorElement);

    return {
      cursorElement,
      cursorImage,
      nameElement,
    };
  }

  return {
    processData(room, data: MouseMessage | SyncMessage, peerId) {
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
    ref.cursorElement.style.left =
      ref.cursor.x + (isSelf ? -Anchor.element.offsetLeft : 0) + "px";
    ref.cursorElement.style.top =
      ref.cursor.y + (isSelf ? -Anchor.element.offsetTop : 0) + "px";
  }
}
