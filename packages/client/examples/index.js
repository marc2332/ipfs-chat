const { Client } = require('../dist/main')
const { LocalStorage } = require('node-localstorage')

const storage = new LocalStorage('./chat_cache')

if(!storage.getItem('rooms')){
	storage.setItem('rooms', JSON.stringify({
		
	}))
}

const rooms = [
	'ExperimentalRoom'
];

(async () => {
	const history = JSON.parse(storage.getItem('rooms'))
	rooms.forEach(room => {
		const roomHistory = history[room]
		if(!roomHistory) return
		roomHistory.messages.forEach(({ username, message }) => {
			console.log(`${username}@${room}: ${message}`)
		})
	})
})()

const instance = new Client({
	server: 'ws://localhost:4000',
	username: `SomeUser`,
	userkey: '1234',
	rooms,
	database: {
		logMessage({ room, username, message }){
			const current = JSON.parse(storage.getItem('rooms'))
			if(!current[room])  current[room] = {
				messages: []
			}
			
			current[room].messages.push({
				username,
				message
			})
			
			storage.setItem('rooms', JSON.stringify(current))
		}
	}
})

instance.connect().then(() => {
	
	console.log(' <- Client connected ->')
	
	instance.events.on('message',({ room, username, message }) => {
		console.log(`${username}@${room}: ${message}`)
	})
	
	setInterval(() => {
		instance.sendMessage(`Hello World!${Math.random()}`,{
			room: 'ExperimentalRoom'
		})
	}, 750)
	
})

