import type { RoomPlugin } from "index";

import infoWindow from "./infoWindow";
import names from "./names";
import objectLoader from "./objectLoader";
import peerCursors from "./peerCursors";
import peerRelaying from "./peerRelaying";
import pluginManager from "./pluginManager";
import roomSharing from "./roomSharing";
import theme from "./theme";
import viewportAnchor from "./viewportAnchor";

/**
 * Global Reference to available plugins
 */
export let availablePlugins: RoomPlugin[] = [];

/**
 * Loads default and external Plugins
 * @param externalPlugins URLs of external plugin files
 * @returns a list of RoomPlugins
 */
export async function loadPlugins(
  externalPlugins: string[]
): Promise<RoomPlugin[]> {
  const plugins: RoomPlugin[] = [
    objectLoader,
    peerRelaying,
    infoWindow,
    theme,
    peerCursors,
    roomSharing,
    pluginManager,
    names,
    viewportAnchor,
  ];

  console.info("%cdownloading any external plugins...", "color: #f0b");
  for (const pluginURL of externalPlugins) {
    console.info(`\tdownloading from ${pluginURL}...`);
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

  console.info(`%cvalidating plugins dependencies...`, "color: #f72");
  availablePlugins = getSortedPlugins(plugins);
  console.info(
    `%cresolved plugin ordering:\n%c${availablePlugins
      .map((plugin, index) => `\t${index + 1}. ${plugin.name}`)
      .join("\n")}`,
    "color: #0d0",
    "color: white"
  );

  console.info(`%cbootstrapping plugins...`, "color: #08f");
  availablePlugins.forEach((plugin) => {
    if (plugin.load) {
      console.info(`\t[${plugin.name}]`);
      plugin.load();
    }
  });

  return availablePlugins;
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
      if (!plugin) throw Error(`missing dependency [${dep}]`);
      plugin.dependencies?.forEach(checkDep);
      sortedPlugins.push(plugin);
    }
  }

  plugins.forEach((plugin) => checkDep(plugin.name));

  return sortedPlugins;
}
