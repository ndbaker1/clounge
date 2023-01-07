import { RoomPlugin } from "types";

export default function plugin(): RoomPlugin {
  return {
    selfSetup(room) {
      const roomLinkContainer = document.createElement("div");
      const roomLink = document.createElement("button");
      roomLinkContainer.style.position = "fixed";
      roomLinkContainer.style.top = "0";
      roomLinkContainer.style.right = "0";
      roomLinkContainer.style.padding = "1rem";

      roomLink.innerText = "📢 Share Lobby";
      roomLink.style.padding = "0.5rem 0.8rem";
      roomLink.onclick = async () => {
        await navigator.clipboard.writeText(
          `${location.origin}?peer=${room.self.id}`
        );

        roomLink.innerText = "📋 Link Copied";
        setTimeout(() => { roomLink.innerText = "📢 Share Lobby" }, 1000);
      }
      roomLinkContainer.appendChild(roomLink);
      document.body.appendChild(roomLinkContainer);
    },
  };
}
