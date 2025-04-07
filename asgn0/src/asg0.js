// asg0.js (c) 2012 matsuda
// Function to draw a vector

function main() {
  // Clear the canvas first
  var canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return false;
  }
  var ctx = canvas.getContext("2d");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Create a Vector3 instance (v1) with default values
  var v1 = new Vector3([2.5, 2.5, 0]);
  // Draw the vector v1 in red
  drawVector(v1, "red");
}

function drawVector(v, color) {
  // Retrieve <canvas> element
  var canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return false;
  }
  // Get the rendering context for 2DCG
  var ctx = canvas.getContext("2d");
  // Calculate the center of the canvas
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  // Set the stroke color for the vector
  ctx.strokeStyle = color;
  // Start drawing from the center of the canvas
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  // Scale the vector by 20 as specified in the instructions
  // Note: We subtract y from centerY because canvas y-axis is flipped (0 at top)
  ctx.lineTo(centerX + v.elements[0] * 20, centerY - v.elements[1] * 20);
  ctx.stroke();
}

function handleDrawEvent() {
  // Retrieve <canvas> element
  var canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return false;
  }
  // Get the rendering context for 2DCG
  var ctx = canvas.getContext("2d");

  // Clear the canvas (set background to black)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read the values of the text boxes to create v1
  var x1Value = parseFloat(document.getElementById("x-coord").value);
  var y1Value = parseFloat(document.getElementById("y-coord").value);

  // Create the vector v1 with the input values (keeping z as 0)
  var v1 = new Vector3([x1Value, y1Value, 0]);

  // Read the values of the text boxes to create v2
  var x2Value = parseFloat(document.getElementById("x2-coord").value);
  var y2Value = parseFloat(document.getElementById("y2-coord").value);

  // Create the vector v2 with the input values (keeping z as 0)
  var v2 = new Vector3([x2Value, y2Value, 0]);

  // Draw vector v1 in red and vector v2 in blue
  drawVector(v1, "red");
  drawVector(v2, "blue");
}

/**
 * Calculate the angle between two vectors in radians
 * @param {Vector3} v1 The first vector
 * @param {Vector3} v2 The second vector
 * @return {Number} The angle between the vectors in radians
 */
function angleBetween(v1, v2) {
  // Calculate the dot product using the static method
  var dotProduct = Vector3.dot(v1, v2);

  // Calculate the magnitudes
  var magV1 = v1.magnitude();
  var magV2 = v2.magnitude();

  // Handle zero vectors
  if (magV1 === 0 || magV2 === 0) {
    console.log("Warning: Cannot calculate angle with a zero vector.");
    return 0;
  }

  // Calculate cos(alpha) = dot(v1, v2) / (||v1|| * ||v2||)
  var cosAlpha = dotProduct / (magV1 * magV2);

  // Due to floating-point errors, cosAlpha might be slightly outside [-1, 1]
  // Clamp it to ensure valid input for Math.acos
  cosAlpha = Math.max(-1, Math.min(1, cosAlpha));

  // Return the angle in radians
  return Math.acos(cosAlpha);
}

/**
 * Calculate the area of the triangle formed by two vectors
 * @param {Vector3} v1 The first vector
 * @param {Vector3} v2 The second vector
 * @return {Number} The area of the triangle
 */
function areaTriangle(v1, v2) {
  // Calculate the cross product using the static method
  var crossProduct = Vector3.cross(v1, v2);

  // The magnitude of the cross product equals the area of the parallelogram
  var areaParallelogram = crossProduct.magnitude();

  // The triangle area is half the parallelogram area
  return areaParallelogram / 2;
}

