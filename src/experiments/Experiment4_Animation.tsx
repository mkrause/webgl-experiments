
import * as React from 'react';
import { type UseAnimationFrameCallback, useAnimationFrame } from '../util/reactUtil';

/*
Experiment 4
*/


// ---
// Utilities (reusable)
// ---

type Vertex3 = [number, number, number];
type Matrix4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

const m4 = {
  multiply(a: Matrix4, b: Matrix4): Matrix4 {
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];
    const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0];
    const b31 = b[3 * 4 + 1];
    const b32 = b[3 * 4 + 2];
    const b33 = b[3 * 4 + 3];
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0];
    const a31 = a[3 * 4 + 1];
    const a32 = a[3 * 4 + 2];
    const a33 = a[3 * 4 + 3];
    
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },
};

type Mesh = { vertices: Array<Vertex3>, indices: Array<number> };
type MeshWithBuffers = { mesh: Mesh, vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer };

const webglUtil = {
  compileProgram(
    gl: WebGL2RenderingContext,
    shadersSource: { vertexShader?: string, fragmentShader?: string },
  ): WebGLProgram {
    const shaders: Array<WebGLShader> = [];
    
    if (shadersSource.vertexShader) {
      // Create a vertex shader
      const vertShader = gl.createShader(gl.VERTEX_SHADER);
      if (vertShader === null) { throw new Error(`Failed to create vertex shader`); }
      gl.shaderSource(vertShader, shadersSource.vertexShader);
      
      // Compile the vertex shader
      gl.compileShader(vertShader);
      if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vertShader));
        throw new Error('Failed to compile vertex shader');
      }
      
      shaders.push(vertShader);
    }
    
    if (shadersSource.fragmentShader) {
      // Create a fragment shader
      const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (fragShader === null) { throw new Error(`Failed to create fragment shader`); }
      gl.shaderSource(fragShader, shadersSource.fragmentShader);
      
      // Compile the fragment shader
      gl.compileShader(fragShader);
      if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fragShader));
        throw new Error('Failed to compile fragment shader');
      }
      
      shaders.push(fragShader);
    }
    
    // Create a shader program object to store the combined shader program
    const program = gl.createProgram();
    if (program === null) { throw new Error(`Failed to create shader program`); }
    
    for (const shader of shaders) {
      gl.attachShader(program, shader);
    }
    
    // Link the program
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      throw new Error(`Failed to link shader program`);
    }
    
    return program;
  },
  
  getUniformLocation(gl: WebGL2RenderingContext, program: WebGLProgram, uniformName: string): WebGLUniformLocation {
    const uniformLocation = gl.getUniformLocation(program, uniformName);
    if (uniformLocation === null) { throw new Error(`Unable to locate uniform "${uniformName}"`); }
    return uniformLocation;
  },
  
  getAttributeLocation(gl: WebGL2RenderingContext, program: WebGLProgram, attributeName: string): number {
    const attributeLocation = gl.getAttribLocation(program, attributeName);
    if (attributeLocation < 0) { throw new Error(`Unable to locate attribute "${attributeName}"`); }
    return attributeLocation;
  },
  
  // Set up a vertex array buffer (for later use)
  createVertexBuffer(gl: WebGL2RenderingContext, vertices: Array<Vertex3>): WebGLBuffer {
    const vertexBuffer = gl.createBuffer(); // Create a vertex array buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // Bind it to the global `ARRAY_BUFFER`
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);
    
    // Unbind the buffer, the consumer can re-bind this at the appropriate time
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    if (vertexBuffer === null) { throw new Error(`Failed to create vertex array buffer`); }
    
    return vertexBuffer;
  },
  // Set up an index array buffer (for later use)
  createIndexBuffer(gl: WebGL2RenderingContext, indices: Array<number>): WebGLBuffer {
    const indexBuffer = gl.createBuffer(); // Create an index array buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); // Bind it to the global `ELEMENT_ARRAY_BUFFER`
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    // Unbind the buffer, the consumer can re-bind this at the appropriate time
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    if (indexBuffer === null) { throw new Error(`Failed to create index array buffer`); }
    
    return indexBuffer;
  },
  
  createBuffersForMesh(gl: WebGL2RenderingContext, mesh: Mesh): MeshWithBuffers {
    return {
      mesh,
      vertexBuffer: webglUtil.createVertexBuffer(gl, mesh.vertices),
      indexBuffer: webglUtil.createIndexBuffer(gl, mesh.indices),
    };
  },
};


