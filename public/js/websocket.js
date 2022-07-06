
/* var dataSocket = new WebSocket('ws://' + location.host + '/echo' );
dataSocket.onopen = function(){
	console.log("websocket open!");
}

dataSocket.onmessage =  function(res){
	var data = res.data;
	console.log(res.body);
	if (data.id === "ICA"){
		camera.cardiac(data.array, data.bufferWindow);
	}
	

} */
const ws = new WebSocket('ws://' + location.host + '/echo');

async function connectToServer() {
	return new Promise((resolve, reject) => {
		const timer = setInterval(() => {
			if(ws.readyState === 1) {
				clearInterval(timer)
				resolve(ws);
				console.log("websocket open!");
			}
		}, 10);
	});
}

ws.onmessage = (webSocketMessage) => {
	//console.log(JSON.parse(webSocketMessage));
	const messageBody = JSON.parse(webSocketMessage.data);
	const data = messageBody[0];
	if (data.id === "ICA"){
		camera.cardiac(data.array, data.bufferWindow);
		console.log('cardiac');
	}
};

function sendData(data){
	ws.send(data);
	//console.log(data);
}

ws.onclose = function(){
	console.log('closed');
}
