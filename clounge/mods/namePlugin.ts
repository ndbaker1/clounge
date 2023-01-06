import { RoomPlugin } from "index";

export type SyncMessage = {
    type: 'identification';
    name: string;
};

export type RoomExtension = { name: string };

export default function plugin(): RoomPlugin<null, RoomExtension> {
    const canvas = document.createElement('div');
    document.body.appendChild(canvas);

    return {
        processData(room, data: SyncMessage, peerId) {
            if (data?.type === 'identification') {
                room.peers[peerId].name = data.name;
            }
        },
        peerSetup(room, peerId) {
            room.peers[peerId].connection.send({
                type: 'identification',
                name: room.self.name
            } as SyncMessage);
        },
        selfSetup(room) {
            room.self.name = prompt("name?") || "noname";
        }
    };
}

