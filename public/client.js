// here we get a reference to the webpage elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber"); 
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localvideo");
var remoteVideo = document.getElementById("remoteVideo");
// these are the global variables
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
//these are the STUN servers
var iceServers={
    'iceServers':[
        {'url': 'stun:stun.services.mozilla.com'},
        {'url': 'stun:stun.l.google.com:19302'}
    ]
}
var streamConstraints = { audio: true, video: true }; 
var isCaller;



//Here we connect to the socket.io server.
var socket=io();

//Here we add a click event to the button

btnGoRoom.onclick = function(){
    if(inputRoomNumber.value ===''){
        alert("Please type a room number")
    }else{
        roomNumber = inputRoomNumber.value; //we take the value from the element
        socket.emit('create or join', roomNumber);// we send a message to server
        divSelectRoom.style = "display: none;";//hide selectRoom div
        divSelectRoom.style = "display: block;";//show consultingRoom div
    }
}


// when server emits created
socket.on('created', function (room) {
        //caller gets user media devices with defined constraints
        navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) { 
            localStream = stream; //sets local stream to variable
            localVideo.src = URL.createObjectURL(stream); //shows stream to user
            isCaller = true; //sets current user as caller
        }).catch(function (err) {
            console.log('An error ocurred when accessing media devices');
        });
});

//when server emits joined
socket.on("joined", function (room) {
//callee gets user media devices
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) { 
        localStream = stream; //sets local stream to variable
        localVideo.src = URL.createObjectURL(stream); //shows stream to user 
        socket.emit('ready', roomNumber); //sends message to server
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices');
    });
});



//when server emits ready 
socket.on('ready', function () { 
    if (isCaller) {
//creates an RTCPeerConnection object
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        //adds event listeners to the newly created object 
        rtcPeerConnection.onicecandidate = onlceCandidate; 
        rtcPeerConnection.onaddstream = onAddStream;
        //adds the current local stream to the object 
        rtcPeerConnection.addStream(localStream);
        //prepares an Offer
        rtcPeerConnection.createOffer(setLocalAndOffer, function(e){console.log(e)});
    }
});
//when servers emits offer
socket.on('offer', function(event){
    if(!isCaller){
        //creates an RTCPeerConnection object
        rtcPeerConnection = new RTCPeerConnection(iceServers);

        //adds event listeners to the newly created object
        rtcPeerConnection.onicecandidate = onlceCandidate;
        rtcPeerConnection.onaddstream = onAddStream;

        //adds the current local stream to the object
        rtcPeerConnection.addStream(localStream);

        //stores the offer as remote description
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        
        //prepares an answer
        rtcPeerConnection.createAnswer(setLocalAndOffer, function(e){console.log(e)});


    }
});
//when server emits answer
socket.on('answer', function (event){ 
    //stores it as remote description
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

//when server emits candidate
socket.on('candidate', function (event) { 
    //creates a candidate object
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label, 
        candidate: event.candidate
    });
    //stores candidate
    rtcPeerConnection.addIceCandidate(candidate);
});










// when a user receives the other user's video and audio stream 
function onAddStream(event) {
    remoteVideo.src = URL.createObjectURL(event.stream); 
    remoteStream = event.stream;
}

//These are the functions referenced before as listeners for the peer connection 
//sends a candidate message to server
function onlceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate'); 
        socket.emit('candidate', { 
            type: 'candidate',
            label: event.candidate.sdpMLineIndex, 
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}
//stores offer and sends message to server
function setLocalAndOffer(sessionDescription) {
    rtcPeerConnection.setLocalDescription(sessionDescription);
    socket.emit('offer', {
        type: 'offer',
        sdp: sessionDescription,
        room: roomNumber
    });
}
//stores answer and sends message to server 
function setLocalAndAnswer(sessionDescription) { 
    rtcPeerConnection.setLocalDescription(sessionDescription);
    socket.emit('answer', {
        type: 'answer',
        sdp: sessionDescription, 
        room: roomNumber
    });
}