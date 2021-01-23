const { Client } = require('../dist/main')

const instance = new Client({
	server: 'ws://localhost:4000',
	username: `SomeUser`,
	userkey: '1234',
	rooms: [
		'ExperimentalRoom'
	]
})

instance.connect().then(() => {
	
	console.log('Client connected!')
	
	instance.events.on('message',({ room, username, message }) => {
		console.log(`${username}@${room}: ${message}`)
	})
	
	setInterval(() => {
		instance.sendMessage(`Hello World!${Math.random()}`,{
			room: 'ExperimentalRoom'
		})
	}, 2500)
	
})

