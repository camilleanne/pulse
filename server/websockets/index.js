import {WebSocket, WebSocketServer} from 'ws';
import queryString from 'query-string';
import {PythonShell} from 'python-shell';
var pyFile = '/model.py'
var pyScriptPath = '././py/';
var pyMode = 'json';
var pyArgs = [];
var options = { mode: pyMode, scriptPath: pyScriptPath, args: pyArgs,pythonOptions: ['-u']};
let pyshell = new PythonShell("script.py",options);

export default async (expressServer) => {
    const webSocketServer = new WebSocket.Server({
        noServer:true,
        path: "/echo"
    });

    expressServer.on("upgrade",( request,socket,head ) => {
        webSocketServer.handleUpgrade(request,socket,head, (websocket) => {
            webSocketServer.emit("connection",request,websocket);
        });
    });

    webSocketServer.on(
        "connection",
        function connection(websocketConnection, connectionRequest) {
          //console.log(websocketConnection);
          //const {path, params} = websocketConnection?.url?.split("?");
          //const connectionParams = queryString.parse(params);

      
          //console.log(connectionParams);

          connectionRequest.on("message", (message) => {
            
            let theMessage = message;
            //console.log(theMessage["bufferWindow"]);
            pyArgs[0] = theMessage;
            PythonShell.run('script.py', options, function (err, results) {
              if (err) throw err;
              //console.log(results);
              connectionRequest.send(JSON.stringify(results));
              //console.log("done  Sent");
            }); 
            
            /*
            //pyshell.send(JSON.stringify(parsedMessage));
            pyshell.send('332');
            pyshell.on('message', function (message) {
              // received a message sent from the Python script (a simple "print" statement)
              console.log("Received a message sent from the Python script");
              console.log(message);
              //connectionRequest.send(message);
          });
          */
          });
        }
      );

    return webSocketServer
}
