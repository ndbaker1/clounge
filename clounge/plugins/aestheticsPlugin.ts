import { RoomPlugin } from "types";


// https://colorhunt.co/palette/4b5d67322f3d59405c87556f
const bgColor = '#322F3D';

export default function plugin(): RoomPlugin {
    return {
        selfSetup() {
            document.body.style.backgroundColor = bgColor;
            document.body.style.color = 'white';
        }
    };
}


