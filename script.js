var toRadians = function(th) {
	return Math.PI * th / 180;
};

var angleDistance = function(a, b) {
	d = b - a;
	if (d > 180) {
		d -= 360;
	}
	
	if (d < -180) {
		d += 360
	}
	
	return d;
};

var main = function() {

	var canvas = document.getElementById("your_canvas");
	var scoreDiv = document.getElementById("score");
	var highScoreDiv = document.getElementById("high_score");
	var boostDiv = document.getElementById("boost");
	var highScore = 0;
	var score = 0;

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	/* Capture Keyboard Events */
	var rotation = 0;
	var keyState = {};
	
	var checkKeys = function() {
		if (keyState[65]) {
			rotation += 4;
			if (rotation > 180) {
				rotation -= 360;
			}
		}
		
		if (keyState[68]) {
			rotation -= 4;
			if (rotation < -180) {
				rotation += 360;
			}
		}
	};
  
	document.addEventListener("keydown", function(e) {
		keyState[e.keyCode || e.which] = true;
	}, true);
	document.addEventListener("keyup", function(e) {
		keyState[e.keyCode || e.which] = false;
	}, true);

	/* Get WebGL context */
	var gl;
	try {
		gl = canvas.getContext("experimental-webgl", {antialias: true});
	} catch (e) {
		alert("You are not WebGL compatible");
		return false;
	}
	
	/* Shaders */
	  /*========================= SHADERS ========================= */
	/*jshint multistr: true */
	var shader_vertex_source="\n\
attribute vec3 position; //the position of the point\n\
uniform mat4 PVM;\n\
attribute vec2 uv;\n\
varying vec2 vUV;\n\
\n\
varying vec3 vColor;\n\
void main(void) { //pre-built function\n\
gl_Position = PVM*vec4(position, 1.);\n\
vUV=uv;\n\
}";


	var shader_fragment_source="\n\
precision mediump float;\n\
uniform float time;\n\
uniform int boost;\n\
uniform sampler2D sampler;\n\
varying vec2 vUV;\n\
\n\
\n\
\n\
void main(void) {\n\
float x = 1.0;\n\
vec4 color = texture2D(sampler, vUV);\n\
float cond = mod(time, 60.0);\n\
if (boost == 1){\n\
x = 1. + 2.0 * abs(cos(time));\n\
}else if (cond < 20.) {\n\
float greyscaleValue=(color.r+color.g+color.b)/3.;\n\
vec4 greyscaleColor=vec4(greyscaleValue,greyscaleValue,greyscaleValue, 1.);\n\
\n\
color = mix(greyscaleColor, color, 0.2);\n\
//color = greyscaleColor;\n\
}\n\
gl_FragColor = x * color;\n\
}";

	var get_shader = function(source, type, typeString) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		  alert("ERROR IN "+typeString+ " SHADER : " + gl.getShaderInfoLog(shader));
		  return false;
		}
		return shader;
	};

	var shader_vertex = get_shader(shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");

	var shader_fragment = get_shader(shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
	var SHADER_PROGRAM = gl.createProgram();
	gl.attachShader(SHADER_PROGRAM, shader_vertex);
	gl.attachShader(SHADER_PROGRAM, shader_fragment);
	
	gl.linkProgram(SHADER_PROGRAM);
	
	var _PVM = gl.getUniformLocation(SHADER_PROGRAM, "PVM");
	
	var _boost = gl.getUniformLocation(SHADER_PROGRAM, "boost");
	var _time = gl.getUniformLocation(SHADER_PROGRAM, "time");
	var _sampler = gl.getUniformLocation(SHADER_PROGRAM, "sampler");
	var _position = gl.getAttribLocation(SHADER_PROGRAM, "position");
	var _uv = gl.getAttribLocation(SHADER_PROGRAM, "uv");
	
	gl.enableVertexAttribArray(_position);
	gl.enableVertexAttribArray(_uv);
	gl.useProgram(SHADER_PROGRAM);
	gl.uniform1i(_sampler, 0); // Texture channel 0
	
	/* The Tunnel */
	// Points
	var tunnel_vertex = [];
  	var n = 1;
	for(i = 0; i <= 8; i++){
		angle = 22.5 + 45 * i;
		rad = toRadians(angle);
		tunnel_vertex.push(Math.cos(rad)); //x
		tunnel_vertex.push(Math.sin(rad)); //y
		tunnel_vertex.push(0); //z

		
		tunnel_vertex.push(i / 8);
		tunnel_vertex.push(0);
		

		tunnel_vertex.push(Math.cos(rad)); //x
		tunnel_vertex.push(Math.sin(rad)); //y
		tunnel_vertex.push(-100 * n); //z

		tunnel_vertex.push(i / 8);
		tunnel_vertex.push(5 * n);
	}
	
    //Faces
    var tunnel_faces = [
    	0,1,2,		1,2,3,
    	2,3,4,		3,4,5,
    	4,5,6,		5,6,7,
    	6,7,8,		7,8,9,
    	8,9,10,		9,10,11,
    	10,11,12,	11,12,13,
    	12,13,14,	13,14,15,
    	14,15,16,	15,16,17,
    ];
	
	var TUNNEL_VERTEX = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, TUNNEL_VERTEX);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tunnel_vertex), gl.STATIC_DRAW);
	
	
	var TUNNEL_FACES = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TUNNEL_FACES);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tunnel_faces), gl.STATIC_DRAW);
	
	var box_vertex = [
		-0.3, -1.0, -0.5, 0, 0,
		+0.3, -1.0, -0.5, 1, 0,
		+0.3, +1.0, -0.5, 1, 1,
		-0.3, +1.0, -0.5, 0, 1,
		
		-0.3, -1.0, +0.5, 0, 0,
		+0.3, -1.0, +0.5, 1, 0,
		+0.3, +1.0, +0.5, 1, 1,
		-0.3, +1.0, +0.5, 0, 1,
	];
	
	var box_faces = [
		0, 1, 2,	0, 2, 3,
		1, 4, 0,	1, 5, 4,
		4, 5, 6,	6, 7, 4,
		4, 7, 3,	4, 3, 0,
		3, 2, 6,	6, 7, 3,
		1, 5, 6,	6, 2, 1,
	];
	
	var BOX_VERTEX = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, BOX_VERTEX);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(box_vertex), gl.STATIC_DRAW);
	
	var BOX_FACES = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BOX_FACES);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(box_faces), gl.STATIC_DRAW);	
	
	/* MATRIX */
	var PROJMATRIX = mat4.create();
	mat4.perspective(PROJMATRIX, toRadians(40), canvas.width / canvas.height, 0.05, 50);
	var VIEWMATRIX = mat4.create();
	mat4.fromTranslation(VIEWMATRIX, [0, 0, -5]);
	var MOVEMATRIX = mat4.create();
	var MOVEMATRIX2 = mat4.create();
	var MOVEMATRIXBOX = mat4.create();
		
	/*========================= TEXTURES ========================= */
	var get_texture = function(image_URL){
		var image = new Image();

		image.src = image_URL;
		image.webglTexture = false;
		image.crossOrigin = "anonymous";


		image.onload = function(e) {
		  var texture = gl.createTexture();
		  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		  gl.bindTexture(gl.TEXTURE_2D, texture);
		  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
		  gl.generateMipmap(gl.TEXTURE_2D);
		  gl.bindTexture(gl.TEXTURE_2D, null);
		  image.webglTexture = texture;
		};

		return image;
	};

	var tunnel_texture = get_texture("resources/checker.jpg");
	var box_texture = get_texture("resources/crate.jpg");
	
	/* Drawing */
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	
	gl.clearDepth(1.0);
	
	var time_old = 0;
	var position = 0;
	var tunnelPosition = 0;
	var boxProperties = [
		{
			pos: 0,
			rot: 30
		},
		{
			pos: -10,
			rot: 45
		}, 
		{
			pos: -20,
			rot: 90
		},
		{
			pos: -30,
			rot: 120
		}
	];

	boostTime = 0, boostCounter = 0;
	var animate = function(time) {
		checkKeys();
		var dt = time - time_old;
		
		gl.uniform1f(_time, time / 1000);
		if (time - boostTime > 30000) {
			boostTime = time;
			boostCounter++;
			console.log("Boost");
		}
		
		if (time - boostTime < 5000) {
			gl.uniform1i(_boost, 1);
		} else {
			gl.uniform1i(_boost, 0);
		}
		
		position -= 0.1 * Math.pow(1.25, boostCounter);
		var circleCoords = [Math.sin(toRadians(rotation)), Math.cos(toRadians(rotation))];
		mat4.lookAt(VIEWMATRIX, [0.9 * circleCoords[0], 0.9 * circleCoords[1], position], [0, 0, position - 100], [-circleCoords[0], -circleCoords[1], 0]);
		
		if (position < tunnelPosition - 100) {
			tunnelPosition -= 100;
		}
		
		mat4.fromTranslation(MOVEMATRIX, [0, 0, tunnelPosition]);
		mat4.fromTranslation(MOVEMATRIX2, [0, 0, tunnelPosition - 100]);
		time_old = time;
		
		gl.viewport(0.0, 0.0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		var PVM = mat4.create();
		mat4.mul(PVM, PROJMATRIX, VIEWMATRIX);
		mat4.mul(PVM, PVM, MOVEMATRIX);
		gl.uniformMatrix4fv(_PVM, false, PVM);
		if (tunnel_texture.webglTexture) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tunnel_texture.webglTexture);
		}

		
		var stride = 4 * (3 + 2);	
		gl.bindBuffer(gl.ARRAY_BUFFER, TUNNEL_VERTEX);
		gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, stride, 0);
		gl.vertexAttribPointer(_uv, 2, gl.FLOAT, false, stride, 3 * 4);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, TUNNEL_FACES);
		gl.drawElements(gl.TRIANGLES, 8 * 2 * 3, gl.UNSIGNED_SHORT, 0);
		
		
		mat4.mul(PVM, PROJMATRIX, VIEWMATRIX);
		mat4.mul(PVM, PVM, MOVEMATRIX2);
		gl.uniformMatrix4fv(_PVM, false, PVM);
		gl.drawElements(gl.TRIANGLES, 8 * 2 * 3, gl.UNSIGNED_SHORT, 0);
		
		if (box_texture.webglTexture) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, box_texture.webglTexture);
		}
		
		gl.bindBuffer(gl.ARRAY_BUFFER, BOX_VERTEX);
		gl.vertexAttribPointer(_position, 3, gl.FLOAT, false, stride, 0);
		gl.vertexAttribPointer(_uv, 2, gl.FLOAT, false, stride, 3 * 4);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BOX_FACES);
		
		for (let p of boxProperties) {
			if (p.pos - 10 > position) {
				p.pos -= 50;
				p.rot = Math.floor((-90 + Math.random() * 180));
			}
			
			p.rot += 1;
			if (p.rot > 90) {
				p.rot -= 180;
			}
			
			var rotationMatrix = mat4.create();
			mat4.fromRotation(rotationMatrix, toRadians(p.rot), [0, 0, -1]);
			mat4.fromTranslation(MOVEMATRIXBOX, [0, 0, p.pos]);
			mat4.mul(PVM, PROJMATRIX, VIEWMATRIX);
			mat4.mul(PVM, PVM, MOVEMATRIXBOX);
			mat4.mul(PVM, PVM, rotationMatrix);
			gl.uniformMatrix4fv(_PVM, false, PVM);
			
			gl.drawElements(gl.TRIANGLES, 6 * 2 * 3, gl.UNSIGNED_SHORT, 0);

			var abs = Math.abs;
			var diffRot1 = abs(angleDistance(rotation, p.rot));
			var diffRot2 = 180 - abs(angleDistance(rotation, p.rot));
			var diffPos = abs(p.pos - position)
			
			// if (diffPos < 0.5)
			// {
				// console.log(rotation, p.rot, diffRot1, diffRot2);
			// }
			
			if ((diffRot1 <= 22 || diffRot2 <= 22)&& diffPos < 0.5){
				alert('Game Over!\n' + "Score: " + score);
				position -= 2;
				keyState = {};
				highScore = Math.max(score, highScore);
				score = 0;
				boostCounter = 0;
			}
		}
		
		score++;
		scoreDiv.innerHTML = score;
		highScoreDiv.innerHTML = highScore;
		boostDiv.innerHTML = "> ".repeat(boostCounter);
		
		gl.flush();
		
		window.requestAnimationFrame(animate);
	}
	
	animate(0);
};