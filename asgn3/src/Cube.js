class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1, 1, 1, 1]; // Default solid-color RGBA
    this.textureNum = -2; // -2: untextured, >=0: bound texture unit
    this.matrix = new Matrix4(); // Local model transformation matrix

    // Initialize shared interleaved vertex+UV data once
    if (!Cube.vertexData) {
      const positions = [
        // FRONT face (6 vertices)
        -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
        0.5, 0.5, -0.5, 0.5, 0.5,
        // LEFT face
        -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
        // RIGHT face
        0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5, 0.5, 0.5,
        // TOP face
        -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5, -0.5,
        // BACK face
        0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
        // BOTTOM face
        -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5,
        0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
      ];

      const uvs = [
        // Each face uses the same UV pattern for consistent texturing
        0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1,
        0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1,
        0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1,
      ];

      // Pack into a single Float32Array: [pos.x, pos.y, pos.z, uv.u, uv.v] * 36 vertices
      const interleaved = new Float32Array(36 * 5);
      for (let i = 0; i < 36; i++) {
        interleaved[i * 5 + 0] = positions[i * 3 + 0];
        interleaved[i * 5 + 1] = positions[i * 3 + 1];
        interleaved[i * 5 + 2] = positions[i * 3 + 2];
        interleaved[i * 5 + 3] = uvs[i * 2 + 0];
        interleaved[i * 5 + 4] = uvs[i * 2 + 1];
      }
      Cube.vertexData = interleaved;
    }
  }

  render() {
    // Update shader uniforms: texture selector and color blend
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4fv(u_FragColor, this.color);
    // Upload the model transform
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // On first call: create and configure the shared VBO and attribute pointers
    if (!Cube._vbo) {
      Cube._vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._vbo);
      gl.bufferData(gl.ARRAY_BUFFER, Cube.vertexData, gl.STATIC_DRAW);

      const stride = Float32Array.BYTES_PER_ELEMENT * 5;
      // position attr: 3 floats at offset 0
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(a_Position);
      // UV attr: 2 floats at offset 3 * sizeof(float)
      gl.vertexAttribPointer(
        a_UV,
        2,
        gl.FLOAT,
        false,
        stride,
        Float32Array.BYTES_PER_ELEMENT * 3,
      );
      gl.enableVertexAttribArray(a_UV);
    } else {
      // Bind existing buffer on subsequent draws
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._vbo);
    }

    // Draw all vertices as triangles for rendering
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
