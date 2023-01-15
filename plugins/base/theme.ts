import type { RoomPlugin } from "types";

// https://colorhunt.co/palette/4b5d67322f3d59405c87556f

let styleElement: HTMLStyleElement;

export default <RoomPlugin>{
    name: "theme",
    initialize() {
        styleElement = document.createElement("style");
        styleElement.innerHTML = `
        * {
          color: white;
        }

        body {
          background-color: #322F3D;
          color: white;
        }

        button {
          margin-bottom: 3px;
          border-width: 0;
          border-radius: 8px;
          box-shadow: black 1px 4px;
          background-color: #59405C;
          transition: ease 100ms;
        } button:hover {
          background-color: #805060;
        } button:active {
          margin-top: 3px;
          margin-bottom: 0;
          box-shadow: black 1px 1px;
          background-color: #87556F;
        }

        input {
          border-radius: 4px;
          background: #59405C;
        } input:focus {
          outline: 1px solid #87556F;
        }
      `;

        document.head.appendChild(styleElement);
    },
    cleanup() {
        styleElement.remove();
    },
};
