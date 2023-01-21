import type { RoomPlugin } from "types";

const PLUGINS_KEY = "pluginUrls";

let editorWindow: HTMLTextAreaElement;

export default <RoomPlugin>{
    name: "pluginManager",
    initialize() {
        if (typeof window !== "undefined") {
            const marginOffset = "-50%";

            editorWindow = document.createElement("textarea");
            editorWindow.style.position = "fixed";
            editorWindow.style.margin = editorWindow.style.bottom = editorWindow.style.left = "0";
            editorWindow.style.width = "99vw";
            editorWindow.style.height = "20rem";
            editorWindow.style.transition = "ease 400ms";
            editorWindow.style.marginBottom = marginOffset;

            editorWindow.value = sessionStorage.getItem(PLUGINS_KEY) ?? "";
            editorWindow.oninput = () => sessionStorage.setItem(PLUGINS_KEY, editorWindow.value ?? "");

            document.body.appendChild(editorWindow);

            window.addEventListener("keypress", ({ key }) => {
                if (key === "?") {
                    editorWindow.style.marginBottom =
                        editorWindow.style.marginBottom === marginOffset ? "0" : marginOffset;
                }
            });
        }
    },
    cleanup() {
        editorWindow.remove();
    },
};
