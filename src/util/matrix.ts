
/*
Simple implementation of vector and matrix math (not particularly efficient, focuses on readability).

Existing libraries:
- https://glmatrix.net
*/


export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type Matrix4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
];


export const v3 = {
  origin(): Vector3 {
    return [0, 0, 0];
  },
  scale(s: number, v: Vector3): Vector3 {
    return v.map(x => x * s) as Vector3;
  },
  magnitude(v: Vector3): number {
    return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
  },
  normalize(v: Vector3): Vector3 {
    const magnitude = v3.magnitude(v);
    return v3.scale(1 / magnitude, v);
  },
  add(v: Vector3, w: Vector3): Vector3 {
    return v.map((vi, i) => vi + w[i]) as Vector3;
  },
  subtract(v: Vector3, w: Vector3): Vector3 {
    return v.map((vi, i) => vi - w[i]) as Vector3;
  },
  dot(v: Vector3, w: Vector3): number {
    return v.reduce((acc, vEntry, i) => acc + vEntry * w[i], 0);
  },
  cross(v: Vector3, w: Vector3): Vector3 {
    const t1 = v[2] * w[0] - v[0] * w[2];
    const t2 = v[0] * w[1] - v[1] * w[0];
    return [v[1] * w[2] - v[2] * w[1], t1, t2];
  },
};

export const v4 = {
  zero(): Vector4 {
    return [0, 0, 0, 1];
  },
  dot(v: Vector4, w: Vector4): number {
    return v.reduce((acc, vEntry, i) => acc + vEntry * w[i], 0);
  },
  scale(s: number, v: Vector4): Vector4 {
    return v.map(x => x * s) as Vector4;
  },
  toVector3(v: Vector4): Vector3 {
    return v.slice(0, 2) as Vector3;
  }
};


