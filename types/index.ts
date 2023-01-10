/**
 * 2D Vector type 
 */
export type Vector2D = {
	x: number;
	y: number;
};

/**
 * Type with callbacks for Peer channel manipulation
 */
type ConnectedPeer = {
	connection: {
		send: (data: unknown) => void;
		close: () => void;
	};
};

/**
 * Self-tracking info such as Peer Relay ID and Peer channel setup callback,
 */
type ConnectedSelf = {
	id: PeerID;
	connect: (peerId: PeerID) => void;
};

/**
 * Type Alias for Peer IDs to keep things consistent
 */
export type PeerID = string;

/**
 * Generic Type representing the structure of data stored within each Client.
 */
export type RoomData<
	PeerExtension = object,
	RoomExtension = object,
	ObjectExtension = object,
> = RoomExtension & {
	/**
	 * Attributes stored about the User,
	 */
	self: ConnectedSelf & PeerExtension;
	/**
	 * Attributes stored for every Peer in the Session
	 */
	peers: Record<PeerID, ConnectedPeer & PeerExtension>;
	/**
	 * Attributes on objects shared throughout the Session
	 */
	objects: Record<number, ObjectExtension>;
};

/**
 * Custom Plugin Definition
 */
export type RoomPlugin<
	PeerExtension = object,
	RoomExtension = object,
	ObjectExtension = object,
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
	 * Cleanup procedure for the plugin
	 */
	cleanup?(room: RoomData<PeerExtension, RoomExtension, ObjectExtension>): void;
	/**
	 * Setup for self upon connecting
	 * @param room RoomData reference
	 */
	initialize?(room: RoomData<PeerExtension, RoomExtension, ObjectExtension>): void;
	/**
	 * Setup for peers when connecting to self
	 * @param room RoomData reference
	 * @param peerId ID of the connecting peer
	 */
	peerSetup?(room: RoomData<PeerExtension, RoomExtension, ObjectExtension>, peerId: PeerID): void;
	/**
	 * Handler for incoming messages from peers
	 * @param room RoomData reference
	 * @param data peer message
	 * @param peerId ID of the peer which the data comes from
	 */
	processMessage?<T = object>(
		room: RoomData<PeerExtension, RoomExtension, ObjectExtension>,
		data: T,
		peerId: PeerID,
	): void;
	/**
	 * Handler for when a peer has disconnected
	 * @param room RoomData reference
	 * @param peerId ID the peer
	 */
	handlePeerDisconnect?(
		room: RoomData<PeerExtension, RoomExtension, ObjectExtension>,
		peerId: PeerID,
	): void;
};
