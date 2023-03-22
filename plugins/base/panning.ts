import type { RoomPlugin } from "types";
import type { ObjectPropertiesRoomExtension } from "./objectProperties";
import type { ViewportRoomExtension } from "./viewport";
import type { InfoWindowRoomExtension } from "./infoWindow";

import infoWindow from "./infoWindow";
import objectProperties from "./objectProperties";

let anchorCoordinateElement: HTMLElement;

let panning = false;
const previousPosition = { x: 0, y: 0 };

export default <RoomPlugin<object, ViewportRoomExtension & InfoWindowRoomExtension & ObjectPropertiesRoomExtension>>{
    name: "panning",
    dependencies: [infoWindow.name, objectProperties.name],
    initialize(room) {

        anchorCoordinateElement = document.createElement("small");
        room.infoWindowPlugin.element.prepend(anchorCoordinateElement);

        window.addEventListener("mousedown", ({ button }) => {
            if (button === 1 || room.objectPropertiesPlugin.getObjectIdsUnderCursor().length == 0) panning = true;
        });
        window.addEventListener("mouseup", () => {
            panning = false;
        });

        window.addEventListener("mousemove", ({ clientX, clientY }) => {
            if (panning) {
                room.viewportPlugin.move({
                    x: clientX - previousPosition.x,
                    y: clientY - previousPosition.y,
                });

                anchorCoordinateElement.textContent = `Viewport: (${-room.viewportPlugin.position.x}, ${-room.viewportPlugin.position.y})`;
            }

            previousPosition.x = clientX;
            previousPosition.y = clientY;
        });
    },
    cleanup() {
        anchorCoordinateElement.remove();
    },
};
