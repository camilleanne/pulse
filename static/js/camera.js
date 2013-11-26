var camera = (function(){
  var htracker;
  var video, canvas, context, videoPause, canvasOverlay, overlayContext;
  var countdownCanvas, countdownContext, hrCanvas, hrContext;
  var renderTimer;
  var width = 640;
  var height = 480;
  var fps = 15;
  var heartrate;
  var heartrateArray = [];
  var lastTime;
  var bufferWindow = 1024;
  var workingBuffer;
  var countdown = false;
  var red = [];
  var green = [];
  var blue = [];
  // var time = [];
  var pause = false;
  var spectrum;
  // var confidenceGraph;
  var confidenceGraph, x, y, line;

  function initVideoStream(){
    video = document.createElement("video");
    video.setAttribute('width', width);
    video.setAttribute('height', height);

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
    
    //approximating forehead based on facetracking
    sx = event.x + (-(event.width/5)) >> 0;
    sy = event.y + (-(event.height/3)) >> 0;
    sw = (event.width/4) >> 0;
    sh = (event.height/6) >> 0;
    // sw = (event.width/3) >> 0;
    // sh = (event.height/5) >> 0;

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

      forehead = context.getImageData(sx, sy, sw, sh);
      
      //turn green
      for (i = 0; i < forehead.data.length; i+=4){
        //for reference:
        // var red = forehead.data[i];
        // var green = forehead.data[i+1];
        // var blue = forehead.data[i+2];
        // var alpha = forehead.data[i+3];

        // for putting a green video image on screen
        // forehead.data[i] = forehead.data[i];
        // forehead.data[i + 1] = forehead.data[i]
        // forehead.data[i + 2] = forehead.data[i];


        //get sum of green area for each frame
        redSum = forehead.data[i] + redSum;
        greenSum = forehead.data[i+1] + greenSum;
        blueSum = forehead.data[i+2] + blueSum;
      };
      
      //get average of green area for each frame
      var redAverage = redSum/(forehead.data.length/4);
      var greenAverage = greenSum/(forehead.data.length/4);
      var blueAverage = blueSum/(forehead.data.length/4);

      shiftDataWindow(redAverage, greenAverage, blueAverage);
      
      // for putting green video image on screen
      // overlayContext.putImageData(forehead, event.x + (-(event.width/2)) >> 0, event.y + (-(event.height/2)) >> 0);
      overlayContext.rotate((Math.PI/2)-event.angle);
      
      // see note above about .translate()
      // overlayContext.translate(-event.x, -event.y);

    }
    //  for debugging framerates
    // var newTime = new Date();
    // var elapsedTime = newTime - lastTime;
    // lastTime = newTime;
    // console.log("approx FPS: ", 1000/elapsedTime); // to do: try sending this to the DOM

  };


  function shiftDataWindow(redAverage, greenAverage, blueAverage){
    // cascade so user doesn't have to wait 60sec for a heartbeat
    // allows for greater accuracy over time
    if (red.length < (bufferWindow/8)){
        red.push(redAverage);
        green.push(greenAverage);
        blue.push(blueAverage);
        // time.push(Date.now());
        countdown = true;
        // console.log(time)

      } else if (red.length < (bufferWindow/4)){
        workingBuffer = bufferWindow/8
        red.push(redAverage);
        green.push(greenAverage);
        blue.push(blueAverage);
        // time.push(Date.now());
        sendData(JSON.stringify({"array": [red.slice(red.length - workingBuffer), green.slice(green.length - workingBuffer), blue.slice(blue.length - workingBuffer)], "bufferWindow": workingBuffer, })); //"time": time.slice(time.length - workingBuffer)

      } else if (red.length < (bufferWindow/2)){
        workingBuffer = bufferWindow/4
        red.push(redAverage);
        green.push(greenAverage);
        blue.push(blueAverage);
        // time.push(Date.now());
        sendData(JSON.stringify({"array": [red.slice(red.length - workingBuffer), green.slice(green.length - workingBuffer), blue.slice(blue.length - workingBuffer)], "bufferWindow": workingBuffer, })); //"time":time.slice(time.length - workingBuffer)

      } else if (red.length < bufferWindow) {
        workingBuffer = bufferWindow/2
        red.push(redAverage);
        green.push(greenAverage);
        blue.push(blueAverage);
        // time.push(Date.now());
        sendData(JSON.stringify({"array": [red.slice(red.length - workingBuffer), green.slice(green.length - workingBuffer), blue.slice(blue.length - workingBuffer)], "bufferWindow": workingBuffer, })); //"time":time.slice(time.length - workingBuffer)

      } else {
        workingBuffer = bufferWindow
        red.push(redAverage);
        red.shift();

        green.push(greenAverage);
        green.shift();

        blue.push(blueAverage);
        blue.shift();

        // time.push(Date.now());
        // time.shift();
        countdown = false;
        sendData(JSON.stringify({"array":[red, green, blue], "bufferWindow": bufferWindow, })); //"time":time
      }
  }


  function drawCountdown(array){
    countdownContext.font = "20pt Helvetica";
    countdownContext.clearRect(0,0,200,100);
    countdownContext.save();
    countdownContext.fillText(((bufferWindow - array.length)/fps) >> 0, 25, 25);
    countdownContext.restore();
  };


  function cardiac(averagePixelArray, bfwindow){
    var normalized = normalize(averagePixelArray);
    console.log(normalized)
    // var normalized = averagePixelArray;
    // fast fourier transform from dsp.js
    
    var fft = new RFFT(bfwindow, fps);
    fft.forward(normalized);
    spectrum = fft.spectrum;
    // spectrum = averagePixelArray;

    var freqs = frequencyExtract(spectrum, fps);
    var freq = freqs.freq_in_hertz
    heartrate = freq * 60;
    heartrateArray.push(heartrate)

    //draw heartbeat to page
    countdownContext.font = "20pt Helvetica";
    countdownContext.clearRect(0,0,200,100);
    countdownContext.save();
    countdownContext.fillText(heartrate >> 0, 25, 25);
    countdownContext.restore();

    graphData = {one: normalized[normalized.length-1]}
    // graphData.two =
    // graphData = {one: (freqs.normalizedFreqs[freqs.normalizedFreqs.length-1] * 10)}
    graph.series.addData(graphData);
    graph.render();
    showConfidenceGraph(freqs, 600, 100)

  };
  
  var graph = new Rickshaw.Graph( {
      element: document.getElementById("graph"),
      width: 200,
      height: 100,
      renderer: 'line',
      min: -5,
      interpolation: 'basis',
      series: new Rickshaw.Series.FixedDuration([{ name: 'one' }], undefined, {
        timeInterval: 1000/fps,
        maxDataPoints: 100,
        timeBase: new Date().getTime() / 1000
      })
    });
  function showConfidenceGraph(data, width, height){

    var data = _.zip(data.normalizedFreqs, data.filteredFreqBin)
    if (confidenceGraph){
      if (data.length == 22){
        y = d3.scale.linear().domain([0, 0.825]).range([height, 10]);
      } else if (data.length == 44){
        y = d3.scale.linear().domain([0, 0.77]).range([height, 30]);
      } else if (data.length > 44){
        y = d3.scale.linear().domain([0, 0.70]).range([height, 30]);
      } 
      confidenceGraph.selectAll("path").transition().attr("d", line(data)).attr("class", "line").ease("linear").duration(66);

    } else {
      confidenceGraph = d3.select("#confidenceGraph").append("svg").attr("width", width).attr("height", height);
      x = d3.scale.linear().domain([0.75,4]).range([0, width]);
      y = d3.scale.linear().domain([0, 1]).range([height, 0]);

      line = d3.svg.line()
        .x(function(d) { return x(+d[1]); })
        .y(function(d) { return y(+d[0]); });

      confidenceGraph.append("svg:path").attr("d", line(data)).attr("class", "line");
    }


  }

  // }
  function startCapture(){
    video.play();
    pause = false;

    renderTimer = setInterval(function(){
        context.drawImage(video, 0, 0, width, height);
      }, Math.round(1000 / fps));

    headtrack();

  };

  function pauseCapture(){
    if (renderTimer) clearInterval(renderTimer);
    pause = true;
    video.pause();

    //removes the event listener and stops headtracking
    document.removeEventListener("facetrackingEvent", greenRect);
    htracker.stop();
    // console.log(heartrate);


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






