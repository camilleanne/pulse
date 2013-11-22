function mean(array) {
    var sum = array.reduce(function(a, b){ return a + b });
    return sum/array.length;
 };

function normalize(array){
// normalizes an array of data to a mean of zero (does not normalize between -1 and 1)
  var square = [];
  var normalized = [];
  var averageOfArray = mean(array);
  
  //standard deviation
  for (var i = 0; i < array.length; i++){
    square.push(Math.pow((array[i] - averageOfArray), 2));
  };
  squaredAverage = mean(square);
  stdDev = Math.sqrt(squaredAverage);

  //normalize
  for (var i = 0; i < array.length; i++){
    normalized.push((array[i] - averageOfArray)/stdDev)
  };
  return normalized

};

function frequencyExtract(fftArray, framerate){
	// Return the Discrete Fourier Transform sample frequencies.
	// returns the center of the FFT bins
	// blantantly ripped from numpy.fft.fftfreq(), but ported by JS by yours truly
	// could probably be optimized a bit
	

	//1. keep the first (FFT size/2 + 1) elements, truncate the rest
	//2. scale -- divide all elements by FFT size
	//3. fold -- leave the first element and the last unchanged and multiply all
	// other elements by 2
	//4. calculate the magnitude for each component (sq.root(real^2 + imaginary^2))
	//5. calculate (FFT size/2+1) values of frequency from 0 to Nyquist with a step of delta f

	var val, n, d, N;
	var p1 = [];
	var p2 = [];
	var results = [];
	var freqs = [];


	//from numpy.fft.fftfreq doc: "Sample spacing (inverse of the sampling rate). Defaults to 1. For instance, if the sample spacing is in seconds, then the frequency unit is cycles/second."
	// if my frequency is 15 fps, or 15 Hz, or every 66ms, then the sample spacing is .066 seconds (1/15)

	n = fftArray.length;
	d = 1.0/framerate;

	val = 1.0/(n * d);
	N = ((n - 1)/2 + 1) >> 0;

	for (var i = 0; i < N; i++){ p1.push(i) }

	for (var i = (-(n/2) >> 0); i < 0; i++) { p2.push(i) }
	
	results = p1.concat(p2)

	freqs = results.map( function(i){ return i * val })
	// console.log("freqs: ", freqs)

	return filterFreq(fftArray, freqs, framerate);
 }

function filterFreq(fftArray, freqs, framerate){
	// calculates the power spectra and returns 
	// the frequency, in Hz, of the most prominent 
	// frequency between 0.75 Hz and 3.3333 Hz (45 - 200 bpm)
	// console.log(freqs)
	var filteredFFT = [];
	var filteredFreqBin = [];

	var freqObj = _.object(freqs, fftArray);
	for (freq in freqObj){
		if ((freq > 0.75) && (freq < 3.333)){
			filteredFFT.push(freqObj[freq]);
			filteredFreqBin.push(freq);
		}
	}
	var normalizedFreqs = filteredFFT.map(function(i) {return Math.pow(Math.abs(i), 2)});

	var idx = _.indexOf(normalizedFreqs, _.max(normalizedFreqs));

	var freq_in_hertz = filteredFreqBin[idx]
	// console.log('freq: ', freq_in_hertz)
	return freq_in_hertz

}

// function cardiac(freq_in_hertz){
// 	return freq_in_hertz * 60;
// }