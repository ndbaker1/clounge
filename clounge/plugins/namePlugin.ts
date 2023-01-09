import type { RoomPlugin } from "index";

export type SyncMessage = {
  type: "identification";
  name: string;
};

export type RoomExtension = { name: string };

export default <RoomPlugin<RoomExtension>>{
  name: "namePlugin",
  processMessage(room, data: SyncMessage, peerId) {
    if (data?.type === "identification") {
      room.peers[peerId].name = data.name;
    }
  },
  peerSetup(room, peerId) {
    const message: SyncMessage = {
      type: "identification",
      name: room.self.name,
    };
    room.peers[peerId].connection.send(message);
  },
  selfSetup(room) {
    const nameContainer = document.createElement("div");
    nameContainer.style.position = "fixed";
    nameContainer.style.top = "0";
    nameContainer.style.left = "0";
    nameContainer.style.padding = "0.5rem";

    const nameField = document.createElement("input");
    nameField.placeholder = "provide a name..";
    nameField.style.margin = "0.5rem 0.8rem";
    nameField.oninput = async () => {
      room.self.name = nameField.value; // user doesn't really even need to know their own name

      const message: SyncMessage = {
        type: "identification",
        name: nameField.value,
      };
      for (const peer in room.peers) {
        room.peers[peer].connection.send(message);
      }
    };
    nameContainer.appendChild(nameField);
    document.body.appendChild(nameContainer);
  },
};
