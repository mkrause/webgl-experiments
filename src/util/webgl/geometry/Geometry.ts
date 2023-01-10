
import { type Vector3 } from '../../matrix';


export type Mesh = { vertices: Array<Vector3>, indices: Array<number>, normals: Array<Vector3> };

export const cube = (): Mesh => {
  // An array of 3D vertices forming a unit cube.
  // This assumes a right-handed coordinate system (positive z-axns extending towards the viewer).
  const vertices: Array<Vector3> = [
    [-1.0, -1.0, +1.0], [+1.0, -1.0, +1.0], [+1.0, +1.0, +1.0], [-1.0, +1.0, +1.0], // Front face
    [-1.0, -1.0, -1.0], [-1.0, +1.0, -1.0], [+1.0, +1.0, -1.0], [+1.0, -1.0, -1.0], // Back face
    [-1.0, +1.0, -1.0], [-1.0, +1.0, +1.0], [+1.0, +1.0, +1.0], [+1.0, +1.0, -1.0], // Top face
    [-1.0, -1.0, -1.0], [+1.0, -1.0, -1.0], [+1.0, -1.0, +1.0], [-1.0, -1.0, +1.0], // Bottom face
    [+1.0, -1.0, -1.0], [+1.0, +1.0, -1.0], [+1.0, +1.0, +1.0], [+1.0, -1.0, +1.0], // Right face
    [-1.0, -1.0, -1.0], [-1.0, -1.0, +1.0], [-1.0, +1.0, +1.0], [-1.0, +1.0, -1.0], // Left face
  ];
  
  // Specify the array indices, where counter-clockwise ordered vertices form a forward-facing triangle
  const indices: Array<number> = [
    0, 1, 2, 0, 2, 3, // Front quad
    4, 5, 6, 4, 6, 7, // Back quad
    8, 9, 10, 8, 10, 11, // Top quad
    12, 13, 14, 12, 14, 15, // Bottom quad
    16, 17, 18, 16, 18, 19, // Right quad
    20, 21, 22, 20, 22, 23, // Left quad
  ];
  
  const xp: Vector3 = [1, 0, 0];
  const xn: Vector3 = [-1, 0, 0];
  const yp: Vector3 = [0, 1, 0];
  const yn: Vector3 = [0, -1, 0];
  const zp: Vector3 = [0, 0, 1];
  const zn: Vector3 = [0, 0, -1];
  const normals: Array<Vector3> = [
    zp, zp, zp, zp, // Front face
    zn, zn, zn, zn, // Back face 
    yp, yp, yp, yp, // Top face
    yn, yn, yn, yn, // Bottom face
    xp, xp, xp, xp, // Right face
    xn, xn, xn, xn, // Left face
  ];
  
  return { vertices, indices, normals };
};
