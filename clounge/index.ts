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
 * Custom Plugin Definition
 */
export type RoomPlugin<
  PeerExtension = {},
  BaseExtension = {},
  ObjectExtension = {}
> = {
  /**
   * Name used to identify the plugin
   */
  name: string;
  /**
   * Optional list of plugin dependencies
   */
  dependencies?: string[];
  /**
   * Initialization for the plugin
   */
  load?(): void;
  /**
   * Cleanup procedure for the plugin
   */
  unload?(): void;
  /**
   * Setup for self upon connecting
   * @param room RoomData reference
   */
  selfSetup?(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>
  ): void;
  /**
   * Setup for peers when connecting to self
   * @param room RoomData reference
   * @param peerId ID of the connecting peer
   */
  peerSetup?(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
    peerId: PeerID
  ): void;
  /**
   * Handler for incoming messages from peers
   * @param room RoomData reference
   * @param data peer message
   * @param peerId ID of the peer which the data comes from
   */
  processMessage?<T = any>(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
    data: T,
    peerId: PeerID
  ): void;
  /**
   * Handler for when a peer has disconnected
   * @param room RoomData reference
   * @param peerId ID the peer
   */
  handlePeerDisconnect?(
    room: RoomData<PeerExtension, BaseExtension, ObjectExtension>,
    peerId: PeerID
  ): void;
};
