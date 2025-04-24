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
// --- Keep original global variable state ---
let u_ModelMatrix;
let u_GlobalRotateMatrix;

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
let g_globalAngle = 30; // Original value from your code
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;

// per-leg rotation angles [front-right, back-right, front-left, back-left]
let g_legAngles = [0, 0, 0, 0];
let g_stoutAngle = -12.5;
let g_tongueAngle = -12.5;

// --- START: Globals for Mouse Rotation ---
let g_globalAngleX = 0; // Rotation around X-axis (controlled by mouse Y)
let g_globalAngleY = 0; // Rotation around Y-axis (controlled by mouse X)
let g_isDragging = false;
let g_lastMouseX = -1;
let g_lastMouseY = -1;
const g_mouseSensitivity = 200; // Sensitivity factor for rotation speed
// --- END: Globals for Mouse Rotation ---

function addActionsForHtmlUI() {
  // Size Slider Events
  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      // Original event listener
      g_globalAngle = this.value; // Original assignment
      renderScene();
    });

  // Limb Slider Events
  ["leg0Slide", "leg1Slide", "leg2Slide", "leg3Slide"].forEach((id, i) => {
    document.getElementById(id).addEventListener("input", function () {
      // Original event listener
      g_legAngles[i] = this.value; // Original assignment
      renderScene();
    });
  });

  // Lower-stout slider (jaw movement)
  document.getElementById("stoutSlide").addEventListener("input", function () {
    g_stoutAngle = parseFloat(this.value); // Original parseFloat

    // If stout opens wider than tongue, push tongue open to match:
    if (g_tongueAngle < g_stoutAngle) {
      g_tongueAngle = g_stoutAngle;
      // update the tongue slider thumb
      document.getElementById("tongueSlide").value = g_tongueAngle;
    }

    renderScene();
  });

  // Tongue slider
  document.getElementById("tongueSlide").addEventListener("input", function () {
    // grab requested tongue angle…
    let requested = parseFloat(this.value); // Original parseFloat

    // but clamp so it's never less than the current stout angle
    if (requested < g_stoutAngle) {
      requested = g_stoutAngle;
      // snap the slider thumb back up
      this.value = requested;
    }

    g_tongueAngle = requested;
    renderScene();
  });
}

// --- START: MOUSE EVENT HANDLERS for Rotation ---
function handleMouseDown(ev) {
  // Use button property to check for left mouse button (button === 0)
  if (ev.button !== 0) return;
  let [x, y] = convertCoordinatesEventToGL(ev); // Use existing conversion function
  g_lastMouseX = x;
  g_lastMouseY = y;
  g_isDragging = true;
}

function handleMouseUp(ev) {
  // Only stop dragging if left button was released
  if (ev.button !== 0) return;
  g_isDragging = false;
}

function handleMouseMove(ev) {
  if (!g_isDragging) return; // Only rotate if dragging

  let [x, y] = convertCoordinatesEventToGL(ev); // Use existing conversion function

  let deltaX = x - g_lastMouseX;
  let deltaY = y - g_lastMouseY;

  // Apply rotation based on mouse delta, scaled by sensitivity
  g_globalAngleY += deltaX * g_mouseSensitivity; // Mouse X motion -> Y-axis rotation
  g_globalAngleX += deltaY * g_mouseSensitivity; // Mouse Y motion -> X-axis rotation

  // Update the last mouse position for the next movement calculation
  g_lastMouseX = x;
  g_lastMouseY = y;

  renderScene(); // Trigger re-render
}

function handleMouseLeave(ev) {
  // If mouse leaves the canvas while dragging, stop the drag operation
  g_isDragging = false;
}
// --- END: MOUSE EVENT HANDLERS for Rotation ---

function main() {
  //Set up canvas and gl variables
  setupWebGL();
  //Set up actions for the HTML UI elements
  connectVariablestoGLSL();
  //Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Update mouse event handlers ---

  // Add new handlers for mouse drag rotation
  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
  canvas.onmouseleave = handleMouseLeave; // Add handler for mouse leaving canvas

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

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
  renderScene();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  // Keep original function
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magentaAnimation) {
    g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  }
}

var g_shapesList = []; // Keep original variable

/* // Keep original commented out variables
var g_points = []; // The array for the position of a mouse press
var g_colors = []; // The array to store the color of a point
var g_sizes = []; */

function click(ev) {
  // Keep original function (it just won't be called by mouse drag now)
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
  renderScene();
}

function convertCoordinatesEventToGL(ev) {
  // Keep original function
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  // Store the coordinates to g_points array
  return [x, y];
}

