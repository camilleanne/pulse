// A wrapper for a websocket attached to a single URL.
//
//     var options = {
//       url: "ws:127.0.0.1:8000/echo",
//       onmessage: function (data) {
//         console.log("Received", data);
//         if (data.id === "ICA"){
//          camera.cardiac(data.array, data.bufferWindow);
//         }
//       }
//     };
//
//     var ds = new DataSocket();
//     ds.sendData("foo":"bar")
//
var DataSocket = function (options) {

  // A "private" placeholder for the actual socket
  var dataSocket;

  if (!(options && options.url)) {
    throw new Error("Please specify a socket URL!");
  }

  dataSocket = new WebSocket(options.url);

  dataSocket.onopen = function(){
    console.log("websocket open!");
  };

  dataSocket.onmessage = function(e){
    var data;
    try {
      JSON.parse(e.data);
      if (options.onmessage) {
        option.onmessage(e.data);
      }
      else {
        console.log("Unhandled message", e.data);
      }
    } catch (e) {
      console.error("Invalid message!", e.data);
    }
  };

  dataSocket.onclose = function(){
    console.log("closed");
  };

  // We can expose "public" methods by adding them to the object.
  this.sendData = function(data){

    // If data is an Object, Array, or Null, stringify before sending
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
    if (typeof data == "object") {
      data = JSON.stringify(data);
    }

    dataSocket.send(data);
  };
};

