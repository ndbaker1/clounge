import type { RoomPlugin, Vector2D } from "types";

import type { CursorPeerExtension, CursorRoomExtension } from "./peerCursors";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

// local libs
import cursorPlugin from "./peerCursors";
import viewportAnchorPlugin from "./viewportAnchor";
import infoWindow from "./infoWindow";

// Object Data should only ever be fields, no functions, classes,
// or anything that is not obviously serializable.
export type RoomObjectDescriptors<
    Fields extends Record<string, string | number | boolean> = Record<never, never>
> = {
    descriptors: Fields & Vector2D & {
        id: number;
        width?: number;
        height?: number;
        currentImg?: string;
        frontImg: string;
        backImg: string;
        rotationDeg: number;
        draggable?: boolean;
    }
};

export type ObjectMessage =
    | {
        type: "object_position";
        id: number;
        position: Vector2D;
    }
    | {
        type: "object_rotation";
        id: number;
        rotation: number;
    }
    | {
        type: "object_move_front";
        id: number;
    }
    | {
        type: "object_flip";
        id: number;
        side: "front" | "back";
    }
    | {
        type: "object_spawn";
        descriptors: RoomObjectDescriptors["descriptors"];
    };

export type ObjectLoaderObjectExtension = RoomObjectDescriptors & {
    element: HTMLImageElement;
};
export type ObjectLoaderPeerExtension = CursorPeerExtension;
export type ObjectLoaderRoomExtension = CursorRoomExtension & ViewportAnchorRoomExtension & {
    objectLoaderPlugin: {
        objectContainer: HTMLElement; // automatically keep track of the the next id to be created.
        currentId: number;
        selectedObjectId: number;
        previousPosition: Vector2D;
        updateId: (id: number) => void;
        spawnObject: (partialDescriptors: Partial<RoomObjectDescriptors["descriptors"]>) => ObjectLoaderObjectExtension;
        setObjectRotation: (id: number, rotation: number, isSelf: boolean) => void;
        setObjectPosition: (id: number, position: Vector2D, isSelf: boolean) => void;
        moveElementToFront: (id: number, isSelf: boolean) => void;
        flipObject: (id: number, side: "front" | "back", isSelf: boolean) => void;
    }
};

// hack to provide alternative compile time constants,
// by using the type-literal reinforcement:
// <OBJECT_ID_ATTRIBUTE>"object-id"
export type OBJECT_ID_ATTRIBUTE = "object-id";

const KEYMAPS = {
    rotateRight: "e",
    rotateLeft: "q",
    flip: "w",
};

