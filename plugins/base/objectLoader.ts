import type { RoomPlugin } from "types";
import type { ObjectDescriptors, ObjectMessage, ObjectPropertiesRoomExtension } from "./objectProperties";

// local libs
import objectProperties from "./objectProperties";

let actionContainer: HTMLElement;

export default <RoomPlugin<object, ObjectPropertiesRoomExtension>>{
    name: "objectLoader",
    dependencies: [objectProperties.name],
    cleanup() {
        actionContainer.remove();
    },
    initialize(room) {
        // button that allows you to bulk load using a formatted json
        actionContainer = document.createElement("div");
        actionContainer.style.position = "fixed";
        actionContainer.style.display = "grid";
        actionContainer.style.top = "0";
        actionContainer.style.right = "10rem";
        actionContainer.style.padding = "1rem";
        actionContainer.style.gap = "0.2rem";

        const uploadButton = document.createElement("button");
        uploadButton.innerText = "📷 Load Object Descriptor";
        uploadButton.style.padding = "0.5rem 0.8rem";
        uploadButton.onclick = async () => {
            try {
                const loadRequest: Partial<ObjectDescriptors["descriptors"] & { count: number }>[] = JSON.parse(
                    prompt(`
Hope you understand typescript notation.
Please enter a json string of the type: 
Array<{
    id: number;
    width?: number;
    height?: number;
    currentImg?: string;
    frontImg: string;
    backImg: string;
    rotationDeg: number;
    draggable?: boolean;
    count?: number;
}>
                    `) ?? ""
                );

                loadRequest.forEach((spawn) => {
                    for (let i = 0; i < (spawn.count ?? 1); i++) {
                        const { descriptors } = room.objectPropertiesPlugin.spawnObject(spawn);

                        const message: ObjectMessage = {
                            type: "object_spawn",
                            descriptors,
                        };

                        for (const id in room.peers) {
                            room.peers[id].connection.send(message);
                        }
                    }
                });
            } catch (e) {
                // Eh...
                console.error("encountered issue loading an object.", e);
            }
        };

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "💣 Clear Objects";
        deleteButton.style.padding = "0.5rem 0.8rem";
        deleteButton.onclick = () => {
            for (const idKey in room.objects) {
                const id = parseInt(idKey);
                room.objectPropertiesPlugin.deleteObject(id, true);
            }
        };

        actionContainer.appendChild(uploadButton);
        actionContainer.appendChild(deleteButton);
        document.body.appendChild(actionContainer);
    },
};