function handleDrawOperationEvent() {
  // Retrieve <canvas> element
  var canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return false;
  }
  // Get the rendering context for 2DCG
  var ctx = canvas.getContext("2d");

  // Clear the canvas (set background to black)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read the values of the text boxes to create v1
  var x1Value = parseFloat(document.getElementById("x-coord").value);
  var y1Value = parseFloat(document.getElementById("y-coord").value);

  // Create the vector v1 with the input values (keeping z as 0)
  var v1 = new Vector3([x1Value, y1Value, 0]);
  // Draw vector v1 in red
  drawVector(v1, "red");

  // Read the values of the text boxes to create v2
  var x2Value = parseFloat(document.getElementById("x2-coord").value);
  var y2Value = parseFloat(document.getElementById("y2-coord").value);

  // Create the vector v2 with the input values (keeping z as 0)
  var v2 = new Vector3([x2Value, y2Value, 0]);
  // Draw vector v2 in blue
  drawVector(v2, "blue");

  // Read the selected operation and scalar value
  var operation = document.getElementById("operation").value;
  var scalarValue = parseFloat(document.getElementById("scalar").value);

  // Perform the selected operation
  switch (operation) {
    case "add":
      // Create v3 = v1 + v2
      var v3 = new Vector3([x1Value, y1Value, 0]); // copy v1
      v3.add(v2);
      // Draw v3 in green
      drawVector(v3, "green");
      break;
    case "sub":
      // Create v3 = v1 - v2
      var v3 = new Vector3([x1Value, y1Value, 0]); // copy v1
      v3.sub(v2);
      // Draw v3 in green
      drawVector(v3, "green");
      break;
    case "mul":
      // Create v3 = v1 * s
      var v3 = new Vector3([x1Value, y1Value, 0]);
      v3.mul(scalarValue);
      // Draw v3 in green
      drawVector(v3, "green");

      // Create v4 = v2 * s
      var v4 = new Vector3([x2Value, y2Value, 0]);
      v4.mul(scalarValue);
      // Draw v4 in green
      drawVector(v4, "green");
      break;
    case "div":
      // Create v3 = v1 / s
      var v3 = new Vector3([x1Value, y1Value, 0]);
      v3.div(scalarValue);
      // Draw v3 in green
      drawVector(v3, "green");

      // Create v4 = v2 / s
      var v4 = new Vector3([x2Value, y2Value, 0]);
      v4.div(scalarValue);
      // Draw v4 in green
      drawVector(v4, "green");
      break;
    case "magnitude":
      // Calculate and log the magnitude of v1
      var mag1 = v1.magnitude();
      console.log(
        "Magnitude of v1 (" + x1Value + ", " + y1Value + ", 0): " + mag1,
      );

      // Calculate and log the magnitude of v2
      var mag2 = v2.magnitude();
      console.log(
        "Magnitude of v2 (" + x2Value + ", " + y2Value + ", 0): " + mag2,
      );
      break;
    case "normalize":
      // Create v3 = normalized v1
      var v3 = new Vector3([x1Value, y1Value, 0]);
      v3.normalize();
      // Draw normalized v1 in green
      drawVector(v3, "green");

      // Create v4 = normalized v2
      var v4 = new Vector3([x2Value, y2Value, 0]);
      v4.normalize();
      // Draw normalized v2 in green
      drawVector(v4, "green");

      // Log the result
      console.log(
        "Normalized v1: (" +
          v3.elements[0] +
          ", " +
          v3.elements[1] +
          ", " +
          v3.elements[2] +
          ")",
      );
      console.log(
        "Normalized v2: (" +
          v4.elements[0] +
          ", " +
          v4.elements[1] +
          ", " +
          v4.elements[2] +
          ")",
      );
      break;
    case "angle":
      // Calculate the angle between v1 and v2
      var angle = angleBetween(v1, v2);

      // Convert radians to degrees for more readable output
      var angleDegrees = angle * (180 / Math.PI);

      // Log the results
      console.log("Angle between v1 and v2: " + angle.toFixed(4) + " radians");
      console.log(
        "Angle between v1 and v2: " + angleDegrees.toFixed(2) + " degrees",
      );

      // Draw an arc to visualize the angle (optional visualization)
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;

      // Start from v1 direction, draw arc to v2 direction
      var startAngle = Math.atan2(-y1Value, x1Value); // Negative y because canvas y is flipped
      var endAngle = Math.atan2(-y2Value, x2Value);

      // Draw the arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, startAngle, endAngle, false);
      ctx.strokeStyle = "green";
      ctx.stroke();
      break;
    case "area":
      // Calculate the area of the triangle formed by v1 and v2
      var area = areaTriangle(v1, v2);

      // Log the result
      console.log("Area of the triangle: " + area);
      break;
  }
}
