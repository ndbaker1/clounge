import type { Message, PeerID, RoomPlugin, Vector2D } from "types";

import type { SyncMessage, NamePeerExtension } from "./names";
import type { ViewportAnchorRoomExtension } from "./viewportAnchor";

import namePlugin from "./names";
import viewportAnchorPlugin from "./viewportAnchor";
import infoWindow from "./infoWindow";

export type MouseMessage =
    | Message<"mouse_position", {
        position: Vector2D;
    }>
    | Message<"mouse_press", {
        pressed: boolean;
    }>;

type CursorElements = {
    cursorElement: HTMLElement;
    cursorImage: HTMLImageElement;
    nameElement: HTMLParagraphElement;
};

export type CursorPeerExtension = CursorElements & {
    /**
     * The Cursor Position relaive to the window.
     */
    cursorScreen: Vector2D;
    /**
     * The Cursor Position relative to the (infinite) board space.
     */
    cursorWorld: Vector2D;
    mousePressed: boolean;
} & NamePeerExtension;

export type CursorRoomExtension = {
    cursorPlugin: {
        cursorContainer: HTMLElement;
        createCursor: () => CursorElements;
        moveCursor: (pos: Vector2D, id: PeerID) => void;
    };
};

const dragImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAA2CAYAAABumXGkAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAABLVJREFUeJztmk1oVFcUx48dE41t05gWtR+2af2C1tKhpSBSy7TY2ipi2goi+BHRUopIUmo/pJuAutFi0kIXhVbS+gEWleDGjZCBShE3iYquIy5clJosXFg34/8/957JzZ15781k3puZQA78SGbmzbvnf8+55368EaneZlmmlanTPSALxixZ+17Di6Jzb4JrIBfANXvNYzIhqCFE0Qk6tRCMS7AAhdf8CUbsa/4dAO9JHUVRQBO4qI62tbXl+vr6cmNjY3n4P9+TaIE/g3apsRA2lgIvu84MDQ3lfON7ZYggf4PZMjnlEjU21Ay2qxOZTKZIgBo/4zXd3d254eHh/Hv8y9eekBtSnG6fJCFKo/AkOK4O9Pb2BorgZ/39/SU/4/sSHaULElO6aW98Cv4Q02uFhsJEDA4OBn5GS6fTU0m3KQlgT1wIaiRMxPj4eKiInp6ectPttkxOtVfKFTTL9sD1sJ4KExFlVaQby/buqOho/h9xv6w9xsbjEBFDuq0LEqICWt0vuD0WlwjOKWHGdGOFc1NNK57lDphbSohOZlv1YvaIa3GJiLKBgYEioXzd0dHhCvnMpn1BhEbhcdCnF7JH6iEiqDB0dXW5Io6CeW40dDA/A04GOVorEUHmtg9OgKfdaGgqvQjOTBMRZ6y/Tdb/wrJiCTg7TUSctf42uyLmgGXg3DQRcc76WyRieZgIljoutYmWvzqLWG79Ll9EvW1GRKPYjIhGsRkRjWIzIhrFOjs7XRHHwkQc1AvDjmXqYd6O7zsxa6ciETwc2+VcmBsdHa2373mjH45fD8ScwiwWb+3EF8+CTTJxoJXfiDSCcbfniLgFPhaz/5kkguvyNpABh91oZLPZemvw99inwbtizgMK+wnd2XF7+rpNqSv6Ja5ao86SkrSRkRFXwP9gD0iL2Z4Wdna6x+YJwnNijkQOgP/0y/6hQS3N21tfBZvBS9bflDiHBToueOa6EmwTc+r2sJ7jwxvQOZvqfMbR7o4HNU0pqlsA3gH7wCX3JrWeO7wo3AQ7wWs2lZqkxAGaDnBe0AHWgx/EO0xmpaiFeWOB/Ag+silflEpuNPgB54ynrOIt4JBMHO7mYQNJm1eRWFZ5Dpu2KV+USn40NK1Yh98CXeAncE9qVLFKjAVGYQN4HrSId/pXKhpuWi0Cq8GXYh6yFAZ6khXLGwtuFFqjouAKSdmLOXe8IKYifAXOuz0UdERfjTHCXhR+ryQKpYRwfDAH+YCDUz3nj38kwbTylhj/gs/FPBd3o1D20yMtuzrQV4hZePWCu9pQ1POGSs3bN2TFrOcWVxoF19yBzgnmDbADXJbJIU+K38TMWfNlYtldsQh/oPMXBRnwS41EfC0Rk1ulQpiPT4BXxTzTzoL7CTnPcv6XmPTl6Xfg5FapEE0rzpgfgG/Br2KeFZyKEf4mhJHmsmeNePuGak3TilWCId4I9oJvwPdiKle18D77wRfgQzFbZpb5KQ3oUuaWXQ7ypWAVWGsbXBcDvM/74G0xZZ0btWaJIZVc02pFIeyhVttQe0zMt/fj3DTPthNbFNR0kPPGzbaRFttgXLTY+zJ1U1LFTyOihKiYlGV2jOg9E3E+TFASlG2PAK07WHZZ4B/sAAAAAElFTkSuQmCC";
const pointImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAABKCAYAAAASebweAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAABUBJREFUeJztW1toHFUY/rpp0zRq3bZivVDdqq1QFRdFELywilovSNEKRbAa0QpiJcG7+BJQX1RMEHwQVOIVWlIJfemLkIUWEV+SKvY54oMPotkHBfVl/b+c82fPnt2ZyWRndiY6P3xkd3bOzPnOfznn/OcP0Luss1hTop0eE9QFixZ1ey33pNi56wSnBc0AnLb35I4IO1QSbBc0EExA0bD3lpAjMuzMBsEJ2I6Wy+XmxMREc3FxcQn8zGtoETlh25Qy67UjHMkBwU44oz07O9v0hdfQrpGqbZu5NjiSg4KDsJ2r1WodBFT4G1okHhVsRMbaUC2cLfgYtnPj4+OBJPgbWiTY5hxkrA2+eL3gfMGXiE+CbbbbZ2RGQh26IjiK+CSO2raZOrj6wy7BNOKTmLZtB5ExiY22I8cQn8Qx2zZT51YSu7F6ErtRkOhdChIoSCQnBQkUJJKTggT+YySGkOFyvFcSf6KVPPhEcBsyyIb0SqIb3hNs7SeRNEgQJ2E2SpoNSZXQqkmMjo425+bmlq7xL797RH4QzNvP/DsleCBpUrq/HopLYnJysutvvI5oLR1HQuamybL9gk8FZ9wXhZGYmZkJ/I1SrVZXY26rIsCROB70kjASjUYjlMTY2NhKze0ntJvaZSslpNmN78NGKoxElPRgbkyNPhGlHfWBt9zGOmJu1OmFRALmtjeIiBLY7DZwRywpEszbhgnNjVlE19S8rOLPMMGmg4jmlx7WmzkiriRFIkqmpqY6iPJ7pVJxieyHl5BTLZwlmNAbOSJZkAgKDCMjIy6JtwXDrjbUmc8TfB7U0X6RCBJvJfCZYJurDTWlSwRH1giJI7a/y+lRTVVejpBUZc5ITNv+DrokIlOVOSOh6dEOEqHroxySaNsx/n9IcNLhwSKhE9GaI5G1FCTyIgWJvEhBIi/i7SneDSPxut4YVvqQhXg7vpdh1k4dJFiA8rhzY3NhYSHrvi8J++H06y/Bg4Id8NZO/HKhYB9aCa2ljUgehLs9hwTTR/fA7H/aSHBdXhbUBG+62qjX61lz8E2J9SK3wuQDlvcTurPj9vQaa1LfaiOulaJySWnK/Py8S+BvwZMwdVTDcHZ2brryIpiUyKuC37SxnzTop3h76+8EDwkuRZczD/UL1iZdLXgEJuv2T5b+4Tl005o6zzi2okvRi5oU2bG26WbBs4Kv3Yf0e+7wtPCj4DHBVdaUNqBLAk0dnDdUBPcKXoNJwS8/jJGiH+L5AvGO4G5r8oHHZ+obnDPOtYwPCN4Q/OI+kC9IW7wZmmGVediqNfnQ+qmSY1aMw9fDRCseUf2OPkWsLr5ALdwnuFiwCRHleHouoWZ1geAmwdMwRYnLjp5mxPJ8wdXC5igt+GbFmzl3cHpnRHhO8JU7QkEp+l6EGva08FEcLXQjQv+gDfKAg47O+eMbpGhW3hLjV8EhmNpzVwsrPj3SsKuOfiXMwmscjqNHnTfEFW/fUIdZz+2IqwVXXEfnBHMtTNXxKbSrPC18CDNnbUFr2R2bhO/oLNStCd7vAwEuuZ9HxOQWlwjtkeXWe2DqxuuCP1IiwHDOzDfPtZn9TqQ2xF2WcMa8U/CS4AOYs4IvEgSPnKnpw4JbYM4hEisOVrNilKCK7xc8I3hR8ApM5OoVfM4LgqcEd8FkvhnmE6s1d8MunfwKwY2CO+wL9yYAPud2wQ0wYZ1RcRAJlxlptCIRjhC1UrakksAW+zzOTcOWQOIV/+rk6+0LSGaTfWFSGLLPpekOIKX/S9IqmJJ9yYAllRT0mX37p6p1KWLF8i+2/PZgRaGmlAAAAABJRU5ErkJggg==";

