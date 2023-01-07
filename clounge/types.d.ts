export type Vector2D = {
  x: number;
  y: number;
};

export type ObjectData = Vector2D;

export type ConnectedPeerData = {
  connection: {
    send: (data: any) => void;
  };
};

type PeerID = string;

export type RoomData<
  PeerExtension = {},
  BaseExtension = {},
  ObjectExtension extends ObjectData = ObjectData
> = BaseExtension & {
  peers: Record<PeerID, ConnectedPeerData & PeerExtension>;
  self: { id: PeerID, connect: (peerId: PeerID) => void } & PeerExtension;
  objects: Record<number, ObjectExtension>;
};

/**
 * Custom handlers for a room
 */
export type RoomPlugin<
  State = any,
  A = {},
  B = {},
  C extends ObjectData = ObjectData
> = {
  state?: State;
  selfSetup?(room: RoomData<A, B, C>): void;
  peerSetup?(room: RoomData<A, B, C>, peerId: PeerID): void;
  processData?(room: RoomData<A, B, C>, data: any, peerId: PeerID): void;
  render?(room: RoomData<A, B, C>): void;
};
