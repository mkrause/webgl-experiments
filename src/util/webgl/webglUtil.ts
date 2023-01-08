
import { type Vector3 } from '../matrix';


export type AttributeLocation = number;

// Internal shorthands
type GLContext = WebGL2RenderingContext;


/**
 * Initialize a WebGL rendering context for the given HTML canvas element.
 */
export const initializeRenderingContext = (canvas: HTMLCanvasElement): GLContext => {
  const gl: null | WebGL2RenderingContext = canvas.getContext('webgl2');
  if (gl === null) { throw new Error(`Unable to initialize WebGL`); }
  
  // The viewport is automatically configured (but it's good to update this on render in case the width/height changed)
  //gl.viewport(0, 0, canvas.width, canvas.height);
  
  return gl;
};

/**
 * Compile a shader program from the given GLSL shader source code.
 */
type ShadersSource = { vertexShader?: string, fragmentShader?: string };
export const compileProgram = (gl: GLContext, shadersSource: ShadersSource): WebGLProgram => {
  const shaders: Array<WebGLShader> = [];
  
  if (shadersSource.vertexShader) {
    // Create a vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (vertexShader === null) { throw new Error(`Failed to create vertex shader`); }
    gl.shaderSource(vertexShader, shadersSource.vertexShader);
    
    // Compile the vertex shader
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vertexShader));
      throw new Error('Failed to compile vertex shader');
    }
    
    shaders.push(vertexShader);
  }
  
  if (shadersSource.fragmentShader) {
    // Create a fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (fragmentShader === null) { throw new Error(`Failed to create fragment shader`); }
    gl.shaderSource(fragmentShader, shadersSource.fragmentShader);
    
    // Compile the fragment shader
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fragmentShader));
      throw new Error('Failed to compile fragment shader');
    }
    
    shaders.push(fragmentShader);
  }
  
  // Create the shader program
  const program = gl.createProgram();
  if (program === null) { throw new Error(`Failed to create shader program`); }
  
  for (const shader of shaders) {
    gl.attachShader(program, shader);
  }
  
  // Link the program
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error(`Failed to link shader program`);
  }
  
  return program;
};

export const getUniformLocation =
  (gl: GLContext, program: WebGLProgram, uniformName: string): WebGLUniformLocation => {
    const uniformLocation = gl.getUniformLocation(program, uniformName);
    if (uniformLocation === null) { throw new Error(`Unable to locate uniform "${uniformName}"`); }
    return uniformLocation;
  };
export const getAttributeLocation =
  (gl: GLContext, program: WebGLProgram, attributeName: string): AttributeLocation => {
    const attributeLocation = gl.getAttribLocation(program, attributeName);
    if (attributeLocation < 0) { throw new Error(`Unable to locate attribute "${attributeName}"`); }
    return attributeLocation;
  };

export const createArrayBuffer = (gl: GLContext, data: Array<number>): WebGLBuffer => {
  // FIXME: currently only supports array of floats (Float32Array)
  
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null); // Clean up
  
  if (buffer === null) { throw new Error(`Failed to create array buffer`); }
  return buffer;
};

// Set up a vertex array buffer (for later use)
export const createVertexBuffer = (gl: GLContext, vertices: Array<Vector3>): WebGLBuffer => {
  const vertexBuffer = gl.createBuffer(); // Create a vertex array buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // Bind it to the global `ARRAY_BUFFER`
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);
  
  // Unbind the buffer, the consumer can re-bind this at the appropriate time
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
  if (vertexBuffer === null) { throw new Error(`Failed to create vertex array buffer`); }
  
  /*
  Note: we could use a vertex array object here. This captures the vertex attributes at init time, which speeds
  up rendering (saves a few calls to bindBuffer/vertexAttribPointer/enableVertexAttribArray). However, it requires
  us to know the attribute location ahead of time, which makes this a bit tricky to generalize.
  See: https://stackoverflow.com/questions/50255115/what-are-vertex-arrays-in-opengl-webgl2
  */
  //const vao: null | WebGLVertexArrayObject = gl.createVertexArray();
  //gl.bindVertexArray(vao);
  //gl.enableVertexAttribArray(positionAttributeLocation);
  //gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
  
  return vertexBuffer;
};

// Set up an index array buffer (for later use)
export const createIndexBuffer = (gl: GLContext, indices: Array<number>): WebGLBuffer => {
  const indexBuffer = gl.createBuffer(); // Create an index array buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); // Bind it to the global `ELEMENT_ARRAY_BUFFER`
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
  // Unbind the buffer, the consumer can re-bind this at the appropriate time
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
  if (indexBuffer === null) { throw new Error(`Failed to create index array buffer`); }
  
  return indexBuffer;
};
