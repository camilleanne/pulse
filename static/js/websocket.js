// A wrapper for a websocket attached to a single URL.
//
//     var options = {
//       url: "ws:127.0.0.1:8000/echo"
//     };
//
//     var ds = new DataSocket();
//     ds.sendData("foo":"bar")
//
var DataSocket = function (options) {

  // A "private" placeholder for the actual socket
  var dataSocket;

  if (!(options && options.url)) {
    throw new Error('Please specify a socket URL!');
  }

  dataSocket = new WebSocket(options.url);

  dataSocket.onopen = function(){
    console.log("websocket open!");
  }

  dataSocket.onmessage =  function(e){
    var data = JSON.parse(e.data);

    if (data.id === "ICA"){

      camera.cardiac(data.array, data.bufferWindow);
    }

  }

  dataSocket.onclose = function(){
    console.log('closed');
  }

  // We can expose "public" methods by adding them to the object.
  this.sendData = function sendData(data){
    dataSocket.send(data);
  };
};

