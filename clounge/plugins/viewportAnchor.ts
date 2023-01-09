import type { RoomPlugin, Vector2D } from "index";
import infoWindowPlugin, { InfoWindow } from "./infoWindow";

export class Anchor {
  static element?: HTMLElement;
  private static position: Vector2D = { x: 0, y: 0 };

  static setPosition(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;
    if (this.element) {
      this.element.style.left = x + "px";
      this.element.style.top = y + "px";
    }
  }

  static move(x: number, y: number) {
    this.setPosition(this.position.x + x, this.position.y + y);
  }

  static getPosition(): Vector2D {
    return this.position;
  }
}

const state = {
  mousepressed: false,
  oldPosition: { x: 0, y: 0 },
  infoElement: <HTMLElement | null>null,
};

export default <RoomPlugin>{
  name: "viewportAnchor",
  dependencies: [infoWindowPlugin.name],
  load() {
    Anchor.element = document.createElement("div");
    Anchor.element.style.position = "fixed";
    Anchor.element.style.zIndex = String(99999);
    Anchor.setPosition(0, 0);
    document.body.appendChild(Anchor.element);

    if (InfoWindow.element) {
      state.infoElement = document.createElement('small');
      InfoWindow.element.appendChild(state.infoElement);
    }
  },
  unload() {
    Anchor.element?.remove();
    state.infoElement?.remove();
  },
  selfSetup() {
    window.addEventListener("mousedown", ({ button }) => {
      if (button === 1) state.mousepressed = true;
    });
    window.addEventListener("mouseup", ({ button }) => {
      if (button === 1) state.mousepressed = false;
    });
    window.addEventListener("mousemove", ({ clientX, clientY }) => {
      if (state.mousepressed) {
        const delta: Vector2D = {
          x: clientX - state.oldPosition.x,
          y: clientY - state.oldPosition.y,
        };

        Anchor.move(delta.x, delta.y);
      }

      state.oldPosition.x = clientX;
      state.oldPosition.y = clientY;

      if (state.infoElement) {
        const currentAnchorPosition = Anchor.getPosition();
        state.infoElement.textContent = `Viewport: (${-currentAnchorPosition.x}, ${-currentAnchorPosition.y})`;
      }
    });
  },
};