let mouseCoordinateElement: HTMLElement;

export default <RoomPlugin<CursorPeerExtension, CursorRoomExtension & ViewportAnchorRoomExtension>>{
    name: "peerCursors",
    dependencies: [viewportAnchorPlugin.name, namePlugin.name, infoWindow.name],
    processMessage(room, data: MouseMessage | SyncMessage, peerId) {
        if (data?.type === "identification") {
            room.peers[peerId].nameElement.innerHTML = data.name;
        } else if (data?.type === "mouse_position") {
            room.cursorPlugin.moveCursor(data.position, peerId);
        } else if (data?.type === "mouse_press") {
            room.peers[peerId].mousePressed = data.pressed;
            room.peers[peerId].cursorImage.src = data.pressed ? dragImage : pointImage;
        }
    },
    initialize(room) {
        const cursorContainer = document.createElement("div");
        cursorContainer.style.position = "relative";
        cursorContainer.style.zIndex = String(9999);
        room.viewportAnchorPlugin.elementRef.appendChild(cursorContainer);

        mouseCoordinateElement = document.createElement("p");
        room.infoWindowPlugin.element.prepend(mouseCoordinateElement);

        // ROOM DATA INITIALIZED
        room.cursorPlugin = {
            cursorContainer,
            createCursor: () => {
                const cursorElement = document.createElement("div");
                const cursorImage = document.createElement("img");
                const nameElement = document.createElement("p");

                cursorElement.className = "cursor";
                cursorElement.style.left = cursorImage.style.top = "-99px";
                cursorImage.src = pointImage;
                cursorImage.width = 16;

                cursorElement.appendChild(cursorImage);
                cursorElement.appendChild(nameElement);

                room.cursorPlugin.cursorContainer?.appendChild(cursorElement);

                return {
                    cursorElement,
                    cursorImage,
                    nameElement,
                };
            },
            moveCursor: ({ x, y }, id) => {
                const isSelf = room.self.id === id;
                const ref = isSelf ? room.self : room.peers[id];

                ref.cursorWorld = {
                    x: x - (isSelf ? room.viewportAnchorPlugin.position.x : 0),
                    y: y - (isSelf ? room.viewportAnchorPlugin.position.y : 0),
                };
                if (isSelf) {
                    ref.cursorScreen = { x, y };
                }

                ref.cursorElement.style.left = ref.cursorWorld.x + "px";
                ref.cursorElement.style.top = ref.cursorWorld.y + "px";

                if (isSelf) {
                    const message: MouseMessage = {
                        type: "mouse_position",
                        position: room.self.cursorWorld,
                    };
                    for (const id in room.peers) {
                        room.peers[id].connection.send(message);
                    }
                }
            },
        };

        room.self.cursorWorld = { x: 0, y: 0 };
        room.self.cursorScreen = { x: 0, y: 0 };
        room.self.mousePressed = false;

        const cursorData = room.cursorPlugin.createCursor();
        cursorData.nameElement.innerHTML = "me";
        cursorData.nameElement.style.color = "#F2A07B";
        room.self = { ...room.self, ...cursorData };

        // hacky way to remove the cursor in all cases
        const cursorStyle = document.createElement("style");
        cursorStyle.innerHTML = `
            * { cursor: none; }

            .cursor {
                display: flex;
                flex-direction: row;
                position: absolute;
                user-select: none;
                pointer-events: none;

                margin-left: -12px;
                margin-top: -8px;

                align-items: center;
                z-index: 99;
            } .cursor > p {
                margin: 0;
            }
        `;
        document.head.appendChild(cursorStyle);

        window.addEventListener("mousemove", ({ clientX, clientY }) => {
            room.cursorPlugin.moveCursor({ x: clientX, y: clientY }, room.self.id);
            mouseCoordinateElement.textContent = `Mouse Coords: (${room.self.cursorWorld.x}, ${room.self.cursorWorld.y})`;
        });

        window.addEventListener("mousedown", () => {
            room.self.cursorImage.src = dragImage;

            const message: MouseMessage = { type: "mouse_press", pressed: true };
            for (const id in room.peers) {
                room.peers[id].connection.send<MouseMessage>(message);
            }
        });

        window.addEventListener("mouseup", () => {
            room.self.cursorImage.src = pointImage;

            const message: MouseMessage = { type: "mouse_press", pressed: false };
            for (const id in room.peers) {
                room.peers[id].connection.send<MouseMessage>(message);
            }
        });
    },
    peerSetup(room, peerId) {
        room.peers[peerId].cursorWorld = { x: 0, y: 0 };
        room.peers[peerId].mousePressed = false;

        const cursorData = room.cursorPlugin.createCursor();
        room.peers[peerId] = { ...room.peers[peerId], ...cursorData };

        room.cursorPlugin.moveCursor(room.self.cursorScreen, room.self.id);
    },
    handlePeerDisconnect(room, peerId) {
        room.peers[peerId].cursorElement.remove();
    },
    cleanup(room) {
        room.cursorPlugin.cursorContainer.remove();
        mouseCoordinateElement?.remove();
    },
};
