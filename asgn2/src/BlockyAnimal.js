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

  /* // Original comments
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
let g_globalAngle = 30;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;
let g_legAngles = [0, 0, 0, 0];
let g_stoutAngle = -12.5;
let g_tongueAngle = -12.5;

// --- Globals for Mouse Rotation ---
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_isDragging = false;
let g_lastMouseX = -1;
let g_lastMouseY = -1;
const g_mouseSensitivity = 200;

// --- START: Globals for Hop Animation ---
let g_isHopping = false; // Is the hop animation currently playing?
let g_hopStartTime = 0; // Timestamp when the hop started (using g_seconds)
const g_hopDuration = 0.5; // Duration of the hop in seconds
const g_hopHeight = 0.3; // Maximum height of the hop
let g_verticalOffset = 0; // Current vertical offset calculated in tick()
// --- END: Globals for Hop Animation ---

function addActionsForHtmlUI() {
  // Size Slider Events
  document
    .getElementById("angleSlide")
    .addEventListener("mousemove", function () {
      g_globalAngle = this.value;
      renderScene();
    });

  // Limb Slider Events
  ["leg0Slide", "leg1Slide", "leg2Slide", "leg3Slide"].forEach((id, i) => {
    document.getElementById(id).addEventListener("input", function () {
      g_legAngles[i] = this.value;
      renderScene();
    });
  });

  // Lower-stout slider (jaw movement)
  document.getElementById("stoutSlide").addEventListener("input", function () {
    g_stoutAngle = parseFloat(this.value);

    if (g_tongueAngle < g_stoutAngle) {
      g_tongueAngle = g_stoutAngle;
      document.getElementById("tongueSlide").value = g_tongueAngle;
    }

    renderScene();
  });

  // Tongue slider
  document.getElementById("tongueSlide").addEventListener("input", function () {
    let requested = parseFloat(this.value);

    if (requested < g_stoutAngle) {
      requested = g_stoutAngle;
      this.value = requested;
    }

    g_tongueAngle = requested;
    renderScene();
  });
}

// --- MOUSE EVENT HANDLERS ---
function handleMouseDown(ev) {
  // Check for left mouse button
  if (ev.button !== 0) return;

  // --- Check for Shift Key for Hop ---
  if (ev.shiftKey) {
    // Trigger hop animation if not already hopping
    if (!g_isHopping) {
      g_isHopping = true;
      g_hopStartTime = g_seconds; // Record start time using global seconds
      g_verticalOffset = 0; // Ensure offset starts at 0 for this hop
    }
    // Important: Prevent starting a drag when Shift+Click is intended for hop
    return;
  }
  // --- End Shift Key Check ---

  // If not Shift+Click, proceed with normal rotation drag logic
  let [x, y] = convertCoordinatesEventToGL(ev);
  g_lastMouseX = x;
  g_lastMouseY = y;
  g_isDragging = true;
}

function handleMouseUp(ev) {
  if (ev.button !== 0) return;
  g_isDragging = false;
}

function handleMouseMove(ev) {
  // Only process if dragging (and not during a hop trigger)
  if (!g_isDragging) return;

  let [x, y] = convertCoordinatesEventToGL(ev);
  let deltaX = x - g_lastMouseX;
  let deltaY = y - g_lastMouseY;

  g_globalAngleY += deltaX * g_mouseSensitivity;
  g_globalAngleX += deltaY * g_mouseSensitivity;

  g_lastMouseX = x;
  g_lastMouseY = y;

  renderScene(); // Re-render is implicitly handled by tick() loop
}

function handleMouseLeave(ev) {
  g_isDragging = false;
}
// --- END MOUSE EVENT HANDLERS ---

function main() {
  //Set up canvas and gl variables
  setupWebGL();
  //Set up actions for the HTML UI elements
  connectVariablestoGLSL();
  //Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Assign mouse handlers
  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
  canvas.onmouseleave = handleMouseLeave;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Start the animation loop
  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  // Update global time
  g_seconds = performance.now() / 1000.0 - g_startTime;

  // Update standard animations (if any were active)
  updateAnimationAngles();

  // --- START: Update Hop Animation Offset ---
  if (g_isHopping) {
    let hopTime = g_seconds - g_hopStartTime;
    if (hopTime >= g_hopDuration) {
      // Hop finished
      g_isHopping = false;
      g_verticalOffset = 0; // Reset offset
    } else {
      // Calculate vertical offset using a parabolic curve (or sine, as before)
      // Sine gives a smoother start/end:
      let progress = hopTime / g_hopDuration;
      g_verticalOffset = g_hopHeight * Math.sin(progress * Math.PI);
    }
  }
  // --- END: Update Hop Animation Offset ---

  // Draw everything
  renderScene();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  // Original function
  if (g_yellowAnimation) {
    g_yellowAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magentaAnimation) {
    g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  }
}

var g_shapesList = []; // Original variable

/* // Original commented variables
var g_points = [];
var g_colors = [];
var g_sizes = []; */

