biofeedback
===========

Biofeedback application in browser

Based on techniques outlined in ["Non-contact, automated cardiac pulse measurements using video imaging and blind source separation"](http://www.opticsinfobase.org/oe/abstract.cfm?uri=oe-18-10-10762) by Poh, et al (2010) and work by @thearn with OpenCV and Python ([webcam-pulse-detector](https://github.com/thearn/webcam-pulse-detector)).

[Headtrackr.js](https://github.com/auduno/headtrackr/) is currently doing the heavy lifting for much of the facetracking.

TO DO:
===========
*  Extract green channel from tracked forehead area - DONE 11/10
*  Implement independent component analysis (ICA) on average green pixels over time
*  Apply Fast Fourier Transform (FFT)
*  Extract heartrate
*  Build web application
*  optimize, optimize, optimize
