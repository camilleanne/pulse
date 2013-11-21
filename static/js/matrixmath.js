// some naive solutions for some basic matrix math funcions using TypedArrays
// open to much memory optimization, I'm sure.

// example arrays
var a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

var x = new Float64Array(a.length);

x.set(a);

var X = new Matrix(x, 3, 4);

//create Matrix obj, keeps dimension metadata handy
function Matrix(array, r, c){
    this.array = array;
    this.r = r;
    this.c = c;

}

function transpose(matrix){
    var ai = 0;
    var arrayT = new Float64Array(matrix.array.length);
    for (var i = 0; i < matrix.c; i++){
        for (var i2 = 0; i2 < matrix.array.length; i2+=matrix.c){
            arrayT[ai] = matrix.array[i2+i];
            ai++;
        }
    }
    return new Matrix(arrayT, matrix.c, matrix.r);
}

function getSection(matrix, r, c){
    if (typeof r === "undefined" || r === null){ r = -1; }
    if (typeof c === "undefined" || c === null){ c = -1; }
    
    if (c >= 0 && r < 0){
        //return a column
        var ci = c;
        var ce = matrix.r;
        var col = [];
        for (var i = ci; i < matrix.array.length; i += matrix.c){ 
            col.push(i)
        }
        return col
    } else if (c < 0 && r >= 0){
        //return a row
        var ri = r * matrix.c;
        var re = ri + matrix.c;
        var row = [];
        for (var i = ri; i < re; i++){ row.push(i) }
        return row
    } else if (c >= 0 && r >= 0){
        //return a cell based on row + column
        return ((r * matrix.c) + (c))
    } else {
        return "error"
    }
}

function matrixMultiply(matrix1, matrix2){
    //multiply two matrices
    if (matrix1.c != matrix2.r){
        return "error: inner dimensions are not the same"
    } else {
        var multArray = [];
        var matrixArray = new Float64Array(matrix1.r * matrix2.c)
        var ai = 0;
        for (var i = 0; i < matrix.r; i ++){
             var workingRow = getSection(matrix1, i, null)
             for (var i2 = 0; i2 < matrix2.c; i2 ++){
                var workingCol = getSection(matrix2, null, i2)
                var temp = 0;
                for (var i3 = 0; i3 < matrix1.c; i3++){
                    temp = temp + (matrix1.array[workingRow[i3]] * matrix2.array[workingCol[i3]])
                }
              multArray.push(temp)
            }   
        }
    matrixArray.set(multArray)
    return new Matrix(matrixArray, matrix1.r, matrix2.c);
    }
}