import type { RoomPlugin } from "types";
import type { ObjectPropertiesObjectExtension, ObjectPropertiesRoomExtension } from "./objectProperties";
import type { ObjectContextMenuRoomExtension } from "./objectContextMenu";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

import peerCursors from "./peerCursors";
import objectProperties from "./objectProperties";
import objectContextMenu from "./objectContextMenu";
import viewportAnchor from "./viewportAnchor";

export default <RoomPlugin<
    object,
    ObjectPropertiesRoomExtension & ObjectContextMenuRoomExtension & ViewportAnchorRoomExtension,
    ObjectPropertiesObjectExtension
>
    >{
        name: "objectPocket",
        dependencies: [peerCursors.name, objectProperties.name, objectContextMenu.name, viewportAnchor.name],
        initialize(room) {

            const pocket = document.createElement("div");
            pocket.id = "pocket";
            pocket.style.position = "fixed";
            pocket.style.bottom = "0";
            pocket.style.right = "1rem";
            pocket.style.width = "20rem";
            pocket.style.padding = "1rem";
            pocket.style.borderRadius = "1rem 1rem 0 0";
            pocket.style.backgroundColor = "#312F2";
            pocket.style.transition = "ease 400ms";
            pocket.style.transform = "translateY(150%)";
            pocket.style.boxShadow = "black 1px 4px 12px";

            room.viewportAnchorPlugin.elementRef.appendChild(pocket);

            const pocketIcon = document.createElement("button");
            pocketIcon.id = "pocket-button";
            pocketIcon.style.position = "fixed";
            pocketIcon.style.bottom = "0";
            pocketIcon.style.right = "5rem";
            pocketIcon.style.padding = "1rem";
            pocket.style.transition = "ease 400ms";
            pocketIcon.style.borderRadius = "1rem 1rem 0 0";
            pocketIcon.style.backgroundColor = "#59405C";
            pocketIcon.textContent = "Pocket 💼";

            const closeButton = document.createElement("button");
            closeButton.textContent = "close ✖";
            closeButton.style.padding = "0.2rem";
            closeButton.style.height = "2rem";
            closeButton.style.margin = "0.6rem";
            closeButton.onclick = () => {
                pocket.style.transform = "translateY(150%)";
                pocketIcon.style.transform = "";
            };
            pocket.appendChild(closeButton);

            room.viewportAnchorPlugin.elementRef.appendChild(pocketIcon);

            pocketIcon.onclick = () => {
                pocket.style.transform = "";
                pocketIcon.style.transform = "translateY(150%)";

            };


            room.objectContextMenuPlugin.menuOptions.set("pocket 💼", (ids) => {
                function closeWindow() {
                    previewContainer.remove();
                    window.removeEventListener("mouseup", closeWindow);
                }

                const previewContainer = document.createElement("div");
                previewContainer.style.position = "fixed";
                previewContainer.style.display = "grid";
                previewContainer.style.borderRadius = "5px";
                previewContainer.style.backgroundColor = "#322F3D";
                previewContainer.style.boxShadow = "black 1px 4px 12px";

                previewContainer.style.top = "10vh";
                previewContainer.style.left = "50%";
                previewContainer.style.transform = "translateX(-50%)";

                const closeButton = document.createElement("button");
                closeButton.textContent = "close ✖";
                closeButton.style.padding = "0.2rem";
                closeButton.style.height = "2rem";
                closeButton.style.margin = "0.6rem";
                closeButton.onclick = closeWindow;
                previewContainer.appendChild(closeButton);

                const itemContainer = document.createElement("div");
                itemContainer.style.padding = "1rem";
                itemContainer.style.display = "grid";
                itemContainer.style.gridTemplateColumns = "repeat(auto-fill, 80px)";
                itemContainer.style.gap = "1rem";
                itemContainer.style.overflow = "auto";
                itemContainer.style.width = "50vw";
                itemContainer.style.maxHeight = "50vh";
                previewContainer.appendChild(itemContainer);

                ids.forEach((id, index) => {
                    const objectPreview = document.createElement("div");
                    objectPreview.style.textAlign = "center";

                    const text = document.createElement("small");
                    text.textContent = index.toString();

                    const image = document.createElement("img");
                    image.src = room.objects[id].descriptors.currentImg ?? "";
                    image.width = 80;
                    image.onmousedown = ({ button }) => {
                        if (button === 0) { // left click
                            closeWindow();
                            room.objectPropertiesPlugin.selectedObjectId = id;
                        }
                    };

                    objectPreview.appendChild(image);
                    objectPreview.appendChild(text);

                    itemContainer.appendChild(objectPreview);
                });

                room.viewportAnchorPlugin.elementRef.appendChild(previewContainer);
            });
        },
        cleanup(room) {
            room.objectContextMenuPlugin.menuOptions.delete("pocket 💼");
        },
    };
