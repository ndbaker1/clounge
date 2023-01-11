import type { RoomPlugin, Vector2D } from "types";
import type { InfoWindowRoomExtension } from "./infoWindow";

import infoWindowPlugin from "./infoWindow";

export type ViewportAnchorRoomExtension = {
    viewportAnchorPlugin: {
        elementRef: HTMLElement;
        position: Vector2D;
        anchorCoordinateElement: HTMLElement;
        setPosition: (x: number, y: number) => void;
        move: (x: number, y: number) => void;
    }
} & InfoWindowRoomExtension;

const internalState = {
    mousepressed: false,
    oldPosition: { x: 0, y: 0 },
};

export default <RoomPlugin<object, ViewportAnchorRoomExtension>>{
    name: "viewportAnchor",
    dependencies: [infoWindowPlugin.name],
    initialize(room) {
        const elementRef = document.createElement("div");
        elementRef.style.position = "fixed";
        elementRef.style.zIndex = String(9999);
        document.body.appendChild(elementRef);

        const anchorCoordinateElement = document.createElement("p");
        room.infoWindowPlugin.element.appendChild(anchorCoordinateElement);

        room.viewportAnchorPlugin = {
            setPosition(x: number, y: number) {
                this.position.x = x;
                this.position.y = y;
                this.elementRef.style.left = x + "px";
                this.elementRef.style.top = y + "px";
            },
            move(x: number, y: number) {
                this.setPosition(this.position.x + x, this.position.y + y);
            },
            position: { x: 0, y: 0 },
            anchorCoordinateElement,
            elementRef,
        };

        window.addEventListener("mousedown", ({ button }) => {
            if (button === 1) internalState.mousepressed = true;
        });
        window.addEventListener("mouseup", ({ button }) => {
            if (button === 1) internalState.mousepressed = false;
        });
        window.addEventListener("mousemove", ({ clientX, clientY }) => {
            if (internalState.mousepressed) {
                const delta: Vector2D = {
                    x: clientX - internalState.oldPosition.x,
                    y: clientY - internalState.oldPosition.y,
                };

                room.viewportAnchorPlugin.move(delta.x, delta.y);
            }

            internalState.oldPosition.x = clientX;
            internalState.oldPosition.y = clientY;

            room.viewportAnchorPlugin.anchorCoordinateElement.textContent = `Viewport: (${-room.viewportAnchorPlugin.position.x}, ${-room.viewportAnchorPlugin.position.y})`;
        });
    },
    cleanup(room) {
        room.viewportAnchorPlugin.elementRef.remove();
        room.viewportAnchorPlugin.anchorCoordinateElement.remove();
    },
};
