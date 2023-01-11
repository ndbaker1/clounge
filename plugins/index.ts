import type { RoomPlugin } from "types";
import infoWindow from "./src/infoWindow";
import names from "./src/names";
import objectLoader from "./src/objectLoader";
import peerCursors from "./src/peerCursors";
import peerRelaying from "./src/peerRelaying";
import pluginManager from "./src/pluginManager";
import roomSharing from "./src/roomSharing";
import theme from "./src/theme";
import viewportAnchor from "./src/viewportAnchor";

export class PluginManager {
    /**
     * Global Reference to available plugins
     */
    static availablePlugins: RoomPlugin[] = [];

    /**
     * Loads default and external Plugins
     * @param externalPlugins URLs of external plugin files
     * @returns a list of RoomPlugins
     */
    static async loadPlugins(externalPlugins: string[]): Promise<RoomPlugin[]> {
        const plugins = [
            viewportAnchor,
            infoWindow,
            names,
            objectLoader,
            peerCursors,
            peerRelaying,
            pluginManager,
            roomSharing,
            theme,
        ];

        if (externalPlugins.length > 0) {
            console.info("%c" + this.tag("downloading external plugins..."), "color: #f72");
            for (const pluginURL of externalPlugins) {
                console.info("%c\t" + this.tag(`downloading ${pluginURL}...`), "color: #d7d");
                try {
                    const pluginCode: string = await (await fetch(pluginURL)).text();
                    const pluginModule: { default: RoomPlugin } = await import(
                    /* @vite-ignore */ "data:text/javascript," + pluginCode
                    );

                    console.info("%c\t" + this.tag(`successfully downloaded [${pluginModule.default.name}]`), "color: #d7d");
                    plugins.push(pluginModule.default);
                } catch (e) {
                    console.error(e);
                }
            }
        }

        if (plugins.length > 0) {
            console.info("%c" + this.tag("validating and ordering plugins..."), "color: #d45");
            this.availablePlugins = this.availablePlugins.concat(this.getSortedPlugins(plugins));

            const orderList = this.availablePlugins
                .map((plugin, index) => `\t${index + 1}.\t${plugin.name}`)
                .join("\n");
            console.info("%c" + this.tag(`loading order resolved: \n${orderList}`), "color: #0dd");
        }

        console.info("%c" + this.tag("finished loading plugins!"), "color: #0e0");
        return this.availablePlugins;
    }

    /**
     * Sort a list of Plugins according to the order they should be loaded
     * @param plugins RoomPlugins
     * @returns an array of the input plugins sorted by dependencies
     */
    private static getSortedPlugins(plugins: RoomPlugin[]): RoomPlugin[] {
        // The behavior here is that duplicate plugins will be ignored
        const pluginMap = plugins.reduce((p, c) => p.set(c.name, c), new Map<string, RoomPlugin>());

        const sortedPlugins: RoomPlugin[] = [];

        function checkDep(dep: string): boolean {
            if (!sortedPlugins.find((plugin) => plugin.name === dep)) {
                const plugin = pluginMap.get(dep);
                if (plugin) {
                    plugin.dependencies?.forEach(checkDep);
                    sortedPlugins.push(plugin);
                    return true;
                }

                console.error(`missing dependency[${dep}]`);
            }

            return false;
        }

        plugins.forEach((plugin) => checkDep(plugin.name));

        return sortedPlugins;
    }

    private static tag(msg: unknown): string {
        return "[PluginManager] " + msg;
    }
}
