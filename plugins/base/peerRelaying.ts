import type { Message, PeerID, RoomPlugin } from "types";

type PeerRelayMessage = Message<"peer_relay_message", {
    peerId: PeerID;
}>;

export default <RoomPlugin>{
    name: "peerRelaying",
    processMessage(room, data: PeerRelayMessage) {
        if (data?.type === "peer_relay_message") {
            if (!(data.peerId in room.peers)) {
                room.self.connect(data.peerId);
            }
        }
    },
    peerSetup(room, peerId) {
        for (const otherId in room.peers) {
            room.peers[peerId].connection.send<PeerRelayMessage>({
                type: "peer_relay_message",
                peerId: otherId,
            });
        }
    },
};
