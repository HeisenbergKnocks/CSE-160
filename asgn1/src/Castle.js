// Castle class that draws a colorful castle using at least 20 triangles
class Castle {
  constructor() {
    // Array to store triangles and their colors
    // Each entry is an object with vertices and color
    this.triangles = [];

    // Create the different parts of the castle with colors
    this.createWall();
    this.createBattlements();
    this.createTowers();
    this.createDrawbridge();
    this.createMoat();
    this.createFlags();
    this.createWindows();
    this.createDoor();
    this.createSky();
  }

  // Create the main wall as a rectangle, using 2 triangles
  createWall() {
    // Wall color (stone gray)
    let wallColor = [0.7, 0.7, 0.7, 1.0];

    // Wall spans from x = -0.8 to 0.8, and y from -0.8 to 0.0
    this.triangles.push({
      vertices: [-0.8, -0.8, -0.8, 0.0, 0.8, 0.0],
      color: wallColor,
    });
    this.triangles.push({
      vertices: [-0.8, -0.8, 0.8, 0.0, 0.8, -0.8],
      color: wallColor,
    });
  }

  // Create battlements on top of the wall with small triangles
  createBattlements() {
    // Battlement color (lighter stone)
    let battlementColor = [0.8, 0.8, 0.8, 1.0];

    // Define fixed positions for symmetrical battlements
    // We'll place 2 on each side of the central tower
    let battlementPositions = [
      // Left side battlements
      { start: -0.8, end: -0.6 },
      { start: -0.5, end: -0.3 },
      // Right side battlements
      { start: 0.3, end: 0.5 },
      { start: 0.6, end: 0.8 },
    ];

    let baseY = 0.0;
    let height = 0.2;

    // Create each battlement at the specified positions
    for (let pos of battlementPositions) {
      let x1 = pos.start;
      let x2 = pos.end;
      let midX = (x1 + x2) / 2;

      this.triangles.push({
        vertices: [x1, baseY, midX, baseY + height, x2, baseY],
        color: battlementColor,
      });
    }
  }

  // Create two side towers with a base rectangle and a triangular roof
  createTowers() {
    // Tower base color (darker stone)
    let towerColor = [0.6, 0.6, 0.65, 1.0];
    // Tower roof color (dark red)
    let roofColor = [0.7, 0.2, 0.2, 1.0];

    // Left Tower:
    // Tower base from x = -1.0 to -0.8, y from -0.8 to 0.2
    this.triangles.push({
      vertices: [-1.0, -0.8, -1.0, 0.2, -0.8, 0.2],
      color: towerColor,
    });
    this.triangles.push({
      vertices: [-1.0, -0.8, -0.8, 0.2, -0.8, -0.8],
      color: towerColor,
    });
    // Tower roof: a triangle with peak at y = 0.4
    this.triangles.push({
      vertices: [-1.0, 0.2, -0.9, 0.4, -0.8, 0.2],
      color: roofColor,
    });

    // Right Tower:
    // Tower base from x = 0.8 to 1.0, y from -0.8 to 0.2
    this.triangles.push({
      vertices: [0.8, -0.8, 0.8, 0.2, 1.0, 0.2],
      color: towerColor,
    });
    this.triangles.push({
      vertices: [0.8, -0.8, 1.0, 0.2, 1.0, -0.8],
      color: towerColor,
    });
    // Tower roof
    this.triangles.push({
      vertices: [0.8, 0.2, 0.9, 0.4, 1.0, 0.2],
      color: roofColor,
    });

    // Add a third central tower
    // Central tower base
    this.triangles.push({
      vertices: [-0.3, 0.0, -0.3, 0.3, 0.3, 0.3],
      color: towerColor,
    });
    this.triangles.push({
      vertices: [-0.3, 0.0, 0.3, 0.3, 0.3, 0.0],
      color: towerColor,
    });
    // Central tower roof
    this.triangles.push({
      vertices: [-0.3, 0.3, 0.0, 0.6, 0.3, 0.3],
      color: roofColor,
    });
  }

  // Create a drawbridge in the center of the wall
  createDrawbridge() {
    // Brown wooden drawbridge
    let bridgeColor = [0.6, 0.4, 0.2, 1.0];

    // Drawbridge on the center of the wall
    this.triangles.push({
      vertices: [-0.2, -0.8, -0.2, -0.4, 0.2, -0.4],
      color: bridgeColor,
    });
    this.triangles.push({
      vertices: [-0.2, -0.8, 0.2, -0.4, 0.2, -0.8],
      color: bridgeColor,
    });
  }

