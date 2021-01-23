import * as IPFS from 'ipfs-core'
import EventEmitter from 'events'
import WebSocket from 'ws'

interface ClientInterface {
	sendMessage: (message: string, options: SendMessageOptions) => Promise<MessageSentResult>
}

interface ClientOptions {
	server: string,
	username: string,
	userkey: string
	rooms: string[]
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
	constructor({ server, username, userkey, rooms }: ClientOptions){
		this.server = server
		this.username = username
		this.userkey = userkey
		this.rooms = rooms
		
	}
	/*
	 * Connect the client to the WebSocket server
	 */
	public connect(): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const ports_inc = 0

			this.ipfsNode = await IPFS.create({
				repo: `cache/${this.username}`,
				//@ts-ignore
				config:{
					"Addresses": {
						"API": `/ip4/127.0.0.1/tcp/${5002+ports_inc}`,
						"Gateway": `/ip4/127.0.0.1/tcp/${8081+ports_inc}`,
						"Swarm": [
							`/ip4/0.0.0.0/tcp/${4002+ports_inc}`,
							`/ip6/::/tcp/${4002+ports_inc}`
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
						this.events.emit('message', JSON.parse(messageContent))
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
