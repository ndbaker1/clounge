import { RoomPlugin, Vector2D } from "index";
import { Anchor } from "./anchorPlugin";
import type { RoomExtension as CursorRoomExtension } from "./cursorPlugin";

type ObjectSpawn = {
  id: number;
  width?: number;
  height?: number;
  imgSrc: string;
} & Vector2D;

type Message =
  | {
    type: "object_position";
    id: number;
    position: Vector2D;
  }
  | {
    type: "object_spawn";
    object: ObjectSpawn;
  };

export type RoomExtension = CursorRoomExtension;
export type ObjectExtension = {
  objectData: ObjectSpawn;
  element: HTMLImageElement;
};

class State {
  constructor(
    public objectContainer: HTMLElement,
    // automatically keep track of the the next id to be created.
    public currentId = 0,
    public selectedObject = {
      id: 0,
      elementRef: null,
    },
    public previousPosition: Vector2D = { x: 0, y: 0 }
  ) { }
}

export default function plugin(): RoomPlugin<
  null,
  CursorRoomExtension,
  object,
  ObjectExtension
> {
  const objectContainer = document.createElement("div");
  Anchor.element.appendChild(objectContainer);

  function initObjectElement(spawnData: ObjectSpawn): HTMLImageElement {
    const element = document.createElement("img");
    element.setAttribute("object-id", spawnData.id.toString());
    element.style.position = "absolute";

    element.src = spawnData.imgSrc;
    if (spawnData.width) {
      element.width = spawnData.width;
    }
    if (spawnData.height) {
      element.height = spawnData.height;
    }
    element.style.left = `${spawnData.x}px`;
    element.style.top = `${spawnData.y}px`;

    objectContainer.appendChild(element);

    return element;
  }

  const state = new State(objectContainer);

  return {
    processData(room, data: Message) {
      if (data?.type === "object_position") {
        room.objects[data.id].objectData.x = data.position.x;
        room.objects[data.id].objectData.y = data.position.y;
        room.objects[data.id].element.style.top = `${data.position.y}px`;
        room.objects[data.id].element.style.left = `${data.position.x}px`;
        state.currentId = Math.max(data.id, state.currentId);
      } else if (data?.type === "object_spawn") {
        const element = initObjectElement(data.object);
        if (data.object.id in room.objects)
          room.objects[data.object.id].element.remove();
        room.objects[data.object.id] = { objectData: data.object, element };
        state.currentId = Math.max(data.object.id, state.currentId);
      }
    },
    selfSetup(room) {
      // button that allows you to bulk load using a formatted json
      const uploadContainer = document.createElement("div");
      const uploadButton = document.createElement("button");
      uploadContainer.style.position = "fixed";
      uploadContainer.style.top = "0";
      uploadContainer.style.right = "10rem";
      uploadContainer.style.padding = "1rem";

      uploadButton.innerText = "📷 Load Object Descriptor";
      uploadButton.style.padding = "0.5rem 0.8rem";
      uploadButton.onclick = async () => {
        try {
          const loadRequest: { url: string; count: number }[] = JSON.parse(
            prompt(
              "enter json string of the type: Array<{ url: string, count: number }>"
            )
          );

          loadRequest.forEach(({ url, count }) => {
            for (let i = 0; i < count; i++) {
              const objectData: ObjectSpawn = {
                id: ++state.currentId, // increment
                x: 300,
                y: 300,
                width: 160,
                imgSrc: url,
              };

              const element = initObjectElement(objectData);
              room.objects[state.currentId] = { element, objectData };

              const message: Message = {
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
          console.error("failed to load images..");
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
          const elementId = parseInt(hoveredElement.getAttribute("object-id"));

          state.selectedObject.id = elementId;
          state.selectedObject.elementRef = room.objects[elementId];
        }
      });

      window.addEventListener("mouseup", ({ button }) => {
        if (button === 0) {
          state.selectedObject.id = 0;
        }
      });

      window.addEventListener("mousemove", () => {
        if (state.selectedObject.id > 0) {
          const delta: Vector2D = {
            x: room.self.cursor.x - state.previousPosition.x,
            y: room.self.cursor.y - state.previousPosition.y,
          };

          room.objects[state.selectedObject.id].objectData.x += delta.x;
          room.objects[state.selectedObject.id].objectData.y += delta.y;
          room.objects[state.selectedObject.id].element.style.top =
            room.objects[state.selectedObject.id].objectData.y + "px";
          room.objects[state.selectedObject.id].element.style.left =
            room.objects[state.selectedObject.id].objectData.x + "px";

          const message: Message = {
            type: "object_position",
            id: state.selectedObject.id,
            position: room.objects[state.selectedObject.id].objectData,
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
        const message: Message = {
          type: "object_spawn",
          object: room.objects[id].objectData,
        };
        room.peers[peerId].connection.send(message);
      }
    },
  };
}
