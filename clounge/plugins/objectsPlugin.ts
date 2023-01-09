import type { RoomPlugin, Vector2D } from "index";
import anchorPlugin, { Anchor } from "./anchorPlugin";
import cursorPligin from "./cursorPlugin";
import type { RoomExtension as CursorRoomExtension } from "./cursorPlugin";

export type SpawnObject = Vector2D & {
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
    object: SpawnObject;
  };

export type RoomExtension = CursorRoomExtension;
export type ObjectExtension = {
  objectData: SpawnObject;
  element: HTMLImageElement;
};

class ObjectState {
  constructor(
    public objectContainer: HTMLElement = document.createElement("div"),
    // automatically keep track of the the next id to be created.
    public currentId = 0,
    public selectedObjectId = 0,
    public previousPosition: Vector2D = { x: 0, y: 0 }
  ) {
    Anchor.element.appendChild(objectContainer);
  }
}

const OBJECT_ID_ATTRIBUTE = "object-id";

let state: ObjectState;

export function spawnObject(spawnData: SpawnObject): HTMLImageElement {
  const element = document.createElement("img");
  element.setAttribute(OBJECT_ID_ATTRIBUTE, spawnData.id.toString());
  element.style.position = "absolute";

  element.src = spawnData.imgSrc.front;
  if (spawnData.width) {
    element.width = spawnData.width;
  }
  if (spawnData.height) {
    element.height = spawnData.height;
  }
  element.style.left = spawnData.x + "px";
  element.style.top = spawnData.y + "px";

  state.objectContainer.appendChild(element);

  return element;
}

export default <RoomPlugin<CursorRoomExtension, object, ObjectExtension>>{
  name: "objectsPlugin",
  dependencies: [cursorPligin.name, anchorPlugin.name],
  load() {
    state = new ObjectState();
  },
  processMessage(room, data: ObjectMessage) {
    if (data?.type === "object_position") {
      room.objects[data.id].objectData.x = data.position.x;
      room.objects[data.id].objectData.y = data.position.y;
      room.objects[data.id].element.style.top = data.position.y + "px";
      room.objects[data.id].element.style.left = data.position.x + "px";
      state.currentId = Math.max(data.id, state.currentId);
    } else if (data?.type === "object_spawn") {
      const element = spawnObject(data.object);
      if (data.object.id in room.objects) {
        room.objects[data.object.id].element.remove();
      }

      room.objects[data.object.id] = { objectData: data.object, element };
      state.currentId = Math.max(data.object.id, state.currentId);
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
        const loadRequest: (Partial<SpawnObject> & { count?: number })[] = JSON.parse(
          prompt(
            "enter json string of the type: Array<{ url: string, count: number }>"
          ) ?? "empty"
        );

        loadRequest.forEach((spawn) => {
          for (let i = 0; i < (spawn.count ?? 1); i++) {
            const objectData: SpawnObject = {
              id: ++state.currentId, // increment
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

            const element = spawnObject(objectData);
            room.objects[state.currentId] = { element, objectData };

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
        const hoveredElement = document.elementFromPoint(
          room.self.cursor.x,
          room.self.cursor.y
        );
        const elementId = parseInt(
          hoveredElement?.getAttribute(OBJECT_ID_ATTRIBUTE) ?? ""
        );

        state.selectedObjectId = elementId;
      }
    });

    window.addEventListener("mouseup", ({ button }) => {
      if (button === 0) {
        state.selectedObjectId = 0;
      }
    });

    window.addEventListener("mousemove", () => {
      if (state.selectedObjectId > 0 && room.objects[state.selectedObjectId].objectData.draggable) {
        const delta: Vector2D = {
          x: room.self.cursor.x - state.previousPosition.x,
          y: room.self.cursor.y - state.previousPosition.y,
        };

        room.objects[state.selectedObjectId].objectData.x += delta.x;
        room.objects[state.selectedObjectId].objectData.y += delta.y;
        room.objects[state.selectedObjectId].element.style.top =
          room.objects[state.selectedObjectId].objectData.y + "px";
        room.objects[state.selectedObjectId].element.style.left =
          room.objects[state.selectedObjectId].objectData.x + "px";

        const message: ObjectMessage = {
          type: "object_position",
          id: state.selectedObjectId,
          position: room.objects[state.selectedObjectId].objectData,
        };

        for (const id in room.peers) {
          room.peers[id].connection.send(message);
        }
      }

      // element-wise copy to avoid aliasing
      state.previousPosition.x = room.self.cursor.x;
      state.previousPosition.y = room.self.cursor.y;
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
