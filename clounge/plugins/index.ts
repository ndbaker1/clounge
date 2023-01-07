import namePlugin from "./namePlugin";
import cursorPlugin from "./cursorPlugin";
import cardPlugin from "./cardPlugin";
import sharePlugin from "./sharePlugin";
import aestheticsPlugin from "./aestheticsPlugin";

import { RoomPlugin } from "types";


export function defaultPlugins(): RoomPlugin[] {
    return [aestheticsPlugin(), sharePlugin(), namePlugin(), cursorPlugin(), cardPlugin()];
}

export async function loadPlugins(pluginList: string[]): Promise<RoomPlugin[]> {
    const plugins: RoomPlugin[] = [];
    for (const pluginURL of pluginList) {
        const pluginCode: string = await (await fetch(pluginURL)).text();
        const pluginModule: () => RoomPlugin = (await import( /* @vite-ignore */ `data:text/javascript,${pluginCode}`)).default;
        plugins.push(pluginModule());
    }
    return plugins;
}