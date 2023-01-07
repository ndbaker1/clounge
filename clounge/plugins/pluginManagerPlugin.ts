import { RoomPlugin } from "types";

const PLUGINS_KEY = "pluginUrls";

export default function plugin(): RoomPlugin {
    if (typeof window !== "undefined") {
        const marginOffset = "-50%";

        const editorWindow = document.createElement("div");
        editorWindow.style.position = "fixed";
        editorWindow.style.margin =
            editorWindow.style.bottom =
            editorWindow.style.left =
            "0";
        editorWindow.style.width = "100vw";
        editorWindow.style.height = "20rem";
        editorWindow.style.transition = "ease 400ms";
        editorWindow.style.marginBottom = marginOffset;

        document.body.appendChild(editorWindow);

        (async () => {
            const monaco = await import("monaco-editor");
            const editor = monaco.editor.create(editorWindow, {
                value: sessionStorage.getItem(PLUGINS_KEY),
                language: "json",
                theme: "vs-dark",
                minimap: { enabled: false },
            });

            editor.applyFontInfo(document.documentElement);
            editor.onDidChangeModelContent(() =>
                sessionStorage.setItem(PLUGINS_KEY, editor.getValue())
            );

            monaco.editor.remeasureFonts();

            window.addEventListener("keypress", ({ key }) => {
                if (key === "?") {
                    editorWindow.style.marginBottom =
                        editorWindow.style.marginBottom === marginOffset
                            ? "0"
                            : marginOffset;
                }
            });
        })();
    }

    return {};
}
