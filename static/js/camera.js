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
      //**
    // renderTimer = setInterval(function(){
    //   context.drawImage(video, 0, 0, width, height);
    //   /* greenRect(); */}, Math.round(1000 / fps));
      
    htracker = new headtrackr.Tracker({detectionInterval: 1000/fps});
    htracker.init(video, canvas, context);
    htracker.start();

    document.addEventListener("facetrackingEvent", greenRect)

    // for each facetracking event received draw rectangle around tracked face on canvas
    // document.addEventListener("facetrackingEvent", greenRect) //**

  };

  function greenRect(event) {

    // for facetracking, draws the rectangle on the canvas

    // clear canvas
    overlayContext.clearRect(0,0,width,height);

    var sx, sy, sw, sh, forehead, inpos, outpos;
    var greenSum = 0;
    var redSum = 0;
    var blueSum = 0;
    var normalized = [];
    
    //approximating forehead based on facetracking
    //**
    sx = event.x + (-(event.width/5)) >> 0;
    sy = event.y + (-(event.height/3)) >> 0;
    sw = (event.width/2.5) >> 0;
    sh = (event.height/4) >> 0;

    //** for testing without headtracking
    // sx = sy = 200;
    // sw = sh = 50;

    // CS == camshift (in headtrackr.js)
    // once we have stable tracking, draw rectangle
    if (event.detection == "CS") /**/ {
      // Notes: 
      // translate moves the origin point of context by event.x and event.y
      // ex. (88, 120) becomes the new (0, 0), removing translating for 
      // the moment and adding (event.x + or event.y + ) where needed for now

      // overlayContext.translate(event.x, event.y)

      //**
      overlayContext.rotate(event.angle-(Math.PI/2));
      overlayContext.strokeStyle = "#00CC00";

      overlayContext.strokeRect(event.x + (-(event.width/2)) >> 0, event.y + (-(event.height/2)) >> 0, event.width, event.height);
      
      // blue forehead box (for debugging)
      overlayContext.strokeStyle = "#33CCFF";       
      overlayContext.strokeRect(sx, sy, sw, sh);

      // red forehead box (for debugging)
      // overlayContext.fillStyle = "rgba(200, 0, 0, 1)";
      // overlayContext.fillRect(sx, sy, sw, sh);
      
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

      
      //create an array of averages for last 30 seconds
      // if (greenTimeSeries.length < bufferWindow){
      //   greenTimeSeries.push(average);
      //   countdown = true;
        
      // } else {
      //   greenTimeSeries.push(average);
      //   greenTimeSeries.shift();
        
      //   countdown = false;
      //   cardiac(greenTimeSeries);

      // }

      // messy cascade for refinement of heartrate/frequency bins over time as more data becomes available
      // if (greenTimeSeries.length < (bufferWindow/8)){
      //   greenTimeSeries.push(average);
      //   countdown = true;

      // } else if (greenTimeSeries.length < (bufferWindow/4)){
      //   greenTimeSeries.push(average);
      //   cardiac(greenTimeSeries.slice((greenTimeSeries.length - bufferWindow/8)), bufferWindow/8);

      // } else if (greenTimeSeries.length < (bufferWindow/2)){
      //   greenTimeSeries.push(average);
      //   cardiac(greenTimeSeries.slice((greenTimeSeries.length - bufferWindow/4)), bufferWindow/4);

      // } else if (greenTimeSeries.length < bufferWindow) {
      //   greenTimeSeries.push(average);
      //   cardiac(greenTimeSeries.slice((greenTimeSeries.length - bufferWindow/2)), bufferWindow/2);
      
      // } else {
      //   greenTimeSeries.push(average);
      //   greenTimeSeries.shift();

      //   countdown = false;
      //   cardiac(greenTimeSeries, bufferWindow);
      // }

      // if (countdown == true){
      //   drawCountdown(greenTimeSeries);
      // };

      // overlayContext.putImageData(forehead, sx, sy);
      overlayContext.rotate((Math.PI/2)-event.angle); //**
      
      // see note above about .translate()
      // overlayContext.translate(-event.x, -event.y);

    }
    //  for debugging framerates
    var newTime = new Date();
    var elapsedTime = newTime - lastTime;
    lastTime = newTime;
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
    // static test fft spectrum data:
    // var fftArray = [0, 0.6082253456115723, 0.25601473450660706, 0.3510543704032898, 0.33191803097724915, 0.40043285489082336, 0.24442104995250702, 0.2906903624534607, 0.10941631346940994, 0.22052565217018127, 0.08654522150754929, 0.11624716222286224, 0.17962567508220673, 0.10583585500717163, 0.14719387888908386, 0.1313147246837616, 0.06234072521328926, 0.1543150544166565, 0.11760584264993668, 0.11862088739871979, 0.12146361917257309, 0.266795814037323, 0.21472491323947906, 0.06073959171772003, 0.06288193166255951, 0.09347641468048096, 0.036240000277757645, 0.05102884769439697, 0.04235406965017319, 0.02831820584833622, 0.05210259556770325, 0.10648924112319946, 0.15421639382839203, 0.06438228487968445, 0.10806077718734741, 0.03795776888728142, 0.08309036493301392, 0.031337834894657135, 0.09866298735141754, 0.014706060290336609, 0.03916962072253227, 0.08954672515392303, 0.029007576406002045, 0.057937536388635635, 0.008652705699205399, 0.037266805768013, 0.02773413620889187, 0.06986536830663681, 0.003169334027916193, 0.11411335319280624, 0.08028649538755417, 0.023082412779331207, 0.07458089292049408, 0.035777997225522995, 0.03824623301625252, 0.049640655517578125, 0.077757328748703, 0.034727200865745544, 0.04745856299996376, 0.023465096950531006, 0.024489138275384903, 0.07100922614336014, 0.040082309395074844, 0.05462462082505226, 0.018537191674113274, 0.022122405469417572, 0.07421161979436874, 0.030828898772597313, 0.015992337837815285, 0.041366539895534515, 0.022134358063340187, 0.04682140797376633, 0.04059939831495285, 0.03882011026144028, 0.03683715686202049, 0.0355040617287159, 0.04130915179848671, 0.0772508755326271, 0.017217449843883514, 0.04906228929758072, 0.05653959885239601, 0.03592155873775482, 0.05430029705166817, 0.08023825287818909, 0.021106261759996414, 0.015047682449221611, 0.025425495579838753, 0.01588442362844944, 0.010336599312722683, 0.04358170926570892, 0.03919610008597374, 0.059951890259981155, 0.0548163503408432, 0.0708637610077858, 0.05006611347198486, 0.0253529604524374, 0.024189390242099762, 0.04341737926006317, 0.021617475897073746, 0.023999590426683426, 0.03697226196527481, 0.04166150838136673, 0.048380929976701736, 0.023121561855077744, 0.028621751815080643, 0.02181928977370262, 0.06232449412345886, 0.003735166508704424, 0.056197550147771835, 0.007498697843402624, 0.026589369401335716, 0.036785390228033066, 0.06052883714437485, 0.02696179784834385, 0.06407647579908371, 0.07175770401954651, 0.04474520683288574, 0.05206694453954697, 0.0502486452460289, 0.04056066647171974, 0.04000169411301613, 0.029190203174948692, 0.0447375625371933, 0.05608018860220909, 0.04813564941287041, 0.04150288179516792, 0.03023460879921913, 0.013040808029472828]
    // console.log(averagePixelArray)
    var normalized = normalize(averagePixelArray);

    // fast fourier transform from dsp.js
    
    var fft = new RFFT(bfwindow, fps);
    fft.forward(normalized);
    var spectrum = fft.spectrum;

    // console.log("spectrum: ",spectrum)

    var freq = frequencyExtract(spectrum, fps);
    // console.log("peak freq in hz:", freq)

    heartrate = freq * 60;
    // console.log("heartrate: ", heartrate);

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

    // console.log(heartrateArray);
    // console.log(rgbMatrix);


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






