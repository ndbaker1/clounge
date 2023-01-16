import type { Message, RoomPlugin } from "types";

export type SyncMessage = Message<"identification", {
    name: string;
}>;

export type NamePeerExtension = { name: string };

const elementRefs: HTMLElement[] = [];

export default <RoomPlugin<NamePeerExtension>>{
    name: "names",
    processMessage(room, data: SyncMessage, peerId) {
        if (data?.type === "identification") {
            room.peers[peerId].name = data.name;
        }
    },
    peerSetup(room, peerId) {
        room.peers[peerId].connection.send<SyncMessage>({
            type: "identification",
            name: room.self.name,
        });
    },
    initialize(room) {
        function updateName(name?: string) {
            room.self.name = name != null && name.length > 0
                ? name
                : "unnamed"; // user doesn't really even need to know their own name

            const message: SyncMessage = {
                type: "identification",
                name: room.self.name,
            };

            for (const peer in room.peers) {
                room.peers[peer].connection.send<SyncMessage>(message);
            }
        }

        updateName();

        const nameContainer = document.createElement("div");
        nameContainer.style.position = "fixed";
        nameContainer.style.top = "0";
        nameContainer.style.left = "0";
        nameContainer.style.padding = "0.5rem";

        const nameField = document.createElement("input");
        nameField.placeholder = "provide a name..";
        nameField.style.margin = "0.5rem 0.8rem";
        nameField.oninput = () => updateName(nameField.value);
        nameContainer.appendChild(nameField);
        document.body.appendChild(nameContainer);

        elementRefs.push(nameContainer);
    },
    cleanup() {
        elementRefs.forEach(e => e.remove());
    },
};
