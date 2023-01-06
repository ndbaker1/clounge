import { RoomPlugin, Vector2D } from "index";

type Message =
    | {
        type: 'spawn';
        object: {
            id: number,
            x: number,
            y: number,
            width: number,
            height: number,
            imgSrc?: string,
        }
    }
    | {
        type: 'drag';
        change: Vector2D;
    };

export default function plugin(): RoomPlugin {
    const canvas = document.createElement('div');
    document.body.appendChild(canvas);

    return {
        processData(room, data: Message, peerId) {
            if (data?.type === 'drag') {

            } else if (data?.type === "spawn") {
                room.objects[data.object.id] = data.object;

                const loadedObject = document.createElement('img');
                if (data.object.imgSrc) loadedObject.src = data.object.imgSrc;
                loadedObject.width = data.object.width;
                loadedObject.height = data.object.height;
                loadedObject.style.left = `${data.object.x}px`;
                loadedObject.style.top = `${data.object.y}px`;
            }
        },

        selfSetup(room) {
            window.addEventListener('mousemove', ({ clientX, clientY }) => {

            });
        }
    };
}

