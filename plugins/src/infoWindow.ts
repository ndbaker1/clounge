import type { RoomPlugin } from "types";

export class InfoWindow {
    static element?: HTMLDivElement;
}

export default <RoomPlugin>{
    name: "infoWindow",
    load() {
        InfoWindow.element = document.createElement("div");
        InfoWindow.element.style.position = "fixed";
        InfoWindow.element.style.right = "0";
        InfoWindow.element.style.bottom = "0";
        InfoWindow.element.style.margin = "1rem";
        document.body.appendChild(InfoWindow.element);
    },
    unload() {
        InfoWindow.element?.remove();
    },
};
