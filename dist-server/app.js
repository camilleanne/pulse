"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _path = _interopRequireDefault(require("path"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _morgan = _interopRequireDefault(require("morgan"));

var _index = _interopRequireDefault(require("./routes/index"));

var _splash = _interopRequireDefault(require("./routes/splash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var app = (0, _express["default"])();
app.use((0, _morgan["default"])('dev'));
app.use(_express["default"].json());
app.use(_express["default"].urlencoded({
  extended: false
}));
app.use((0, _cookieParser["default"])());
app.use(_express["default"]["static"](_path["default"].join(__dirname, '../public/')));
app.get('/', function (req, res) {
  res.sendFile(_path["default"].join(__dirname, '../public/splash.html'));
});
app.get('/begin', function (req, res) {
  res.sendFile(_path["default"].join(__dirname, '../public/index.html'));
});
/*
app.use('/index', indexRouter);
app.use('/splash', splashRouter);
*/

var _default = app;
exports["default"] = _default;