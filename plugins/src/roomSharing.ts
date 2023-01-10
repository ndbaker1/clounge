import type { RoomPlugin } from "types";

export default <RoomPlugin>{
    name: "roomSharing",
    selfSetup(room) {
        const roomLinkContainer = document.createElement("div");
        roomLinkContainer.style.position = "fixed";
        roomLinkContainer.style.top = "0";
        roomLinkContainer.style.right = "0";
        roomLinkContainer.style.padding = "1rem";

        const roomLink = document.createElement("button");
        roomLink.innerText = "📢 Share Lobby";
        roomLink.style.padding = "0.5rem 0.8rem";
        roomLink.onclick = async () => {
            await navigator.clipboard.writeText(
                `${location.origin}${location.pathname}?peer=${room.self.id}`,
            );

            roomLink.innerText = "📋 Link Copied";
            setTimeout(() => {
                roomLink.innerText = "📢 Share Lobby";
            }, 1000);
        };

        roomLinkContainer.appendChild(roomLink);
        document.body.appendChild(roomLinkContainer);
    },
};
