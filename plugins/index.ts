import type { RoomPlugin } from "types";

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
        if (externalPlugins.length > 0) console.info("%c" + this.tag("downloading external plugins..."), "color: #f72");

        const plugins = await Promise.all(
            externalPlugins.map(async (pluginURL) => {
                console.info(`\tdownloading from ${pluginURL}...`);
                const pluginCode: string = await (await fetch(pluginURL)).text();
                const pluginModule: { default: RoomPlugin } = await import(
                    /* @vite-ignore */ "data:text/javascript," + pluginCode
                );

                console.info("%c" + this.tag(`successfully downloaded [${pluginModule.default.name}].`), "color: #0dd");
                return pluginModule.default;
            }),
        );

        if (plugins.length > 0) {
            console.info("%c" + this.tag("validating plugins dependencies..."), "color: #f04");
            this.availablePlugins = this.availablePlugins.concat(this.getSortedPlugins(plugins));
            console.info(
                "%c" + this.tag(`resolved plugin ordering:\n%c${this.availablePlugins
                    .map((plugin, index) => `\t${index + 1}. ${plugin.name}`)
                    .join("\n")}`),
                "color: #0dd",
                "color: white",
            );

            console.info("%c" + this.tag("bootstrapping plugins..."), "color: #08f");
            this.availablePlugins.forEach((plugin) => {
                if (plugin.load) {
                    console.info(`\t[${plugin.name}]`);
                    plugin.load();
                }
            });
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
        const pluginMap = plugins.reduce((p, c) => p.set(c.name, c), new Map<string, RoomPlugin>());

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

    private static tag(msg: unknown): string {
        return "[PluginManager] " + msg;
    }
}
