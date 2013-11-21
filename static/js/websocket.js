var dataSocket = new WebSocket("ws:127.0.0.1:8000/echo");

dataSocket.onopen = function(){
	console.log("websocket open!");
}

dataSocket.onmessage =  function(e){
	console.log(e.data);
	// dataSocket.send("SHUTUP SERVER");
}
function sendData(data){
	dataSocket.send(data);
}

dataSocket.onclose = function(){
	console.log('closed');
}