function click(ev) {
  // Original function
  let [x, y] = convertCoordinatesEventToGL(ev);
  let point;
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegments;
  } // Assuming g_selectedSegments exists if CIRCLE used
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);
  renderScene(); // Original call
}

function convertCoordinatesEventToGL(ev) {
  // Original function
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function renderScene() {
  var startTime = performance.now();

  // --- START: Apply Global Transformation (Rotation + Hop Translation) ---
  // 1. Calculate Rotation Matrix (Slider + Mouse Drag)
  var rotMat = new Matrix4();
  rotMat.rotate(g_globalAngle, 0, 1, 0); // Original slider Y rotation
  rotMat.rotate(g_globalAngleY, 0, 1, 0); // Mouse drag Y rotation
  rotMat.rotate(g_globalAngleX, 1, 0, 0); // Mouse drag X rotation

  // 2. Calculate Final Global Matrix including Hop Translation
  // Apply translation *before* rotation to move the object in world space before rotating the view
  var globalMat = new Matrix4();
  globalMat.translate(0, g_verticalOffset, 0); // Apply hop offset vertically
  globalMat.multiply(rotMat); // Multiply by the rotation matrix

  // 3. Pass the combined matrix to the shader
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalMat.elements);
  // --- END: Apply Global Transformation ---

  // Clear the canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Colors and parts definitions are exactly as in your original file provided previously.
  const brown = [0.76, 0.55, 0.34, 1.0];
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
  head.render(); // Original render position

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
    [+0.5, -0.15, +0.37],
    [-0.05, -0.15, +0.37],
    [+0.5, -0.15, -0.03],
    [-0.05, -0.15, -0.03],
  ];

  legOffsets.forEach(([x, y, z], idx) => {
    const leg = new Cube();
    leg.color = lightBrown;
    leg.matrix = new Matrix4(body.matrix); // Original relation to body.matrix
    leg.matrix.setTranslate(x, y, z);
    leg.matrix.rotate(180, 0, 0, 1); // Original rotation
    leg.matrix.rotate(g_legAngles[idx], 0, 0, 1); // Original rotation
    leg.matrix.scale(0.25, 0.3, 0.25);
    leg.render();
  });

  // ——— EARS ———
  const earOffsets = [
    [0.2, +0.225, 0.84],
    [0.2, +0.225, -0.05],
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
    [0.75, 0.5, 0.6],
    [0.75, 0.5, 0.1],
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
  const purple = [0.6, 0.2, 0.8, 1.0]; // Original variable
  const pupilOffsets = [
    [1.1, 0.6, 0.75],
    [1.1, 0.6, 0.25],
  ];

  pupilOffsets.forEach(([x, y, z]) => {
    const p = new Cylinder(); // Original use of Cylinder
    p.color = black;
    p.matrix = new Matrix4(head.matrix); // Original relation to head.matrix
    p.matrix.translate(x, y, z);
    p.matrix.rotate(-90, 0, 1, 0);
    p.matrix.scale(0.125, 0.125, 0.125);
    p.render();
  });

  // UPPER STOUT
  // NOTE: The original code re-uses the 'head' variable here. This is kept exactly.
  head = new Cube(); // Original re-assignment of head variable
  head.color = lightBrown;
  head.matrix = new Matrix4(head.matrix); // Original self-reference
  head.matrix.setTranslate(0.65, 0.375, 0.175); // Original values
  head.matrix.scale(0.2, 0.1, 0.25); // Original values
  head.render();

  // ——— LOWER STOUT ———
  const lowerStout = new Cube();
  lowerStout.color = lightBrown;
  lowerStout.matrix = new Matrix4(head.matrix); // Original relation to the re-assigned head variable
  lowerStout.matrix.setTranslate(0.65, 0.34, 0.175); // Original values
  lowerStout.matrix.rotate(g_stoutAngle, 0, 0, 1); // Original rotation
  lowerStout.matrix.scale(0.2, 0.05, 0.25); // Original values
  lowerStout.render();

  // ——— TONGUE ———
  const tonguePink = [0.96, 0.65, 0.7, 1.0];
  const tongue = new Cube();
  tongue.color = tonguePink;
  tongue.matrix = new Matrix4(head.matrix); // Original relation to the re-assigned head variable
  tongue.matrix.setTranslate(0.65, 0.39, 0.175); // Original values
  tongue.matrix.rotate(g_tongueAngle, 0, 0, 1); // Original rotation
  tongue.matrix.scale(0.2, 0.01, 0.25); // Original values
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
  // Original function
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
