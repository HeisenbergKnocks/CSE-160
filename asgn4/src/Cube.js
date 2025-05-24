class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1, 1, 1, 1]; // Default solid-color RGBA
    this.textureNum = -2; // -2: untextured, >=0: bound texture unit
    this.matrix = new Matrix4(); // Local model transformation matrix

    // Initialize shared interleaved vertex+UV+normal data once
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

      // Define normals per face and repeat for 6 vertices each
      const faceNormals = [
        [0, 0, 1], // front
        [-1, 0, 0], // left
        [1, 0, 0], // right
        [0, 1, 0], // top
        [0, 0, -1], // back
        [0, -1, 0], // bottom
      ];
      const normals = [];
      faceNormals.forEach(([nx, ny, nz]) => {
        for (let i = 0; i < 6; i++) {
          normals.push(nx, ny, nz);
        }
      });

      // Pack into a single Float32Array: [x,y,z, u,v, nx,ny,nz] * 36
      const interleaved = new Float32Array(36 * 8);
      for (let i = 0; i < 36; i++) {
        interleaved.set(positions.slice(i * 3, i * 3 + 3), i * 8 + 0);
        interleaved.set(uvs.slice(i * 2, i * 2 + 2), i * 8 + 3);
        interleaved.set(normals.slice(i * 3, i * 3 + 3), i * 8 + 5);
      }
      Cube.vertexData = interleaved;
    }
  }

  render() {
    // Update shader uniforms: texture selector, color blend, transform
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4fv(u_FragColor, this.color);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const stride = Float32Array.BYTES_PER_ELEMENT * 8;

    // On first call: create and configure the shared VBO and attribute pointers
    if (!Cube._vbo) {
      Cube._vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._vbo);
      gl.bufferData(gl.ARRAY_BUFFER, Cube.vertexData, gl.STATIC_DRAW);

      // position attribute at offset 0
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(a_Position);
      // UV attribute at offset 3 * sizeof(float)
      gl.vertexAttribPointer(
        a_UV,
        2,
        gl.FLOAT,
        false,
        stride,
        Float32Array.BYTES_PER_ELEMENT * 3,
      );
      gl.enableVertexAttribArray(a_UV);
      // Normal attribute at offset 5 * sizeof(float)
      gl.vertexAttribPointer(
        a_Normal,
        3,
        gl.FLOAT,
        false,
        stride,
        Float32Array.BYTES_PER_ELEMENT * 5,
      );
      gl.enableVertexAttribArray(a_Normal);
    } else {
      // Bind on subsequent draws
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._vbo);
    }

    // *outside* the if/else:
    gl.bindBuffer(gl.ARRAY_BUFFER, Cube._vbo);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, stride, 12);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, stride, 20);
    // (and ensure all three are enabled)
    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_UV);
    gl.enableVertexAttribArray(a_Normal);

    // Draw the cube
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
