import jade
import numpy as np
import json

def parse_RGB(message):
	buffer_window = message["bufferWindow"]

	# # ** FOR GREEN CHANNEL ONLY **
	# X = np.array(message["array"])
	# X = normalize_array(X)
	# return json.dumps(parse_ICA_results(X, buffer_window))

	# ** FOR RGB CHANNELS & ICA **
	X = np.ndarray(shape = (3, buffer_window), buffer= np.array(message["array"]))
	X = normalize_matrix(X)
	ICA = jade.main(X)
	return json.dumps(parse_ICA_results(ICA, buffer_window)) #message["time"]


	

def parse_ICA_results(ICA, buffer_window): #time
	signals = {}
	signals["id"] = "ICA"
	signals["bufferWindow"] = buffer_window

	# ** FOR RGB CHANNELS & ICA **
	one = np.squeeze(np.asarray(ICA[:, 0])).tolist()
	two = np.squeeze(np.asarray(ICA[:, 1])).tolist()
	three = np.squeeze(np.asarray(ICA[:, 2])).tolist()
	
	one = (np.hamming(len(one)) * one)
	two = (np.hamming(len(two)) * two)
	three = (np.hamming(len(three)) * three)

	# print "one: ", one.astype(float).tolist()
	# print "two: ", two.astype(float).tolist()
	# print "three: ", three.astype(float).tolist()

	one = np.absolute(np.square(np.fft.irfft(one))).astype(float).tolist()
	two = np.absolute(np.square(np.fft.irfft(two))).astype(float).tolist()
	three = np.absolute(np.square(np.fft.irfft(three))).astype(float).tolist()

	power_ratio = [0, 0, 0]
	power_ratio[0] = np.sum(one)/np.amax(one)
	power_ratio[1] = np.sum(two)/np.amax(two)
	power_ratio[2] = np.sum(three)/np.amax(three)

	if np.argmax(power_ratio) == 0:
		signals["array"] = one
	elif np.argmax(power_ratio) == 1:
		signals["array"] = two
	else:
		signals["array"] = three

	# print power_ratio
	# print signals
	return signals

	# # ** FOR GREEN CHANNEL ONLY **
	# hamming = (np.hamming(len(ICA)) * ICA)
	# fft = np.fft.rfft(hamming)
	# fft = np.absolute(np.square(fft))
	# signals["array"] = fft.astype(float).tolist()

	# return signals


	# ** experiments **
	# ** for interpolation and hamming **
	# even_times = np.linspace(time[0], time[-1], len(time))
	# interpolated_two = np.interp(even_times, time, np.squeeze(np.asarray(ICA[:, 1])).tolist())
	# interpolated_two = np.hamming(len(time)) * interpolated_two
	# interpolated_two = interpolated_two - np.mean(interpolated_two)

	# signals["two"] = interpolated_two.tolist()

	# #fft = np.fft.rfft(np.squeeze(np.asarray(ICA[:, 1])))
	# #signals["two"] = fft.astype(float).tolist()


def normalize_matrix(matrix):
	# ** for matrix
	for array in matrix:
		average_of_array = np.mean(array)
		std_dev = np.std(array)

		for i in range(len(array)):
			array[i] = ((array[i] - average_of_array)/std_dev)
	return matrix

def normalize_array(array):
	#** for array
	average_of_array = np.mean(array)
	std_dev = np.std(array)

	for i in range(len(array)):
		array[i] = ((array[i] - average_of_array)/std_dev)
	return array