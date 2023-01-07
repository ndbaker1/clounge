import { RoomPlugin } from "types";

// https://colorhunt.co/palette/4b5d67322f3d59405c87556f
const bgColor = "#322F3D";

export default function plugin(): RoomPlugin {
  return {
    selfSetup() {
      document.body.style.backgroundColor = bgColor;
      document.body.style.color = "white";
      document.head.innerHTML += `
            <style type="text/css">
                * {
                  color: white;
                }

                button {
                  border-width: 0;
                  border-radius: 8px;
                  box-shadow: black 1px 4px;
                  background-color: #59405C;
                  transition: ease 100ms;
                } button:hover {
                  background-color: #805060;
                } button:active {
                  margin-top: 3px;
                  box-shadow: black 1px 1px;
                  background-color: #87556F;
                }

                input {
                  border-radius: 4px;
                  background: #59405C;
                } input:focus {
                  outline: 1px solid #87556F;
                }
            </style>
            `;
    },
  };
}
