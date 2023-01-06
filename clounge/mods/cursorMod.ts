import { CursorData, RoomData, RoomMod, Vector2D } from "index";
import { SyncMessage } from "./syncMod";

export type MouseUpdate = {
    type: 'mouse';
    position: CursorData;
};

type RoomExtension = { cursorElement: HTMLElement };

export default function mod(): RoomMod<null, RoomExtension> {
    const canvas = document.createElement('div');
    document.body.appendChild(canvas);

    return {
        processData(room, data: MouseUpdate | SyncMessage, peerId) {
            if (data?.type === 'identification') {
                const cursorElement = document.createElement('div');
                const cursorImage = document.createElement('img');
                const txt = document.createElement('p');

                cursorElement.className = `cursor`;
                cursorElement.style.left = cursorElement.style.top = '-99px';
                cursorImage.src =
                    'https://www.freeiconspng.com/thumbs/cursor-png/description-cursor-icon-with-shadow-32.png';
                cursorImage.width = 40;
                cursorImage.height = 48;
                txt.innerHTML = data.name;
                cursorElement.appendChild(cursorImage);
                cursorElement.appendChild(txt);
                canvas?.appendChild(cursorElement);
                room.peers[peerId].cursorElement = cursorElement;
            } else if (data?.type === 'mouse') {
                moveCursor(data.position, peerId, room);
            }
        },
        selfSetup(room) {
            window.addEventListener('mousemove', ({ clientX, clientY }) => {
                room.self.cursor.x = clientX;
                room.self.cursor.y = clientY;

                for (const id in room.peers) {
                    room.peers[id].connection.send({
                        type: 'mouse',
                        position: room.self.cursor
                    } as MouseUpdate);
                }

                moveCursor({ x: clientX, y: clientY }, room.self.id, room, true);
            });

            const cursorElement = document.createElement('div');
            const cursorImage = document.createElement('img');
            const txt = document.createElement('p');

            cursorElement.className = `cursor`;
            cursorElement.style.left = cursorElement.style.top = '-99px';
            cursorImage.src =
                'https://www.freeiconspng.com/thumbs/cursor-png/description-cursor-icon-with-shadow-32.png';
            cursorImage.width = 40;
            cursorImage.height = 48;

            txt.innerHTML = room.self.name;
            cursorElement.appendChild(cursorImage);
            cursorElement.appendChild(txt);
            canvas?.appendChild(cursorElement);
            room.self.cursorElement = cursorElement;

            // hacky way to remove the cursor in all cases
            document.head.innerHTML += `<style type="text/css">* { cursor: none; }</style>`;
        }
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
