import { RoomPlugin } from "types";


export type SyncMessage = {
    type: 'identification';
    name: string;
};

export type RoomExtension = { name: string };

export default function plugin(): RoomPlugin<null, RoomExtension> {
    return {
        processData(room, data: SyncMessage, peerId) {
            if (data?.type === 'identification') {
                room.peers[peerId].name = data.name;
            }
        },
        peerSetup(room, peerId) {
            const message: SyncMessage = {
                type: 'identification',
                name: room.self.name,
            };
            room.peers[peerId].connection.send(message);
        },
        selfSetup(room) {
            room.self.name = "noname";
        }
    };
}

