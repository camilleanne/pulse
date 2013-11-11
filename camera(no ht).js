var camera = (function(){
  var video, canvas, context, videoPause, overlayContext;

  function initVideoStream(){
    // videoPause = false;
    video = document.createElement("video");
    video.setAttribute('width', 320);
    video.setAttribute('height', 240);
    vid.appendChild(video); //when using facetrackr this must be commented out
    var cameraExists = false;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
  
    if (navigator.getUserMedia){
      navigator.getUserMedia({
        video:true
      }, function(stream){
        video.src = window.URL.createObjectURL(stream); 
        initCanvas();
      }, errorCallback);
      
    };
  };

  function initCanvas(){
    canvas = document.createElement("canvas");
    canvas.setAttribute('width', 320);
    canvas.setAttribute('height', 240);
    context = canvas.getContext("2d");

    // canvasOverlay = document.createElement("canvas");
    // // console.log(canvasOverlay)
    // canvasOverlay.setAttribute('width', 320);
    // canvasOverlay.setAttribute('height', 240);
    // canvasOverlay.style.position = "absolute";
    // canvasOverlay.style.top = '0px';
    // canvasOverlay.style.zIndex = '100001';
    // canvasOverlay.style.display = 'block';
    // overlayContext = canvasOverlay.getContext('2d');
    // overlayContext.clearRect(0,0,320,240);
    // // console.log(overlayContext)

    
    vid.appendChild(canvas);
    vid.appendChild(canvasOverlay)


    startCapture();


  };
  //for facetracking
  // function headtrack (){
  //     // console.log(cameraExists +"blue");
  //     var htracker = new headtrackr.Tracker();
  //     htracker.init(video, canvas);
  //     htracker.start();

  //     window.htracker = htracker;
  //     // for each facetracking event received draw rectangle around tracked face on canvas

  //     // if (!videoPause){
  //     document.addEventListener("facetrackingEvent", greenRect)

      
  //     // };
  // };
  //for facetracking, draws the rectangle on the canvas
  // function greenRect( event ) {
  //       // clear canvas
  //       overlayContext.clearRect(0,0,320,240);
  //       // once we have stable tracking, draw rectangle
  //       console.log(event.detection)
  //       if (event.detection == "CS") {
  //         overlayContext.translate(event.x, event.y)
  //         overlayContext.rotate(event.angle-(Math.PI/2));
  //         overlayContext.strokeStyle = "#00CC00";
  //         overlayContext.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height);
  //         overlayContext.rotate((Math.PI/2)-event.angle);
  //         overlayContext.translate(-event.x, -event.y);
  //       }
  //  };

  function startCapture(){
    cameraExists = true;
    video.play();
    // headtrack();
  };

  function pauseCapture(){
    video.pause();
    //removes the event listener, but doesn't stop facetracking!!
    // document.removeEventListener("facetrackingEvent", greenRect);


  };
  var errorCallback = function(error){
    console.log('rejeeeected', error);
  }; 

  return{
    init: function(){
      // videoPause = false;
      initVideoStream();
      

    },
    start: startCapture,
    pause: pauseCapture,
  }

  
  
})();