export const m4 = {
  print(m: Matrix4) {
    return `[
  ${JSON.stringify(m[0])},
  ${JSON.stringify(m[1])},
  ${JSON.stringify(m[2])},
  ${JSON.stringify(m[3])}
]`;
  },
  
  identity(): Matrix4 {
    return [
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0],
    ];
  },
  
  scale(m: Matrix4, s: number): Matrix4 {
    return m.map(row => row.map(entry => entry * s)) as Matrix4;
  },
  
  transpose(m: Matrix4): Matrix4 {
    const transposed = m4.identity();
    for (const i in m) {
      for (const j in m[i]) {
        transposed[j][i] = m[i][j];
      }
    }
    return transposed;
  },
  
  determinant(m: Matrix4): number {
    // Adapted from: https://github.com/toji/gl-matrix/blob/master/src/mat4.js
    const b0 = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    const b1 = m[0][0] * m[1][2] - m[0][2] * m[1][0];
    const b2 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
    const b3 = m[2][0] * m[3][1] - m[2][1] * m[3][0];
    const b4 = m[2][0] * m[3][2] - m[2][2] * m[3][0];
    const b5 = m[2][1] * m[3][2] - m[2][2] * m[3][1];
    const b6 = m[0][0] * b5 - m[0][1] * b4 + m[0][2] * b3;
    const b7 = m[1][0] * b5 - m[1][1] * b4 + m[1][2] * b3;
    const b8 = m[2][0] * b2 - m[2][1] * b1 + m[2][2] * b0;
    const b9 = m[3][0] * b2 - m[3][1] * b1 + m[3][2] * b0;
  
    return m[1][3] * b6 - m[0][3] * b7 + m[3][3] * b8 - m[2][3] * b9;
  },
  
  invert(m: Matrix4): Matrix4 {
    // Adapted from: https://github.com/toji/gl-matrix/blob/master/src/mat4.js
    const det = m4.determinant(m);
    if (det === 0) { throw new Error(`Failed to invert the given matrix`); }
    
    const d = 1 / det;
    
    const b00 = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    const b01 = m[0][0] * m[1][2] - m[0][2] * m[1][0];
    const b02 = m[0][0] * m[1][3] - m[0][3] * m[1][0];
    const b03 = m[0][1] * m[1][2] - m[0][2] * m[1][1];
    const b04 = m[0][1] * m[1][3] - m[0][3] * m[1][1];
    const b05 = m[0][2] * m[1][3] - m[0][3] * m[1][2];
    const b06 = m[2][0] * m[3][1] - m[2][1] * m[3][0];
    const b07 = m[2][0] * m[3][2] - m[2][2] * m[3][0];
    const b08 = m[2][0] * m[3][3] - m[2][3] * m[3][0];
    const b09 = m[2][1] * m[3][2] - m[2][2] * m[3][1];
    const b10 = m[2][1] * m[3][3] - m[2][3] * m[3][1];
    const b11 = m[2][2] * m[3][3] - m[2][3] * m[3][2];
    
    return [
      [
        d * (m[1][1] * b11 - m[1][2] * b10 + m[1][3] * b09),
        d * (m[0][2] * b10 - m[0][1] * b11 - m[0][3] * b09),
        d * (m[3][1] * b05 - m[3][2] * b04 + m[3][3] * b03),
        d * (m[2][2] * b04 - m[2][1] * b05 - m[2][3] * b03),
      ],
      [
        d * (m[1][2] * b08 - m[1][0] * b11 - m[1][3] * b07),
        d * (m[0][0] * b11 - m[0][2] * b08 + m[0][3] * b07),
        d * (m[3][2] * b02 - m[3][0] * b05 - m[3][3] * b01),
        d * (m[2][0] * b05 - m[2][2] * b02 + m[2][3] * b01),
      ],
      [
        d * (m[1][0] * b10 - m[1][1] * b08 + m[1][3] * b06),
        d * (m[0][1] * b08 - m[0][0] * b10 - m[0][3] * b06),
        d * (m[3][0] * b04 - m[3][1] * b02 + m[3][3] * b00),
        d * (m[2][1] * b02 - m[2][0] * b04 - m[2][3] * b00),
      ],
      [
        d * (m[1][1] * b07 - m[1][0] * b09 - m[1][2] * b06),
        d * (m[0][0] * b09 - m[0][1] * b07 + m[0][2] * b06),
        d * (m[3][1] * b01 - m[3][0] * b03 - m[3][2] * b00),
        d * (m[2][0] * b03 - m[2][1] * b01 + m[2][2] * b00),
      ],
    ];
  },
  
  multiply(m: Matrix4, n: Matrix4): Matrix4 {
    const product = m4.identity();
    const nT = m4.transpose(n);
    for (const i in m) {
      for (const j in m[i]) {
        product[i][j] = v4.dot(m[i], nT[j]);
      }
    }
    return product;
  },
  // Multiply all the given matrices, in left-to-right order (i.e. `multiplyPiped(A, B, C)` returns `CBA`)
  multiplyPiped(...matrices: Array<Matrix4>): Matrix4 {
    return matrices.reduce(
      (product, matrix) => m4.multiply(matrix, product),
      m4.identity(),
    );
  },
  // Multiplication of a matrix and a 3D vector in homogeneous coordinates. Will return another `Vector4` in
  // homogeneous coordinates, dividing by the `w` component (perspective divide) if necessary.
  multiplyVector(m: Matrix4, v: Vector4, perspectiveDivide = true): Vector4 {
    const product = v4.zero();
    for (const i in v) {
      product[i] = v4.dot(m[i], v);
    }
    
    const w = product[3];
    if (!perspectiveDivide || w === 1) {
      return product;
    } else {
      // Divide by the `w` component to get a normalized vector in homogeneous coordinates (i.e. w = 1)
      // Note: `w` could be zero here, in which case the result would be (+/-)Infinity/NaN (depending on the numerator)
      // Up to the consumer to prevent `w` from being 0, if `perspectiveDivide` is enabled
      return v4.scale(1 / w, product);
    }
  },
  
  //
  // Linear transformations
  //
  
  scaling(s: Vector3): Matrix4 {
    return [
      [s[0], 0.0,  0.0, 0.0],
      [ 0.0, s[1], 0.0, 0.0],
      [ 0.0, 0.0, s[2], 0.0],
      [ 0.0, 0.0,  0.0, 1.0],
    ];
  },
  
  // Note: the angle `a` in each of the following is in radians and represents a counterclockwise rotation along
  // the respective axis.
  rotationX(a: number): Matrix4 {
    return [
      [1.0,         0.0,          0.0, 0.0],
      [0.0, Math.cos(a), -Math.sin(a), 0.0],
      [0.0, Math.sin(a),  Math.cos(a), 0.0],
      [0.0,         0.0,          0.0, 1.0],
    ];
  },
  rotationY(a: number): Matrix4 {
    return [
      [ Math.cos(a), 0.0, Math.sin(a), 0.0],
      [         0.0, 1.0,         0.0, 0.0],
      [-Math.sin(a), 0.0, Math.cos(a), 0.0],
      [         0.0, 0.0,         0.0, 1.0],
    ];
  },
  rotationZ(a: number): Matrix4 {
    return [
      [Math.cos(a), -Math.sin(a), 0.0, 0.0],
      [Math.sin(a),  Math.cos(a), 0.0, 0.0],
      [        0.0,          0.0, 1.0, 0.0],
      [        0.0,          0.0, 0.0, 1.0],
    ];
  },
  
  //
  // Affine/perspective transformations
  //
  
  translation(t: Vector3): Matrix4 {
    return [
      [1.0, 0.0, 0.0, t[0]],
      [0.0, 1.0, 0.0, t[1]],
      [0.0, 0.0, 1.0, t[2]],
      [0.0, 0.0, 0.0, 1.0],
    ];
  },
  
  // Generate an orthographic projection matrix, based on explicit frustum coordinates.
  // See also:
  // - `glFrustum` https://registry.khronos.org/OpenGL-Refpages/gl2.1/xhtml/glFrustum.xml
  // - https://en.wikipedia.org/wiki/Orthographic_projection
  // - https://github.com/toji/gl-matrix/blob/master/src/mat4.js#L1664
  orthographicFrustum(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4 {
    const w = Math.abs(right - left); // Frustum width
    const h = Math.abs(top - bottom); // Frustum height
    const d = Math.abs(far - near); // Frustum depth
    
    // Translation from camera space origin to clip space origin
    const translation = m4.translation([
      -1 * (left + right) / 2, // `(left + right) / 2` is the horizontal midpoint of the frustum
      -1 * (bottom + top) / 2,
      -1 * (near + far) / 2,
    ]);
    
    // Scaling to (-1, 1) clip space range (normalized device coordinates)
    const scaling = m4.scaling([
      1 / (w / 2), // Scale (inversed) by half the frustum width (equivalently, can simplify this to `2/w`)
      1 / (h / 2),
      1 / (d / 2),
    ]);
    
    return m4.multiplyPiped(translation, scaling);
  },
  
  // Generate an orthographic projection matrix, based on field of view
  // `fov` is the vertical field of view angle, in radians
  orthographicProjection(fov: number, aspect: number, near: number, far: number): Matrix4 {
    const nearHeight = 2 * (Math.tan(fov / 2) * near); // The near clip plane height (derived from FoV and distance)
    const top = nearHeight / 2; // The top clip plane Y-coordinate (derived from the near clip plane height)
    const right = top * aspect; // The right clip plane X-coordinate (which is fixed by the aspect ratio)
    return m4.orthographicFrustum(-right, right, -top, top, near, far);
  },
  
  // Generate a perspective projection matrix
  // - `fov` is the vertical field of view angle, in radians
  // - `aspect` is the viewport width/height ratio
  // - `nearZ` is the Z-coordinate of the near clip plane (should be passed as a positive number)
  // - `farZ` is the Z-coordinate of the far clip plane (should be passed as a positive number)
  perspectiveProjection(fov: number, aspect: number, nearZ: number, farZ: number): Matrix4 {
    // For a full explanation of the math behind this perspective projection, see:
    // - https://stackoverflow.com/questions/28286057/trying-to-understand-the-math-behind-the-perspective-matrix
    // - https://unspecified.wordpress.com/2012/06/21/calculating-the-gluperspective-matrix
    
    const theta = fov / 2; // Vertical viewing angle (relative to the Z-axis)
    
    // Trick: the following is equivalent to `1 / tan(theta)`, but avoids division by zero (see the StackOverflow)
    const s = Math.tan(Math.PI * 0.5 - theta); // Usually called `f` (but confusing, `f` is also the focal length)
    
    const r = 1.0 / (nearZ - farZ); // Extract out common factor
    return [
      [s / aspect, 0.0,                0.0,                  0.0],
      [       0.0,   s,                0.0,                  0.0],
      [       0.0, 0.0, (nearZ + farZ) * r, 2 * nearZ * farZ * r],
      [       0.0, 0.0,               -1.0,                  0.0], // Perspective divide
    ];
  },
  
  // Generate a camera transform to look at in the direction of the given `target`
  lookAt(camera: Vector3, target: Vector3): Matrix4 {
    const up: Vector3 = [0, 1, 0];
    
    const zAxis = v3.normalize(v3.subtract(camera, target));
    const xAxis = v3.normalize(v3.cross(up, zAxis));
    const yAxis = v3.normalize(v3.cross(zAxis, xAxis));
    
    return [
      [xAxis[0], yAxis[0], zAxis[0], camera[0]],
      [xAxis[1], yAxis[1], zAxis[1], camera[1]],
      [xAxis[2], yAxis[2], zAxis[2], camera[2]],
      [0, 0, 0, 1],
    ];
  },
};
