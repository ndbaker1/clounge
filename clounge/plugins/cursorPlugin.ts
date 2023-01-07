import type { RoomData, RoomPlugin, Vector2D } from "types";
import type { SyncMessage, RoomExtension as NameRoomExtension } from "./namePlugin";


export type CursorData = {
    pressed: boolean,
} & Vector2D;

export type MouseUpdate = {
    type: 'mouse';
    data: CursorData;
};

type CursorPluginData = { cursorElement: HTMLElement } & { cursor: CursorData };

export type RoomExtension = CursorPluginData & NameRoomExtension;

export default function plugin(): RoomPlugin<null, RoomExtension> {
    const canvas = document.createElement('div');
    document.body.appendChild(canvas);

    return {
        processData(room, data: MouseUpdate | SyncMessage, peerId) {
            if (data?.type === 'identification') {
                const cursorElement = createCursorElement(data.name);
                canvas.appendChild(cursorElement);
                room.peers[peerId].cursorElement = cursorElement;
            } else if (data?.type === 'mouse') {
                moveCursor(data.data, peerId, room);
            }
        },
        selfSetup(room) {
            room.self.cursor = { x: 0, y: 0, pressed: false };

            const cursorElement = createCursorElement(room.self.name);
            canvas.appendChild(cursorElement);
            room.self.cursorElement = cursorElement;

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

                    margin-left: -16px;
                    margin-top: -10px;

                    text-align: center;
                    z-index: 99;
                }
            </style>
            `;

            window.addEventListener('mousemove', ({ clientX, clientY }) => {
                room.self.cursor.x = clientX;
                room.self.cursor.y = clientY;

                for (const id in room.peers) {
                    room.peers[id].connection.send({
                        type: 'mouse',
                        data: room.self.cursor
                    } as MouseUpdate);
                }

                moveCursor({ x: clientX, y: clientY }, room.self.id, room, true);
            });
        },
        peerSetup(room, peerId) {
            room.peers[peerId].cursor = { x: 0, y: 0, pressed: false };
        },
    };
}

function moveCursor({ x, y }: Vector2D, id: string, room: RoomData<RoomExtension>, isSelf = false) {
    const ref = isSelf ? room.self : room.peers[id];
    const cursorRef = ref.cursorElement;
    const cursor = ref.cursor;
    cursor.x = x;
    cursor.y = y;

    if (cursorRef) {
        cursorRef.style.left = `${x}px`;
        cursorRef.style.top = `${y}px`;
    }
}

function createCursorElement(name: string): HTMLElement {
    const cursorElement = document.createElement('div');
    const cursorImage = document.createElement('img');
    const txt = document.createElement('p');

    cursorElement.className = `cursor`;
    cursorElement.style.left = cursorElement.style.top = '-99px';
    cursorImage.src =
        'https://www.freeiconspng.com/thumbs/cursor-png/description-cursor-icon-with-shadow-32.png';
    cursorImage.width = 40;
    cursorImage.height = 48;

    txt.innerHTML = name
    cursorElement.appendChild(cursorImage);
    cursorElement.appendChild(txt);

    return cursorElement;
}