// ---
// Models
// ---

const createCubeMesh = (): Mesh => {
  // Our "model": an array of 3D vertices forming a unit cube
  // These are in local space coordinates. Order must be counter-clockwise for a front-facing face
  const vertices: Array<Vertex3> = [
    [-1.0, -1.0, +1.0], [+1.0, -1.0, +1.0], [+1.0, +1.0, +1.0], [-1.0, +1.0, +1.0], // Front face
    [-1.0, -1.0, -1.0], [-1.0, +1.0, -1.0], [+1.0, +1.0, -1.0], [+1.0, -1.0, -1.0], // Back face
    [-1.0, +1.0, -1.0], [-1.0, +1.0, +1.0], [+1.0, +1.0, +1.0], [+1.0, +1.0, -1.0], // Top face
    [-1.0, -1.0, -1.0], [+1.0, -1.0, -1.0], [+1.0, -1.0, +1.0], [-1.0, -1.0, +1.0], // Bottom face
    [+1.0, -1.0, -1.0], [+1.0, +1.0, -1.0], [+1.0, +1.0, +1.0], [+1.0, -1.0, +1.0], // Right face
    [-1.0, -1.0, -1.0], [-1.0, -1.0, +1.0], [-1.0, +1.0, +1.0], [-1.0, +1.0, -1.0], // Left face
  ];
  
  const indices = [
    0, 1, 2, 0, 2, 3, // Front
    4, 5, 6, 4, 6, 7, // Back
    8, 9, 10, 8, 10, 11, // Top
    12, 13, 14, 12, 14, 15, // Bottom
    16, 17, 18, 16, 18, 19, // Right
    20, 21, 22, 20, 22, 23, // Left
  ];
  
  return { vertices, indices };
};


// ---
// Application
// ---


const initWebGlContext = (canvas: HTMLCanvasElement): WebGL2RenderingContext => {
  const gl: null | WebGL2RenderingContext = canvas.getContext('webgl2');
  if (gl === null) { throw new Error(`Unable to initialize WebGL`); }
  gl.viewport(0, 0, canvas.width, canvas.height);
  return gl;
};

// type Model = {
//   mesh: Mesh,
//   transform: Matrix4,
// };
type AppContext = {
  programInfo: {
    program: WebGLProgram,
    uniforms: Record<string, WebGLUniformLocation>,
    attributes: Record<string, number>,
  },
  meshes: Record<string, MeshWithBuffers>,
};
const initExperiment = (canvas: HTMLCanvasElement, gl: WebGL2RenderingContext): AppContext => {
  //
  // Set up models
  //
  
  const cube: Mesh = createCubeMesh();
  const cubeWithBuffers: MeshWithBuffers = webglUtil.createBuffersForMesh(gl, cube);
  
  
  //
  // Create the shader program
  //
  
  const vertexShader = `
    #version 300 es
    
    uniform mat4 transformation;
    in vec3 vertex_position;
    in vec4 vertex_color;
    out vec4 color;
    
    void main(void) {
      gl_Position = transformation * vec4(vertex_position, 1.0);
      color = vertex_color;
    }
  `.trim();
  
  const fragmentShader = `
    #version 300 es
    precision highp float;
    
    in vec4 color;
    out vec4 outColor;
    
    void main(void) {
      outColor = color; // Color interpolated from vertices
    }
  `.trim();
  
  const shaderProgram = webglUtil.compileProgram(gl, { vertexShader, fragmentShader });
  
  return {
    programInfo: {
      program: shaderProgram,
      uniforms: {
        transformation: webglUtil.getUniformLocation(gl, shaderProgram, 'transformation'),
      },
      attributes: {
        vertexPosition: webglUtil.getAttributeLocation(gl, shaderProgram, 'vertex_position'),
        vertexColor: webglUtil.getAttributeLocation(gl, shaderProgram, 'vertex_color'),
      },
    },
    meshes: {
      cube: cubeWithBuffers,
    },
  };
};

