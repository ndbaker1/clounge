import type { RoomPlugin } from "types";

export default <RoomPlugin<object>>{
    name: "helpWindow",
    initialize() {
        // Add a help window for people opening the app for the first time
        const helpButton = document.createElement("button");
        helpButton.style.position = "fixed";
        helpButton.style.margin = "0.5rem";
        helpButton.style.right = helpButton.style.bottom = "0";
        helpButton.textContent = "click here if it's your first time!";
        helpButton.onclick = () => {
            const helpWindow = document.createElement("div");
            helpWindow.style.position = "fixed";
            helpWindow.style.left = "50%";
            helpWindow.style.top = "5rem";
            helpWindow.style.transform = "translate(-50%)";
            helpWindow.style.display = "grid";
            helpWindow.style.gap = "1rem";

            const dialogue = document.createElement("small");
            dialogue.innerHTML = `
                Welcome to 🧂 <u>tablesalt</u>, a peer-to-peer tabletop.

                <br/> <br/>

                The first thing you'll probably want to do is share your room with others.  
                Click the "Share Lobby" button in the top-right and then send the link to your friends!
                Don't forget to set a name for yourself in the top-left, which is what others will see next to your cursor.

                <br/> <br/>

                In order to load objects into the room, press the "Load Objects" button in the top-right.
                It will prompt you for a descriptor JSON, which is going to be an array of objects with required and optional properties.
                It may help to visit the
                <a
                    href="https://github.com/ndbaker1/tablesalt/blob/main/plugins/base/objectLoader.ts#L10"
                    target="_blank noreferrer"
                >JSON example</a>
                in the app's source code for reference.

                <br/> <br/>

                Once objects are loaded into the room you can drag them around and right-click to perform additional actions.
                There are some default controls and shortcuts built-in already, such as:

                <ul>
                    <li>middle-click and drag to pan around</li>
                    <li>hover an object and press "f" to flip it over</li>
                    <li>hover an object and press "space" to view a close-up of it</li>
                    <li>hover over objects and press "ctrl" + left-click to open up the preview menu</li>
                    <li>hold shift and drag to move every object under the cursor</li>
                </ul>

                Lots of things may change as it's still very much a work in progress,
                so don't be surprised by the amount of bugs and bad UI design choices :)

                <br/> <br/>

                Regardless, thanks for trying out tablesalt!
            `;

            const exitHelp = document.createElement("button");
            exitHelp.textContent = "close for now";
            exitHelp.onclick = () => helpWindow.remove();

            const removeHelp = document.createElement("button");
            removeHelp.textContent = "close and dont show again";
            removeHelp.onclick = () => {
                helpWindow.remove();
                helpButton.remove();
            };

            helpWindow.appendChild(dialogue);
            helpWindow.appendChild(exitHelp);
            helpWindow.appendChild(removeHelp);

            document.body.appendChild(helpWindow);
        };

        document.body.appendChild(helpButton);
    },
};
