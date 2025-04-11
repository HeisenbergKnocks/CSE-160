// Enhanced Castle with animations and interactive elements
class AnimatedCastle extends Castle {
  constructor() {
    super();

    // Animation properties
    this.time = 0;
    this.flagWaveSpeed = 0.05;
    this.dayNightCycle = 0;
    this.dayNightSpeed = 0.005;
    this.fireflies = [];
    this.birds = [];
    this.starsVisible = false;
    this.drawbridgeOpen = false; // Initialize drawbridge state

    // Create 20 fireflies with random positions
    for (let i = 0; i < 20; i++) {
      this.fireflies.push({
        x: Math.random() * 1.6 - 0.8,
        y: Math.random() * 0.7 - 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
      });
    }

    // Create 5 birds
    for (let i = 0; i < 5; i++) {
      this.birds.push({
        x: -1.2 + Math.random() * 0.5,
        y: 0.5 + Math.random() * 0.3,
        speed: 0.005 + Math.random() * 0.005,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.1 + Math.random() * 0.1,
        size: 0.03 + Math.random() * 0.03,
      });
    }

    // Setup click handlers for interactive areas
    this.setupInteractiveAreas();
  }

  // Define clickable areas on the castle
  setupInteractiveAreas() {
    this.clickAreas = [
      // Main door - toggles drawbridge animation
      {
        x1: -0.2,
        y1: -0.4,
        x2: 0.2,
        y2: -0.1,
        action: () => {
          this.toggleDrawbridge();
        },
      },
      // Left tower - launches fireworks
      {
        x1: -1.0,
        y1: -0.8,
        x2: -0.8,
        y2: 0.4,
        action: () => {
          this.launchFirework(-0.9, 0.4);
        },
      },
      // Right tower - launches fireworks
      {
        x1: 0.8,
        y1: -0.8,
        x2: 1.0,
        y2: 0.4,
        action: () => {
          this.launchFirework(0.9, 0.4);
        },
      },
      // Central tower - toggles day/night
      {
        x1: -0.3,
        y1: 0.0,
        x2: 0.3,
        y2: 0.6,
        action: () => {
          this.toggleDayNight();
        },
      },
    ];
  }

  // Check if a click is within a defined area
  checkClick(x, y) {
    for (let area of this.clickAreas) {
      if (x >= area.x1 && x <= area.x2 && y >= area.y1 && y <= area.y2) {
        area.action();
        return true;
      }
    }
    return false;
  }

  // Toggle drawbridge animation
  toggleDrawbridge() {
    // In a real implementation, you would animate the drawbridge here
    console.log("Drawbridge toggled!");
    this.drawbridgeOpen = !this.drawbridgeOpen;
  }

  // Launch a firework from a position
  launchFirework(x, y) {
    // In a real implementation, you would create an animated firework
    console.log("Firework launched!");
    this.fireworks = this.fireworks || [];
    this.fireworks.push({
      x: x,
      y: y,
      targetY: y + 0.5 + Math.random() * 0.3,
      phase: 0,
      color: [
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        1.0,
      ],
      particles: [],
    });
  }

  // Toggle between day and night
  toggleDayNight() {
    this.starsVisible = !this.starsVisible;
    // Force to either day or night immediately
    this.dayNightCycle = this.starsVisible ? Math.PI : 0;
  }