// type Scene = {
//   root: Model,
// };
type TimingInfo = { time: number, delta: number };
const renderExperiment = (
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  app: AppContext,
  timing: TimingInfo,
) => {
  const program = app.programInfo.program;
  const uniforms = app.programInfo.uniforms;
  const attributes = app.programInfo.attributes;
  const cubeWithBuffers = app.meshes.cube;
  
  gl.useProgram(program);
  
  
  //
  // Set up the input (buffer, uniforms, attributes)
  //
  
  // Set up the vertex array buffer and vertex index buffer for our model
  {
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeWithBuffers.vertexBuffer);
    gl.vertexAttribPointer(attributes.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributes.vertexPosition);
  };
  {
    // FIXME: this buffer should be prepared ahead of time like the other buffers
    const colorPalette = [
      [0.8, 0, 0, 1],
      [0, 1, 0, 1],
      [0, 0, 1, 1],
      [0.5, 0.5, 0, 1],
      [0.5, 0, 0.5, 1],
      [0, 0.5, 0.5, 1],
    ];
    const colors = cubeWithBuffers.mesh.vertices.flatMap(
      //(_vertex, index) => colorPalette[index % 4],
      (_vertex, index) => colorPalette[Math.floor((index / 4) % 6)],
    );
    const colorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(attributes.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributes.vertexColor);
  };
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeWithBuffers.indexBuffer);
  
  // Set the uniform values
  
  const scaleMatrix: Matrix4 = [
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 0.5, 0.0,
    0.0, 0.0, 0.0, 1.0,
  ];
  
  const angleX = timing.time / 2000;
  const angleY = timing.time / 1000;
  const angleZ = timing.time / 2000;
  const rotationMatrixX: Matrix4 = [
    1.0, 0.0, 0.0, 0.0,
    0.0, Math.cos(angleX), Math.sin(angleX), 0.0,
    0.0, -1 * Math.sin(angleX), Math.cos(angleX), 0.0,
    0.0, 0.0, 0.0, 1.0,
  ];
  const rotationMatrixY: Matrix4 = [
    Math.cos(angleY), 0.0, -1 * Math.sin(angleY), 0.0,
    0.0, 1.0, 0.0, 0.0,
    Math.sin(angleY), 0.0, Math.cos(angleY), 0.0,
    0.0, 0.0, 0.0, 1.0,
  ];
  const rotationMatrixZ: Matrix4 = [
    Math.cos(angleZ), -1 * Math.sin(angleZ), 0.0, 0.0,
    Math.sin(angleZ), Math.cos(angleZ), 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
  ];
  const aspectRatioMatrix: Matrix4 = [
    canvas.height / canvas.width, 0.0, 0.0, 0.0, // Compensate for the aspect ratio
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0,
  ];
  
  const transformationMatrix = m4.multiply(
    m4.multiply(
      rotationMatrixZ,
      m4.multiply(
        rotationMatrixY,
        m4.multiply(rotationMatrixX, scaleMatrix),
      ),
    ),
    aspectRatioMatrix,
  );
  
  gl.uniformMatrix4fv(uniforms.transformation, true, transformationMatrix);
  
  
  //
  // Render
  //
  
  // Clear the canvas + depth buffer
  // https://stackoverflow.com/questions/48693164/depth-buffer-clear-behavior-between-draw-calls
  gl.clearColor(0.6, 0.6, 0.6, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Enable the depth test
  gl.enable(gl.DEPTH_TEST);
  
  // Draw the triangle
  gl.drawElements(gl.TRIANGLES, cubeWithBuffers.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
};

export const Experiment4 = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [glContext, setGlContext] = React.useState<null | WebGL2RenderingContext>(null);
  const [appContext, setAppContext] = React.useState<null | AppContext>(null);
  const [running, setRunning] = React.useState(true);
  const ready = running && canvasRef.current !== null && glContext !== null && appContext !== null;
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const glContext = initWebGlContext(canvasRef.current);
      setGlContext(glContext);
      setAppContext(initExperiment(canvas, glContext));
    }
  }, [canvasRef]);
  
  const animate = React.useCallback<UseAnimationFrameCallback>(({ time, delta }) => {
    const canvas = canvasRef.current;
    if (canvas === null || glContext === null) { throw new Error(`Missing initialized WebGL canvas`); }
    if (appContext === null) { throw new Error(`App was not initialized properly`); }
    
    renderExperiment(canvas, glContext, appContext, { time, delta });
  }, [canvasRef, glContext]);
  useAnimationFrame(!ready ? null : animate);
  
  return (
    <>
      <div><canvas ref={canvasRef} width="800" height="600"/></div>
      <button
        onClick={() => {
          setRunning(running => !running);
        }}
      >
        {running ? 'Stop' : 'Start'}
      </button>
    </>
  );
};
