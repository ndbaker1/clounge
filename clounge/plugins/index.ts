import namePlugin from "./namePlugin";
import cursorPlugin from "./cursorPlugin";
import objectsPlugin from "./objectsPlugin";
import sharePlugin from "./sharePlugin";
import themePlugin from "./themePlugin";
import pluginManagerPlugin from "./pluginManagerPlugin";
import peerRelayPlugin from "./peerRelayPlugin";
import anchorPlugin from "./anchorPlugin";

import type { RoomPlugin } from "index";

/**
 * Loads default and external Plugins
 * @param externalPlugins URLs of external plugin files
 * @returns a list of RoomPlugins
 */
export async function loadPlugins(
  externalPlugins: string[]
): Promise<RoomPlugin[]> {
  const plugins: RoomPlugin[] = [
    peerRelayPlugin,
    themePlugin,
    cursorPlugin,
    sharePlugin,
    pluginManagerPlugin,
    namePlugin,
    anchorPlugin,
    objectsPlugin,
  ];

  console.info("downloading any external plugins...");
  for (const pluginURL of externalPlugins) {
    console.info(`downloading from ${pluginURL}...`);
    const pluginCode: string = await (await fetch(pluginURL)).text();
    const pluginModule: { default: RoomPlugin } = await import(
      /* @vite-ignore */ "data:text/javascript," + pluginCode
    );

    console.info(
      `%csuccessfully downloaded [${pluginModule.default.name}].`,
      "color: #0dd"
    );
    plugins.push(pluginModule.default);
  }

  console.info(`validating plugins dependencies...`);
  const sortedPlugins = getSortedPlugins(plugins);
  console.info(
    `%cresolved valid ordering:\n%c${sortedPlugins
      .map((plugin, index) => `\t${index + 1}. ${plugin.name}`)
      .join("\n")}`,
    "color: #0d0",
    "color: white"
  );

  console.info(`%cbootstrapping plugins...`, "color: #9bf");
  sortedPlugins.forEach((plugin) => {
    if (plugin.load) {
      console.info(`\t[${plugin.name}]`);
      plugin.load();
    }
  });

  return sortedPlugins;
}

/**
 * Sort a list of Plugins according to the order they should be loaded
 * @param plugins RoomPlugins
 * @returns an array of the input plugins sorted by dependencies
 */
function getSortedPlugins(plugins: RoomPlugin[]): RoomPlugin[] {
  const pluginMap = plugins.reduce(
    (p, c) => p.set(c.name, c),
    new Map<string, RoomPlugin>()
  );

  const sortedPlugins: RoomPlugin[] = [];

  function checkDep(dep: string) {
    if (!sortedPlugins.find((plugin) => plugin.name === dep)) {
      const plugin = pluginMap.get(dep);
      if (!plugin) throw Error("missing dependency " + dep);
      plugin.dependencies?.forEach(checkDep);
      sortedPlugins.push(plugin);
    }
  }

  plugins.forEach((plugin) => checkDep(plugin.name));

  return sortedPlugins;
}
