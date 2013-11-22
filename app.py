from flask import Flask, render_template, request
from flask_sockets import Sockets
import model

app = Flask(__name__)
sockets = Sockets(app)

@app.route("/")
def index():
	return render_template("index.html")

@sockets.route('/echo')
def echo_socket(ws):
	while True:
		message = ws.receive()
		# if len(message) <= 4:
		# 	buffer_window = message
		# else:
		signals = model.parse_RGB(message, 1024)
		ws.send(signals)
		# ws.send("received")
		# print message
		# flash(message)

if __name__ == "__main__":
    app.run(debug=True)