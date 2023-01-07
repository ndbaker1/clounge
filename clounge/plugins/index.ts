import namePlugin from "./namePlugin";
import cursorPlugin from "./cursorPlugin";
import cardPlugin from "./cardPlugin";
import sharePlugin from "./sharePlugin";
import aestheticsPlugin from "./aestheticsPlugin";
import pluginManagerPlugin from "./pluginManagerPlugin";
import peerRelayPlugin from "./peerRelayPlugin";

import { RoomPlugin } from "types";

export function defaultPlugins(): RoomPlugin[] {
  return [
    // no dependencies
    aestheticsPlugin(),
    pluginManagerPlugin(),
    peerRelayPlugin(),
    sharePlugin(),
    namePlugin(),

    // namePlugin
    cursorPlugin(),

    // cursorPlugin
    cardPlugin(),
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