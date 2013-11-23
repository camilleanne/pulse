camera.init();
var paused = false;

document.getElementById("end_camera").addEventListener("click", function() {
  if (!paused){
    camera.pause();
    paused = true;
  } else {
    camera.start();
    paused = false;
  }
});