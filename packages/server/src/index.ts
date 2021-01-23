import express from 'express'
import morgan from 'morgan'
import expressWS from 'express-ws'

const app = express()

const port = process.env.PORT || 4000

expressWS(app)

app.use(morgan('dev'))


const activeRooms = {

}

app.ws('/bridge', (socket) => {
	socket.on('message', (msg) => {
		const data = JSON.parse(msg)
		console.log(data)
		switch(data.type){
			case 'listenRooms':
				
				data.rooms.forEach(room => {
					if(!activeRooms[room]){
						activeRooms[room] = {
							sockets: []
						}
					}
					activeRooms[room].sockets.push(socket)
				})

				break;
				
			case 'message':
				activeRooms[data.room].sockets.forEach(socket => {
					console.log(data.cid)
					socket.send(JSON.stringify({
						room: data.room,
						type: 'message',
						cid: data.cid
					}))
				})
				activeRooms[data.room]
				break;
		}
	})
	
	socket.on('close', () => {
		Object.keys(activeRooms).forEach((roomName, i) => {
			const room = activeRooms[roomName]
			room.sockets.forEach(ws => {
				if(ws == socket){
					room.sockets.splice(i, 1)
				}
			})
		})
	})
})

app.listen(port,{
	host: '0.0.0.0'
} , () => {
	console.log('listening on port 4000')
})