function renderScene() {
  var startTime = performance.now();

  // Apply the global camera rotation from slider AND mouse drag
  var globalRotMat = new Matrix4(); // Start with identity
  globalRotMat.rotate(g_globalAngle, 0, 1, 0); // Apply original slider Y rotation
  globalRotMat.rotate(g_globalAngleY, 0, 1, 0); // Apply mouse drag Y rotation
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0); // Apply mouse drag X rotation
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
  body.matrix = new Matrix4(this.matrix); // Original use of this.matrix
  body.matrix.setTranslate(-0.3, -0.2, 0.0);
  body.matrix.scale(0.9, 0.5, 0.6);
  body.render();

  // ——— WOOL ———
  var wool = new Cube();
  wool.matrix = new Matrix4(this.matrix); // Original use of this.matrix
  wool.matrix.setTranslate(-0.49, -0.25, -0.08);
  wool.matrix.scale(1.1, 0.6, 0.75);
  wool.render();

  // ——— HEAD ———
  var head = new Cube();
  head.color = brown;
  head.matrix = new Matrix4(body.matrix); // Original relation to body.matrix
  head.matrix.setTranslate(0.3, 0.3, 0.05);
  head.matrix.scale(0.4, 0.35, 0.5);
  head.render();

  // ——— FACE ———
  var face = new Cube();
  face.color = lighterBrown;
  face.matrix = new Matrix4(head.matrix); // Original relation to head.matrix
  face.matrix.setTranslate(0.69, 0.3, 0.51);
  face.matrix.rotate(90, 0, 1, 0);
  face.matrix.scale(0.42, 0.3, 0.02);
  face.render();

  // ——— LEGS ———
  const legOffsets = [
    [+0.5, -0.15, +0.37], // front‑right
    [-0.05, -0.15, +0.37], // back‑right
    [+0.5, -0.15, -0.03], // front‑left
    [-0.05, -0.15, -0.03], // back‑left
  ];

  legOffsets.forEach(([x, y, z], idx) => {
    const leg = new Cube();
    leg.color = lightBrown;
    leg.matrix = new Matrix4(body.matrix); // Original relation to body.matrix

    leg.matrix.setTranslate(x, y, z);
    leg.matrix.rotate(180, 0, 0, 1);
    leg.matrix.rotate(g_legAngles[idx], 0, 0, 1);
    leg.matrix.scale(0.25, 0.3, 0.25);

    leg.render();
  });

  // ——— EARS ———
  const earOffsets = [
    [0.2, +0.225, 0.84], // right ear
    [0.2, +0.225, -0.05], // left ear
  ];

  const white = [1.0, 1.0, 1.0, 1.0];

  for (let off of earOffsets) {
    const ear = new Cube();
    ear.color = white;
    ear.matrix = new Matrix4(head.matrix); // Original relation to head.matrix
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
    eye.matrix = new Matrix4(head.matrix); // Original relation to head.matrix
    eye.matrix.translate(off[0], off[1], off[2]);
    eye.matrix.scale(0.3, 0.3, 0.3);
    eye.render();
  }

  // ——— PUPILS ———
  const black = [0.0, 0.0, 0.0, 1.0];
  const purple = [0.6, 0.2, 0.8, 1.0];
  const pupilOffsets = [
    [1.1, 0.6, 0.75], // left pupil
    [1.1, 0.6, 0.25], // right  pupil
  ];

  pupilOffsets.forEach(([x, y, z]) => {
    const p = new Cylinder();
    p.color = black;
    p.matrix = new Matrix4(head.matrix); // Original relation to head.matrix
    p.matrix.translate(x, y, z);
    p.matrix.rotate(-90, 0, 1, 0);
    p.matrix.scale(0.125, 0.125, 0.125);
    p.render();
  });

  // UPPER STOUT
  var upperStout = new Cube();
  upperStout.color = lightBrown;
  upperStout.matrix = new Matrix4(head.matrix); // Original relation to head.matrix
  upperStout.matrix.setTranslate(0.65, 0.375, 0.175);
  upperStout.matrix.scale(0.2, 0.1, 0.25);
  upperStout.render();

  // ——— LOWER STOUT ———
  const lowerStout = new Cube();
  lowerStout.color = lightBrown;
  lowerStout.matrix = new Matrix4(head.matrix); // Original relation to the head variable
  lowerStout.matrix.setTranslate(0.65, 0.34, 0.175);
  lowerStout.matrix.rotate(g_stoutAngle, 0, 0, 1);
  lowerStout.matrix.scale(0.2, 0.05, 0.25);
  lowerStout.render();

  // ——— TONGUE ———
  const tonguePink = [0.96, 0.65, 0.7, 1.0];

  const tongue = new Cube();
  tongue.color = tonguePink;
  tongue.matrix = new Matrix4(head.matrix); // Original relation to the head variable
  tongue.matrix.setTranslate(0.65, 0.39, 0.175);
  tongue.matrix.rotate(g_tongueAngle, 0, 0, 1);
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
  // Keep original function
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
