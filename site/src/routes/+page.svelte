<script lang="ts">
	import { writable } from 'svelte/store';

	import { type DataConnection, Peer } from 'peerjs';

	import type { RoomMod, RoomData } from 'clounge';
	import { cardMod, cursorMod, syncMod } from 'clounge/mods';

	let name: string;
	let peer: string;
	const selfId = writable('');

	function start() {
		const self = new Peer();

		// load mods
		const mods: RoomMod[] = [syncMod(), cursorMod(), cardMod()];

		self.on('open', (id) => {
			$selfId = id;

			const room: RoomData = {
				objects: {},
				peers: {},
				self: {
					cursor: { x: 0, y: 0, pressed: false },
					name,
					id
				}
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
					room.peers[con.peer] = {
						name: '',
						connection: con,
						cursor: { x: 0, y: 0, pressed: false }
					};
					console.log('opened to peer', con.peer);
					mods.forEach((mod) => mod.peerSetup && mod.peerSetup(room, con.peer));
				});

				con.on('data', (data) => {
					mods.forEach((mod) => mod.processData && mod.processData(room, data, con.peer));
				});
			}
		});
	}
</script>

<input bind:value={name} />
<input bind:value={peer} />
<button on:click={() => start()}>start</button>
<p>{$selfId}</p>

<style global>
	#canvas {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		pointer-events: none;
		z-index: 2;
		user-select: none;
	}

	.cursor {
		position: absolute;
		user-select: none;
		pointer-events: none;

		margin-left: -16px;
		margin-top: -10px;
	}
</style>
