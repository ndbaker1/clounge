import { RoomMod } from "index";

export type SyncMessage = {
    type: 'identification';
    name: string;
};

export default function mod(): RoomMod {
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
    };
}

