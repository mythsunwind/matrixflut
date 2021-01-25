from flask import Flask
from flask import current_app, request, escape, jsonify, render_template, redirect, url_for
import threading
from rgbmatrix import RGBMatrix, RGBMatrixOptions
import socket
import sys
import logging
from threading import Thread
from PIL import Image, ImageColor
import time

log = logging.getLogger('matrixflut')

# matrix settings
size = (64, 32)

# pixelflut server settings
host = ''
port = 1234

image = Image.new('RGB', size)
pixels = image.load()
lastpixels = [[],[]]

app = Flask(__name__)

def drawImage(matrix):
    global lastpixels
    global running

    while(running):
        time.sleep(0.2)
        if isDifferent(pixels, lastpixels):
            lastpixels = getPixels(pixels)
            matrix.SetImage(image, 0, 0)

def saveImage(image):
    image.save("out/out" + str(int(round(time.time() * 1000))) + ".bmp")

def readlineFromClient(matrix, client, address):
    # set a buffer size ( could be 2048 or 4096 / power of 2 )
    buffersize = 1024

    try:
        readline = client.makefile().readline


        while running:
            data = readline(buffersize).strip()
            if not data:
                break

            arguments = data.split()
            #log.info("DATA: " + str(arguments))
                
            if len(arguments) == 4:
                if arguments[0] == "PX":
                    color = arguments[3]
                    if len(color) == 8:
                        rgb = ImageColor.getcolor("#" + color, "RGBA")
                    else:
                        rgb = ImageColor.getcolor("#" + color, "RGB")
                    pixels[int(arguments[1]), int(arguments[2])] = rgb
            elif len(arguments) == 2:
                if arguments[0] == "BRIGHTNESS":
                    try:
                        brightness = int(arguments[1])
                        if brightness >= 0 and brightness <= 100:
                            matrix.brightness = brightness
                    except:
                        log.error('Brightness value is not a number')
            elif len(arguments) == 1:
                if arguments[0] == "SIZE":
                    client.send("SIZE {} {}\n".format(size[0], size[1]).encode())
                    break

    finally:
        client.close()
        log.info('CLIENT Disconnected:' + address[0] + ':' + str(address[1]) + '\n')

def isDifferent(pixels, lastpixels):
    for x in range(size[0]):
        for y in range(size[1]):
            try:
                lastpixel = lastpixels[x][y]
                if pixels[x, y] != lastpixel:
                   return True
            except IndexError:
                return True
    #log.info("Image not different")
    return False

def getPixels(pixels):
    array = []
    for x in range(size[0]):
        innerarray = []
        for y in range(size[1]):
            innerarray.append(1)
        array.append(innerarray)

    for x in range(size[0]):
        for y in range(size[1]):
            array[x][y] = pixels[x, y]
    return array

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/favicon.ico')
def favicon():
    return redirect(url_for('static', filename = 'favicon.ico'))

@app.route('/api/size')
def api_size():
    return jsonify(size)

@app.route('/api/pixels', methods=['GET']))
def api_pixels_get():
    return jsonify(getPixels(pixels))

@app.route('/api/pixels', methods=['POST']))
def api_pixels_set():
    json = request.get_json()
    log.info(json)
    return jsonify(getPixels(pixels))

def flaskThread():
    app.run()

if __name__ == "__main__":
    threading.Thread(target=app.run).start()

    global running
    running = True

    logging.basicConfig(level=logging.DEBUG)

    options = RGBMatrixOptions()
    options.rows = size[1]
    options.cols = size[0]
    options.row_address_type = 4
    options.hardware_mapping = "adafruit-hat"

    matrix = RGBMatrix(options = options)

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        s.bind((host, port))
    except OSError as error:
        log.error('SERVER: Bind failed. Error Code : ' + str(error))
        sys.exit()
	
    log.info('SERVER: Bind on %r:%r', host, port)

    s.listen(100)

    try:
        Thread(target=drawImage, args=(matrix, )).start()

        while(running):
            client, address = s.accept()
            log.info('CLIENT Connected: ' + address[0] + ':' + str(address[1]))
            Thread(target=readlineFromClient, args=(matrix, client, address)).start()
    except KeyboardInterrupt:
        running = False
        log.info("SERVER: Stopping...")
    finally:
        s.close()
