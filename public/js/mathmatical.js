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
	
	var squaredAverage = mean(square);
	var stdDev = Math.sqrt(squaredAverage);

	//normalize
	for (var i = 0; i < array.length; i++){
		normalized.push((array[i] - averageOfArray)/stdDev)
	};
	
	return normalized;

};

function frequencyExtract(fftArray, framerate){
	// Return the Discrete Fourier Transform sample frequencies.
	// returns the center of the FFT bins
	// blantantly ripped from numpy.fft.fftfreq(), but ported by JS by yours truly
	
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
	results = p1.concat(p2);
	freqs = results.map( function(i){ return i * val });

	return filterFreq(fftArray, freqs, framerate);
 }

function filterFreq(fftArray, freqs, framerate){
	// calculates the power spectra and returns 
	// the frequency, in Hz, of the most prominent 
	// frequency between 0.75 Hz and 3.3333 Hz (45 - 200 bpm)
	var filteredFFT = [];
	var filteredFreqBin = [];

	var freqObj = _.object(freqs, fftArray);
	for (freq in freqObj){
		if ((freq > 0.80) && (freq < 3)){
			filteredFFT.push(freqObj[freq]);
			filteredFreqBin.push((freq)/1);
		}
	}
	var normalizedFreqs = filteredFFT.map(function(i) {return Math.pow(Math.abs(i), 2)});
	var idx = _.indexOf(normalizedFreqs, _.max(normalizedFreqs));
	var freq_in_hertz = filteredFreqBin[idx];
	
	freqs = {normalizedFreqs: normalizedFreqs, filteredFreqBin: filteredFreqBin, freq_in_hertz: freq_in_hertz}
	return freqs;
}