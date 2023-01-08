import namePlugin from "./namePlugin";
import cursorPlugin from "./cursorPlugin";
import objectsPlugin from "./objectsPlugin";
import sharePlugin from "./sharePlugin";
import themePlugin from "./themePlugin";
import pluginManagerPlugin from "./pluginManagerPlugin";
import peerRelayPlugin from "./peerRelayPlugin";
import anchorPlugin from "./anchorPlugin";

import { RoomPlugin } from "index";

export function defaultPlugins(): RoomPlugin[] {
  return [
    peerRelayPlugin(),
    themePlugin(),
    sharePlugin(),
    pluginManagerPlugin(),
    namePlugin(),
    anchorPlugin(),

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
