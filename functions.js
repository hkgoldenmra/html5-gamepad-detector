function templateReId(gamepad, elements){
	for (var i = 0; i < elements.length; i++){
		if (elements[i].id != ''){
			elements[i].id = 'gamepad-' + gamepad.index + '-' + elements[i].id;
		}
	}
}

function connectHandler(event){
	addGamepad(event.gamepad);
}

function addGamepad(gamepad){
	var style = document.getElementById('gamepad-style').value;
	var div = document.getElementById(style + '-gamepad-template').cloneNode(true);
	div.id = 'gamepad-' + gamepad.index;
	div.style.display = '';
	templateReId(gamepad, div.getElementsByTagName('path'));
	templateReId(gamepad, div.getElementsByTagName('rect'));
	templateReId(gamepad, div.getElementsByTagName('circle'));
	templateReId(gamepad, div.getElementsByTagName('ellipse'));
	templateReId(gamepad, div.getElementsByTagName('polygon'));
	templateReId(gamepad, div.getElementsByTagName('textarea'));
	document.body.appendChild(div);
	var driver = gamepad.id;
	var index = 0;
	if ((index = driver.lastIndexOf(' (')) >= 0){
		driver = driver.substring(0, index);
	}
	if ((index = driver.lastIndexOf(') ')) >= 0){
		driver = driver.substring(index + 2);
	}
	if ((index = driver.lastIndexOf('-')) >= 0){
		driver = driver.substring(index + 1);
	}
	var textarea = document.getElementById(div.id + '-info');
	textarea.value = '';
	textarea.value += "index = " + gamepad.index;
	textarea.value += "\ndriver (long) = " + gamepad.id;
	textarea.value += "\ndriver (short) = " + driver;
	textarea.value += "\nbuttons = " + gamepad.buttons.length;
	textarea.value += "\naxes = " + gamepad.axes.length;
	gamepad['driver'] = driver;
	gamepad['extend'] = 10;
	var l3 = document.getElementById(div.id + '-button-l3');
	if (l3 != null){
		gamepad['l3'] = {};
		gamepad['l3']['cx'] = l3.getAttribute('cx');
		gamepad['l3']['cy'] = l3.getAttribute('cy');
	}
	var r3 = document.getElementById(div.id + '-button-r3');
	if (r3 != null){
		gamepad['r3'] = {};
		gamepad['r3']['cx'] = r3.getAttribute('cx');
		gamepad['r3']['cy'] = r3.getAttribute('cy');
	}
	controllerObjects[gamepad.index] = gamepad;
	window.requestAnimationFrame(updateStatus);
}

function disconnectHandler(e){
	removeGamepad(e.gamepad);
}

function removeGamepad(gamepad){
	var d = document.getElementById("controller" + gamepad.index);
	document.body.removeChild(d);
	delete controllerObjects[gamepad.index];
}

function moveAnalog(gamepad, index, element, type, axis){
	if (gamepad.axes[index] != undefined && gamepad[type] != undefined){
		element.setAttribute(axis, gamepad[type][axis] - -gamepad.axes[index] * gamepad['extend']);
		document.getElementById(element.id + '-shadow').setAttribute(axis, element.getAttribute(axis));
	}
}

function pressAnalog(gamepad, index, prefix, axis){
	if (gamepad.axes[index] != undefined){
		if (axis == 'y'){
			var buttonU = document.getElementById(prefix + 'u');
			if (buttonU != null){
				buttonU.setAttribute('fill-opacity', ((gamepad.axes[index] < -offset) ? 1 : 0));
			}
			var buttonD = document.getElementById(prefix + 'd');
			if (buttonD != null){
				buttonD.setAttribute('fill-opacity', ((gamepad.axes[index] > offset) ? 1 : 0));
			}
		} else if (axis == 'x'){
			var buttonL = document.getElementById(prefix + 'l');
			if (buttonL != null){
				buttonL.setAttribute('fill-opacity', ((gamepad.axes[index] < -offset) ? 1 : 0));
			}
			var buttonR = document.getElementById(prefix + 'r');
			if (buttonR != null){
				buttonR.setAttribute('fill-opacity', ((gamepad.axes[index] > offset) ? 1 : 0));
			}
		}
	}
}

function pressDpad(gamepad, index, elementNegative, elementPositive){
	if (gamepad.axes[index] != undefined){
		elementNegative.setAttribute('fill-opacity', ((gamepad.axes[index] < -offset) ? 1 : 0));
		elementPositive.setAttribute('fill-opacity', ((gamepad.axes[index] > offset) ? 1 : 0));
	}
}

function pressByValue(gamepad, index, values){
	if (gamepad.axes[index] != undefined){
		var input = gamepad.axes[index].toFixed(6);
		for (var pressed in values[input]){
			for (var i in values[input][pressed]){
				document.getElementById('gamepad-' + gamepad.index + '-button-' + values[input][pressed][i]).setAttribute('fill-opacity', pressed);
			}
		}
	}
}

function updateStatus(){
	try{
		if (!haveEvents){
			scanGamepads();
		}
		for (var j in controllerObjects){
			var controllerObject = controllerObjects[j];
			var driver = drivers[uOS][uBrowser][controllerObject.driver];
			for (var i in driver['buttons']){
				var button = driver['buttons'][i];
				button = document.getElementById('gamepad-' + controllerObject.index + '-button-' + button);
				if (button != null){
					var pressed = controllerObject.buttons[i];
					if (typeof(pressed) == 'object') {
						pressed = pressed.pressed;
					} else {
						pressed = pressed == 1.0;
					}
					if (button.className.baseVal == 'anti'){
						button.setAttribute('fill-opacity', pressed ? 0 : 0.6);
					} else {
						button.setAttribute('fill-opacity', pressed ? 1 : 0);
					}
				}
			}
			for (var i in driver['axes']){
				var axis = driver['axes'][i];
				if (axis['type'] == 'analog'){
					var id = 'gamepad-' + controllerObject.index + '-button-' + axis['button'];
					var button = document.getElementById(id);
					if (button == null){
						pressAnalog(controllerObject, i, id, axis['axis']);
					} else {
						moveAnalog(controllerObject, i, button, axis['button'], 'c' + axis['axis']);
					}
				} else if (axis['type'] == 'dpad'){
					var buttonNegative = document.getElementById('gamepad-' + controllerObject.index + '-button-' + axis['buttons']['-']);
					var buttonPositive = document.getElementById('gamepad-' + controllerObject.index + '-button-' + axis['buttons']['+']);
					pressDpad(controllerObject, i, buttonNegative, buttonPositive);
				} else if (axis['type'] == 'value'){
					pressByValue(controllerObject, i, axis['buttons']);
				}
			}
		}
		window.requestAnimationFrame(updateStatus);
	} catch (ex){
		document.getElementById('warning').innerHTML = ex.lineNumber + ': ' + ex.toString();
	}
}

function scanGamepads(){
	var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
	for (var i = 0; i < gamepads.length; i++){
		if (gamepads[i]){
			if (gamepads[i].index in controllerObjects){
				controllerObjects[gamepads[i].index] = gamepads[i];
			} else {
				addGamepad(gamepads[i]);
			}
		}
	}
}