  // Update animation state
  update() {
    this.time += 0.016; // Approximately 60fps

    // Update day/night cycle
    this.dayNightCycle += this.dayNightSpeed;
    if (this.dayNightCycle > Math.PI * 2) {
      this.dayNightCycle = 0;
    }

    // Update birds
    for (let bird of this.birds) {
      bird.x += bird.speed;
      bird.wingPhase += bird.wingSpeed;

      // Reset bird when it flies off screen
      if (bird.x > 1.2) {
        bird.x = -1.2;
        bird.y = 0.5 + Math.random() * 0.3;
      }
    }

    // Update fireflies (only visible at night)
    for (let firefly of this.fireflies) {
      firefly.phase += firefly.speed;
      // Make a small random movement
      firefly.x += (Math.random() - 0.5) * 0.01;
      firefly.y += (Math.random() - 0.5) * 0.01;

      // Keep within bounds
      firefly.x = Math.max(-1.0, Math.min(1.0, firefly.x));
      firefly.y = Math.max(-0.7, Math.min(0.7, firefly.y));
    }

    // Update fireworks if any
    if (this.fireworks) {
      for (let i = this.fireworks.length - 1; i >= 0; i--) {
        let firework = this.fireworks[i];
        firework.phase += 0.05;

        // Move upward
        if (firework.phase < 1.0) {
          firework.y = firework.y + (firework.targetY - firework.y) * 0.1;
        }
        // Explode
        else if (
          firework.phase === 1.0 ||
          (firework.phase < 2.0 && !firework.exploded)
        ) {
          firework.exploded = true;
          // Create particles
          for (let j = 0; j < 20; j++) {
            const angle = (j * Math.PI * 2) / 20;
            firework.particles.push({
              x: firework.x,
              y: firework.y,
              vx: Math.cos(angle) * 0.02,
              vy: Math.sin(angle) * 0.02,
              life: 1.0,
            });
          }
        }
        // Update particles
        else if (firework.phase < 3.0) {
          for (let particle of firework.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy -= 0.001; // Gravity
            particle.life -= 0.02;
          }
        }
        // Remove dead fireworks
        else {
          this.fireworks.splice(i, 1);
        }
      }
    }
  }

