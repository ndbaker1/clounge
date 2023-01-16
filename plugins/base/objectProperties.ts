import type { Message, RoomPlugin, Vector2D } from "types";

import type { CursorPeerExtension, CursorRoomExtension } from "./peerCursors";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

// local libs
import cursorPlugin from "./peerCursors";
import viewportAnchorPlugin from "./viewportAnchor";

// Object Data should only ever be fields, no functions, classes,
// or anything that is not obviously serializable.
export type ObjectDescriptors<
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
    | Message<"object_position", {
        id: number;
        position: Vector2D;
    }>
    | Message<"object_rotation", {
        id: number;
        rotation: number;
    }>
    | Message<"object_move_front", {
        id: number;
    }>
    | Message<"place_relative", {
        id: number;
        targetId: number;
        way: "after" | "before";
    }>
    | Message<"object_flip", {
        id: number;
        side: "front" | "back";
    }>
    | Message<"object_spawn", {
        descriptors: ObjectDescriptors["descriptors"];
    }>
    | Message<"delete_object", {
        id: number;
    }>;

export type ObjectPropertiesObjectExtension = ObjectDescriptors & {
    element: HTMLImageElement;
};
export type ObjectPropertiesPeerExtension = CursorPeerExtension;
export type ObjectPropertiesRoomExtension = CursorRoomExtension & ViewportAnchorRoomExtension & {
    objectPropertiesPlugin: {
        objectContainer: HTMLElement; // automatically keep track of the the next id to be created.
        currentId: number;
        selectedObjectId: number;
        previousPosition: Vector2D;
        updateId: (id: number) => void;
        spawnObject: (partialDescriptors: Partial<ObjectDescriptors["descriptors"]>) => number;
        setObjectRotation: (id: number, rotation: number, isSelf: boolean) => void;
        setObjectPosition: (id: number, position: Vector2D, isSelf: boolean) => void;
        moveToFront: (id: number, isSelf: boolean) => void;
        placeRelative: (id: number, target: number, way: "after" | "before", isSelf: boolean) => void;
        flipObject: (id: number, side: "front" | "back", isSelf: boolean) => void;
        deleteObject: (id: number, isSelf: boolean) => void;
        getObjectIdsUnderCursor: () => number[];
    }
};

// hack to provide alternative compile time constants,
// by using the type-literal reinforcement:
// <OBJECT_ID_ATTRIBUTE>"object-id"
export type OBJECT_ID_ATTRIBUTE = "object-id";

export default <RoomPlugin<
    ObjectPropertiesPeerExtension,
    ObjectPropertiesRoomExtension,
    ObjectPropertiesObjectExtension
