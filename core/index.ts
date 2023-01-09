export type Vector2D = {
	x: number;
	y: number;
};

export type ConnectedPeerData = {
	connection: {
		send: (data: unknown) => void;
		close: () => void;
	};
};

export type PeerID = string;

export type RoomData<
	PeerExtension = object,
	BaseExtension = object,
	ObjectExtension = object,
> = BaseExtension & {
	peers: Record<PeerID, ConnectedPeerData & PeerExtension>;
	self: { id: PeerID; connect: (peerId: PeerID) => void } & PeerExtension;
	objects: Record<number, ObjectExtension>;
};

/**
 * Custom Plugin Definition
 */
export type RoomPlugin<
	PeerExtension = object,
	BaseExtension = object,
	ObjectExtension = object,
> = {
	/**
	 * Name used to identify the plugin
	 */
	name: string;
	/**
	 * Optional list of plugin dependencies
	 */
	dependencies?: string[];
	/**
	 * Initialization for the plugin
	 */
	load?(): void;
	/**
	 * Cleanup procedure for the plugin
	 */
	unload?(): void;
	/**
	 * Setup for self upon connecting
	 * @param room RoomData reference
	 */
	selfSetup?(room: RoomData<PeerExtension, BaseExtension, ObjectExtension>): void;
	/**
	 * Setup for peers when connecting to self
	 * @param room RoomData reference
	 * @param peerId ID of the connecting peer
	 */
	peerSetup?(room: RoomData<PeerExtension, BaseExtension, ObjectExtension>, peerId: PeerID): void;
	/**
	 * Handler for incoming messages from peers
	 * @param room RoomData reference
	 * @param data peer message
	 * @param peerId ID of the peer which the data comes from
	 */
	processMessage?<T = object>(
		room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
		data: T,
		peerId: PeerID,
	): void;
	/**
	 * Handler for when a peer has disconnected
	 * @param room RoomData reference
	 * @param peerId ID the peer
	 */
	handlePeerDisconnect?(
		room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
		peerId: PeerID,
	): void;
};

/**
 * Global Reference to available plugins
 */
export let availablePlugins: RoomPlugin[] = [];

/**
 * Loads default and external Plugins
 * @param externalPlugins URLs of external plugin files
 * @returns a list of RoomPlugins
 */
export async function loadPlugins(externalPlugins: string[]): Promise<RoomPlugin[]> {
	if (externalPlugins.length > 0) console.info("%cdownloading external plugins...", "color: #f72");

	const plugins = await Promise.all(
		externalPlugins.map(async (pluginURL) => {
			console.info(`\tdownloading from ${pluginURL}...`);
			const pluginCode: string = await (await fetch(pluginURL)).text();
			const pluginModule: { default: RoomPlugin } = await import(
				/* @vite-ignore */ "data:text/javascript," + pluginCode
			);

			console.info(`%csuccessfully downloaded [${pluginModule.default.name}].`, "color: #0dd");
			return pluginModule.default;
		}),
	);

	if (plugins.length > 0) {
		console.info("%cvalidating plugins dependencies...", "color: #f04");
		availablePlugins = getSortedPlugins(plugins);
		console.info(
			`%cresolved plugin ordering:\n%c${availablePlugins
				.map((plugin, index) => `\t${index + 1}. ${plugin.name}`)
				.join("\n")}`,
			"color: #0dd",
			"color: white",
		);

		console.info("%cbootstrapping plugins...", "color: #08f");
		availablePlugins.forEach((plugin) => {
			if (plugin.load) {
				console.info(`\t[${plugin.name}]`);
				plugin.load();
			}
		});
	}

	console.info("%cfinished loading!", "color: #0e0");
	return availablePlugins;
}

/**
 * Sort a list of Plugins according to the order they should be loaded
 * @param plugins RoomPlugins
 * @returns an array of the input plugins sorted by dependencies
 */
function getSortedPlugins(plugins: RoomPlugin[]): RoomPlugin[] {
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
