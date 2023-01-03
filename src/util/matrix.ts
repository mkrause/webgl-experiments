
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
  // Multiplication of a matrix and a 3D vector in homogeneous coordinates. Will return another `Vector4` in
  // homogeneous coordinates, dividing by the `w` component (perspective divide) if necessary.
  multiplyVector(m: Matrix4, v: Vector4): Vector4 {
    const product = v4.zero();
    for (const i in v) {
      product[i] = v4.dot(m[i], v);
    }
    // Divide by the `w` component to get a normalized vector in homogeneous coordinates (i.e. w = 1)
    return v4.scale(1 / product[3], product);
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
      1 / (w / 2), // Scale by the inverse of half the frustum width (equivalently, can simplify this to `2/w`)
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
  // `fov` is the vertical field of view angle, in radians
  perspectiveProjection(fov: number, aspect: number, near: number, far: number): Matrix4 {
    // Ref: https://webgl2fundamentals.org/webgl/webgl-3d-perspective-matrix.html
    
    // const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    // const rangeInv = 1.0 / (near - far);
    // 
    // return m4.transpose([
    //   [f / aspect, 0, 0, 0],
    //   [0, f, 0, 0],
    //   [0, 0, (near + far) * rangeInv, -1],
    //   [0, 0, near * far * rangeInv * 2, 0],
    // ]);
    // return [
    //   [f / aspect, 0, 0, 0],
    //   [0, f, 0, 0],
    //   [0, 0, (near + far) * rangeInv, near * far * rangeInv * 2],
    //   [0, 0, -1, 0],
    // ];
    
    const proj = m4.orthographicProjection(fov, aspect, near, far);
    const pers = m4.identity();
    pers[3] = [0, 0, 1, 0];
    return m4.multiplyPiped(proj, pers);
    
    const w = Math.abs(right - left); // Frustum width
    const h = Math.abs(top - bottom); // Frustum height
    const d = Math.abs(far - near); // Frustum depth
    
    const translation = m4.translation([
      -1 * (left + right) / 2, // `(left + right) / 2` is the horizontal midpoint of the frustum
      -1 * (bottom + top) / 2,
      -1 * (near + far) / 2,
    ]);
    
    return [
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0],
    ];
  },
};