>
    >{
        name: "objectProperties",
        dependencies: [cursorPlugin.name, viewportAnchorPlugin.name],
        cleanup(room) {
            room.objectPropertiesPlugin.objectContainer.remove();
        },
        processMessage(room, data: ObjectMessage) {
            if (data?.type === "object_position") {
                room.objectPropertiesPlugin.setObjectPosition(data.id, data.position, false);
            } else if (data?.type === "object_rotation") {
                room.objectPropertiesPlugin.setObjectRotation(data.id, data.rotation, false);
            } else if (data?.type === "object_move_front") {
                room.objectPropertiesPlugin.moveToFront(data.id, false);
            } else if (data?.type === "object_flip") {
                room.objectPropertiesPlugin.flipObject(data.id, data.side, false);
            } else if (data?.type === "object_spawn") {
                room.objectPropertiesPlugin.spawnObject(data.descriptors);
            } else if (data?.type === "delete_object") {
                room.objectPropertiesPlugin.deleteObject(data.id, false);
            } else if (data?.type === "place_relative") {
                room.objectPropertiesPlugin.placeRelative(data.id, data.targetId, data.way, false);
            }
        },
        initialize(room) {
            const objectContainer = document.createElement("div");
            objectContainer.style.position = "relative";
            objectContainer.style.zIndex = String(-1);
            room.viewportAnchorPlugin.elementRef.appendChild(objectContainer);

            // ROOM DATA INITIALIZED
            room.objectPropertiesPlugin = {
                currentId: 0,
                previousPosition: { x: 0, y: 0 },
                selectedObjectId: 0,
                objectContainer,
                updateId: (id) => room.objectPropertiesPlugin.currentId = Math.max(id, room.objectPropertiesPlugin.currentId),
                spawnObject: (spawn) => {
                    const descriptors: ObjectDescriptors["descriptors"] = {
                        id: ++room.objectPropertiesPlugin.currentId, // increment
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
                    room.objectPropertiesPlugin.objectContainer.appendChild(element);

                    room.objectPropertiesPlugin.updateId(descriptors.id);

                    return descriptors.id;
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
                            room.peers[id].connection.send<ObjectMessage>(message);
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
                            room.peers[id].connection.send<ObjectMessage>(message);
                        }
                    }
                },
                moveToFront(id, isSelf) {
                    room.objectPropertiesPlugin.objectContainer.appendChild(room.objects[id].element);

                    if (isSelf) {
                        const message: ObjectMessage = { type: "object_move_front", id };

                        for (const id in room.peers) {
                            room.peers[id].connection.send<ObjectMessage>(message);
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
                            room.peers[id].connection.send<ObjectMessage>(message);
                        }
                    }
                },
                deleteObject: (id, isSelf) => {
                    room.objects[id].element.remove();
                    delete room.objects[id];

                    if (isSelf) {
                        const message: ObjectMessage = { type: "delete_object", id };

                        for (const id in room.peers) {
                            room.peers[id].connection.send<ObjectMessage>(message);
                        }
                    }
                },
                getObjectIdsUnderCursor() {
                    return document.elementsFromPoint(room.self.cursorScreen.x, room.self.cursorScreen.y)
                        .filter(ele => ele.hasAttribute(<OBJECT_ID_ATTRIBUTE>"object-id"))
                        .map(ele => parseInt(ele.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id") ?? ""));
                },
                placeRelative(id, targetId, way, isSelf) {
                    const element = room.objects[id].element;
                    const targetElement = room.objects[targetId].element;
                    if (way === "after") {
                        targetElement.after(element);
                    } else if (way === "before") {
                        targetElement.before(element);
                    }

                    this.setObjectPosition(id, room.objects[targetId].descriptors, true);

                    if (isSelf) {
                        const message: ObjectMessage = { type: "place_relative", id, targetId, way };
                        for (const id in room.peers) {
                            room.peers[id].connection.send<ObjectMessage>(message);
                        }
                    }
                },
            };

            window.addEventListener("mousedown", ({ button }) => {
                // button == 0 means left click
                if (button === 0) {
                    const hoveredElement = document.elementFromPoint(room.self.cursorScreen.x, room.self.cursorScreen.y);
                    const elementIdString = hoveredElement?.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
                    if (elementIdString != null) {
                        const elementId = parseInt(elementIdString);
                        room.objectPropertiesPlugin.moveToFront(elementId, true);
                        room.objectPropertiesPlugin.selectedObjectId = elementId;
                    }
                }
            });

            window.addEventListener("mouseup", ({ button }) => {
                if (button === 0) {
                    room.objectPropertiesPlugin.selectedObjectId = 0;
                }
            });

            window.addEventListener("mousemove", () => {
                if (
                    room.objectPropertiesPlugin.selectedObjectId > 0 &&
                    room.objects[room.objectPropertiesPlugin.selectedObjectId].descriptors.draggable === true
                ) {
                    const delta: Vector2D = {
                        x: room.self.cursorWorld.x - room.objectPropertiesPlugin.previousPosition.x,
                        y: room.self.cursorWorld.y - room.objectPropertiesPlugin.previousPosition.y,
                    };

                    room.objectPropertiesPlugin.setObjectPosition(
                        room.objectPropertiesPlugin.selectedObjectId,
                        {
                            x: room.objects[room.objectPropertiesPlugin.selectedObjectId].descriptors.x + delta.x,
                            y: room.objects[room.objectPropertiesPlugin.selectedObjectId].descriptors.y + delta.y,
                        },
                        true,
                    );
                }

                // element-wise copy to avoid aliasing
                room.objectPropertiesPlugin.previousPosition = Object.assign({}, room.self.cursorWorld);
            });
        },
        peerSetup(room, peerId) {
            // trick to send updates in order by how hey appear in the DOM
            for (const element of document.querySelectorAll("[" + <OBJECT_ID_ATTRIBUTE>"object-id" + "]")) {
                const elementId = element.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id");
                if (elementId != null) {
                    const message: ObjectMessage = {
                        type: "object_spawn",
                        descriptors: room.objects[parseInt(elementId)].descriptors,
                    };
                    room.peers[peerId].connection.send<ObjectMessage>(message);
                }
            }
        },
    };
