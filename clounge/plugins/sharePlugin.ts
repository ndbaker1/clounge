import { RoomPlugin } from "types";

export default function plugin(): RoomPlugin {
  return {
    selfSetup(room) {
      const roomLink = document.createElement("button");
      roomLink.style.position = "fixed";
      roomLink.style.top = "0";
      roomLink.style.right = "0";
      roomLink.style.margin = "0.8rem";
      roomLink.style.padding = "0.5rem 0.8rem";

      roomLink.innerText = "Share Lobby 🎩";
      roomLink.onclick = async () =>
        await navigator.clipboard.writeText(
          `${location.origin}?peer=${room.self.id}`
        );

      document.body.appendChild(roomLink);
    },
  };
}