export default <RoomPlugin<ObjectLoaderPeerExtension, ObjectLoaderRoomExtension, ObjectLoaderObjectExtension>>{
    name: "objectLoader",
    dependencies: [cursorPlugin.name, viewportAnchorPlugin.name, infoWindow.name],
    cleanup(room) {
        room.objectLoaderPlugin.objectContainer.remove();
    },
    processMessage(room, data: ObjectMessage) {
        if (data?.type === "object_position") {
            room.objectLoaderPlugin.setObjectPosition(data.id, data.position, false);
        } else if (data?.type === "object_rotation") {
            room.objectLoaderPlugin.setObjectRotation(data.id, data.rotation, false);
        } else if (data?.type === "object_move_front") {
            room.objectLoaderPlugin.moveElementToFront(data.id, false);
        } else if (data?.type === "object_flip") {
            room.objectLoaderPlugin.flipObject(data.id, data.side, false);
        } else if (data?.type === "object_spawn") {
            room.objectLoaderPlugin.spawnObject(data.descriptors);
        }
    },
    initialize(room) {
        const objectContainer = document.createElement("div");
        objectContainer.style.position = "relative";
        objectContainer.style.zIndex = String(-1);
        room.viewportAnchorPlugin.elementRef.appendChild(objectContainer);

        const keybindList = document.createElement("div");
        keybindList.style.display = "flex";
        keybindList.style.flexDirection = "column";
        for (const [action, key] of Object.entries(KEYMAPS)) {
            const keybind = document.createElement("small");
            keybind.textContent = action + " = '" + key + "'";
            keybindList.appendChild(keybind);
        }
        room.infoWindowPlugin.element.prepend(keybindList);

        // ROOM DATA INITIALIZED
        room.objectLoaderPlugin = {
            currentId: 0,
            previousPosition: { x: 0, y: 0 },
            selectedObjectId: 0,
            objectContainer,
            updateId: (id) => room.objectLoaderPlugin.currentId = Math.max(id, room.objectLoaderPlugin.currentId),
            spawnObject: (spawn) => {
                const descriptors: RoomObjectDescriptors["descriptors"] = {
                    id: ++room.objectLoaderPlugin.currentId, // increment
                    x: 300,
                    y: 300,
                    width: 120,
                    rotationDeg: 0,
                    frontImg: `https://placekitten.com/${spawn.width ?? 120}/${spawn.height ?? 200}`,
                    backImg: `https://placekitten.com/${spawn.width ?? 120}/${spawn.height ?? 200}`,
                    draggable: true,
                    // override any of the sane default with
                    // any of the values from the spawn object
                    ...spawn,
                };

                const element = document.createElement("img");
                element.setAttribute(<OBJECT_ID_ATTRIBUTE>"object-id", descriptors.id.toString());
                element.style.position = "absolute";

                element.src = descriptors.currentImg ?? (descriptors.currentImg = descriptors.frontImg);
                element.style.rotate = descriptors.rotationDeg + "deg";

                if (descriptors.width != null) {
                    element.width = descriptors.width;
                }
                if (descriptors.height != null) {
                    element.height = descriptors.height;
                }

                element.style.left = descriptors.x + "px";
                element.style.top = descriptors.y + "px";

                if (descriptors.id in room.objects) {
                    room.objects[descriptors.id].element?.remove();
                }

                // ordering here matters.
                // the element field is optional because the object exists before the node
                room.objects[descriptors.id] = { element, descriptors };
                room.objectLoaderPlugin.objectContainer.appendChild(element);

                room.objectLoaderPlugin.updateId(descriptors.id);

                return room.objects[descriptors.id];
            },
            setObjectRotation: (id, rotation, isSelf) => {
                if (room.objects[id].element == undefined) return;
                room.objects[id].descriptors.rotationDeg = rotation;
                room.objects[id].element.style.rotate = rotation + "deg";

                if (isSelf) {
                    const message: ObjectMessage = {
                        type: "object_rotation",
                        id, rotation,
                    };

                    for (const id in room.peers) {
                        room.peers[id].connection.send(message);
                    }
                }
            },
            setObjectPosition: (id, position, isSelf) => {
                room.objects[id].descriptors.x = position.x;
                room.objects[id].descriptors.y = position.y;
                room.objects[id].element.style.top = position.y + "px";
                room.objects[id].element.style.left = position.x + "px";

                if (isSelf) {
                    const message: ObjectMessage = {
                        type: "object_position",
                        id, position,
                    };

                    for (const id in room.peers) {
                        room.peers[id].connection.send(message);
                    }
                }
            },
            moveElementToFront(id, isSelf) {
                room.objectLoaderPlugin.objectContainer.appendChild(
                    room.objectLoaderPlugin.objectContainer.removeChild(
                        room.objects[id].element
                    )
                );

                if (isSelf) {
                    const message: ObjectMessage = { type: "object_move_front", id };

                    for (const id in room.peers) {
                        room.peers[id].connection.send(message);
                    }
                }
            },
            flipObject: (id, side, isSelf) => {
                const newImage = side === "front"
                    ? room.objects[id].descriptors.frontImg
                    : room.objects[id].descriptors.backImg;

                room.objects[id].descriptors.currentImg = newImage;
                room.objects[id].element.src = newImage;

                if (isSelf) {
                    const message: ObjectMessage = { type: "object_flip", side, id };

                    for (const id in room.peers) {
                        room.peers[id].connection.send(message);
                    }
                }
            },
        };

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
                const loadRequest: Partial<RoomObjectDescriptors["descriptors"] & { count: number }>[] = JSON.parse(
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
                        const { descriptors: objectData } = room.objectLoaderPlugin.spawnObject(spawn);

                        const message: ObjectMessage = {
                            type: "object_spawn",
                            descriptors: objectData,
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

        uploadContainer.appendChild(uploadButton);
        document.body.appendChild(uploadContainer);

        window.addEventListener("mousedown", ({ button }) => {
            // button == 0 means left click
            if (button === 0) {
                const hoveredElement = document.elementFromPoint(room.self.cursor.x, room.self.cursor.y) as HTMLElement | null;
                const elementIdString = hoveredElement?.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
                if (elementIdString != null) {
                    const elementId = parseInt(elementIdString);
                    room.objectLoaderPlugin.moveElementToFront(elementId, true);
                    room.objectLoaderPlugin.selectedObjectId = elementId;
                }
            }
        });

        window.addEventListener("mouseup", ({ button }) => {
            if (button === 0) {
                room.objectLoaderPlugin.selectedObjectId = 0;
            }
        });

        window.addEventListener("keydown", ({ key }) => {
            if (room.objectLoaderPlugin.selectedObjectId > 0) {
                const roomObject = room.objects[room.objectLoaderPlugin.selectedObjectId];
                if (key == KEYMAPS.rotateLeft) {
                    room.objectLoaderPlugin.setObjectRotation(
                        room.objectLoaderPlugin.selectedObjectId,
                        (roomObject.descriptors.rotationDeg - 90) % 360,
                        true,
                    );
                }
                if (key == KEYMAPS.rotateRight) {
                    room.objectLoaderPlugin.setObjectRotation(
                        room.objectLoaderPlugin.selectedObjectId,
                        (roomObject.descriptors.rotationDeg + 90) % 360,
                        true,
                    );
                }
                if (key == KEYMAPS.flip) {
                    room.objectLoaderPlugin.flipObject(
                        room.objectLoaderPlugin.selectedObjectId,
                        roomObject.descriptors.currentImg === roomObject.descriptors.frontImg
                            ? "back"
                            : "front",
                        true,
                    );
                }
            }
        });

        window.addEventListener("mousemove", () => {
            if (
                room.objectLoaderPlugin.selectedObjectId > 0 &&
                room.objects[room.objectLoaderPlugin.selectedObjectId].descriptors.draggable === true
            ) {
                const delta: Vector2D = {
                    x: room.self.cursor.x - room.objectLoaderPlugin.previousPosition.x,
                    y: room.self.cursor.y - room.objectLoaderPlugin.previousPosition.y,
                };

                room.objectLoaderPlugin.setObjectPosition(
                    room.objectLoaderPlugin.selectedObjectId,
                    {
                        x: room.objects[room.objectLoaderPlugin.selectedObjectId].descriptors.x + delta.x,
                        y: room.objects[room.objectLoaderPlugin.selectedObjectId].descriptors.y + delta.y,
                    },
                    true,
                );
            }

            // element-wise copy to avoid aliasing
            room.objectLoaderPlugin.previousPosition.x = room.self.cursor.x;
            room.objectLoaderPlugin.previousPosition.y = room.self.cursor.y;
        });
    },
    peerSetup(room, peerId) {
        // trick to send updates in order by how hey appear in the DOM
        for (const element of document.querySelectorAll("[object-id]")) {
            const elementId = element.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
            if (elementId != null) {
                const message: ObjectMessage = {
                    type: "object_spawn",
                    descriptors: room.objects[parseInt(elementId)].descriptors,
                };
                room.peers[peerId].connection.send(message);
            }
        }
    },
};
