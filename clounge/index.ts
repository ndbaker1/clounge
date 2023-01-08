export type Vector2D = {
  x: number;
  y: number;
};

export type ConnectedPeerData = {
  connection: {
    send: (data: any) => void;
    close: () => void;
  };
};

export type PeerID = string;

export type RoomData<
  PeerExtension = {},
  BaseExtension = {},
  ObjectExtension = {}
> = BaseExtension & {
  peers: Record<PeerID, ConnectedPeerData & PeerExtension>;
  self: { id: PeerID; connect: (peerId: PeerID) => void } & PeerExtension;
  objects: Record<number, ObjectExtension>;
};

/**
 * Custom handlers for a room
 */
export type RoomPlugin<
  State = any,
  PeerExtension = {},
  BaseExtension = {},
  ObjectExtension = {}
> = {
  state?: State;
  selfSetup?(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>
  ): void;
  peerSetup?(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
    peerId: PeerID
  ): void;
  processData?(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
    data: any,
    peerId: PeerID
  ): void;
  handlePeerDisconnect?(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
    peerId: PeerID
  ): void;
};
