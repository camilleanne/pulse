var camera = (function(){
  var htracker;
  var video, canvas, context, videoPause, canvasOverlay, overlayContext;
  var countdownCanvas, countdownContext, rawDataGraph;
  var renderTimer, dataSend, workingBuffer, heartbeatTimer;
  var width = 380;
  var height = 285;
  var fps = 15;
  var heartrate = 60;
  var bufferWindow = 512;
  var sendingData = false;
  var red = [];
  var green = [];
  var blue = [];
  var pause = false;
  var spectrum;
  var confidenceGraph, x, y, line, xAxis;
  var heartrateAverage = [];
  var circle, circleSVG, r;
  var toggle = 1;
  var hrAv = 65;
  var blur = false;
  var graphing = false;

  function initVideoStream(){
    video = document.createElement("video");
    video.setAttribute("width", width);
    video.setAttribute("height", height);

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    // ** for showing/hiding arrow ** 
    var hidden = document.getElementById("arrow");
    var buttonBar = document.getElementById("buttonBar");
    var allowWebcam = document.getElementById("allowWebcam");

    if (navigator.getUserMedia){
      navigator.getUserMedia({
        video: true,
        audio: false
      }, function(stream){
        if (video.mozSrcObject !== undefined) { // for Firefox
          video.mozSrcObject = stream;
        } else {
          video.src = window.URL.createObjectURL(stream); 
        }
        hidden.style.display = "none";
        hidden.className = "";
        allowWebcam.style.display = "none";

        buttonBar.className = "button";

        initCanvas(); 
      }, errorCallback);
      };
  };

  function initCanvas(){
    canvas = document.getElementById("canvas");
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    context = canvas.getContext("2d");
    
    canvasOverlay = document.getElementById("canvasOverlay");
    canvasOverlay.setAttribute("width", width);
    canvasOverlay.setAttribute("height", height);
    overlayContext = canvasOverlay.getContext("2d");
    overlayContext.clearRect(0,0,width,height);

    var button = document.getElementById("end_camera");
    button.style.display = "block";

    // ** displays raw data (difference in pixel averages over time sampled 15 times a second) ** 
    rawDataGraph = new Rickshaw.Graph( {
      element: document.getElementById("rawDataGraph"),
      width: 600,
      height: 120,
      renderer: "line",
      min: -2,
      interpolation: "basis",
      series: new Rickshaw.Series.FixedDuration([{ name: "one" }], undefined, {
        timeInterval: 1000/fps,
        maxDataPoints: 300,
        timeBase: new Date().getTime() / 1000
      })
    });



    startCapture();
  };

  function headtrack (){      
    htracker = new headtrackr.Tracker({detectionInterval: 1000/fps});
    htracker.init(video, canvas, context);
    htracker.start();

    // ** for each facetracking event received draw rectangle around tracked face on canvas ** 
    document.addEventListener("facetrackingEvent", greenRect)
  };

  function greenRect(event) {
    // ** clear canvas ** 
    overlayContext.clearRect(0,0,width,height);

    var sx, sy, sw, sh, forehead, inpos, outpos;
    var greenSum = 0;
    var redSum = 0;
    var blueSum = 0;
    
    // ** approximating forehead based on facetracking ** 
    sx = event.x + (-(event.width/5)) + 20 >> 0;
    sy = event.y + (-(event.height/3)) + 10 >> 0;
    sw = (event.width/5) >> 0;
    sh = (event.height/10) >> 0;

    //  ** CS == camshift (in headtrackr.js) ** 
    //  ** once we have stable tracking, draw rectangle ** 
    if (event.detection == "CS") /**/ {
      overlayContext.rotate(event.angle-(Math.PI/2));
      overlayContext.strokeStyle = "#00CC00";
      overlayContext.strokeRect(event.x + (-(event.width/2)) >> 0, event.y + (-(event.height/2)) >> 0, event.width, event.height);
      
      //  ** for debugging: blue forehead box ** 
      overlayContext.strokeStyle = "#33CCFF";       
      overlayContext.strokeRect(sx, sy, sw, sh);

      forehead = context.getImageData(sx, sy, sw, sh);
      
      // ** turn green ** 
      for (i = 0; i < forehead.data.length; i+=4){
        // ** for reference: ** 
        // var red = forehead.data[i];
        // var green = forehead.data[i+1];
        // var blue = forehead.data[i+2];
        // var alpha = forehead.data[i+3];

        //  ** for debugging: puts a green video image on screen ** 
        // forehead.data[i] = 0;
        // forehead.data[i + 1] = forehead.data[i]
        // forehead.data[i + 2] = 0;

        // ** get sum of green area for each frame **
        // ** FOR RGB CHANNELS & ICA **
        redSum = forehead.data[i] + redSum;
        greenSum = forehead.data[i+1] + greenSum;
        blueSum = forehead.data[i+2] + blueSum;
        
        // ** blurs video after head tracking **
        if (blur == false){
          var border = document.getElementById("border");
          canvas.className = "video blur";
          border.className = "border";
          blur = true;
          minimizeVideo();
        }

        // // ** TOGGLE FOR GREEN CHANNEL ONLY **
        // greenSum = forehead.data[i+1] + greenSum;
      };

      // ** get average of green area for each frame **

      // ** FOR RGB CHANNELS & ICA **
      var redAverage = redSum/(forehead.data.length/4);
      var greenAverage = greenSum/(forehead.data.length/4);
      var blueAverage = blueSum/(forehead.data.length/4);

      // //  ** TOGGLE FOR GREEN CHANNEL ONLY **
      // var greenAverage = greenSum/(forehead.data.length/4);

      // //  ** TOGGLE FOR GREEN CHANNEL ONLY **
      // if (green.length < bufferWindow){
      //     green.push(greenAverage);
      //   if (green.length > bufferWindow/8){
      //       sendingData = true;
      //   }
      // } else {
      //   green.push(greenAverage);
      //   green.shift();
      // }

      // ** FOR RGB CHANNELS & ICA **
      if (green.length < bufferWindow){
          red.push(redAverage);
          green.push(greenAverage);
          blue.push(blueAverage);
        if (green.length > bufferWindow/8){
            sendingData = true;
        }
      } else {
        red.push(redAverage);
        red.shift();
        green.push(greenAverage);
        green.shift();
        blue.push(blueAverage);
        blue.shift();
      }
      
      graphData = {one: normalize(green)[green.length-1]}
      rawDataGraph.series.addData(graphData);
      rawDataGraph.update();

      if (graphing === false){
        var rickshawAxis = document.getElementById("rawDataLabel");
        rickshawAxis.style.display = "block";
        graphing = true;
      }

      // ** for debugging: puts green video image on screen **
      // overlayContext.putImageData(forehead, sx, sy);

      overlayContext.rotate((Math.PI/2)-event.angle);
    }
  };

  function drawCountdown(array){
    countdownContext.font = "20pt Helvetica";
    countdownContext.clearRect(0,0,200,100);
    countdownContext.save();
    countdownContext.fillText(((bufferWindow - array.length)/fps) >> 0, 25, 25);
    countdownContext.restore();
  };


  function cardiac(array, bfwindow){
    // ** if using Green Channel, you can normalize data in the browser: ** 
    // var normalized = normalize(array);
    // var normalized = array;

    // // ** fast fourier transform from dsp.js **
    // // ** if using green channel, you can run fft in the browser: **
    // var fft = new RFFT(bfwindow, fps);
    // fft.forward(normalized);
    // spectrum = fft.spectrum;

    // ** if FFT is done on server, set spectrum to that array **
    spectrum = array;

    var freqs = frequencyExtract(spectrum, fps);
    var freq = freqs.freq_in_hertz;
    heartrate = freq * 60;
    
    // //** TOGGLE FOR GREEN CHANNEL ONLY **
    // graphData = {one: green[green.length-1]}
    // graph.series.addData(graphData);
    // graph.render();

    showConfidenceGraph(freqs, 600, 100);
    heartbeatCircle(heartrate);
    
    // ** create an average of the last five heartrate 
    // measurements for the pulsing circle ** 
    if (heartrateAverage.length < 3){
        heartrateAverage.push(heartrate);
        hrAV = heartrate;
    } else {
      heartrateAverage.push(heartrate);
      heartrateAverage.shift();
      hrAv = mean(heartrateAverage);
    }
  };

  function heartbeatCircle(heartrate){
    var cx = $("#heartbeat").width() / 2;
    var cy = $("#heartbeat").width() / 2;
    r = $("#heartbeat").width() / 4;

    if (circle) {
      circleSVG.select("text").text(heartrate >> 0);

    } else {
      circleSVG = d3.select("#heartbeat")
                    .append("svg")
                    .attr("width", cx * 2)
                    .attr("height", cy * 2);
      circle = circleSVG.append("circle")
                        .attr("cx", cx)
                        .attr("cy", cy)
                        .attr("r", r)
                        .attr("fill", "#DA755C");
      circleSVG.append("text")
               .text(heartrate >> 0)
               .attr("text-anchor", "middle")
               .attr("x", cx )
               .attr("y", cy + 10)
               .attr("font-size", "26pt")
               .attr("fill", "white");   
    }
  }

  function showConfidenceGraph(data, width, height){
    // **  x == filteredFreqBin, y == normalizedFreqs ** 
    var max = _.max(data.normalizedFreqs);
    data.filteredFreqBin = _.map(data.filteredFreqBin, function(num){return num * 60});
    var data = _.zip(data.normalizedFreqs, data.filteredFreqBin);
    
    if (confidenceGraph){
      y = d3.scale.linear().domain([ 0, max]).range([height, 0]);
      confidenceGraph.select("path").transition().attr("d", line(data)).attr("class", "line").ease("linear").duration(750);
    } else {
      x = d3.scale.linear().domain([48, 180]).range([0, width - 20]);
      y = d3.scale.linear().domain([0, max]).range([height, 0]);

      confidenceGraph = d3.select("#confidenceGraph").append("svg").attr("width", width).attr("height", 150);
      
      xAxis = d3.svg.axis().scale(x).tickSize(-height).tickSubdivide(true);

      line = d3.svg.line()
                    .x(function(d) { return x(+d[1]); })
                    .y(function(d) { return y(+d[0]); });
      
      confidenceGraph.append("svg:path").attr("d", line(data)).attr("class", "line");
      confidenceGraph.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
      confidenceGraph.append("text").attr("x", 235).attr("y", height + 40).style("text-anchor", "end").text("Confidence in frequency in BPM").attr("font-size", "12pt").attr("fill", "steelblue");
    }
  }

  function clearConfidenceGraph(){
    var confidenceClear = document.getElementById("confidenceGraph");
    while (confidenceClear.firstChild){
      confidenceClear.removeChild(confidenceClear.firstChild);
    }
  }

  function startCapture(){
    video.play();

    // ** if the video is paused, reset everything so that the data collection process restarts ** 
    if (pause == true){
      pause = false;
      red = [];
      green = [];
      blue = []; 
      confidenceGraph = null;
      clearConfidenceGraph();
    }
    
    // ** set the framerate and draw the video the canvas at the desired fps ** 
    renderTimer = setInterval(function(){
        context.drawImage(video, 0, 0, width, height);
      }, Math.round(1000 / fps));


    // ** send data via websocket to the python server ** 
    dataSend = setInterval(function(){
      // //  ** TOGGLE FOR GREEN CHANNEL ONLY **
      // if (sendingData){
      //   sendData(JSON.stringify({"array": green, "bufferWindow": green.length}));
      // }
      // ** FOR RGB CHANNELS & ICA **
      if (sendingData){
        sendData(JSON.stringify({"array": [red, green, blue], "bufferWindow": green.length}));
      }

    }, Math.round(1000));

    // ** pulse the round cirle containing the heartrate 
    // to an average of the last five heartrate measurements **
    heartbeatTimer = setInterval(function(){
      var duration = Math.round(((60/hrAv) * 1000)/4);
      if (confidenceGraph){
         if (toggle % 2 == 0){
            circleSVG.select("circle")
                   .transition()
                   .attr("r", r)
                   .duration(duration);
          } else {
            circleSVG.select("circle")
                   .transition()
                   .attr("r", r + 15)
                   .duration(duration);
          }
          if (toggle == 10){
            toggle = 0;
          }
          toggle++;
        }
    }, Math.round(((60/hrAv) * 1000)/2));


    // ** begin headtracking! ** 
    headtrack();
  };

  function pauseCapture(){
    // ** clears timers so they don't continue to fire ** 
    if (renderTimer) clearInterval(renderTimer);
    if (dataSend) clearInterval(dataSend);
    if (heartbeatTimer) clearInterval(heartbeatTimer);

    pause = true;
    sendingData = false;
    video.pause();

    // ** removes the event listener and stops headtracking ** 
    document.removeEventListener("facetrackingEvent", greenRect);
    htracker.stop();

  };

  var errorCallback = function(error){
    console.log("something is wrong with the webcam!", error);
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

