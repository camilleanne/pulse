from flask import Flask, render_template, request
from flask_sockets import Sockets
import model
import json

app = Flask(__name__)
sockets = Sockets(app)

@app.route("/")
def index():
	return render_template("splash.html")

@app.route("/begin")
def get_heartrate():
	return render_template("index.html")


@sockets.route('/echo')
def echo_socket(ws):
	while True:
		message = json.loads(ws.receive())
		signals = model.parse_RGB(message)
		
		ws.send(signals)

if __name__ == "__main__":
	app.run(debug = True)