  // Render the animated castle
  render() {
    // First determine if it's day or night based on cycle
    const isDaytime = Math.cos(this.dayNightCycle) > 0;
    const dayNightRatio = (Math.cos(this.dayNightCycle) + 1) / 2; // 0 to 1

    // Render sky with appropriate color based on time of day
    let skyColor;
    if (isDaytime) {
      // Day sky (blue)
      skyColor = [
        0.4 + 0.2 * dayNightRatio,
        0.6 + 0.2 * dayNightRatio,
        0.9 + 0.1 * dayNightRatio,
        1.0,
      ];
    } else {
      // Night sky (dark blue)
      skyColor = [0.1, 0.1, 0.3, 1.0];
    }

    gl.uniform4f(
      u_FragColor,
      skyColor[0],
      skyColor[1],
      skyColor[2],
      skyColor[3],
    );
    drawTriangle([-1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    drawTriangle([-1.0, -1.0, 1.0, 1.0, 1.0, -1.0]);

    // Render stars at night
    if (!isDaytime) {
      this.renderStars();
      this.renderMoon();
    } else {
      this.renderSun();
    }

    // Render castle base elements (use parent's render method)
    for (let i = 0; i < this.triangles.length; i++) {
      let triangle = this.triangles[i];

      // Skip sky triangles since we've already drawn the sky
      if (
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

    // Render drawbridge
    this.renderDrawbridge();

    // Render animated flags
    this.renderFlags();

    // Render birds
    this.renderBirds();

    // Render fireflies (only at night)
    if (!isDaytime) {
      this.renderFireflies();
    }

    // Render fireworks if any
    if (this.fireworks) {
      this.renderFireworks();
    }
  }

  // Render drawbridge based on open/closed state
  renderDrawbridge() {
    // Brown color for wooden drawbridge
    const bridgeColor = [0.6, 0.4, 0.2, 1.0];

    gl.uniform4f(
      u_FragColor,
      bridgeColor[0],
      bridgeColor[1],
      bridgeColor[2],
      bridgeColor[3],
    );

    if (this.drawbridgeOpen) {
      // Render open drawbridge (lowered)
      drawTriangle([-0.15, -0.25, 0.15, -0.25, 0.0, -0.6]);
    } else {
      // Render closed drawbridge (vertical)
      drawTriangle([-0.15, -0.25, 0.15, -0.25, 0.0, -0.39]);
    }
  }

  // Render animated flags
  renderFlags() {
    // Red flag
    let redFlagColor = [1.0, 0.0, 0.0, 1.0];
    // Blue flag
    let blueFlagColor = [0.0, 0.3, 1.0, 1.0];

    // Calculate wave effect based on time - INCREASED AMPLITUDE FOR MORE VISIBLE WAVING
    const waveOffset = 0.15 * Math.sin(this.time * this.flagWaveSpeed);

    // Flag on left tower with wave animation
    gl.uniform4f(
      u_FragColor,
      redFlagColor[0],
      redFlagColor[1],
      redFlagColor[2],
      redFlagColor[3],
    );
    drawTriangle([-0.905, 0.39, -0.905, 0.54, -0.755 + waveOffset, 0.47]);

    // Flag on right tower with wave animation
    gl.uniform4f(
      u_FragColor,
      blueFlagColor[0],
      blueFlagColor[1],
      blueFlagColor[2],
      blueFlagColor[3],
    );
    drawTriangle([0.905, 0.39, 0.905, 0.54, 0.755 - waveOffset, 0.47]);
  }

  // Render stars in night sky
  renderStars() {
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

    // Use deterministic star positions
    const starPositions = [
      [-0.8, 0.8],
      [-0.6, 0.9],
      [-0.4, 0.7],
      [-0.2, 0.85],
      [0.1, 0.75],
      [0.3, 0.9],
      [0.5, 0.8],
      [0.7, 0.7],
      [0.9, 0.85],
      [-0.9, 0.5],
      [-0.7, 0.6],
      [-0.5, 0.5],
      [-0.3, 0.65],
      [0.0, 0.55],
      [0.2, 0.7],
      [0.4, 0.6],
      [0.6, 0.5],
      [0.8, 0.65],
    ];

    // Render each star as a tiny triangle
    for (let pos of starPositions) {
      const starSize = 0.01;
      const twinkle = 0.005 * Math.sin(this.time * 2 + pos[0] * 10);

      drawTriangle([
        pos[0],
        pos[1],
        pos[0] - starSize - twinkle,
        pos[1] - starSize,
        pos[0] + starSize + twinkle,
        pos[1] - starSize,
      ]);
    }
  }

  // Render sun
  renderSun() {
    // Sun color (yellow)
    gl.uniform4f(u_FragColor, 1.0, 0.9, 0.2, 1.0);

    // Sun position based on day/night cycle - FLIPPED AND ADJUSTED ARC HEIGHT
    const sunX = Math.cos(this.dayNightCycle - Math.PI / 2) * 1.5;
    const sunY = -Math.sin(this.dayNightCycle - Math.PI / 2) * 0.3 + 0.7;

    // Only show sun when it's above horizon
    if (sunY > 0) {
      // Draw the sun using a circle approximation (multiple triangles)
      const sunSize = 0.1;
      const segments = 12;

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        drawTriangle([
          sunX,
          sunY,
          sunX + Math.cos(angle1) * sunSize,
          sunY + Math.sin(angle1) * sunSize,
          sunX + Math.cos(angle2) * sunSize,
          sunY + Math.sin(angle2) * sunSize,
        ]);
      }
    }
  }

  // Render moon
  renderMoon() {
    // Moon color (white with slight blue tint)
    gl.uniform4f(u_FragColor, 0.9, 0.9, 1.0, 1.0);

    // Moon position based on day/night cycle (opposite the sun) - FLIPPED AND ADJUSTED ARC HEIGHT
    const moonX = Math.cos(this.dayNightCycle + Math.PI / 2) * 1.5;
    const moonY = -Math.sin(this.dayNightCycle + Math.PI / 2) * 0.3 + 0.7;

    // Only show moon when it's above horizon
    if (moonY > 0) {
      // Draw the moon using a circle approximation
      const moonSize = 0.08;
      const segments = 12;

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        drawTriangle([
          moonX,
          moonY,
          moonX + Math.cos(angle1) * moonSize,
          moonY + Math.sin(angle1) * moonSize,
          moonX + Math.cos(angle2) * moonSize,
          moonY + Math.sin(angle2) * moonSize,
        ]);
      }
    }
  }

  // Render birds
  renderBirds() {
    // Bird color (black)
    gl.uniform4f(u_FragColor, 0.1, 0.1, 0.1, 1.0);

    for (let bird of this.birds) {
      // Calculate wing position based on phase
      const wingY = Math.sin(bird.wingPhase) * bird.size;

      // Draw bird body (small triangle)
      drawTriangle([
        bird.x - bird.size,
        bird.y,
        bird.x + bird.size,
        bird.y,
        bird.x,
        bird.y + bird.size * 0.5,
      ]);

      // Draw wings
      drawTriangle([
        bird.x,
        bird.y,
        bird.x - bird.size * 1.5,
        bird.y + wingY,
        bird.x - bird.size * 0.5,
        bird.y + wingY * 0.5,
      ]);

      drawTriangle([
        bird.x,
        bird.y,
        bird.x + bird.size * 1.5,
        bird.y + wingY,
        bird.x + bird.size * 0.5,
        bird.y + wingY * 0.5,
      ]);
    }
  }

  // Render fireflies (at night)
  renderFireflies() {
    for (let firefly of this.fireflies) {
      // Glow intensity based on phase
      const glowIntensity = (Math.sin(firefly.phase) + 1) / 2;

      // Firefly color (yellow-green glow)
      gl.uniform4f(u_FragColor, 0.8, 1.0, 0.2, glowIntensity * 0.8);

      // Draw firefly as a small triangle
      const size = firefly.size / 1000;
      drawTriangle([
        firefly.x,
        firefly.y,
        firefly.x - size,
        firefly.y - size,
        firefly.x + size,
        firefly.y - size,
      ]);
    }
  }

  // Render fireworks
  renderFireworks() {
    for (let firework of this.fireworks) {
      if (firework.phase < 1.0) {
        // Rocket trail
        gl.uniform4f(u_FragColor, 1.0, 0.6, 0.2, 1.0);
        const size = 0.01;
        drawTriangle([
          firework.x,
          firework.y,
          firework.x - size,
          firework.y - size * 2,
          firework.x + size,
          firework.y - size * 2,
        ]);
      } else if (firework.particles.length > 0) {
        // Render particles
        gl.uniform4f(
          u_FragColor,
          firework.color[0],
          firework.color[1],
          firework.color[2],
          firework.color[3],
        );

        for (let particle of firework.particles) {
          if (particle.life > 0) {
            const size = 0.008 * particle.life;
            drawTriangle([
              particle.x,
              particle.y,
              particle.x - size,
              particle.y - size,
              particle.x + size,
              particle.y - size,
            ]);
          }
        }
      }
    }
  }
}

function drawAnimatedCastle() {
  // Animation loop handler
  let animationCastle = null;
  let animationId = null;

  // Create animated castle if it doesn't exist
  if (!animationCastle) {
    animationCastle = new AnimatedCastle();

    // Set up animation loop
    function animate() {
      animationCastle.update();
      renderAllShapes();
      animationId = requestAnimationFrame(animate);
    }

    // Start the animation loop
    animate();

    // Add click handler for interactive elements
    canvas.addEventListener("click", function (ev) {
      // Convert coordinates to GL space
      let [x, y] = convertCoordinatesEventToGL(ev);
      // Check if clicked on an interactive area
      animationCastle.checkClick(x, y);
    });

    // Add castle to shapes list (will be rendered in renderAllShapes)
    g_shapesList.push(animationCastle);
  } else {
    // Cancel any existing animation
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // Remove existing castle from shapes list
    let index = g_shapesList.indexOf(animationCastle);
    if (index > -1) {
      g_shapesList.splice(index, 1);
    }

    // Create a new one
    animationCastle = null;
    drawAnimatedCastle();
  }
}
