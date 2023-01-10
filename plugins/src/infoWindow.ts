import type { RoomPlugin } from "types";

export type InfoWindowRoomExtension = {
    infoWindowPlugin: {
        element?: HTMLDivElement;
    }
}

export default <RoomPlugin<object, InfoWindowRoomExtension>>{
    name: "infoWindow",
    initialize(room) {
        const infoWindow = document.createElement("div");
        infoWindow.style.position = "fixed";
        infoWindow.style.right = "0";
        infoWindow.style.bottom = "0";
        infoWindow.style.margin = "1rem";

        document.body.appendChild(infoWindow);

        // ROOM DATA INITIALIZED
        room.infoWindowPlugin = { element: infoWindow };
    },
    cleanup(room) {
        room.infoWindowPlugin.element?.remove();
    },
};
