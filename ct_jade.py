from numpy import abs, append, arange, arctan2, argsort, array, concatenate, \
    cos, diag, dot, eye, float32, float64, loadtxt, matrix, multiply, ndarray, \
    newaxis, savetxt, sign, sin, sqrt, zeros
from numpy.linalg import eig, pinv

def jadeR(X):

	origtype = X.dtype #float64

	X = matrix(X.astype(float64)) #create a matrix from a copy of X created as a float 64 array
	
	[n,T] = X.shape #[3, 256]

	m = n #3

	X -= X.mean(1) #[[ 31.22510847] [ 22.12086108] [ 18.80773033]]

	# whitening & projection onto signal subspace
	# -------------------------------------------

	[D,U] = eig((X * X.T) / float(T)) #D== [ 30.11048366   0.50418474   0.10569292], U == [[-0.72856939 -0.63185736  0.26446724] [-0.50647283  0.23699113 -0.82904793] [-0.46116364  0.73796442  0.49268307]]
	k = D.argsort() #[2 1 0]
	Ds = D[k] #[  0.10569292   0.50418474  30.11048366]
	PCs = arange(n-1, n-m-1, -1) #[2 1 0] 

	#PCA
	B = U[:,k[PCs]].T #[[-0.72856939 -0.50647283 -0.46116364] [-0.63185736  0.23699113  0.73796442] [ 0.26446724 -0.82904793  0.49268307]]
	#scaling
	scales = sqrt(Ds[PCs]) #[ 5.48730204  0.71005968  0.32510447]
	B = diag(1./scales) * B #[[-0.1327737  -0.09229906 -0.08404196]  [-0.88986514  0.33376228  1.03929915] [ 0.81348384 -2.55009696  1.51546076]]
	#Sphering
	X = B * X #X.shape == (3, 256)

	del U, D, Ds, k, PCs, scales

	#Estimation of Cumulant Matrices
	#-------------------------------

	X = X.T #transpose data to (256, 3)
	dimsymm = (m * (m + 1)) / 2 #6
	nbcm = dimsymm #6
	CM = matrix(zeros([m, m*nbcm], dtype = float64))
	R = matrix(eye(m, dtype=float64)) #[[ 1.  0.  0.] [ 0.  1.  0.] [ 0.  0.  1.]]
	Qij = matrix(zeros([m, m], dtype = float64))
	Xim = zeros(m, dtype=float64)
	Xijm = zeros(m, dtype=float64)

	Range = arange(m) #[0 1 2]

	for im in range(m):
	    Xim = X[:,im]
	    Xijm = multiply(Xim, Xim)
	    Qij = multiply(Xijm, X).T * X / float(T) - R - 2 * dot(R[:,im], R[:,im].T)
	    CM[:,Range] = Qij
	    Range = Range + m
	    for jm in range(im):
	        Xijm = multiply(Xim, X[:,jm])
	        Qij = sqrt(2) * multiply(Xijm, X).T * X / float(T) - R[:,im] * R[:,jm].T - R[:,jm] * R[:,im].T
	        CM[:,Range] = Qij
	        Range = Range + m

	V = matrix(eye(m, dtype=float64)) #[[ 1.  0.  0.] [ 0.  1.  0.] [ 0.  0.  1.]]

	Diag = zeros(m, dtype=float64) #[0. 0. 0.]
	On = 0.0
	Range = arange(m) #[0 1 2]
	for im in range(nbcm): #nbcm == 6
	    Diag = diag(CM[:,Range])
	    On = On + (Diag * Diag).sum(axis = 0)
	    Range = Range + m
	Off = (multiply(CM,CM).sum(axis=0)).sum(axis=0) - On

	seuil = 1.0e-6 / sqrt(T) #6.25e-08
	encore = True
	sweep = 0
	updates = 0
	upds = 0
	g = zeros([2,nbcm], dtype=float64) #[[ 0.  0.  0.  0.  0.  0.] [ 0.  0.  0.  0.  0.  0.]]
	gg = zeros([2,2], dtype=float64) #[[ 0.  0.]  [ 0.  0.]]
	G = zeros([2,2], dtype=float64)
	c = 0
	s = 0
	ton = 0
	toff = 0
	theta = 0
	Gain = 0

	# Joint diagonalization proper

	while encore:
	    encore = False
	    sweep = sweep + 1
	    upds = 0
	    Vkeep = V
	    
	    for p in range(m-1): #m == 3
	        for q in range(p+1, m): #p == 1 | range(p+1, m) == [2]
	            
	            Ip = arange(p, m*nbcm, m) #[ 0  3  6  9 12 15] [ 0  3  6  9 12 15] [ 1  4  7 10 13 16]
	            Iq = arange(q, m*nbcm, m) #[ 1  4  7 10 13 16] [ 2  5  8 11 14 17] [ 2  5  8 11 14 17]
	            
	            #computation of Givens angle
	            g = concatenate([CM[p, Ip] - CM[q, Iq], CM[p, Iq] + CM[q, Ip]])
	            gg = dot(g, g.T)
	            ton = gg[0,0] - gg[1,1] # -6.54012319852 4.44880758012 -1.96674621935
	            toff = gg[0, 1] + gg[1, 0] # -15.629032394 -4.3847687273 6.72969915184
	            theta = 0.5 * arctan2(toff, ton + sqrt(ton * ton + toff * toff)) #-0.491778606993 -0.194537202087 0.463781701868
	            Gain = (sqrt(ton * ton + toff * toff) - ton) / 4.0 #5.87059352069 0.449409565866 2.24448683877
	            
	            if abs(theta) > seuil:
	                encore = True
	                upds = upds + 1
	                c = cos(theta) 
	                s = sin(theta)
	                G = matrix([[c, -s] , [s, c] ]) # DON"T PRINT THIS! IT"LL BREAK THINGS! HELLA LONG
	                pair = array([p, q]) #don't print this either
	                V[:,pair] = V[:,pair] * G
	                CM[pair,:] = G.T * CM[pair,:]
	                CM[:, concatenate([Ip, Iq])] = append( c*CM[:,Ip]+s*CM[:,Iq], -s*CM[:,Ip]+c*CM[:,Iq], axis=1)
	                On = On + Gain
	                Off = Off - Gain
	    updates = updates + upds #3 6 9 9

	# A separating matrix
	# -------------------

	B = V.T * B #[[ 0.17242566  0.10485568 -0.7373937 ] [-0.41923305 -0.84589716  1.41050008]  [ 1.12505903 -2.42824508  0.92226197]]

	A = pinv(B) #[[-3.35031851 -2.14563715  0.60277625] [-2.49989794 -1.25230985 -0.0835184 ] [-2.49501641 -0.67979249  0.12907178]]
	keys = array(argsort(multiply(A,A).sum(axis=0)[0]))[0] #[2 1 0]
	B = B[keys,:] #[[ 1.12505903 -2.42824508  0.92226197] [-0.41923305 -0.84589716  1.41050008] [ 0.17242566  0.10485568 -0.7373937 ]]
	B = B[::-1,:] #[[ 0.17242566  0.10485568 -0.7373937 ] [-0.41923305 -0.84589716  1.41050008] [ 1.12505903 -2.42824508  0.92226197]]
	b = B[:,0] #[[ 0.17242566] [-0.41923305] [ 1.12505903]]
	signs = array(sign(sign(b)+0.1).T)[0] #[1. -1. 1.]
	B = diag(signs) * B #[[ 0.17242566  0.10485568 -0.7373937 ] [ 0.41923305  0.84589716 -1.41050008] [ 1.12505903 -2.42824508  0.92226197]]
	return B
def main(X):
	B = jadeR(X)
	Y =  B * matrix(X)
	return Y.T

	# B = B.astype(origtype)
	# savetxt("ct_jade_data.txt", Y.T)