import namePlugin from "./namePlugin";
import cursorPlugin from "./cursorPlugin";
import objectsPlugin from "./objectsPlugin";
import sharePlugin from "./sharePlugin";
import themePlugin from "./themePlugin";
import pluginManagerPlugin from "./pluginManagerPlugin";
import peerRelayPlugin from "./peerRelayPlugin";

import { RoomPlugin } from "types";

export function defaultPlugins(): RoomPlugin[] {
  return [
    // no dependencies
    themePlugin(),
    pluginManagerPlugin(),
    peerRelayPlugin(),
    sharePlugin(),
    namePlugin(),

    // namePlugin
    cursorPlugin(),

    // cursorPlugin
    objectsPlugin(),
  ];
}

export async function loadPlugins(pluginList: string[]): Promise<RoomPlugin[]> {
  const plugins: RoomPlugin[] = [];
  for (const pluginURL of pluginList) {
    const pluginCode: string = await (await fetch(pluginURL)).text();
    const pluginModule: () => RoomPlugin = (
      await import(/* @vite-ignore */ `data:text/javascript,${pluginCode}`)
    ).default;

    plugins.push(pluginModule());
  }
  return plugins;
}
