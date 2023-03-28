import type { RoomPlugin, Vector2D } from "types";

import infoWindow from "./infoWindow";

export type ViewportRoomExtension = {
    viewportPlugin: {
        elementRef: HTMLElement;
        position: Vector2D;
        setPosition: (pos: Vector2D) => void;
        move: (delta: Vector2D) => void;
    }
};

export default <RoomPlugin<object, ViewportRoomExtension>>{
    name: "viewport",
    dependencies: [infoWindow.name],
    initialize(room) {
        const elementRef = document.createElement("div");
        elementRef.style.position = "fixed";
        elementRef.style.zIndex = String(9999);
        document.body.appendChild(elementRef);

        room.viewportPlugin = {
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
    },
    cleanup(room) {
        room.viewportPlugin.elementRef.remove();
    },
};
