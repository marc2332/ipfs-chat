const { Client } = require('../dist/main')

const instance = new Client({
	server: 'ws://localhost:4000',
	username: 'publicname',
	userkey: '1234',
	rooms: [
		'Testingroom'
	]
})

instance.connect().then(() => {
	instance.events.on('message',({ room, username, message }) => {
		console.log(`${username} (${room}) -> ${message}`)
	})
	
	setInterval(() => {
		instance.sendMessage(`Hello World!${Math.random()}`,{
			room: 'Testingroom'
		})
	}, 5000)
	
})

