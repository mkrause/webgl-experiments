
import * as React from 'react';

/*
Experiment 1: draw the simplest output (2D triangle) in the most straightforward way.
  - No utility libraries, just raw WebGL
  - No code organization
  - No indexed draws
*/


const initWebGlContext = (canvas: HTMLCanvasElement): WebGL2RenderingContext => {
  const gl: null | WebGL2RenderingContext = canvas.getContext('webgl2');
  if (gl === null) { throw new Error(`Unable to initialize WebGL`); }
  gl.viewport(0, 0, canvas.width, canvas.height);
  return gl;
};

const renderTriangle = (canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) => {
  // Three 3D vertices in clip space coordinates (making up a triangle)
  const vertices = [
    [-0.5, 0.5, 0.0],
    [-0.5, -0.5, 0.0],
    [0.5, -0.5, 0.0],
  ];
  
  // Create an empty buffer object to store vertex buffer
  const vertexBuffer = gl.createBuffer();
  
  // Bind appropriate array buffer to it
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
  // Pass the vertex data to the buffer
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);
  
  // Unbind the buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
  /*================ Shaders ====================*/
  
  // Vertex shader source code
  const vertCode = `
    #version 300 es
    in vec3 coordinates;
    
    void main(void) {
      gl_Position = vec4(coordinates, 1.0);
    }
  `.trim();
  
  // Create a vertex shader object
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  if (vertShader === null) { throw new Error(`Failed to create shader`); }
  
  // Attach vertex shader source code
  gl.shaderSource(vertShader, vertCode);
  
  // Compile the vertex shader
  gl.compileShader(vertShader);
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vertShader));
    throw new Error(`Failed to compile vertex shader`);
  }
  
  // Fragment shader source code
  const fragCode = `
    #version 300 es
    precision highp float;
    uniform vec4 color;
    out vec4 outColor;
    void main(void) {
      //outColor = vec4(0.0, 0.0, 0.7, 0.1); // Hardcoded color
      outColor = color;
    }
  `.trim();
  
  // Create fragment shader object
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (fragShader === null) { throw new Error(`Failed to create shader`); }
  
  // Attach fragment shader source code
  gl.shaderSource(fragShader, fragCode); 
  
  // Compile the fragment shader
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragShader));
    throw new Error(`Failed to compile fragment shader`);
  }
  
  // Create a shader program object to store the combined shader program
  const shaderProgram = gl.createProgram();
  if (shaderProgram === null) { throw new Error(`Failed to create shader program`); }
  
  // Attach the vertex shader
  gl.attachShader(shaderProgram, vertShader);
  
  // Attach the fragment shader
  gl.attachShader(shaderProgram, fragShader);
  
  // Link both the programs
  gl.linkProgram(shaderProgram);
  
  // Use the combined shader program object
  gl.useProgram(shaderProgram);
  
  
  // Set a random color
  const colorLocation = gl.getUniformLocation(shaderProgram, 'color');
  gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
  
  
  /*======= Associating shaders to buffer objects =======*/
  
  // Bind vertex buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
  // Get the attribute location
  const coord = gl.getAttribLocation(shaderProgram, 'coordinates');
  
  // Point an attribute to the currently bound VBO
  gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0); 
  
  // Enable the attribute
  gl.enableVertexAttribArray(coord);
  
  /*=========Drawing the triangle===========*/
  
  // Clear the canvas + depth buffer
  // https://stackoverflow.com/questions/48693164/depth-buffer-clear-behavior-between-draw-calls
  gl.clearColor(0.6, 0.6, 0.6, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Enable the depth test
  gl.enable(gl.DEPTH_TEST);
  
  // Draw the triangle
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
};

export const Experiment1 = () => {
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
