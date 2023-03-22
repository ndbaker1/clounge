import type { RoomPlugin } from "types";

export type UserEventsRoomExtension = {
    keyEventsPlugin: {
        getPressedKeys: () => Set<string>
        getPressedMouseButtons: () => Set<number>,
    }
};

const pressedKeys = new Set<string>();
const pressedMouseButtons = new Set<number>();

export default <RoomPlugin<object, UserEventsRoomExtension>>{
    name: "userEvents",
    initialize(room) {
        window.addEventListener("keydown", ({ ctrlKey, altKey, shiftKey, key }) => {
            if (ctrlKey) pressedKeys.add("ctrl");
            if (altKey) pressedKeys.add("alt");
            if (shiftKey) pressedKeys.add("shift");

            pressedKeys.add(key);
        });

        window.addEventListener("keyup", ({ ctrlKey, altKey, shiftKey, key }) => {
            if (ctrlKey) pressedKeys.delete("ctrl");
            if (altKey) pressedKeys.delete("alt");
            if (shiftKey) pressedKeys.delete("shift");

            pressedKeys.delete(key);
        });

        window.addEventListener("mousedown", ({ button }) => {
            pressedMouseButtons.add(button);
        });

        window.addEventListener("mouseup", ({ button }) => {
            pressedMouseButtons.delete(button);
        });

        room.keyEventsPlugin = {
            getPressedKeys: () => pressedKeys,
            getPressedMouseButtons: () => pressedMouseButtons,
        };
    },
};