  // Create a moat around the castle
  createMoat() {
    // Blue water color
    let waterColor = [0.0, 0.4, 0.8, 1.0];

    // Create a simple rectangular moat with a perfectly straight top edge
    // Just two triangles forming a rectangle at the bottom
    this.triangles.push({
      vertices: [-1.0, -1.0, -1.0, -0.8, 1.0, -0.8],
      color: waterColor,
    });
    this.triangles.push({
      vertices: [-1.0, -1.0, 1.0, -0.8, 1.0, -1.0],
      color: waterColor,
    });
  }

  // Add flags to the towers
  createFlags() {
    // Red flag
    let redFlagColor = [1.0, 0.0, 0.0, 1.0];
    // Blue flag
    let blueFlagColor = [0.0, 0.3, 1.0, 1.0];

    // Flag on left tower - positioned directly on the tower roof
    this.triangles.push({
      vertices: [-0.905, 0.39, -0.905, 0.54, -0.755, 0.47],
      color: redFlagColor,
    });

    // Flag on right tower - positioned directly on the tower roof
    this.triangles.push({
      vertices: [0.905, 0.39, 0.905, 0.54, 0.755, 0.47],
      color: blueFlagColor,
    });
  }

  // Create windows by adding small triangles
  createWindows() {
    // Yellow window light
    let windowColor = [1.0, 0.9, 0.0, 1.0];

    // Windows on the wall
    this.triangles.push({
      vertices: [-0.5, -0.4, -0.5, -0.2, -0.3, -0.3],
      color: windowColor,
    });
    this.triangles.push({
      vertices: [0.5, -0.4, 0.5, -0.2, 0.3, -0.3],
      color: windowColor,
    });

    // Windows on towers
    this.triangles.push({
      vertices: [-0.95, -0.2, -0.95, 0.0, -0.85, -0.1],
      color: windowColor,
    });
    this.triangles.push({
      vertices: [0.95, -0.2, 0.95, 0.0, 0.85, -0.1],
      color: windowColor,
    });
  }

  // Create a door for the castle
  createDoor() {
    // Dark brown door
    let doorColor = [0.4, 0.2, 0.0, 1.0];

    // Door in the center wall above the drawbridge
    this.triangles.push({
      vertices: [-0.15, -0.4, -0.15, -0.1, 0.15, -0.1],
      color: doorColor,
    });
    this.triangles.push({
      vertices: [-0.15, -0.4, 0.15, -0.1, 0.15, -0.4],
      color: doorColor,
    });
  }

  // Create sky background
  createSky() {
    // Light blue sky
    let skyColor = [0.6, 0.8, 1.0, 1.0];

    // Create a full sky background with multiple triangles
    // Upper sky triangle
    this.triangles.push({
      vertices: [-1.0, 0.0, 0.0, 1.0, 1.0, 0.0],
      color: skyColor,
    });

    // Left side sky
    this.triangles.push({
      vertices: [-1.0, -1.0, -1.0, 0.0, 0.0, 1.0],
      color: skyColor,
    });

    // Right side sky
    this.triangles.push({
      vertices: [1.0, -1.0, 0.0, 1.0, 1.0, 0.0],
      color: skyColor,
    });
  }

  // Render method: iterate over all triangles and draw them
  render() {
    // First render the sky (background)
    let skyColor = [0.6, 0.8, 1.0, 1.0];
    gl.uniform4f(
      u_FragColor,
      skyColor[0],
      skyColor[1],
      skyColor[2],
      skyColor[3],
    );

    // Draw a single large rectangle for the sky (2 triangles)
    drawTriangle([-1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    drawTriangle([-1.0, -1.0, 1.0, 1.0, 1.0, -1.0]);

    // Then render all other castle elements in correct order
    for (let i = 0; i < this.triangles.length; i++) {
      let triangle = this.triangles[i];

      // Skip sky triangles since we've drawn a full background
      if (
        i >= this.triangles.length - 3 &&
        triangle.color[0] === 0.6 &&
        triangle.color[1] === 0.8 &&
        triangle.color[2] === 1.0
      ) {
        continue;
      }

      // Set the color for this triangle
      gl.uniform4f(
        u_FragColor,
        triangle.color[0],
        triangle.color[1],
        triangle.color[2],
        triangle.color[3],
      );

      // Draw the triangle
      drawTriangle(triangle.vertices);
    }
  }
}

// Function to create and render the castle
function drawCastle() {
  let castle = new Castle();
  g_shapesList.push(castle);
  renderAllShapes();
}
