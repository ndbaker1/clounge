import { RoomPlugin } from "types";

type IncomingDataType =
  | {
      type: "type1";
    }
  | {
      type: "type2";
    };

export type PluginState = {
  etc: any;
};
export type RoomExtension = {};

export default function plugin(): RoomPlugin<PluginState, RoomExtension> {
  return {
    state: {
      etc: null,
    },
    processData(room, data: IncomingDataType, peerId) {
      if (data?.type === "type1") {
        /// TODO
      } else if (data?.type === "type2") {
        /// TODO
      }
    },
    peerSetup(room, peerId) {
      /// TODO
    },
    render(room) {
      /// TODO
    },
  };
}
