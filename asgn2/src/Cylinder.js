class Cylinder {
  constructor() {
    this.type = "cylinder";
    this.color = [1.0, 1.0, 1.0, 1.0];

    // Model matrix for translating, rotating, scaling the unit cylinder
    this.matrix = new Matrix4();

    // How many slices around the circumference
    this.segments = 30;

    // Height of the cylinder along the z–axis (unit = 1)
    this.height = 1.0;
  }

  render() {
    const rgba = this.color;

    // Pass color and model matrix to the shader
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const n = this.segments;
    const h = this.height;
    const angleStep = (2 * Math.PI) / n;

    for (let i = 0; i < n; i++) {
      const θ1 = i * angleStep;
      const θ2 = (i + 1) * angleStep;

      // Unit‐radius circle in XY, scaled to radius 0.5 for a nicer default
      const x1 = Math.cos(θ1) * 0.5,
        y1 = Math.sin(θ1) * 0.5;
      const x2 = Math.cos(θ2) * 0.5,
        y2 = Math.sin(θ2) * 0.5;

      // —— Top cap (z = h)
      drawTriangle3D([
        0,
        0,
        h, // center
        x1,
        y1,
        h,
        x2,
        y2,
        h,
      ]);

      // —— Bottom cap (z = 0) — flip winding so normal points down
      drawTriangle3D([0, 0, 0, x2, y2, 0, x1, y1, 0]);

      // —— Side (first half)
      drawTriangle3D([x1, y1, 0, x1, y1, h, x2, y2, h]);

      // —— Side (second half)
      drawTriangle3D([x1, y1, 0, x2, y2, h, x2, y2, 0]);
    }
  }
}
