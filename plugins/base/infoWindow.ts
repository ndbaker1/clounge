import type { RoomPlugin } from "types";

export type InfoWindowRoomExtension = {
    infoWindowPlugin: {
        element: HTMLDivElement;
    }
};

export default <RoomPlugin<object, InfoWindowRoomExtension>>{
    name: "infoWindow",
    initialize(room) {
        const infoWindow = document.createElement("div");
        infoWindow.style.zIndex = String(9999);
        infoWindow.style.position = "fixed";
        infoWindow.style.opacity = "0.6";
        infoWindow.style.left = "0";
        infoWindow.style.bottom = "0";
        infoWindow.style.margin = "1rem";
        infoWindow.style.fontSize = "0.8rem";
        infoWindow.style.display = "grid";

        document.body.appendChild(infoWindow);

        const repo = document.createElement("a");
        repo.text = "Github Link 💻";
        repo.target = "_blank noreferrer";
        repo.href = "https://github.com/ndbaker1/tablesalt";
        infoWindow.appendChild(repo);

        // ROOM DATA INITIALIZED
        room.infoWindowPlugin = { element: infoWindow };
    },
    cleanup(room) {
        room.infoWindowPlugin.element.remove();
    },
};
