// Setup basic express server
var express = require('express');
var app = express();
var path = require('path')
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
	console.log('Server listening at port %d', port);
});

// Routing

app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', (socket) => {
	var addedUser = false;

	// when the client emits 'new message', this listens and executes
	socket.on('new message', (data) => {
		// we tell the client to execute 'new message'
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', (username) => {
		if(addedUser) return;

		// we store the username in the socket session for this client
		socket.username = username;
		++numUsers;
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers
		});

		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
		});
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', () => {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	// when the client emits 'stop typing' we broadcast it to others
	socket.on('stop typing', () => {
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});

	// when the user disconnects do this
	socket.on('disconnect', () => {
		if(addedUser) {
			--numUsers;

			// echo globally that user has left the chat
			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
});

// app.get('/', function(req, res){
// 	res.sendFile(__dirname + '/index.html');
// });

// io.on('connection', function(socket){
// 	console.log('a user connected');
// 	socket.on('disconnect', function(){
// 		console.log('user disconnected');
// 	});
// 	socket.on('chat message', function(msg){
// 		console.log('message: ' + msg);
// 		io.emit('chat message', msg);
// 	});
// });

// http.listen(3000, function(){
// 	console.log('listening on *:3000');
// });