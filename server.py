from rgbmatrix import RGBMatrix, RGBMatrixOptions
from rgbmatrix import graphics
import socket
import sys
import logging
from threading import Thread
from PIL import Image, ImageColor
import time

log = logging.getLogger('matrixflut')

# matrix settings
size = (64, 32)

# server settings
host = ''
port = 1234
tick = 50 # in ms

def drawImage(matrix, image):
    matrix.SetImage(image, 0, 0)

def saveImage(image):
    image.save("out/out" + str(int(round(time.time() * 1000))) + ".bmp")

def readlineFromClient(matrix, client, address):
    # set a buffer size ( could be 2048 or 4096 / power of 2 )
    buffersize = 1024

    image = Image.new('RGB', size)
    pixels = image.load()

    try:

        readline = client.makefile().readline

        lastupdate = int(round(time.time() * 1000))

        while running:
            data = readline(buffersize).strip()
            if not data:
                break

            arguments = data.split()
            #log.info("DATA: " + str(arguments))
                
            if len(arguments) == 1:
                if arguments[0] == "SIZE":
                    client.send("SIZE {} {}\n".format(size[0], size[1]).encode())
                    break

            if len(arguments) == 4:
                if arguments[0] == "PX":
                    color = arguments[3]
                    if len(color) == 8:
                        rgb = ImageColor.getcolor("#" + color, "RGBA")
                    else:
                        rgb = ImageColor.getcolor("#" + color, "RGB")
                    pixels[int(arguments[1]), int(arguments[2])] = rgb

            if int(round(time.time() * 1000)) > (lastupdate + tick):
                lastupdate = int(round(time.time() * 1000))
                #log.info("TICK" + str(lastupdate))
                image.show()
                drawImage(matrix, image)

    finally:
        client.close()
        log.info('CLIENT Disconnected:' + address[0] + ':' + str(address[1]) + '\n')

if __name__ == '__main__':
    global running
    running = True

    logging.basicConfig(level=logging.DEBUG)

    options = RGBMatrixOptions()
    options.rows = size[1]
    options.cols = size[0]
    options.row_address_type = 4
    options.hardware_mapping = "adafruit-hat"

    matrix = RGBMatrix(options = options)

    font = graphics.Font()
    font.LoadFont("/home/pi/time/spleen-6x12.bdf")

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        s.bind((host, port))
    except OSError as error:
        log.error('SERVER: Bind failed. Error Code : ' + str(error))
        sys.exit()
	
    log.info('SERVER: Bind on %r:%r', host, port)

    s.listen(100)

    try:
        while(running):
            client, address = s.accept()
            log.info('CLIENT Connected: ' + address[0] + ':' + str(address[1]))
            Thread(target=readlineFromClient, args=(matrix, client, address)).start()
    except KeyboardInterrupt:
        running = False
        log.info("SERVER: Stopping...")
    finally:
        s.close()
