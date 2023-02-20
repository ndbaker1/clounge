import type { RoomPlugin } from "types";
import type { ObjectDescriptors, ObjectMessage, ObjectPropertiesObjectExtension, ObjectPropertiesRoomExtension } from "./objectProperties";

// local libs
import objectProperties from "./objectProperties";

/**
 * Expected type of JSON payload describing object properties, instance number, and sorting label.
 * 
 * When a group label is specified the positioning is done automatically,  
 * so only provide (x, y) coordinates to objects which do not belong in a group.
 * 
 * @example
    [
     {
         "count": 1,
         "frontImg": "https://upload.wikimedia.org/wikipedia/commons/d/db/Blue_card.svg",
         "groupLabel": "blue"
     },
     {
         "count": 2,
         "frontImg": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Red_card.svg",
         "groupLabel": "red"
     },
     {
         "count": 3,
         "frontImg": "https://upload.wikimedia.org/wikipedia/commons/b/b1/Yellow_card.svg",
         "groupLabel": "yellow"
     }
    ]
 */
export type ObjectLoadDescriptor = Partial<ObjectDescriptors["descriptors"] & {
    count: number;
    groupLabel: string;
}>;

export type ObjectLoaderRoomExtension = {
    objectLoaderPlugin: {
        loadObjectDescriptors: (descriptors: ObjectLoadDescriptor[]) => void;
    }
}

let actionContainer: HTMLElement;

export default <RoomPlugin<object, ObjectLoaderRoomExtension & ObjectPropertiesRoomExtension, ObjectPropertiesObjectExtension>>{
    name: "objectLoader",
    dependencies: [objectProperties.name],
    initialize(room) {
        // ROOM DATA INITIALIZED
        room.objectLoaderPlugin = {
            loadObjectDescriptors(descriptors: ObjectLoadDescriptor[]) {
                let maxWidth = 0;
                let offsetCounter = 0;
                const offsetMap = new Map<string, number>();

                descriptors
                    .map((spawn) => {
                        if (spawn.groupLabel != null) {
                            if (!offsetMap.has(spawn.groupLabel)) {
                                offsetMap.set(spawn.groupLabel, offsetCounter++);
                            }

                            maxWidth = Math.max(maxWidth, spawn.width ?? 200);
                        }

                        return spawn;
                    })
                    .map((spawn) => {
                        if (spawn.x == null) spawn.x = window.innerWidth / 2;
                        if (spawn.groupLabel != null) {
                            spawn.x += (offsetMap.get(spawn.groupLabel) ?? 0) * maxWidth;
                        }

                        return spawn;
                    })
                    .forEach((spawn) => {
                        for (let i = 0; i < (spawn.count ?? 1); i++) {
                            const descriptors = room.objects[room.objectPropertiesPlugin.spawnObject(spawn)].descriptors;

                            const message: ObjectMessage = { type: "object_spawn", descriptors };
                            for (const id in room.peers) {
                                room.peers[id].connection.send<ObjectMessage>(message);
                            }
                        }
                    });
            },
        };

        // button that allows you to bulk load using a formatted json
        actionContainer = document.createElement("div");
        actionContainer.style.position = "fixed";
        actionContainer.style.display = "grid";
        actionContainer.style.top = "3rem";
        actionContainer.style.right = "0";
        actionContainer.style.padding = "1rem";
        actionContainer.style.gap = "0.2rem";

        const uploadButton = document.createElement("button");
        uploadButton.innerText = "📷 Load Objects";
        uploadButton.style.padding = "0.5rem 0.8rem";
        uploadButton.onclick = async () => {
            const descriptor = prompt("Enter a Descriptor URL or JSON.\nIf you are supporting JSON, please refer to the [ObjectLoadDescriptor] type in the source code.") ?? "";

            // check url or json
            if (descriptor.startsWith("http")) {
                alert(descriptor);
                // prefix all image names with the stored url (which prepend the same name)
                (async () => {
                    const metaDescriptors: ObjectLoadDescriptor[] = await (await fetch(descriptor + "/descriptors.json")).json();
                    const expandedDescriptors = metaDescriptors.map(descriptor => {
                        if (descriptor.backImg != null) { descriptor.backImg = descriptor + "/" + descriptor.backImg; }
                        if (descriptor.frontImg != null) { descriptor.frontImg = descriptor + "/" + descriptor.frontImg; }
                        return descriptor;
                    });
                    room.objectLoaderPlugin.loadObjectDescriptors(expandedDescriptors);
                })();
            } else {
                try {
                    const loadRequest: ObjectLoadDescriptor[] = JSON.parse(descriptor);
                    room.objectLoaderPlugin.loadObjectDescriptors(loadRequest);
                } catch (e) {
                    // Eh...
                    console.error("encountered issue loading an object.", e);
                }
            }
        };

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "💣 Clear Objects";
        deleteButton.style.padding = "0.5rem 0.8rem";
        deleteButton.onclick = () => {
            if (confirm("are you sure?")) {
                for (const idKey in room.objects) {
                    const id = parseInt(idKey);
                    room.objectPropertiesPlugin.deleteObject(id, true);
                }
            }
        };

        actionContainer.appendChild(uploadButton);
        actionContainer.appendChild(deleteButton);
        document.body.appendChild(actionContainer);
    },
    cleanup() {
        actionContainer.remove();
    },
};
