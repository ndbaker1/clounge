import { PeerID, RoomPlugin } from "index";


type PeerRelayMessage = {
    type: "peer relay message",
    peerId: PeerID,
};

export default function plugin(): RoomPlugin {
    return {
        processData(room, data: PeerRelayMessage) {
            if (data?.type === "peer relay message") {
                if (!(data.peerId in room.peers)) {
                    room.self.connect(data.peerId);
                }
            }
        },
        peerSetup(room, peerId) {
            for (const otherId in room.peers) {
                const message: PeerRelayMessage = { peerId: otherId, type: 'peer relay message' };
                room.peers[peerId].connection.send(message);
            }
        },
    };
}

