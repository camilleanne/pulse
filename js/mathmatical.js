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
	
	var val, n, d, results, N;
	var p1 = [];
	var p2 = [];
	var freqs = [];

	n = fftArray.length;
	d = 1.0;

	val = 1.0/(n * d);
	results = new Array(n);
	N = ((n - 1)/2 + 1) >> 0;
	for (var i = 0; i < N; i++){ p1.push(i) };
	results = p1.concat(results.slice(0, N));
	for (var i = (-(n/2) >> 0); i < 0; i++) { p2.push(i) };
	results = (results.slice(0,N)).concat(p2);
	freqs = results.map( function(i){ return i * val });
	// console.log("freqs: ",freqs)

	return filterFreq(fftArray, freqs, framerate);
}

function filterFreq(fftArray, freqs, framerate){
	// calculates the power spectra and returns 
	// the frequency, in Hz, of the most prominent 
	// frequency between 0.4 Hz and 4 Hz (45 - 240 bpm)

	var filtered = [];
	var freqObj = _.object(freqs, fftArray);

	for (freq in freqObj){
		if ((freq > 0.4) && (freq < 4.0)){
			filtered.push(freqObj[freq]);
		}
	}
	// console.log('filtered: ',filtered)
	var fft_power =  filtered.map(function(i) {return Math.pow(Math.abs(i), 2)});
	// console.log('fft_power: ', fft_power)
	var idx = _.indexOf(fft_power, _.max(fft_power));
	// console.log('idx: ', idx)

	var freq = freqs[idx]
	// console.log('freq: ', freq)
	var freq_in_hertz = Math.abs(freq * framerate)
	// console.log('freq_in_hertz: ', freq_in_hertz)

	// return cardiac(freq_in_hertz)
	return freq_in_hertz
}

function cardiac(freq_in_hertz){
	return freq_in_hertz * 60;
}