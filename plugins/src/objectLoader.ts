import type { RoomPlugin, Vector2D } from "types";

import type { CursorPeerExtension, CursorRoomExtension } from "./peerCursors";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

// local libs
import cursorPlugin from "./peerCursors";
import viewportAnchorPlugin from "./viewportAnchor";

export type ObjectDescriptor = Vector2D & {
    id: number;
    width?: number;
    height?: number;
    imgSrc: {
        front: string;
        back: string;
    };
    draggable?: boolean;
};

export type ObjectMessage =
    | {
        type: "object_position";
        id: number;
        position: Vector2D;
    }
    | {
        type: "object_spawn";
        object: ObjectDescriptor;
    };

export type ObjectLoaderObjectExtension = {
    objectData: ObjectDescriptor;
    element: HTMLImageElement;
};
export type ObjectLoaderPeerExtension = CursorPeerExtension;
export type ObjectLoaderRoomExtension = CursorRoomExtension & ViewportAnchorRoomExtension & {
    objectLoaderPlugin: {
        objectContainer?: HTMLElement; // automatically keep track of the the next id to be created.
        currentId: number;
        selectedObjectId: number;
        previousPosition: Vector2D;
        updateId: (id: number) => void;
        spawnObject: (objectData: ObjectDescriptor) => HTMLImageElement;
    }
};

const OBJECT_ID_ATTRIBUTE = "object-id";


