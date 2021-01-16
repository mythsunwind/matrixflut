# matrixflut
Simple python server for accessing a RGB matrix via Pixelflut protocol

## Pixelflut protocol

Pixelflut is a very simple (and inefficient) ASCII based network protocol to draw pixels on a screen. It is described [here](https://cccgoe.de/wiki/Pixelflut) and [here](https://github.com/defnull/pixelflut).

## Supported protocol features

matrixflut currently supports only these basic commands:

* `SIZE`: Returns the size of the visible canvas in pixel as `SIZE <w> <h>`
* `PX <x> <y> <rrggbb(aa)>`: Draw a single pixel at position (x, y) with the specified hex color code
* `BRIGHTNESS <number>`: A brightness value between 0 and 100

## How to start

`python3 server.py` 

## Further reading

Based on https://github.com/defnull/pixelflut
