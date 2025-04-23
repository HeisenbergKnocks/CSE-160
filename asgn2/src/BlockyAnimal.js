// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablestoGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColor) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }

  /*
  //Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_Size) {
    console.log("Failed to get the storage location of u_Size");
    return;
  } */

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix",
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

//Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;

function addActionsForHtmlUI() {
  // Button Events
  document.getElementById("animationYellowOffButton").onclick = function () {
    g_yellowAnimation = false;
  };
  document.getElementById("animationYellowOnButton").onclick = function () {
    g_yellowAnimation = true;
  };

  document.getElementById("animationMagentaOffButton").onclick = function () {
    g_magentaAnimation = false;
  };

  document.getElementById("animationMagentaOnButton").onclick = function () {
    g_magentaAnimation = true;
  };

  // Color Slider Events
  document
    .getElementById("yellowSlide")
    .addEventListener("mousemove", function () {
      g_yellowAngle = this.value;
      renderAllShapes();
    });

  document
    .getElementById("magentaSlide")
    .addEventListener("mousemove", function () {
      g_magentaAngle = this.value;
      renderAllShapes();
    });

  // Size Slider Events
  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderAllShapes();
    });
}

function main() {
  //Set up canvas and gl variables
  setupWebGL();
  //Set up actions for the HTML UI elements
  connectVariablestoGLSL();
  //Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function (ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  //console.log(g_seconds);

  // Update Animation Angles
  updateAnimationAngles();

  // Draw everything
  renderAllShapes();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magentaAnimation) {
    g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  }
}

var g_shapesList = [];
/*
var g_points = []; // The array for the position of a mouse press
var g_colors = []; // The array to store the color of a point
var g_sizes = []; */

function click(ev) {
  //Extract the event click and return it in WebGL coordinates
  let [x, y] = convertCoordinatesEventToGL(ev);

  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegments;
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  //Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  // Store the coordinates to g_points array
  return [x, y];
}

function renderAllShapes() {
  var startTime = performance.now();
  // Apply the global camera rotation
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear the canvas (color + depth)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // a convenient brown color for the monkey
  const brown = [0.76, 0.55, 0.34, 1.0];
  // a lighter brown color
  const lightBrown = [0.85, 0.7, 0.5, 1.0];
  const lighterBrown = [0.92, 0.8, 0.65, 1.0];

  // ——— BODY ———
  var body = new Cube();
  body.color = brown;
  body.matrix = new Matrix4(this.matrix);
  body.matrix.setTranslate(-0.3, -0.2, 0.0);
  body.matrix.scale(0.9, 0.5, 0.6);
  body.render();

  // ——— HEAD ———
  var head = new Cube();
  head.color = brown;
  head.matrix = new Matrix4(body.matrix);
  head.matrix.setTranslate(0.3, 0.3, 0.05);
  head.matrix.scale(0.4, 0.35, 0.5);
  head.render();

  // ——— FACE ———
  var face = new Cube();
  face.color = lighterBrown;
  face.matrix = new Matrix4(head.matrix);
  face.matrix.setTranslate(0.69, 0.3, 0.51);
  face.matrix.rotate(90, 0, 1, 0);
  face.matrix.scale(0.42, 0.3, 0.02);
  face.render();

  // ——— LEGS ———
  // positions for front‐left, front‐right, back‐left, back‐right

  const legOffsets = [
    [+0.45, -0.5, +0.9], // front‑right
    [-0.15, -0.5, +0.9], // back‑right
    [+0.45, -0.5, -0.1], // front‑left
    [-0.1, -0.5, -0.1], // back‑left
  ];

  legOffsets.forEach(([x, y, z]) => {
    const leg = new Cube();
    leg.color = lightBrown;
    leg.matrix = new Matrix4(body.matrix);
    // attach under and out at each corner
    leg.matrix.translate(x, y, z);
    // tall‐skinny prisms
    leg.matrix.scale(0.25, 1.5, 0.15);
    leg.render();
  });

  // ——— EARS ———
  // two small blocks on the sides of the head
  // ——— EARS ———
  // two small blocks on the sides of the head
  const earOffsets = [
    [0.2, +0.225, 0.84], // right ear
    [0.2, +0.225, -0.05], // left ear
  ];

  // a lighter‐brown color for the ears
  const white = [1.0, 1.0, 1.0, 1.0];

  for (let off of earOffsets) {
    const ear = new Cube();
    ear.color = white;
    ear.matrix = new Matrix4(head.matrix);
    ear.matrix.translate(off[0], off[1], off[2]);
    ear.matrix.scale(0.4, 0.4, 0.2);
    ear.render();
  }

  // ——— EYES ———
  const eyeOffsets = [
    [0.75, 0.5, 0.6], // right
    [0.75, 0.5, 0.1], // left
  ];

  for (let off of eyeOffsets) {
    const eye = new Cube();
    eye.color = [1, 1, 1, 1];
    eye.matrix = new Matrix4(head.matrix);
    eye.matrix.translate(off[0], off[1], off[2]);
    eye.matrix.scale(0.3, 0.3, 0.3);
    eye.render();
  }

  // ——— PUPILS ———
  const black = [0.0, 0.0, 0.0, 1.0];
  const purple = [0.6, 0.2, 0.8, 1.0];
  // same X/Y as the eyes, but Z a little further forward
  const pupilOffsets = [
    [1.1, 0.6, 0.75], // left pupil
    [1.1, 0.6, 0.25], // right  pupil
  ];

  pupilOffsets.forEach(([x, y, z]) => {
    const p = new Cylinder(); // 24 slices = nicely round
    p.color = black;
    p.matrix = new Matrix4(head.matrix); // start at head
    p.matrix.translate(x, y, z); // move into eye position
    p.matrix.rotate(-90, 0, 1, 0); // point its caps toward the camera
    // scale to a small disk: radius ~0.05, thickness ~0.01
    p.matrix.scale(0.125, 0.125, 0.125);
    p.render();
  });

  // UPPER STOUT
  var head = new Cube();
  head.color = lightBrown;
  head.matrix = new Matrix4(head.matrix);
  head.matrix.setTranslate(0.65, 0.375, 0.175);
  head.matrix.scale(0.2, 0.1, 0.25);
  head.render();

  // ——— LOWER STOUT ———
  const lowerStout = new Cube();
  lowerStout.color = lightBrown;
  lowerStout.matrix = new Matrix4(head.matrix);
  lowerStout.matrix.setTranslate(0.65, 0.34, 0.175);
  lowerStout.matrix.rotate(-12.5, 0, 0, 1);
  lowerStout.matrix.scale(0.2, 0.05, 0.25);
  lowerStout.render();

  // ——— TONGUE ———
  const tonguePink = [0.96, 0.65, 0.7, 1.0];

  const tongue = new Cube();
  tongue.color = tonguePink;
  tongue.matrix = new Matrix4(head.matrix);
  tongue.matrix.setTranslate(0.65, 0.39, 0.175);
  tongue.matrix.rotate(-12.5, 0, 0, 1); // keep same
  tongue.matrix.scale(0.2, 0.01, 0.25);
  tongue.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(
    " ms: " +
      Math.floor(duration) +
      " fps: " +
      Math.floor(10000 / duration) / 10,
    "numdot",
  );
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
