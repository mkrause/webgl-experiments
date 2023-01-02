
/*
Simple implementation of vector and matrix math (not particularly efficient, just for experimental purposes).

Similar libraries:
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

export const v4 = {
  dot(a: Vector4, b: Vector4): number {
    return a.reduce((acc, a, i) => acc + a * b[i], 0);
  },
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
  
  // Generate an orthographic projection matrix
  // See also:
  // - https://en.wikipedia.org/wiki/Orthographic_projection
  // - https://github.com/toji/gl-matrix/blob/master/src/mat4.js#L1664
  orthographicProjection(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4 {
    const w = right - left; // Frustum width
    const h = top - bottom; // Frustum height
    const d = far - near; // Frustum depth
    
    // Translation from camera space origin to clip space origin
    const translation = m4.translation([
      -1 * (left + right) / 2, // `(left + right) / 2` is the horizontal midpoint of the frustum
      -1 * (bottom + top) / 2,
      -1 * (far + near) / 2,
    ]);
    
    // Scaling to (-1, 1) clip space range (normalized device coordinates)
    const scaling = m4.scaling([
      1 / (w / 2), // Scale by the inverse of half the frustum width (equivalently, can simplify this to `2/w`)
      1 / (h / 2),
      1 / (d / 2),
    ]);
    
    return m4.multiplyPiped(translation, scaling);
  },
  
  perspective(fieldOfViewInRadians: number, aspect: number, near: number, far: number): Matrix4 {
    // Ref: https://webgl2fundamentals.org/webgl/webgl-3d-perspective-matrix.html
    
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    const rangeInv = 1.0 / (near - far);
    
    return m4.transpose([
      [f / aspect, 0, 0, 0],
      [0, f, 0, 0],
      [0, 0, (near + far) * rangeInv, -1],
      [0, 0, near * far * rangeInv * 2, 0],
    ]);
  },
};
