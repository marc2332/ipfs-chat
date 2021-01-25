import * as IPFS from 'ipfs-core'
import EventEmitter from 'events'
import WebSocket from 'ws'

interface ClientInterface {
	sendMessage: (message: string, options: SendMessageOptions) => Promise<MessageSentResult>
}

interface DatabaseInterface {
	logMessage: (message: string) => void
}

interface ClientOptions {
	server: string
	username: string
	userkey: string
	rooms: string[]
	database: DatabaseInterface
}

type MessageSentResult = void

interface SendMessageOptions {
	room: string
}


export class Client implements ClientInterface {
	private ipfsNode: any
	public events: EventEmitter = new EventEmitter()
	private websocket;
	private username: string;
	private server: string;
	private userkey: string;
	private rooms: string[];
	private database: DatabaseInterface;
	constructor({ server, username, userkey, rooms, database }: ClientOptions){
		this.server = server
		this.username = username
		this.userkey = userkey
		this.rooms = rooms
		this.database = database
		
		this.events.on('message', (message) => {
			this.database.logMessage(message)
		})
		
	}
	/*
	 * Connect the client to the WebSocket server
	 */
	public connect(portsIncrement = 0): Promise<void> {
		return new Promise(async (resolve, reject) => {

			this.ipfsNode = await IPFS.create({
				repo: `cache/${this.username}`,
				//@ts-ignore
				config:{
					"Addresses": {
						"API": `/ip4/127.0.0.1/tcp/${5002+portsIncrement}`,
						"Gateway": `/ip4/127.0.0.1/tcp/${8081+portsIncrement}`,
						"Swarm": [
							`/ip4/0.0.0.0/tcp/${4002+portsIncrement}`,
							`/ip6/::/tcp/${4002+portsIncrement}`
						]
					}
				}
			})

			this.websocket = new WebSocket(`${this.server}/bridge`)

			this.websocket.on('message', async (message: string) => {
				const data = JSON.parse(message)
				
				switch(data.type){
					case 'message':
						let messageContent = ''
						for await (const chunk of this.ipfsNode.cat(data.cid)) {
							messageContent += chunk
						}
						this.events.emit('message', {
							cid: data.cid,
							...JSON.parse(messageContent)
						})
						break;
				}
				
			})
			
			this.websocket.on('open', () => {
				this.websocket.send(JSON.stringify({
					type: 'listenRooms',
					rooms: this.rooms
				}))
				resolve()
			})
			
		})
	}
	/*
	 *  Send message into a room
	 */
	public sendMessage(message: string, options: SendMessageOptions): Promise<MessageSentResult> {
		return new Promise(async (resolve, reject) => {
			const { cid, timestamp } = await this.ipfsNode.add(JSON.stringify({
				room: options.room,
				username: this.username,
				message
			}))
			
			this.websocket.send(JSON.stringify({
				room: options.room,
				type: 'message',
				cid: cid.toString()
			}))
			
			resolve()
		})
	}
}
