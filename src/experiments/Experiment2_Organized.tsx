
import * as React from 'react';

/*
Experiment 2: draw a simple shape (2D triangle) with common utilities abstracted out
  - Add more organization in the code
  - Make the shaders slightly more sophisticated with uniforms and attributes
*/


// ---
// Utilities (reusable)
// ---

type Vertex3 = [number, number, number];

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
    if (uniformLocation === null) { throw new Error(`Unable to locate uniform ${uniformName}`); }
    return uniformLocation;
  },
  
  getAttributeLocation(gl: WebGL2RenderingContext, program: WebGLProgram, attributeName: string): number {
    const attributeLocation = gl.getAttribLocation(program, attributeName);
    if (attributeLocation < 0) { throw new Error(`Unable to locate attribute ${attributeName}`); }
    return attributeLocation;
  },
  
  // Set up a vertex array buffer (for later use)
  createVertexBuffer(gl: WebGL2RenderingContext, vertices: Array<Vertex3>): WebGLBuffer {
    const vertexBuffer = gl.createBuffer(); // Create a vertex array buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // Bind it to `ARRAY_BUFFER`
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);
    
    // Unbind the buffer, the consumer can re-bind this at the appropriate time
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    if (vertexBuffer === null) { throw new Error(`Failed to create vertex array buffer`); }
    
    return vertexBuffer;
  },
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

const createVertexArrayBuffer = (gl: WebGL2RenderingContext) => {
  // Our "model": an array of 3D vertices forming a triangle
  // These are in local space coordinates. Order must be counter-clockwise for a front-facing face
  const vertices: Array<Vertex3> = [
    [-0.5, 0.5, 0.0],
    [-0.5, -0.5, 0.0],
    [0.5, -0.5, 0.0],
  ];
  
  return webglUtil.createVertexBuffer(gl, vertices);
};

const renderTriangle = (canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) => {
  const vertexBuffer = createVertexArrayBuffer(gl);
  
  
  //
  // Create the shader program
  //
  
  const vertexShader = `
    #version 300 es
    
    in vec3 vertex_position;
    out vec4 vertex_color;
    
    const vec4 colors[3] = vec4[3](
      vec4(1.0, 0.0, 0.0, 1.0),
      vec4(0.0, 1.0, 0.0, 1.0),
      vec4(0.0, 0.0, 1.0, 1.0)
    );
    
    void main(void) {
      gl_Position = vec4(vertex_position, 1.0);
      vertex_color = colors[gl_VertexID];
    }
  `.trim();
  
  const fragmentShader = `
    #version 300 es
    precision highp float;
    
    uniform vec4 color;
    in vec4 vertex_color;
    out vec4 outColor;
    
    void main(void) {
      //outColor = vec4(0.0, 0.0, 0.7, 0.1); // Hardcoded color
      //outColor = color; // Color from uniform
      outColor = vertex_color; // Color interpolated from vertices
    }
  `.trim();
  
  const shaderProgram = webglUtil.compileProgram(gl, { vertexShader, fragmentShader });
  const shaderProgramInfo = {
    program: shaderProgram,
    uniforms: {
      //color: webglUtil.getUniformLocation(gl, shaderProgram, 'color'),
    },
    attributes: {
      vertexPosition: webglUtil.getAttributeLocation(gl, shaderProgram, 'vertex_position'),
    },
  };
  
  // Use the combined shader program object
  gl.useProgram(shaderProgram);
  
  
  //
  // Set up the input (buffer, uniforms, attributes)
  //
  
  // Bind the vertex array buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
  // Set the uniform values
  //gl.uniform4f(shaderProgramInfo.uniforms.color, Math.random(), Math.random(), Math.random(), 1);
  
  // Specify the attributes (type, layout, etc.)
  gl.vertexAttribPointer(shaderProgramInfo.attributes.vertexPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgramInfo.attributes.vertexPosition);
  
  
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
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};

export const Experiment2 = () => {
  const glContext = React.useRef<WebGL2RenderingContext>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  const render = React.useCallback(
    (canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) => {
      window.requestAnimationFrame(() => { renderTriangle(canvas, gl); });
    },
    [],
  );
  
  React.useLayoutEffect(() => {
    if (canvasRef.current) {
      if (!glContext.current) {
        glContext.current = initWebGlContext(canvasRef.current);
      }
      render(canvasRef.current, glContext.current);
    }
  });
  
  return (
    <>
      <div><canvas ref={canvasRef} width="800" height="600"/></div>
      <button
        onClick={() => {
          if (canvasRef.current && glContext.current) {
            render(canvasRef.current, glContext.current);
          }
        }}
      >
        Render
      </button>
    </>
  );
};