export default <RoomPlugin<ObjectLoaderPeerExtension, ObjectLoaderRoomExtension, ObjectLoaderObjectExtension>>{
    name: "objectLoader",
    dependencies: [cursorPlugin.name, viewportAnchorPlugin.name],
    cleanup(room) {
        room.objectLoaderPlugin.objectContainer?.remove();
    },
    processMessage(room, data: ObjectMessage) {
        if (data?.type === "object_position") {
            room.objects[data.id].objectData.x = data.position.x;
            room.objects[data.id].objectData.y = data.position.y;
            room.objects[data.id].element.style.top = data.position.y + "px";
            room.objects[data.id].element.style.left = data.position.x + "px";
<<<<<<< HEAD
            room.objectLoaderPlugin.updateId(data.id);
        } else if (data?.type === "object_spawn") {
            room.objectLoaderPlugin.spawnObject(data.object);
            room.objectLoaderPlugin.updateId(data.object.id);
        }
    },
    initialize(room) {
        const objectContainer = document.createElement("div");
        if (!room.viewportAnchorPlugin.elementRef) throw Error("anchor not initialized!");
        room.viewportAnchorPlugin.elementRef.appendChild(objectContainer);

        // ROOM DATA INITIALIZED
        room.objectLoaderPlugin = {
            currentId: 0,
            previousPosition: { x: 0, y: 0 },
            selectedObjectId: 0,
            objectContainer,
            updateId: (id: number) => {
                room.objectLoaderPlugin.currentId = Math.max(id, room.objectLoaderPlugin.currentId);
            },
            spawnObject: (objectData: ObjectDescriptor) => {
                const element = document.createElement("img");
                element.setAttribute(OBJECT_ID_ATTRIBUTE, objectData.id.toString());
                element.style.position = "absolute";

                element.src = objectData.imgSrc.front;
                if (objectData.width != null) {
                    element.width = objectData.width;
                }
                if (objectData.height != null) {
                    element.height = objectData.height;
                }
                element.style.left = objectData.x + "px";
                element.style.top = objectData.y + "px";

                if (objectData.id in room.objects) {
                    room.objects[objectData.id].element.remove();
                }

                room.objects[objectData.id] = { element, objectData };

                if (!room.objectLoaderPlugin.objectContainer) throw Error("object container not initialized?");
                room.objectLoaderPlugin.objectContainer.appendChild(element);

                return element;
            },
        };

=======
            ObjectState.updateId(data.id);
        } else if (data?.type === "object_spawn") {
            spawnObject(room, data.object);
            ObjectState.updateId(data.object.id);
        }
    },
    selfSetup(room) {
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf
        // button that allows you to bulk load using a formatted json
        const uploadContainer = document.createElement("div");
        uploadContainer.style.position = "fixed";
        uploadContainer.style.top = "0";
        uploadContainer.style.right = "10rem";
        uploadContainer.style.padding = "1rem";

        const uploadButton = document.createElement("button");
        uploadButton.innerText = "📷 Load Object Descriptor";
        uploadButton.style.padding = "0.5rem 0.8rem";
        uploadButton.onclick = async () => {
            try {
                const loadRequest: Partial<ObjectDescriptor & { count: number }>[] = JSON.parse(
                    prompt("enter json string of the type: Array<{ url: string, count: number }>") ?? "empty",
                );

                loadRequest.forEach((spawn) => {
                    for (let i = 0; i < (spawn.count ?? 1); i++) {
                        const objectData: ObjectDescriptor = {
<<<<<<< HEAD
                            id: ++room.objectLoaderPlugin.currentId, // increment
=======
                            id: ++ObjectState.currentId, // increment
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf
                            x: 300,
                            y: 300,
                            width: 120,
                            imgSrc: {
                                front: "https://placekitten.com/120/240",
                                back: "https://placekitten.com/120/240",
                            },
                            draggable: true,
                            // override any of the sane default with
                            // any of the values from the spawn object
                            ...spawn,
                        };

<<<<<<< HEAD
                        room.objectLoaderPlugin.spawnObject(objectData);
=======
                        spawnObject(room, objectData);
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf

                        const message: ObjectMessage = {
                            type: "object_spawn",
                            object: objectData,
                        };

                        for (const id in room.peers) {
                            room.peers[id].connection.send(message);
                        }
                    }
                });
<<<<<<< HEAD
            } catch (e) {
                // Eh...
                console.error("encountered issue loading an object.", e);
=======
            } catch {
                // Eh...
                console.error("encountered issue loading an object.");
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf
            }
        };

        uploadContainer.appendChild(uploadButton);
        document.body.appendChild(uploadContainer);

        window.addEventListener("mousedown", ({ button }) => {
            // button == 0 means left click
            if (button === 0) {
                const hoveredElement = document.elementFromPoint(room.self.cursor.x, room.self.cursor.y);
                const elementId = parseInt(hoveredElement?.getAttribute(OBJECT_ID_ATTRIBUTE) ?? "");

<<<<<<< HEAD
                room.objectLoaderPlugin.selectedObjectId = elementId;
=======
                ObjectState.selectedObjectId = elementId;
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf
            }
        });

        window.addEventListener("mouseup", ({ button }) => {
            if (button === 0) {
<<<<<<< HEAD
                room.objectLoaderPlugin.selectedObjectId = 0;
=======
                ObjectState.selectedObjectId = 0;
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf
            }
        });

        window.addEventListener("mousemove", () => {
            if (
<<<<<<< HEAD
                room.objectLoaderPlugin.selectedObjectId > 0 &&
                room.objects[room.objectLoaderPlugin.selectedObjectId].objectData.draggable === true
            ) {
                const delta: Vector2D = {
                    x: room.self.cursor.x - room.objectLoaderPlugin.previousPosition.x,
                    y: room.self.cursor.y - room.objectLoaderPlugin.previousPosition.y,
                };

                room.objects[room.objectLoaderPlugin.selectedObjectId].objectData.x += delta.x;
                room.objects[room.objectLoaderPlugin.selectedObjectId].objectData.y += delta.y;
                room.objects[room.objectLoaderPlugin.selectedObjectId].element.style.top =
                    room.objects[room.objectLoaderPlugin.selectedObjectId].objectData.y + "px";
                room.objects[room.objectLoaderPlugin.selectedObjectId].element.style.left =
                    room.objects[room.objectLoaderPlugin.selectedObjectId].objectData.x + "px";

                const message: ObjectMessage = {
                    type: "object_position",
                    id: room.objectLoaderPlugin.selectedObjectId,
                    position: room.objects[room.objectLoaderPlugin.selectedObjectId].objectData,
=======
                ObjectState.selectedObjectId > 0 &&
                room.objects[ObjectState.selectedObjectId].objectData.draggable === true
            ) {
                const delta: Vector2D = {
                    x: room.self.cursor.x - ObjectState.previousPosition.x,
                    y: room.self.cursor.y - ObjectState.previousPosition.y,
                };

                room.objects[ObjectState.selectedObjectId].objectData.x += delta.x;
                room.objects[ObjectState.selectedObjectId].objectData.y += delta.y;
                room.objects[ObjectState.selectedObjectId].element.style.top =
                    room.objects[ObjectState.selectedObjectId].objectData.y + "px";
                room.objects[ObjectState.selectedObjectId].element.style.left =
                    room.objects[ObjectState.selectedObjectId].objectData.x + "px";

                const message: ObjectMessage = {
                    type: "object_position",
                    id: ObjectState.selectedObjectId,
                    position: room.objects[ObjectState.selectedObjectId].objectData,
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf
                };

                for (const id in room.peers) {
                    room.peers[id].connection.send(message);
                }
            }

            // element-wise copy to avoid aliasing
<<<<<<< HEAD
            room.objectLoaderPlugin.previousPosition.x = room.self.cursor.x;
            room.objectLoaderPlugin.previousPosition.y = room.self.cursor.y;
=======
            ObjectState.previousPosition.x = room.self.cursor.x;
            ObjectState.previousPosition.y = room.self.cursor.y;
>>>>>>> 23254544a7c0e3f0693f80eb8614e097096afddf
        });
    },
    peerSetup(room, peerId) {
        for (const id in room.objects) {
            const message: ObjectMessage = {
                type: "object_spawn",
                object: room.objects[id].objectData,
            };
            room.peers[peerId].connection.send(message);
        }
    },
};
