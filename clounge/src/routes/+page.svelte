<script lang="ts">
	import { onMount } from 'svelte';

	import { type DataConnection, Peer } from 'peerjs';

	const cursors: any = {};

	let mouseX: number;
	let mouseY: number;

	onMount(() => {
		const p1 = new Peer();
		const p2 = new Peer();

		let con: DataConnection;
		p2.on('connection', (conn) => {
			alert("test2")
			conn.send('hi!')
			conn.on('data', (data) => {
				// Will print 'hi!'
				console.log('p1', data)
				moveCursor(data as [number, number], '2')
			});
			conn.on('open', () => {
			});
		});

		p1.on('connection', (conn) => {
			alert("test1")
			conn.on('data', (data) => {
				// Will print 'hi!'

			});
			conn.on('open', () => {
			});
		});

		p1.on('open', (p1id) => {
			p2.on("open", p2id => {
				con = p1.connect(p2id);
			con.on('data', (data: any) => {
				// Will print 'hi!'
				console.log(data);
			});
			con.on('open', () => {
				addCursor('2')
			});
			})
		})

		const byId = document.getElementById.bind(document);
		const canvas = byId('canvas');
		console.log(canvas)

		window.addEventListener('mousemove', ({ clientX, clientY }) => {
			mouseX = clientX;
			mouseY = clientY;
			con.send([mouseX, mouseY])
		});

		function moveCursor([x, y]: [number, number], id: string) {
			const el = cursors[id];

			if (el) {
				el.style.left = x + 'px';
				el.style.top = y + 'px';
			}
		}

		function addCursor(id: string) {
			const el = document.createElement('div');
			const img = document.createElement('img');
			const txt = document.createElement('p');

  			el.className = `cursor`
			el.style.left = el.style.top = '-99px';
			img.src = 'https://cdn.pixabay.com/photo/2013/07/12/19/17/cursor-154478_960_720.png';
			img.width = img.height = 48
			el.appendChild(img);
			el.appendChild(txt);
			console.log('added')
			canvas?.appendChild(el);
			cursors[id] = el;
		}

		function removeCursor(id: string) {
			if (cursors[id]) {
				canvas?.removeChild(cursors[id]);
			}
		}

		// addCursor(selfId);
		// room.onPeerJoin(addCursor);
		// room.onPeerLeave(removeCursor);
		// getMove(moveCursor);
	});
</script>

<div id="canvas" />

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

.cursor,
.fruit {
  position: absolute;
}

.cursor {
  margin-left: -10px;
  margin-top: -2px;
}

html {
	cursor: none;
}
</style>
