<script lang="ts" context="module">
	import { onMount } from 'svelte';
	import { joinRoom } from 'trystero';

	onMount(() => {
		const byId = document.getElementById.bind(document);
		const canvas = byId('canvas');
		const peerInfo = byId('peer-info');
		const cursors: any = {};

		const room = joinRoom({ appId: 'clounge-lobby' }, '69');

		const [sendMove, getMove] = room.makeAction<[number, number]>('mouseMove');
		const [sendClick, getClick] = room.makeAction('click');

		function moveCursor([x, y]: [number, number], id: string) {
			const el = cursors[id];

			if (el) {
				el.style.left = x * window.innerWidth + 'px';
				el.style.top = y * window.innerHeight + 'px';
			}
		}

		function addCursor(id: string) {
			const el = document.createElement('div');
			const img = document.createElement('img');
			const txt = document.createElement('p');

			el.style.left = el.style.top = '-99px';
			img.src = 'images/hand.png';
			el.appendChild(img);
			el.appendChild(txt);
			canvas?.appendChild(el);
			cursors[id] = el;

			sendMove([Math.random() * 0.93, Math.random() * 0.93], id);
		}

		function removeCursor(id: string) {
			if (cursors[id]) {
				canvas?.removeChild(cursors[id]);
			}
		}
		room.onPeerJoin(addCursor);
		room.onPeerLeave(removeCursor);
		getMove(moveCursor);
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
