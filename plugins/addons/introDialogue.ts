import type { RoomPlugin } from "types";

export default <RoomPlugin>{
    name: "introDialogue",
    initialize() {
        // Add a help window for people opening the app for the first time
        const introWindow = document.createElement("div");

        introWindow.style.margin = "auto";
        introWindow.style.maxWidth = "min(1000px, 90vw)";
        introWindow.style.maxHeight = "min(100rem, 70vh)";
        introWindow.style.display = "grid";
        introWindow.style.gap = "1rem";
        introWindow.style.overflow = "auto";

        const dialogue = document.createElement("p");
        dialogue.innerHTML = `
            <h3>Welcome to 🧂 <u>tablesalt</u>, a peer-to-peer tabletop.</h3>

            The first thing you'll probably want to do is share your room with others.  
            Click the "Share Lobby" button in the top-right and then send the link to your friends!
            Don't forget to set a name for yourself in the top-left, which is what others will see next to your cursor.

            <br/> <br/>

            In order to load objects into the room, try out a preset or press the "Load Objects" button in the top-right.
            It will be possible to create your own loadable object sets in the future :)

            <br/> <br/>

            Once objects are loaded into the room you can <kbd>left-click</kbd> to drag them around and <kbd>right-click</kbd> to perform additional actions.
            There are some default controls and shortcuts built-in already, such as:

            <ul>
                <li>hold <kbd>middle-click</kbd> or <kbd>left-click</kbd> an empty space and drag to pan around</li>
                <li>hover an object and press <kbd>f</kbd> to flip it over</li>
                <li>hover an object and press <kbd>z</kbd> or <kbd>x</kbd> to view a close-up of the top or bottom side</li>
                <li>hover over objects and press <kbd>q</kbd> to open up the preview menu</li>
                <li>hold <kbd>shift</kbd> + <kbd>left-click</kbd> and drag to move every object under the cursor</li>
            </ul>

            Lots of things may change as it's still very much a work in progress,
            so don't be surprised by the amount of bugs and bad UI design choices :)

            <br/> <br/>

            Regardless, thanks for trying out tablesalt!
        `;

        const closeIntro = document.createElement("button");
        closeIntro.textContent = "close";
        closeIntro.onclick = () => introWindow.remove();

        introWindow.appendChild(dialogue);
        introWindow.appendChild(closeIntro);

        document.body.appendChild(introWindow);
    },
};
