
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
  
  rotationX(r: number): Matrix4 {
    return [
      [1.0,         0.0,          0.0, 0.0],
      [0.0, Math.cos(r), -Math.sin(r), 0.0],
      [0.0, Math.sin(r),  Math.cos(r), 0.0],
      [0.0,         0.0,          0.0, 1.0],
    ];
  },
  rotationY(r: number): Matrix4 {
    return [
      [ Math.cos(r), 0.0, Math.sin(r), 0.0],
      [         0.0, 1.0,         0.0, 0.0],
      [-Math.sin(r), 0.0, Math.cos(r), 0.0],
      [         0.0, 0.0,         0.0, 1.0],
    ];
  },
  rotationZ(r: number): Matrix4 {
    return [
      [Math.cos(r), -Math.sin(r), 0.0, 0.0],
      [Math.sin(r),  Math.cos(r), 0.0, 0.0],
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
};
