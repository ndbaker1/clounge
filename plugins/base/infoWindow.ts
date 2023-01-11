import type { RoomPlugin } from "types";

export type InfoWindowRoomExtension = {
    infoWindowPlugin: {
        element: HTMLDivElement;
    }
}

export default <RoomPlugin<object, InfoWindowRoomExtension>>{
    name: "infoWindow",
    initialize(room) {
        const infoWindow = document.createElement("div");
        infoWindow.style.zIndex = String(9999);
        infoWindow.style.position = "fixed";
        infoWindow.style.left = "0";
        infoWindow.style.bottom = "0";
        infoWindow.style.margin = "1rem";
        infoWindow.style.fontSize = "0.8rem";
        infoWindow.style.display = "flex";
        infoWindow.style.flexDirection = "column";

        document.body.appendChild(infoWindow);

        // ROOM DATA INITIALIZED
        room.infoWindowPlugin = { element: infoWindow };
    },
    cleanup(room) {
        room.infoWindowPlugin.element.remove();
    },
};
