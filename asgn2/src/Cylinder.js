/**
 * Very small helper primitive: a unit‑radius, unit‑height cylinder
 * centred at the origin.  Only the side wall is drawn because
 * we only need a neck / leg segment – feel free to add caps if desired.
 */
class Cylinder {
  constructor(segments = 24) {
    this.type = "cylinder";
    this.color = [1, 1, 1, 1]; // default white
    this.matrix = new Matrix4();
    this.segments = segments; // number of vertical slices
  }

  /** Draws the cylinder using your existing drawTriangle3D(). */
  render() {
    // per‑object uniforms
    gl.uniform4f(
      u_FragColor,
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3],
    );
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const TWO_PI = Math.PI * 2;
    const r = 0.5; // radius (before model‑matrix scale)

    /* ---- side wall: one quad (two triangles) per segment ---- */
    for (let i = 0; i < this.segments; ++i) {
      const a0 = (i / this.segments) * TWO_PI;
      const a1 = ((i + 1) / this.segments) * TWO_PI;

      const x0 = r * Math.cos(a0),
        z0 = r * Math.sin(a0);
      const x1 = r * Math.cos(a1),
        z1 = r * Math.sin(a1);

      // upper and lower y‑coordinates (unit height)
      const yTop = 0.5;
      const yBot = -0.5;

      /* first triangle of the quad */
      drawTriangle3D([x0, yTop, z0, x0, yBot, z0, x1, yTop, z1]);

      /* second triangle of the quad */
      drawTriangle3D([x1, yTop, z1, x0, yBot, z0, x1, yBot, z1]);
    }
  }
}
