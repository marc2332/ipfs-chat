import express from 'express'
import morgan from 'morgan'
import expressWS from 'express-ws'

const app = express()

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
})

app.listen(4000,{
	host: '0.0.0.0'
} , () => {
	console.log('listening on port 4000')
})
