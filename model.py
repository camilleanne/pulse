import ct_jade
import numpy as np
import json

def parse_RGB(message):
	buffer_window = message["bufferWindow"]
	X = np.ndarray(shape = (3, buffer_window), buffer= np.array(message["array"]))

	ICA = ct_jade.main(X)

	return json.dumps(parse_ICA_results(ICA, buffer_window)) #message["time"]

def parse_ICA_results(ICA, buffer_window): #time
	signals = {}
	# signals["one"] = np.squeeze(np.asarray(ICA[:, 0])).tolist()
	signals["two"] = np.squeeze(np.asarray(ICA[:, 1])).tolist()
	# signals["three"] = np.squeeze(np.asarray(ICA[:, 2])).tolist()
	signals["id"] = "ICA"
	signals["bufferWindow"] = buffer_window

	# even_times = np.linspace(time[0], time[-1], len(time))

	# interpolated_two = np.interp(even_times, time, np.squeeze(np.asarray(ICA[:, 1])).tolist())
	# interpolated_two = np.hamming(len(time)) * interpolated_two
	# interpolated_two = interpolated_two - np.mean(interpolated_two)

	# print "regular ica ", np.squeeze(np.asarray(ICA[:, 1])).tolist()
	# signals["two"] = interpolated_two.tolist()
	# print "interpolated ", signals["two"]


	# fft = np.fft.rfft(np.squeeze(np.asarray(ICA[:, 1])))
	# signals["two"] = fft.astype(float).tolist()
	# print signals["two"]


	return signals

