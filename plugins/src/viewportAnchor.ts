import type { RoomPlugin, Vector2D } from "types";
import type { InfoWindowRoomExtension } from "./infoWindow";

import infoWindowPlugin from "./infoWindow";

export type ViewportAnchorRoomExtension = {
    viewportAnchorPlugin: {
        elementRef?: HTMLElement;
        position: Vector2D;
        mousepressed: boolean;
        oldPosition: Vector2D;
        anchorCoordinateElement?: HTMLElement;
        setPosition: (x: number, y: number) => void;
        move: (x: number, y: number) => void;
    }
} & InfoWindowRoomExtension;

export default <RoomPlugin<object, ViewportAnchorRoomExtension>>{
    name: "viewportAnchor",
    dependencies: [infoWindowPlugin.name],
    initialize(room) {
        const elementRef = document.createElement("div");
        elementRef.style.position = "fixed";
        elementRef.style.zIndex = String(99999);
        document.body.appendChild(elementRef);

        const anchorCoordinateElement = document.createElement("small");
        if (!room.infoWindowPlugin.element) throw Error("infoWindowPlugin issue.");
        room.infoWindowPlugin.element.appendChild(anchorCoordinateElement);

        room.viewportAnchorPlugin = {
            setPosition(x: number, y: number) {
                this.position.x = x;
                this.position.y = y;
                if (this.elementRef) {
                    this.elementRef.style.left = x + "px";
                    this.elementRef.style.top = y + "px";
                }
            },
            move(x: number, y: number) {
                this.setPosition(this.position.x + x, this.position.y + y);
            },
            mousepressed: false,
            oldPosition: { x: 0, y: 0 },
            position: { x: 0, y: 0 },
            anchorCoordinateElement,
            elementRef,
        };

        window.addEventListener("mousedown", ({ button }) => {
            if (button === 1) room.viewportAnchorPlugin.mousepressed = true;
        });
        window.addEventListener("mouseup", ({ button }) => {
            if (button === 1) room.viewportAnchorPlugin.mousepressed = false;
        });
        window.addEventListener("mousemove", ({ clientX, clientY }) => {
            if (room.viewportAnchorPlugin.mousepressed) {
                const delta: Vector2D = {
                    x: clientX - room.viewportAnchorPlugin.oldPosition.x,
                    y: clientY - room.viewportAnchorPlugin.oldPosition.y,
                };

                room.viewportAnchorPlugin.move(delta.x, delta.y);
            }

            room.viewportAnchorPlugin.oldPosition.x = clientX;
            room.viewportAnchorPlugin.oldPosition.y = clientY;

            if (room.viewportAnchorPlugin.anchorCoordinateElement) {
                room.viewportAnchorPlugin.anchorCoordinateElement.textContent = `Viewport: (${-room.viewportAnchorPlugin.position.x}, ${-room.viewportAnchorPlugin.position.y})`;
            }
        });
    },
    cleanup(room) {
        room.viewportAnchorPlugin.elementRef?.remove();
        room.viewportAnchorPlugin.anchorCoordinateElement?.remove();
    },
};
