var dataSocket = new WebSocket("ws:127.0.0.1:8000/echo");


dataSocket.onopen = function(){
	console.log("websocket open!");
}

dataSocket.onmessage =  function(e){
	var data = JSON.parse(e.data)
	if (data.id === "ICA"){
		camera.cardiac(data.two, 1024)
	}
}

function sendData(data){
	dataSocket.send(data);
}

dataSocket.onclose = function(){
	console.log('closed');
}