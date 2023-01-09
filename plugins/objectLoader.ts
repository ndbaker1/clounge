import type { RoomData, RoomPlugin, Vector2D } from "core";

import anchorPlugin, { Anchor } from "./viewportAnchor";
import cursorPligin from "./peerCursors";
import type { RoomExtension as CursorRoomExtension } from "./peerCursors";

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

export type RoomExtension = CursorRoomExtension;
export type ObjectExtension = {
	objectData: ObjectDescriptor;
	element: HTMLImageElement;
};

class ObjectState {
	static objectContainer?: HTMLElement;
	// automatically keep track of the the next id to be created.
	static currentId = 0;
	static selectedObjectId = 0;
	static previousPosition: Vector2D = { x: 0, y: 0 };

	static updateId(id: number) {
		this.currentId = Math.max(id, this.currentId);
	}
}

const OBJECT_ID_ATTRIBUTE = "object-id";

export function spawnObject<P, R, O extends ObjectExtension>(
	room: RoomData<P, R, O>,
	objectData: ObjectDescriptor,
): HTMLImageElement {
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

	if (!ObjectState.objectContainer) throw Error("object container not initialized?");

	ObjectState.objectContainer?.appendChild(element);

	if (objectData.id in room.objects) {
		room.objects[objectData.id].element.remove();
	}

	room.objects[objectData.id].element = element;
	room.objects[objectData.id].objectData = objectData;

	return element;
}

export default <RoomPlugin<CursorRoomExtension, object, ObjectExtension>>{
	name: "objectLoader",
	dependencies: [cursorPligin.name, anchorPlugin.name],
	load() {
		ObjectState.objectContainer = document.createElement("div");
		if (!Anchor.element) throw Error("anchor not initialized!");
		Anchor.element.appendChild(ObjectState.objectContainer);
	},
	unload() {
		ObjectState.objectContainer?.remove();
	},
	processMessage(room, data: ObjectMessage) {
		if (data?.type === "object_position") {
			room.objects[data.id].objectData.x = data.position.x;
			room.objects[data.id].objectData.y = data.position.y;
			room.objects[data.id].element.style.top = data.position.y + "px";
			room.objects[data.id].element.style.left = data.position.x + "px";
			ObjectState.updateId(data.id);
		} else if (data?.type === "object_spawn") {
			spawnObject(room, data.object);
			ObjectState.updateId(data.object.id);
		}
	},
	selfSetup(room) {
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
							id: ++ObjectState.currentId, // increment
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

						spawnObject(room, objectData);

						const message: ObjectMessage = {
							type: "object_spawn",
							object: objectData,
						};

						for (const id in room.peers) {
							room.peers[id].connection.send(message);
						}
					}
				});
			} catch {
				// Eh...
				console.error("encountered issue loading an object.");
			}
		};

		uploadContainer.appendChild(uploadButton);
		document.body.appendChild(uploadContainer);

		window.addEventListener("mousedown", ({ button }) => {
			// button == 0 means left click
			if (button === 0) {
				const hoveredElement = document.elementFromPoint(room.self.cursor.x, room.self.cursor.y);
				const elementId = parseInt(hoveredElement?.getAttribute(OBJECT_ID_ATTRIBUTE) ?? "");

				ObjectState.selectedObjectId = elementId;
			}
		});

		window.addEventListener("mouseup", ({ button }) => {
			if (button === 0) {
				ObjectState.selectedObjectId = 0;
			}
		});

		window.addEventListener("mousemove", () => {
			if (
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
				};

				for (const id in room.peers) {
					room.peers[id].connection.send(message);
				}
			}

			// element-wise copy to avoid aliasing
			ObjectState.previousPosition.x = room.self.cursor.x;
			ObjectState.previousPosition.y = room.self.cursor.y;
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
