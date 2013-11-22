var camera = (function(){
  var htracker;
  var video, canvas, context, videoPause, canvasOverlay, overlayContext;
  var countdownCanvas, countdownContext, hrCanvas, hrContext;
  var renderTimer;
  var width = 480;
  var height = 360;
  var fps = 15;
  var greenTimeSeries = [];
  var heartrate;
  var heartrateArray = [];
  var lastTime;
  var bufferWindow = 1024;
  var countdown = false;
  var rgbMatrix = [[],[],[]];

  function initVideoStream(){
    // videoPause = false;
    video = document.createElement("video");
    video.setAttribute('width', width);
    video.setAttribute('height', height);
    // window.video = video;
    var cameraExists = false;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    if (navigator.getUserMedia){
      navigator.getUserMedia({
        video: true,
        audio: false
      }, function(stream){
        if (video.mozSrcObject !== undefined) { // for Firefox
          video.mozSrcObject = stream;
        } else {
          video.src = window.URL.createObjectURL(stream); 
        } initCanvas();
      }, errorCallback);
      };
  };

  function initCanvas(){
    canvas = document.createElement("canvas");
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    context = canvas.getContext("2d");

    canvasOverlay = document.createElement("canvas");
    canvasOverlay.setAttribute('width', width);
    canvasOverlay.setAttribute('height', height);
    canvasOverlay.style.position = "absolute";
    canvasOverlay.style.top = '0';
    canvasOverlay.style.zIndex = '100001';
    canvasOverlay.style.display = 'block';
    overlayContext = canvasOverlay.getContext('2d');
    overlayContext.clearRect(0,0,width,height);

    countdownCanvas = document.createElement("canvas");
    countdownCanvas.setAttribute('width', 200);
    countdownCanvas.setAttribute('height', 100);
    countdownCanvas.style.display = 'block';
    countdownContext = countdownCanvas.getContext('2d');
    countdownContext.clearRect(0,0,width,height);

    vid.appendChild(canvas);
    vid.appendChild(canvasOverlay);
    countdownDiv.appendChild(countdownCanvas);

    startCapture();

  };

  function headtrack (){      
    htracker = new headtrackr.Tracker({detectionInterval: 1000/fps});
    htracker.init(video, canvas, context);
    htracker.start();

    // for each facetracking event received draw rectangle around tracked face on canvas
    document.addEventListener("facetrackingEvent", greenRect)


  };

  function greenRect(event) {
    // clear canvas
    overlayContext.clearRect(0,0,width,height);

    var sx, sy, sw, sh, forehead, inpos, outpos;
    var greenSum = 0;
    var redSum = 0;
    var blueSum = 0;
    var normalized = [];
    
    //approximating forehead based on facetracking
    sx = event.x + (-(event.width/5)) >> 0;
    sy = event.y + (-(event.height/3)) >> 0;
    sw = (event.width/2.5) >> 0;
    sh = (event.height/4) >> 0;

    // CS == camshift (in headtrackr.js)
    // once we have stable tracking, draw rectangle
    if (event.detection == "CS") /**/ {
      
      // Notes: 
      // translate moves the origin point of context by event.x and event.y
      // ex. (88, 120) becomes the new (0, 0), removing translating for 
      // the moment and adding (event.x + or event.y + ) where needed for now

      // overlayContext.translate(event.x, event.y)

      overlayContext.rotate(event.angle-(Math.PI/2));
      overlayContext.strokeStyle = "#00CC00";

      overlayContext.strokeRect(event.x + (-(event.width/2)) >> 0, event.y + (-(event.height/2)) >> 0, event.width, event.height);
      
      // blue forehead box (for debugging)
      overlayContext.strokeStyle = "#33CCFF";       
      overlayContext.strokeRect(sx, sy, sw, sh);
      
      //turn green
      forehead = context.getImageData(sx, sy, sw, sh);
      for (i = 0; i < forehead.data.length; i+=4){
        //for reference:
        // var red = forehead.data[i];
        // var green = forehead.data[i+1];
        // var blue = forehead.data[i+2];
        // var alpha = forehead.data[i+3];
        
        // for putting a green video image on screen
        // forehead.data[i] = 0;
        // forehead.data[i+2] = 0;

        //get sum of green area for each frame
        greenSum = forehead.data[i+1] + greenSum;
        redSum = forehead.data[i] + redSum;
        blueSum = forehead.data[i+2] + blueSum;
      };

      //get average of green area for each frame
      var average = greenSum/forehead.data.length;
      var redAverage = redSum/forehead.data.length;
      var blueAverage = blueSum/forehead.data.length;

      if (rgbMatrix[0].length < bufferWindow){
        rgbMatrix[0].push(redAverage);
        rgbMatrix[1].push(average);
        rgbMatrix[2].push(blueAverage);
      } else {
        rgbMatrix[0].push(redAverage);
        rgbMatrix[0].shift();
        rgbMatrix[1].push(average);
        rgbMatrix[1].shift();
        rgbMatrix[2].push(blueAverage);
        rgbMatrix[2].shift();
      }
      if (rgbMatrix[1].length == bufferWindow){
        sendData(rgbMatrix);
      };

      // for putting green video image on screen
      // overlayContext.putImageData(forehead, sx, sy);
      overlayContext.rotate((Math.PI/2)-event.angle); //**
      
      // see note above about .translate()
      // overlayContext.translate(-event.x, -event.y);

    }
    //  for debugging framerates
    // var newTime = new Date();
    // var elapsedTime = newTime - lastTime;
    // lastTime = newTime;
    // console.log("approx FPS: ", 1000/elapsedTime); // to do: try sending this to the DOM

  };

  function drawCountdown(array){
    countdownContext.font = "20pt Helvetica";
    countdownContext.clearRect(0,0,200,100);
    countdownContext.save();
    countdownContext.fillText(((bufferWindow - array.length)/fps) >> 0, 25, 25);
    countdownContext.restore();
  };


  function cardiac(averagePixelArray, bfwindow){
    var normalized = normalize(averagePixelArray);

    // fast fourier transform from dsp.js
    var fft = new RFFT(bfwindow, fps);
    fft.forward(normalized);
    var spectrum = fft.spectrum;

    var freq = frequencyExtract(spectrum, fps);
    heartrate = freq * 60;
    heartrateArray.push(heartrate)

    //draw heartbeat to page
    countdownContext.font = "20pt Helvetica";
    countdownContext.clearRect(0,0,200,100);
    countdownContext.save();
    countdownContext.fillText(heartrate >> 0, 25, 25);
    countdownContext.restore();

  };
  
  function startCapture(){
    cameraExists = true;
    video.play();

    renderTimer = setInterval(function(){
        context.drawImage(video, 0, 0, width, height);
      }, Math.round(1000 / fps));

    headtrack();

  };

  function pauseCapture(){
    if (renderTimer) clearInterval(renderTimer);
    // if (calculationTimer) clearInterval(calculationTimer);

    video.pause();

    //removes the event listener and stops headtracking
    document.removeEventListener("facetrackingEvent", greenRect);
    htracker.stop();


  };
  var errorCallback = function(error){
    console.log('rejeeeected!', error);
  }; 

  return{
    init: function(){
      initVideoStream();
    },
    start: startCapture,
    pause: pauseCapture,
    cardiac: cardiac,
  }

})();






