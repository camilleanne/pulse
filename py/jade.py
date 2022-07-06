#!/usr/bin/env python
#######################################################################
# jadeR.py -- Blind source separation of real signals
#
# Version 1.8
#
# Copyright 2005, Jean-Francois Cardoso (Original MATLAB code)
# Copyright 2007, Gabriel J.L. Beckers (NumPy translation)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#######################################################################

# This file can be either used from the command line (type
# 'python jadeR.py --help' for usage, or see docstring of function main below)
# or it can be imported as a module in a python shell or program (use
# 'import jadeR').

# Comments in this source file are from the original MATLAB program, unless they
# are preceded by 'GB'.


"""
jadeR

This module contains only one function, jadeR, which does blind source
separation of real signals. Hopefully more ICA algorithms will be added
in the future.

jadeR requires NumPy.
"""

from numpy import abs, append, arange, arctan2, argsort, array, concatenate, \
	cos, diag, dot, eye, float32, float64, loadtxt, matrix, multiply, ndarray, \
	newaxis, savetxt, sign, sin, sqrt, zeros
from numpy.linalg import eig, pinv

def jadeR(X):
	"""
	Blind separation of real signals with JADE.

	jadeR implements JADE, an Independent Component Analysis (ICA) algorithm
	developed by Jean-Francois Cardoso. More information about JADE can be
	found among others in: Cardoso, J. (1999) High-order contrasts for
	independent component analysis. Neural Computation, 11(1): 157-192. Or
	look at the website: http://www.tsi.enst.fr/~cardoso/guidesepsou.html
	
	More information about ICA can be found among others in Hyvarinen A.,
	Karhunen J., Oja E. (2001). Independent Component Analysis, Wiley. Or at the
	website http://www.cis.hut.fi/aapo/papers/IJCNN99_tutorialweb/

	Translated into NumPy from the original Matlab Version 1.8 (May 2005) by
	Gabriel Beckers, http://gbeckers.nl .

	Parameters:

		X -- an n x T data matrix (n sensors, T samples). Must be a NumPy array
			 or matrix.

		m -- number of independent components to extract. Output matrix B will
			 have size m x n so that only m sources are extracted. This is done
			 by restricting the operation of jadeR to the m first principal
			 components. Defaults to None, in which case m == n.

		verbose -- print info on progress. Default is False.

	Returns:

		An m*n matrix B (NumPy matrix type), such that Y = B * X are separated
		sources extracted from the n * T data matrix X. If m is omitted, B is a
		square n * n matrix (as many sources as sensors). The rows of B are
		ordered such that the columns of pinv(B) are in order of decreasing
		norm; this has the effect that the `most energetically significant`
		components appear first in the rows of Y = B * X.

	Quick notes (more at the end of this file):

	o This code is for REAL-valued signals.  A MATLAB implementation of JADE
		for both real and complex signals is also available from
		http://sig.enst.fr/~cardoso/stuff.html

	o This algorithm differs from the first released implementations of
		JADE in that it has been optimized to deal more efficiently
		1) with real signals (as opposed to complex)
		2) with the case when the ICA model does not necessarily hold.

	o There is a practical limit to the number of independent
		components that can be extracted with this implementation.  Note
		that the first step of JADE amounts to a PCA with dimensionality
		reduction from n to m (which defaults to n).  In practice m
		cannot be `very large` (more than 40, 50, 60... depending on
		available memory)

	o See more notes, references and revision history at the end of
		this file and more stuff on the WEB
		http://sig.enst.fr/~cardoso/stuff.html

	o For more info on NumPy translation, see the end of this file.

	o This code is supposed to do a good job!  Please report any
		problem relating to the NumPY code gabriel@gbeckers.nl

	Copyright original Matlab code: Jean-Francois Cardoso <cardoso@sig.enst.fr>
	Copyright Numpy translation: Gabriel Beckers <gabriel@gbeckers.nl>
	"""

	# GB: we do some checking of the input arguments and copy data to new
	# variables to avoid messing with the original input. We also require double
	# precision (float64) and a numpy matrix type for X.

	origtype = X.dtype #float64

	X = matrix(X.astype(float64)) #create a matrix from a copy of X created as a float 64 array
	
	[n,T] = X.shape

	m = n

	X -= X.mean(1)

	# whitening & projection onto signal subspace
	# -------------------------------------------

	# An eigen basis for the sample covariance matrix
	[D,U] = eig((X * X.T) / float(T))
	# Sort by increasing variances
	k = D.argsort()
	Ds = D[k]

	# The m most significant princip. comp. by decreasing variance
	PCs = arange(n-1, n-m-1, -1)


	#PCA
	# At this stage, B does the PCA on m components
	B = U[:,k[PCs]].T

	# --- Scaling ---------------------------------
	# The scales of the principal components
	scales = sqrt(Ds[PCs])
	B = diag(1./scales) * B
	#Sphering
	X = B * X

	# We have done the easy part: B is a whitening matrix and X is white.

	del U, D, Ds, k, PCs, scales

	# NOTE: At this stage, X is a PCA analysis in m components of the real
	# data, except that all its entries now have unit variance. Any further
	# rotation of X will preserve the property that X is a vector of
	# uncorrelated components. It remains to find the rotation matrix such
	# that the entries of X are not only uncorrelated but also `as independent
	# as possible". This independence is measured by correlations of order
	# higher than 2. We have defined such a measure of independence which 1)
	# is a reasonable approximation of the mutual information 2) can be
	# optimized by a `fast algorithm" This measure of independence also
	# corresponds to the `diagonality" of a set of cumulant matrices. The code
	# below finds the `missing rotation " as the matrix which best
	# diagonalizes a particular set of cumulant matrices.

	#Estimation of Cumulant Matrices
	#-------------------------------

	# Reshaping of the data, hoping to speed up things a little bit...
	X = X.T #transpose data to (256, 3)
	# Dim. of the space of real symm matrices
	dimsymm = (m * (m + 1)) / 2 #6
	# number of cumulant matrices
	nbcm = dimsymm #6
	# Storage for cumulant matrices
	CM = matrix(zeros([m, m*nbcm], dtype = float64))
	R = matrix(eye(m, dtype=float64)) #[[ 1.  0.  0.] [ 0.  1.  0.] [ 0.  0.  1.]]
	# Temp for a cum. matrix
	Qij = matrix(zeros([m, m], dtype = float64))
	# Temp
	Xim = zeros(m, dtype=float64)
	# Temp
	Xijm = zeros(m, dtype=float64)

	# I am using a symmetry trick to save storage. I should write a short note
	# one of these days explaining what is going on here.
	# will index the columns of CM where to store the cum. mats.
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

	# Now we have nbcm = m(m+1)/2 cumulants matrices stored in a big
	# m x m*nbcm array.


	# Joint diagonalization of the cumulant matrices
	# ==============================================

	V = matrix(eye(m, dtype=float64)) #[[ 1.  0.  0.] [ 0.  1.  0.] [ 0.  0.  1.]]

	Diag = zeros(m, dtype=float64) #[0. 0. 0.]
	On = 0.0
	Range = arange(m) #[0 1 2]
	for im in range(nbcm): #nbcm == 6
		Diag = diag(CM[:,Range])
		On = On + (Diag * Diag).sum(axis = 0)
		Range = Range + m
	Off = (multiply(CM,CM).sum(axis=0)).sum(axis=0) - On
	# A statistically scaled threshold on `small" angles
	seuil = 1.0e-6 / sqrt(T) #6.25e-08
	# sweep number
	encore = True
	sweep = 0
	# Total number of rotations
	updates = 0
	# Number of rotations in a given seep
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

	# Permute the rows of the separating matrix B to get the most energetic
	# components first. Here the **signals** are normalized to unit variance.
	# Therefore, the sort is according to the norm of the columns of
	# A = pinv(B)
	
	A = pinv(B) #[[-3.35031851 -2.14563715  0.60277625] [-2.49989794 -1.25230985 -0.0835184 ] [-2.49501641 -0.67979249  0.12907178]]
	keys = array(argsort(multiply(A,A).sum(axis=0)[0]))[0] #[2 1 0]
	B = B[keys,:] #[[ 1.12505903 -2.42824508  0.92226197] [-0.41923305 -0.84589716  1.41050008] [ 0.17242566  0.10485568 -0.7373937 ]]
	B = B[::-1,:] #[[ 0.17242566  0.10485568 -0.7373937 ] [-0.41923305 -0.84589716  1.41050008] [ 1.12505903 -2.42824508  0.92226197]]
	# just a trick to deal with sign == 0
	b = B[:,0] #[[ 0.17242566] [-0.41923305] [ 1.12505903]]
	signs = array(sign(sign(b)+0.1).T)[0] #[1. -1. 1.]
	B = diag(signs) * B #[[ 0.17242566  0.10485568 -0.7373937 ] [ 0.41923305  0.84589716 -1.41050008] [ 1.12505903 -2.42824508  0.92226197]]
	return B


	# Revision history of MATLAB code:

	# - V1.8, December 2013
	#  - modifications to main function for demo by Camille Teicheira
	#  - also added inline comments of expected outputs for demo data
	#  - demo here: http://github.com/camilleanne/pulsation
	#
	#- V1.8, May 2005
	#  - Added some commented code to explain the cumulant computation tricks.
	#  - Added reference to the Neural Comp. paper.
	#
	#-  V1.7, Nov. 16, 2002
	#   - Reverted the mean removal code to an earlier version (not using 
	#     repmat) to keep the code octave-compatible.  Now less efficient,
	#     but does not make any significant difference wrt the total 
	#     computing cost.
	#   - Remove some cruft (some debugging figures were created.  What 
	#     was this stuff doing there???)
	#
	#
	#-  V1.6, Feb. 24, 1997 
	#   - Mean removal is better implemented.
	#   - Transposing X before computing the cumulants: small speed-up
	#   - Still more comments to emphasize the relationship to PCA
	#
	#   V1.5, Dec. 24 1997
	#   - The sign of each row of B is determined by letting the first element 
	#     be positive.
	#
	#-  V1.4, Dec. 23 1997 
	#   - Minor clean up.
	#   - Added a verbose switch
	#   - Added the sorting of the rows of B in order to fix in some reasonable
	#     way the permutation indetermination.  See note 2) below.
	#
	#-  V1.3, Nov.  2 1997 
	#   - Some clean up.  Released in the public domain.
	#
	#-  V1.2, Oct.  5 1997 
	#   - Changed random picking of the cumulant matrix used for initialization 
	#     to a deterministic choice.  This is not because of a better rationale 
	#     but to make the ouput (almost surely) deterministic.
	#   - Rewrote the joint diag. to take more advantage of Matlab"s tricks.
	#   - Created more dummy variables to combat Matlab"s loose memory 
	#     management.
	#
	#-  V1.1, Oct. 29 1997.
	#    Made the estimation of the cumulant matrices more regular. This also 
	#    corrects a buglet...
	#
	#-  V1.0, Sept. 9 1997. Created.
	#
	# Main references:
	# @article{CS-iee-94,
	#  title 	= "Blind beamforming for non {G}aussian signals",
	#  author       = "Jean-Fran\c{c}ois Cardoso and Antoine Souloumiac",
	#  HTML 	= "ftp://sig.enst.fr/pub/jfc/Papers/iee.ps.gz",
	#  journal      = "IEE Proceedings-F",
	#  month = dec, number = 6, pages = {362-370}, volume = 140, year = 1993}
	#
	#
	#@article{JADE:NC,
	#  author  = "Jean-Fran\c{c}ois Cardoso",
	#  journal = "Neural Computation",
	#  title   = "High-order contrasts for independent component analysis",
	#  HTML    = "http://www.tsi.enst.fr/~cardoso/Papers.PS/neuralcomp_2ppf.ps",
	#  year    = 1999, month = jan, volume = 11, number = 1, pages = "157-192"}
	#
	#
	#  Notes:
	#  ======
	#
	#  Note 1) The original Jade algorithm/code deals with complex signals in
	#  Gaussian noise white and exploits an underlying assumption that the
	#  model of independent components actually holds. This is a reasonable
	#  assumption when dealing with some narrowband signals. In this context,
	#  one may i) seriously consider dealing precisely with the noise in the
	#  whitening process and ii) expect to use the small number of significant
	#  eigenmatrices to efficiently summarize all the 4th-order information.
	#  All this is done in the JADE algorithm.
	#
	#  In *this* implementation, we deal with real-valued signals and we do
	#  NOT expect the ICA model to hold exactly. Therefore, it is pointless to
	#  try to deal precisely with the additive noise and it is very unlikely
	#  that the cumulant tensor can be accurately summarized by its first n
	#  eigen-matrices. Therefore, we consider the joint diagonalization of the
	#  *whole* set of eigen-matrices. However, in such a case, it is not
	#  necessary to compute the eigenmatrices at all because one may
	#  equivalently use `parallel slices" of the cumulant tensor. This part
	#  (computing the eigen-matrices) of the computation can be saved: it
	#  suffices to jointly diagonalize a set of cumulant matrices. Also, since
	#  we are dealing with reals signals, it becomes easier to exploit the
	#  symmetries of the cumulants to further reduce the number of matrices to
	#  be diagonalized. These considerations, together with other cheap tricks
	#  lead to this version of JADE which is optimized (again) to deal with
	#  real mixtures and to work `outside the model'. As the original JADE
	#  algorithm, it works by minimizing a `good set' of cumulants.
	#
	#  Note 2) The rows of the separating matrix B are resorted in such a way
	#  that the columns of the corresponding mixing matrix A=pinv(B) are in
	#  decreasing order of (Euclidian) norm. This is a simple, `almost
	#  canonical" way of fixing the indetermination of permutation. It has the
	#  effect that the first rows of the recovered signals (ie the first rows
	#  of B*X) correspond to the most energetic *components*. Recall however
	#  that the source signals in S=B*X have unit variance. Therefore, when we
	#  say that the observations are unmixed in order of decreasing energy,
	#  this energetic signature is to be found as the norm of the columns of
	#  A=pinv(B) and not as the variances of the separated source signals.
	#
	#  Note 3) In experiments where JADE is run as B=jadeR(X,m) with m varying
	#  in range of values, it is nice to be able to test the stability of the
	#  decomposition. In order to help in such a test, the rows of B can be
	#  sorted as described above. We have also decided to fix the sign of each
	#  row in some arbitrary but fixed way. The convention is that the first
	#  element of each row of B is positive.
	#
	#  Note 4) Contrary to many other ICA algorithms, JADE (or least this
	#  version) does not operate on the data themselves but on a statistic
	#  (the full set of 4th order cumulant). This is represented by the matrix
	#  CM below, whose size grows as m^2 x m^2 where m is the number of
	#  sources to be extracted (m could be much smaller than n). As a
	#  consequence, (this version of) JADE will probably choke on a `large'
	#  number of sources. Here `large' depends mainly on the available memory
	#  and could be something like 40 or so. One of these days, I will prepare
	#  a version of JADE taking the `data' option rather than the `statistic'
	#  option.

	# Notes on translation (GB):
	# =========================
	#
	# Note 1) The function jadeR is a relatively literal translation from the
	# original MATLAB code. I haven't really looked into optimizing it for
	# NumPy. If you have any time to look at this and good ideas, let me know.
	#
	# Note 2) A test module that compares NumPy output with Octave (MATLAB
	# clone) output of the original MATLAB script is available



def main(X):
	B = jadeR(X)
	Y = B * matrix(X)
	return Y.T

	# B = B.astype(origtype)
	# savetxt("ct_jade_data.txt", Y.T)