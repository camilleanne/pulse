var camera = (function(){
  var video, canvas, context, videoPause, overlayContext;
  var renderTImer;
  var width = 640;
  var height = 480;
  var fps = 15;
  var greenTimeSeries = [];
  var fft, spectrum, spectrum2, rfft;
  var normalized;
  var freq, heartrate;

  function initVideoStream(){
    // videoPause = false;
    video = document.createElement("video");
    video.setAttribute('width', width);
    video.setAttribute('height', height);
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

  canvas = document.createElement("canvas");
  function initCanvas(){
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    context = canvas.getContext("2d");

    canvasOverlay = document.createElement("canvas");
    canvasOverlay.setAttribute('width', width);
    canvasOverlay.setAttribute('height', height);
    canvasOverlay.style.position = "absolute";
    canvasOverlay.style.top = '0px';
    canvasOverlay.style.zIndex = '100001';
    canvasOverlay.style.display = 'block';
    overlayContext = canvasOverlay.getContext('2d');
    overlayContext.clearRect(0,0,width,height);

    vid.appendChild(canvas);
    vid.appendChild(canvasOverlay)

    startCapture();

  };

  // for facetracking
  function headtrack (){
      var htracker = new headtrackr.Tracker();
      htracker.init(video, canvas);
      htracker.start();

      window.htracker = htracker;
      // for each facetracking event received draw rectangle around tracked face on canvas
      document.addEventListener("facetrackingEvent", greenRect)

  };

  // for facetracking, draws the rectangle on the canvas
  function greenRect(event) {
        // clear canvas
        overlayContext.clearRect(0,0,width,height);

        var sx, sy, sw, sh, forehead, inpos, outpos;
        var greenSum = 0;
        var normalized = [];
        //approximating forehead based on facetracking
        sx = event.x + (-(event.width/5)) >> 0;
        sy = event.y + (-(event.height/3)) >> 0;
        sw = (event.width/2.5) >> 0;
        sh = (event.height/4) >> 0;
        
        // console.log(sx, sy, sw, sh)
        // console.log(event.width, event.height, event.x, event.y)
        // console.log(event.angle)

        //CS == camshift (in headtrackr.js)
        // once we have stable tracking, draw rectangle
        if (event.detection == "CS") {
          // Notes: 
          // translate moves the origin point of context by event.x and event.y
          // ex. (88, 120) becomes the new (0, 0), removing translating for 
          // the moment and adding (event.x + or event.y + ) where needed for now

          // overlayContext.translate(event.x, event.y)

          overlayContext.rotate(event.angle-(Math.PI/2));
          overlayContext.strokeStyle = "#00CC00";

          overlayContext.strokeRect(event.x + (-(event.width/2)) >> 0, event.y + (-(event.height/2)) >> 0, event.width, event.height);
          
          // blue forehead box (for debugging)
          // overlayContext.strokeStyle = "#33CCFF";       
          // overlayContext.strokeRect(sx, sy, sw, sh);

          //red forehead box (for debugging)
          // overlayContext.fillStyle = "rgba(200, 0, 0, 1)";
          // overlayContext.fillRect(sx, sy, sw, sh);
          
          // Notes: forehead video box --
          // current theory is that the video brings in images at ~130dpi (@ 320 x 240), 
          // whereas the canvas is 72dpi, thus the .545 or 1.85 difference
          // this isn't perfect, something about the way it calculates, 
          // there is still an offset image sometimes. 
          // Constraints will allow a specific resolution (theoretically), will require testing.
          // This currently only works for the iSight in a MacBook Air
        
          // ** for 320 x 240
          // overlayContext.drawImage(video, event.x + (sx* .8334), sy * 1.8334, sw*1.8334, sh*1.8334, sx, sy, sw, sh);

          // ** for 480 x 320          
          // overlayContext.drawImage(video, (sx * 1.33), sy, sw * 1.3333, sh * 1.3333, sx, sy, sw, sh);

          // ** for 640 x 480 (which is too big for what I want do be doing, but brings the video down to 72dpi)
          overlayContext.drawImage(video, sx, sy - 10, sw, sh, sx, sy, sw, sh);

          //turn green
          forehead = overlayContext.getImageData(sx, sy, sw, sh);
          // console.log(forehead.width, forehead.height, forehead.data.length);
          // console.log(forehead.data)
          for (i = 0; i < forehead.data.length; i+=4){
            //for reference:
            // var red = forehead.data[i];
            // var green = forehead.data[i+1];
            // var blue = forehead.data[i+2];
            // var alpha = forehead.data[i+3];
            forehead.data[i] = 0;
            forehead.data[i+2] = 0;

            //get sum of green area for each frame
            greenSum = forehead.data[i+1] + greenSum;
          }

          //get average of green area for each frame
          var average = greenSum/forehead.data.length;
          console.log("Average: ", average);

          //create an array of averages for last 30 seconds
          //normalize
          if (greenTimeSeries.length < 256){
            greenTimeSeries.push(average);
          } else {
            greenTimeSeries.push(average);
            greenTimeSeries.shift();
            

            normalized = normalize(greenTimeSeries);

            // fast fourier transform from dsp.js
            fft = new RFFT(256, 15);
            fft.forward(normalized);
            spectrum = fft.spectrum;

            freq = frequencyExtract(spectrum, fps);
            console.log(freq)

            //this should be moved, it should not be in this loop, but outside running every second or so
            heartrate = freq * 60;
            console.log(heartrate)

          }
          // console.log("FFT: ",spectrum);
          console.log(heartrate)

          overlayContext.putImageData(forehead, sx, sy);

          overlayContext.rotate((Math.PI/2)-event.angle);
          
          // see note above about .translate()
          // overlayContext.translate(-event.x, -event.y);

        }
        // for debugging framerates
        // var newTime = new Date();
        // var elapsedTime = newTime - lastTime;
        // lastTime = newTime;
        // console.log(1000/elapsedTime); // to do: try sending this to the DOM


   };

   var lastTime;

  
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
  }

})();






