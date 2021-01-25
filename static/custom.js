let unsaved = new Set();
let mousedown = false;

var hoverOverPixel = function() {
	if (mousedown) {
		unsaved.add(this.id);
		document.querySelector("#unsaved").style.display = "block";
		const bgcolor = document.querySelector("#colorpicker").value;
		this.style.setProperty('background-color', bgcolor);
	}
}

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
					td.onmouseover = hoverOverPixel
					// prevent dragging the element
					td.onmousedown = function() { return false };
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
	document.querySelector("#loading").style.display = "block";

	var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/pixels');
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.responseType = 'json';

	xhr.onload = function () {
                if (xhr.status == 200) {
			response = xhr.response
			for (let y = 0; y < response.length; y++) {
				let row = response[y];
				for(let x = 0; x < row.length; x++) {
					let rgb = row[x]
					let id = 'p' + x + '_' + y
					if (!unsaved.has(id)) {
						document.querySelector('#' + id).setAttribute("style", "background-color: rgb(" + rgb[0] + ',' + rgb[1]+ ',' + rgb[2] + ')');
					}
				}
			}
			document.querySelector("#loading").style.display = "none";
		}
	}
	xhr.onerror = function() {
		document.querySelector("#loading").style.display = "none";
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

	document.querySelectorAll(".btn-color").forEach(element => {
		element.addEventListener('click', (event) => {
			const button = event.target;
			style = window.getComputedStyle(button);
			const bgcolor = style.getPropertyValue('background-color');
			document.querySelector("#colorpicker").value = "#" + rgbToHex(bgcolor);
			document.querySelector("#hexcolor").value = rgbToHex(bgcolor);
		});
	});
	document.querySelector("#revert").addEventListener('click', (event) => {
		document.querySelector("#unsaved").style.display = "none";
		unsaved = new Set();
		updateMatrix();
	});
	document.querySelector("#save").addEventListener('click', (event) => {
		if (unsaved.size > 0) {
			px = [];
			for (item of unsaved) {
				const bgcolor = document.querySelector("#" + item).style.getPropertyValue("background-color");
				const hex = rgbToHex(bgcolor);
				item = item.replace('p', '');
				height = item.split('_')[0];
				width = item.split('_')[1];
				px.push("PX " + width + "" + height + " " + hex);
			}
			var xhr = new XMLHttpRequest();
			xhr.open('POST', '/api/pixels', true);
			xhr.setRequestHeader("Content-Type", "application/json");

			xhr.onload = function () {
				document.querySelector("#unsaved").style.display = "none";
				unsaved = new Set();
				updateMatrix();
			};
			xhr.onerror = function () {
				// show error somewhere
				alert("Error while saving")
			}

			xhr.send(JSON.stringify(px));
		}
	});

	// identify if mouse pressed or not
	document.onmousedown = function() { mousedown = true };
	document.onmouseup = function() { mousedown = false };

	// show dialog if unsaved changes
	window.onbeforeunload = function() {
		if (unsaved.size > 0) {
			return "There are unsaved changes.";
		} else {
			return;
		}
	};

	document.querySelector("#unsaved").style.display = "none";
	document.querySelector("#loading").style.display = "none";

	initTable();
	setInterval("updateMatrix()", 10000);
}
