
function initTable() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/api/size');
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.responseType = 'json';

	xhr.onload = function () {
		if (xhr.status == 200) {
			response = xhr.response;
			width = Number(response[0]);
			height = Number(response[1]);
			for (let i = 0; i < height; i++) {
				var tr = document.createElement("tr");
				for (let j = 0; j < width; j++) {
					var td = document.createElement("td");
					td.setAttribute("id", "p" + i + "_"+ j);
					tr.appendChild(td);
				}
				document.querySelector('#matrix').appendChild(tr);
			}
			updateMatrix();
		}
	}
	xhr.send();
}

function updateMatrix() {
	var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/pixels');
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.responseType = 'json';

	xhr.onload = function () {
                if (xhr.status == 200) {
			response = xhr.response
			for (let y = 0; y < response.length; y++) {
				row = response[y];
				for(let x = 0; x < row.length; x++) {
					rgb = row[x]
					document.querySelector('#p' + x + '_' + y).setAttribute("style", "background-color: rgb(" + rgb[0] + ',' + rgb[1]+ ',' + rgb[2] + ')');
				}
			}
		}
	}
	xhr.send();
}

function componentToHex(c) {
	var hex = Number(c).toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
	var rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	return componentToHex(rgb[1]) + componentToHex(rgb[2]) + componentToHex(rgb[3]);
}

window.onload = function() {
	document.querySelector("#colorpicker").addEventListener('change', (event) => {
		const newcolor = event.target.value;
		if (newcolor != null) {
			document.querySelector("#hexcolor").value = newcolor.replace('#', '');
		}
	});
	document.querySelector("#hexcolor").addEventListener('change', (event) => {
		const newcolor = event.target.value;
		if (newcolor != null) {
                        document.querySelector("#colorpicker").value = "#" + newcolor;
                }
	});

	document.querySelectorAll(".btn").forEach(element => {
		element.addEventListener('click', (event) => {
			const button = event.target;
			style = window.getComputedStyle(button);
			const bgcolor = style.getPropertyValue('background-color');
			document.querySelector("#colorpicker").value = "#" + rgbToHex(bgcolor);
			document.querySelector("#hexcolor").value = rgbToHex(bgcolor);
		});
	});

	initTable();
	// TODO: implement refresh
	// setInterval("updateMatrix()", 10000);
}