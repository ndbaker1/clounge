<script lang="ts">
	import { onMount } from 'svelte';
	import { get, writable } from 'svelte/store';

	import { type DataConnection, Peer } from 'peerjs';

	import type { RoomPlugin, RoomData } from 'clounge';
	import { cardPlugin, cursorPlugin, namePlugin } from 'clounge/mods';

	const selfId = writable('');

	onMount(() => {
		const params = new URLSearchParams(location.search);
		const peer = params.get('peer') || 'noname';
		const self = new Peer();

		// load mods
		const mods: RoomPlugin[] = [namePlugin(), cursorPlugin(), cardPlugin()];

		self.on('open', (id) => {
			$selfId = id;

			const room: RoomData = {
				objects: {},
				peers: {},
				self: { id }
			};
			mods.forEach((mod) => mod.selfSetup && mod.selfSetup(room));

			self.on('connection', (con) => {
				setupPeerDataHandler(con);
			});

			if (peer) {
				const peerCon = self.connect(peer);
				setupPeerDataHandler(peerCon);
			}

			function setupPeerDataHandler(con: DataConnection) {
				con.on('open', () => {
					room.peers[con.peer] = { connection: con };
					mods.forEach((mod) => mod.peerSetup && mod.peerSetup(room, con.peer));
				});

				con.on('data', (data) => {
					mods.forEach((mod) => mod.processData && mod.processData(room, data, con.peer));
				});
			}
		});
	});
</script>

{#if $selfId}
    <button
        on:click={async () => await navigator.clipboard.writeText(`${location.origin}?peer=${get(selfId)}`)}
        on:keypress={() => 0}
    >
        {$selfId}
    </button>
{/if}

<style global>
    html {
        overflow: hidden;
    }
</style>
