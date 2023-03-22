import type { RoomPlugin } from "types";
import type { ObjectPropertiesObjectExtension, ObjectPropertiesRoomExtension, OBJECT_ID_ATTRIBUTE } from "./objectProperties";
import type { ObjectContextMenuRoomExtension } from "./objectContextMenu";
import type { ViewportRoomExtension } from "./viewport";

import objectProperties from "./objectProperties";
import objectContextMenu from "./objectContextMenu";
import viewport from "./viewport";

const CONSTANTS = {
    exitKey: "Escape",
    flipKey: "w",
};

let previewOpen = false;

export default <RoomPlugin<
    object,
    ObjectPropertiesRoomExtension & ObjectContextMenuRoomExtension & ViewportRoomExtension,
    ObjectPropertiesObjectExtension
>
    >{
        name: "objectPreview",
        dependencies: [objectProperties.name, objectContextMenu.name, viewport.name],
        initialize(room) {
            function openPreview(ids: number[]) {
                previewOpen = true;
                function closeWindow() {
                    previewContainer.remove();
                    previewOpen = false;
                }

                function flipPreview() {
                    itemContainer.querySelectorAll("img").forEach(previewItem => {
                        const id = parseInt(previewItem.getAttribute(<OBJECT_ID_ATTRIBUTE>"object-id") ?? "");
                        previewItem.src = previewItem.src === room.objects[id].descriptors.backImg
                            ? room.objects[id].descriptors.frontImg
                            : room.objects[id].descriptors.backImg;
                    });
                }

                window.addEventListener("keyup", function handleKeys({ key }) {
                    if (key === CONSTANTS.exitKey) {
                        closeWindow();
                        window.removeEventListener("keyup", handleKeys);
                    } else if (key === CONSTANTS.flipKey) {
                        flipPreview();
                    }
                });

                const previewContainer = document.createElement("div");
                previewContainer.style.position = "fixed";
                previewContainer.style.display = "grid";
                previewContainer.style.borderRadius = "5px";
                previewContainer.style.backgroundColor = "#322F3D";
                previewContainer.style.boxShadow = "black 1px 4px 12px";
                previewContainer.style.top = previewContainer.style.left = "50%";
                previewContainer.style.transform = "translate(-50%, -50%)";

                const buttonContainer = document.createElement("div");
                buttonContainer.style.display = "grid";
                buttonContainer.style.gridAutoFlow = "column";
                buttonContainer.style.gap = "1rem";
                buttonContainer.style.padding = "0.2rem";
                buttonContainer.style.height = "2rem";
                buttonContainer.style.margin = "0.6rem";
                previewContainer.appendChild(buttonContainer);

                const flipButton = document.createElement("button");
                flipButton.textContent = `flip all in preview (or "${CONSTANTS.flipKey}")`;
                flipButton.onclick = flipPreview;
                buttonContainer.appendChild(flipButton);

                const closeButton = document.createElement("button");
                closeButton.textContent = `close ✖ (or "${CONSTANTS.exitKey}")`;
                closeButton.onclick = closeWindow;
                buttonContainer.appendChild(closeButton);

                const itemContainer = document.createElement("div");
                itemContainer.style.margin = "1rem";
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
                    image.alt = id.toString();
                    image.src = room.objects[id].descriptors.currentImg ?? "";
                    image.setAttribute(<OBJECT_ID_ATTRIBUTE>"object-id", id.toString());
                    image.width = 80;

                    objectPreview.appendChild(image);
                    objectPreview.appendChild(text);
                    itemContainer.appendChild(objectPreview);
                });

                room.viewportPlugin.elementRef.appendChild(previewContainer);
            }

            room.objectContextMenuPlugin.menuOptions.set("preview 👀", openPreview);

            window.addEventListener("mousedown", ({ ctrlKey, button }) => {
                if (ctrlKey && button === 0) {
                    const selectedIds = room.objectPropertiesPlugin.getObjectIdsUnderCursor();
                    if (selectedIds.length > 0 && !previewOpen) {
                        openPreview(selectedIds);
                    }

                    // extra insurance
                    room.objectPropertiesPlugin.selectedObjectId = 0;
                }
            });
        },
        cleanup(room) {
            room.objectContextMenuPlugin.menuOptions.delete("preview 👀");
        },
    };
