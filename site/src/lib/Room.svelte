<script lang="ts">
	import { onMount } from 'svelte';

	import type { RoomData } from 'tablesalt-types';
	import { PluginManager } from 'tablesalt-plugins';
	import Peer, { type DataConnection } from 'peerjs';

	const PLUGIN_URLS_KEY = 'pluginUrls';
	const QUERY_PARAM_ID_OVERRIDE_KEY = 'self';
	const QUERY_PARAM_PEER_ID_KEY = 'peer';

	function noErrorParseJSON(json: string | null): string[] | null {
		try {
			return JSON.parse(json ?? '');
		} catch {
			console.error('failed to parse plugin-json:', json);
			return null;
		}
	}

	onMount(async () => {
		const params = new URLSearchParams(location.search);
		const peer = params.get(QUERY_PARAM_PEER_ID_KEY);
		const idOverride = params.get(QUERY_PARAM_ID_OVERRIDE_KEY);
		const self = idOverride ? new Peer(idOverride) : new Peer();

		const externalPlugins = noErrorParseJSON(sessionStorage.getItem(PLUGIN_URLS_KEY)) ?? [];
		const plugins = await PluginManager.loadPlugins(externalPlugins);

		self.on('open', (id) => {
			const room: RoomData = {
				objects: {},
				peers: {},
				self: {
					id,
					connect: (peer) => {
						const peerCon = self.connect(peer);
						setupPeerDataHandler(peerCon);
					}
				}
			};

			plugins.forEach((plugin) => plugin.initialize && plugin.initialize(room));

			self.on('connection', (con) => {
				setupPeerDataHandler(con);
			});

			plugins.forEach((plugin) => plugin.selfSetup && plugin.selfSetup(room));

			window.onbeforeunload = () => {
				for (const peer in room.peers) {
					room.peers[peer].connection.close();
				}
			};

			if (peer) room.self.connect(peer);

			function setupPeerDataHandler(con: DataConnection) {
				con.on('open', () => {
					room.peers[con.peer] = { connection: con };
					plugins.forEach(
						(plugin) => plugin.peerSetup && plugin.peerSetup(room, con.peer)
					);
				});

				con.on('data', (data) => {
					plugins.forEach(
						(plugin) =>
							plugin.processMessage && plugin.processMessage(room, data, con.peer)
					);
				});

				function handlePeerDisconnect() {
					plugins.forEach(
						(plugin) =>
							plugin.handlePeerDisconnect &&
							plugin.handlePeerDisconnect(room, con.peer)
					);
					delete room.peers[con.peer];
				}
				con.on('close', handlePeerDisconnect);
				con.on('error', handlePeerDisconnect);
			}
		});
	});
</script>
