import express from 'express'
import morgan from 'morgan'
import expressWS from 'express-ws'


const app = express()

const port = process.env.PORT || 4000

expressWS(app)

app.use(morgan('dev'))

const activeRooms = {}

class Connection {
	socket: any;
	constructor(socket){
		this.socket = socket
		
		this.socket.on('message', (incomingMessage: string) => {
			const messageObject = JSON.parse(incomingMessage)
			
			switch(messageObject.type){
				/*
				 * Listen for messages in a specific room
				 */
				case 'listenRooms':

					messageObject.rooms.forEach(room => {
						if(!activeRooms[room]){
							activeRooms[room] = {
								sockets: []
							}
						}
						activeRooms[room].sockets.push(socket)
					})

					break;
				/*
				 * Send messages to a specific room
				 */
				case 'message':
					activeRooms[messageObject.room].sockets.forEach(socket => {
						this.send(socket, {
							room: messageObject.room,
							type: 'message',
							cid: messageObject.cid
						})
					})
					break;
			}
		})

		this.socket.on('close', () => {
			this.close()
		})
		
	}
	/*
	 * Send a message to a socket 
	 */
	private send(socketDist: any, messageObj: any){
		socketDist.send(JSON.stringify(messageObj))
	}
	/*
	 * Remove socket from active users in each room it previously joined
	 */
	private close(){
		Object.keys(activeRooms).forEach((roomName, i) => {
			const room = activeRooms[roomName]
			room.sockets.forEach(ws => {
				if(ws === this.socket){
					room.sockets.splice(i, 1)
				}
			})
		})
	}
}

app.ws('/bridge', (socket) => {
	
	new Connection(socket)
	
})

app.listen(port,{
	host: '0.0.0.0'
} , () => {
	console.log(`Listening on port ${port}`)
})
