//requiring libraries
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io =require('socket.io')(http);
//static hosting using express
app.use(express.static('public'));

//signaling handlers
io.on('connection', function (socket) {
     console.log('a user connected');
    //when client emits create or join  
    socket.on('create or join', function (room){ 
        console.log('create or join to room', room);
        //count number of users on room
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 }; 
        var numClients = myRoom.length; 
        console.log(room, 'has', numClients, 'clients');
        if (numClients == 0) {//no users on the room
            socket.join(room);
            socket.emit('created', room);
        }else if (numClients == 1) {//one user on the room
            socket.join(room);  
            socket.emit('joined', room);
        } else {    //room is full
            socket.emit('full', room);
        }
    });
//relay only handlers
    socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });
    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });
    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer', event.sdp);
    });
    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer', event.sdp);
    });
});
// listener
http.listen(3000, function () {
    console.log('listening on *:3000');
});



/* Here is the explanation for the code above:
1. The server is using socket.io to listen for connections on port 3000.
2. When a new connection is made, the server will log a message to the console.
3. When a connection is made, the server will listen for messages from the client containing the text create or join.
4. When the server receives a message with the text create or join, it will check if there are any other clients in the room. It will do this by checking the number of clients in the room. If there are no other clients in the room, the server will add the client to the room and emit a message with the text created back to the client. If there is already a client in the room, the server will add the client to the room and emit a message with the text joined back to the client.
5. When the server receives a message with the text ready, it will broadcast a message with the text ready to all other clients in the room.
6. When the server receives a message with the text candidate, it will broadcast a message with the text candidate to all other clients in the room.
7. When the server receives a message with the text offer, it will broadcast a message with the text offer to all other clients in the room.
8. When the server receives a message with the text answer, it will broadcast a message with the text answer to all other clients in the room. */