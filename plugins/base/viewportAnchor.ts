import type { RoomPlugin, Vector2D } from "types";
import type { InfoWindowRoomExtension } from "./infoWindow";

import infoWindowPlugin from "./infoWindow";

export type ViewportAnchorRoomExtension = {
    viewportAnchorPlugin: {
        elementRef: HTMLElement;
        position: Vector2D;
        setPosition: (pos: Vector2D) => void;
        move: (delta: Vector2D) => void;
    }
} & InfoWindowRoomExtension;

const internalState = {
    middleClick: false,
    previousPosition: { x: 0, y: 0 },
};

let anchorCoordinateElement: HTMLElement;

export default <RoomPlugin<object, ViewportAnchorRoomExtension>>{
    name: "viewportAnchor",
    dependencies: [infoWindowPlugin.name],
    initialize(room) {
        const elementRef = document.createElement("div");
        elementRef.style.position = "fixed";
        elementRef.style.zIndex = String(9999);
        document.body.appendChild(elementRef);

        anchorCoordinateElement = document.createElement("small");
        room.infoWindowPlugin.element.prepend(anchorCoordinateElement);

        room.viewportAnchorPlugin = {
            setPosition({ x, y }) {
                this.position = { x, y };
                this.elementRef.style.left = x + "px";
                this.elementRef.style.top = y + "px";
            },
            move({ x, y }) {
                this.setPosition({
                    x: this.position.x + x,
                    y: this.position.y + y,
                });
            },
            position: { x: 0, y: 0 },
            elementRef,
        };

        window.addEventListener("mousedown", ({ button }) => {
            if (button === 1) internalState.middleClick = true;
        });
        window.addEventListener("mouseup", ({ button }) => {
            if (button === 1) internalState.middleClick = false;
        });

        window.addEventListener("mousemove", ({ clientX, clientY }) => {
            if (internalState.middleClick) {
                room.viewportAnchorPlugin.move({
                    x: clientX - internalState.previousPosition.x,
                    y: clientY - internalState.previousPosition.y,
                });

                anchorCoordinateElement.textContent = `Viewport: (${-room.viewportAnchorPlugin.position.x}, ${-room.viewportAnchorPlugin.position.y})`;
            }

            internalState.previousPosition = { x: clientX, y: clientY };
        });
    },
    cleanup(room) {
        room.viewportAnchorPlugin.elementRef.remove();
        anchorCoordinateElement.remove();
    },
};
