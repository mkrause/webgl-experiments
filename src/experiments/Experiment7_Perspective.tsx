
import { type Vector3, type Vector4, type Matrix4, m4 } from '../util/matrix';

import * as React from 'react';
import { type UseAnimationFrameCallback, useAnimationFrame } from '../util/reactUtil';

/*
Experiment 7: add perspective
*/


// ---
// Utilities (reusable)
// ---

const webglUtil = {
  initializeRenderingContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
    const gl: null | WebGL2RenderingContext = canvas.getContext('webgl2');
    if (gl === null) { throw new Error(`Unable to initialize WebGL`); }
    gl.viewport(0, 0, canvas.width, canvas.height);
    return gl;
  },
  
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
      console.error(gl.getProgramInfoLog(program));
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
  
  createArrayBuffer(gl: WebGL2RenderingContext, data: Array<number>): WebGLBuffer {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Clean up
    
    if (buffer === null) { throw new Error(`Failed to create array buffer`); }
    return buffer;
  },
  // Set up a vertex array buffer (for later use)
  createVertexBuffer(gl: WebGL2RenderingContext, vertices: Array<Vector3>): WebGLBuffer {
    const vertexBuffer = gl.createBuffer(); // Create a vertex array buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // Bind it to the global `ARRAY_BUFFER`
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);
    
    // Unbind the buffer, the consumer can re-bind this at the appropriate time
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    if (vertexBuffer === null) { throw new Error(`Failed to create vertex array buffer`); }
    
    /*
    Note: we could use a vertex array object here. This captures the vertex attributes at init time, which speeds
    up rendering (saves a few calls to bindBuffer/vertexAttribPointer/enableVertexAttribArray). However, it requires
    us to know the attribute location ahead of time, which makes this a bit tricky.
    See: https://stackoverflow.com/questions/50255115/what-are-vertex-arrays-in-opengl-webgl2
    */
    //const vao: null | WebGLVertexArrayObject = gl.createVertexArray();
    //gl.bindVertexArray(vao);
    //gl.enableVertexAttribArray(positionAttributeLocation);
    //gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    
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
};

type Mesh = { vertices: Array<Vector3>, indices: Array<number> };

const Geometry = {
  cube(): Mesh {
    // An array of 3D vertices forming a unit cube.
    // This assumes a right-handed coordinate system (positive z-axis extending towards the viewer).
    const vertices: Array<Vector3> = [
      [-1.0, -1.0, +1.0], [+1.0, -1.0, +1.0], [+1.0, +1.0, +1.0], [-1.0, +1.0, +1.0], // Front face
      [-1.0, -1.0, -1.0], [-1.0, +1.0, -1.0], [+1.0, +1.0, -1.0], [+1.0, -1.0, -1.0], // Back face
      [-1.0, +1.0, -1.0], [-1.0, +1.0, +1.0], [+1.0, +1.0, +1.0], [+1.0, +1.0, -1.0], // Top face
      [-1.0, -1.0, -1.0], [+1.0, -1.0, -1.0], [+1.0, -1.0, +1.0], [-1.0, -1.0, +1.0], // Bottom face
      [+1.0, -1.0, -1.0], [+1.0, +1.0, -1.0], [+1.0, +1.0, +1.0], [+1.0, -1.0, +1.0], // Right face
      [-1.0, -1.0, -1.0], [-1.0, -1.0, +1.0], [-1.0, +1.0, +1.0], [-1.0, +1.0, -1.0], // Left face
    ];
    
    // Specify the array indices, where triangle vertices are ordered in counter-clockwise order
    const indices: Array<number> = [
      0, 1, 2, 0, 2, 3, // Front quad
      4, 5, 6, 4, 6, 7, // Back quad
      8, 9, 10, 8, 10, 11, // Top quad
      12, 13, 14, 12, 14, 15, // Bottom quad
      16, 17, 18, 16, 18, 19, // Right quad
      20, 21, 22, 20, 22, 23, // Left quad
    ];
    
    return { vertices, indices };
  },
};

type WebGLAttributeLocation = number;
type ResourceBuffer = Array<Array<number>>;
type UniformDescriptor = (
  | { type: 'uniformMatrix4fv', transpose?: boolean, data: Matrix4 }
);
type AttributeSource = (
  | { type: 'buffer', buffer: string }
  | { type: 'position' }
);
type AttributeDescriptor = (
  //index: WebGLAttributeLocation, size: number, dataType: number, normalized: boolean, stride: number, offset: number,
  | { type: 'vec3', source: AttributeSource }
  | { type: 'vec4', source: AttributeSource }
);
type Resource = {
  mesh: Mesh,
  vertexShader: string,
  fragmentShader: string,
  buffers: Record<string, ResourceBuffer>,
  uniforms: Record<string, UniformDescriptor>,
  attributes: Record<string, AttributeDescriptor>,
};

type ResourceCompiledBuffer = (
  | { type: 'arrayBuffer', buffer: WebGLBuffer }
  | { type: 'indexBuffer', buffer: WebGLBuffer }
);
type ResourceCompiled = {
  resource: Resource,
  program: WebGLProgram,
  buffers: Record<string, ResourceCompiledBuffer>,
  uniformLocations: Record<string, WebGLUniformLocation>,
  attributeLocations: Record<string, WebGLAttributeLocation>,
};
const webglResourceUtil = {
  compileResource(gl: WebGL2RenderingContext, resource: Resource): ResourceCompiled {
    const program: WebGLProgram = webglUtil.compileProgram(gl, {
      vertexShader: resource.vertexShader.trim(),
      fragmentShader: resource.fragmentShader.trim(),
    });
    
    const buffers: Record<string, ResourceCompiledBuffer> = Object.fromEntries(Object.entries(resource.buffers).map(
      ([bufferName, bufferSpec]) => {
        const buffer: WebGLBuffer = webglUtil.createArrayBuffer(gl, bufferSpec.flat());
        return [bufferName, { type: 'arrayBuffer', buffer }];
      },
    ));
    
    return {
      resource,
      program,
      buffers: {
        ...buffers,
        indices: { type: 'indexBuffer', buffer: webglUtil.createIndexBuffer(gl, resource.mesh.indices) },
        position:  { type: 'arrayBuffer', buffer: webglUtil.createVertexBuffer(gl, resource.mesh.vertices) },
      },
      uniformLocations: Object.fromEntries(Object.entries(resource.uniforms).map(
        ([uniformName]) => [uniformName, webglUtil.getUniformLocation(gl, program, uniformName)],
      )),
      attributeLocations: Object.fromEntries(Object.entries(resource.attributes).map(
        ([attributeName]) => [attributeName, webglUtil.getAttributeLocation(gl, program, attributeName)],
      )),
    };
  },
  
  useResource(gl: WebGL2RenderingContext, resourceCompiled: ResourceCompiled): void {
    const program = resourceCompiled.program;
    const uniformLocations = resourceCompiled.uniformLocations;
    const attributeLocations = resourceCompiled.attributeLocations;
    const resource = resourceCompiled.resource;
    
    gl.useProgram(program);
    
    // Set uniform values
    for (const [uniformName, uniform] of Object.entries(resource.uniforms)) {
      const uniformLocation = uniformLocations[uniformName];
      if (typeof uniformLocation === 'undefined') { throw new Error(`Missing uniform "${uniformName}"`); }
      switch (uniform.type) {
        case 'uniformMatrix4fv':
          gl.uniformMatrix4fv(uniformLocation, uniform.transpose ?? true, uniform.data.flat());
          break;
        default: throw new Error(`Unknown uniform type "${uniform.type}"`);
      }
    }
    
    /*
    for (const [bufferName, bufferSpec] of Object.entries(app.resource.buffers)) {
      switch (bufferSpec.type) {
        case 'arrayBuffer':
          gl.bindBuffer(gl.ARRAY_BUFFER, bufferSpec.buffer);
          gl.vertexAttribPointer(attributes.vertexPosition, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(attributes.vertexPosition);
          break;
        default: throw new Error(`Unknown buffer type ${bufferSpec.type}`);
      }
    }
    */
    
    for (const [attributeName, attributeSpec] of Object.entries(resource.attributes)) {
      const attributeLocation: WebGLAttributeLocation = attributeLocations[attributeName];
      if (typeof attributeLocation === 'undefined') { throw new Error(`Missing attribute "${attributeName}"`); }
      const bufferFromSource = (source: AttributeSource): ResourceCompiledBuffer => {
        switch (source.type) {
          case 'position': return resourceCompiled.buffers.position;
          case 'buffer': return resourceCompiled.buffers[source.buffer];
          default: throw new Error(`Unknown attribute source type ${(source as AttributeSource).type}`);
        }
      };
      const bindBuffer = (buffer: ResourceCompiledBuffer) => {
        switch (buffer.type) {
          case 'arrayBuffer': gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer); break;
          case 'indexBuffer': gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.buffer); break;
          default: throw new Error(`Unknown buffer type ${(buffer as ResourceCompiledBuffer).type}`);
        }
      };
      switch (attributeSpec.type) {
        case 'vec3': {
          const buffer: ResourceCompiledBuffer = bufferFromSource(attributeSpec.source);
          bindBuffer(buffer);
          gl.vertexAttribPointer(attributeLocation, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(attributeLocation);
          break;
        }
        case 'vec4': {
          const buffer: ResourceCompiledBuffer = bufferFromSource(attributeSpec.source);
          bindBuffer(buffer);
          gl.vertexAttribPointer(attributeLocation, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(attributeLocation);
          break;
        }
        default: throw new Error(`Unknown attribute type ${(attributeSpec as AttributeDescriptor).type}`);
      }
    }
  },
};


// ---
// Application
// ---

type AppContext = {
  resource: ResourceCompiled,
};
const initExperiment = (canvas: HTMLCanvasElement, gl: WebGL2RenderingContext): AppContext => {
  const colorPalette = [
    [0.8, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 1],
    [0.5, 0.5, 0, 1],
    [0.5, 0, 0.5, 1],
    [0, 0.5, 0.5, 1],
  ];
  const colors = Geometry.cube().vertices.map(
    (_vertex, index) => colorPalette[Math.floor((index / 4) % 6)],
  );
  const cube: Resource = {
    mesh: Geometry.cube(),
    vertexShader: `
      #version 300 es
      
      uniform mat4 transformation;
      in vec3 vertex_position;
      in vec4 vertex_color;
      out vec4 color;
      
      void main(void) {
        gl_Position = transformation * vec4(vertex_position.xyz, 1.0);
        color = vertex_color;
      }
    `.trim(),
    fragmentShader: `
      #version 300 es
      precision highp float;
      
      in vec4 color;
      out vec4 outColor;
      
      void main(void) {
        outColor = color;
      }
    `.trim(),
    buffers: {
      color: colors,
    },
    uniforms: {
      transformation: { type: 'uniformMatrix4fv', data: m4.identity() },
    },
    attributes: {
      vertex_position: { type: 'vec3', source: { type: 'position' } },
      vertex_color: { type: 'vec4', source: { type: 'buffer', buffer: 'color' } },
    },
  };
  
  const cubeCompiled = webglResourceUtil.compileResource(gl, cube);
  
  return {
    resource: cubeCompiled,
  };
};

const renderCube = (gl: WebGL2RenderingContext, cube: ResourceCompiled, transform: Matrix4): void => {
  webglResourceUtil.useResource(gl, cube);
  gl.uniformMatrix4fv(cube.uniformLocations.transformation, true, transform.flat());
  gl.drawElements(gl.TRIANGLES, cube.resource.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
};

type TimingInfo = { time: number, delta: number };
const renderExperiment = (
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  app: AppContext,
  timing: TimingInfo,
) => {
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  // Clear the canvas + depth buffer
  // https://stackoverflow.com/questions/48693164/depth-buffer-clear-behavior-between-draw-calls
  gl.clearColor(0.6, 0.6, 0.6, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Enable depth testing and culling
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  
  
  const cubeResource = app.resource;
  
  webglResourceUtil.useResource(gl, app.resource);
  
  const localToWorld = (position: Vector3): Matrix4 => {
    const dir = 1; // +1 for counterclockwise, -1 for clockwise
    const angleX = dir * timing.time / 2000;
    const angleY = dir * timing.time / 1000;
    const angleZ = dir * timing.time / 2000;
    
    // Map from the local model space to the world space (i.e. "place" the model in the world)
    return m4.multiplyPiped(
      m4.scaling([0.3, 0.3, 0.3]),
      // m4.rotationX(angleX),
      // m4.rotationY(angleY),
      // m4.rotationZ(angleZ),
      m4.translation(position),
    );
  };
  
  const worldToCamera = () => {
    // return m4.identity();
    
    // Side view of the spinning cubes
    const nearCubes = 5;
    const farCube = 6;
    const distanceToObject = nearCubes + (farCube - nearCubes) / 2;
    return m4.multiplyPiped(
      m4.translation([0, 0, distanceToObject]),
      m4.rotationY((timing.time / 2000) * Math.PI),
      // m4.rotationX(0.2 * Math.PI),
      m4.translation([0, 0, -distanceToObject]),
    );
  };
  
  const cameraToClip = () => {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const fov = 0.3 * (0.5 * Math.PI); // Vertical field of view (in radians)
    const near = 1;
    const far = 1000;
    return m4.perspectiveProjection(fov, aspect, near, far);
  };
  
  const worldToClip = m4.multiplyPiped(worldToCamera(), cameraToClip());
  renderCube(gl, cubeResource, m4.multiplyPiped(localToWorld([-0.6, 0.4, -5]), worldToClip));
  renderCube(gl, cubeResource, m4.multiplyPiped(localToWorld([0.6, 0.4, -5]), worldToClip));
  renderCube(gl, cubeResource, m4.multiplyPiped(localToWorld([0, -0.5, -5]), worldToClip));
  renderCube(gl, cubeResource, m4.multiplyPiped(localToWorld([0, 0, -6]), worldToClip)); // Further back along Z
  
  // const x: Vector3 = [1, 1, 1]; // A vector in local space
  // const p: Vector3 = [0, 0, -30]; // The position in world space
  // const T = m4.multiplyPiped(localToWorld(p), worldToClip);
  // console.log(m4.print(T));
  // console.log('local', x);
  // console.log('world', m4.multiplyVector(localToWorld(p), [...x, 1], false));
  // console.log('clip (1)', m4.multiplyVector(T, [...x, 1], false));
  // console.log('clip (2)', m4.multiplyVector(T, [...x, 1], true));
};

export const Experiment7 = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [glContext, setGlContext] = React.useState<null | WebGL2RenderingContext>(null);
  const [appContext, setAppContext] = React.useState<null | AppContext>(null);
  const [running, setRunning] = React.useState(true);
  const ready = running && canvasRef.current !== null && glContext !== null && appContext !== null;
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const glContext = webglUtil.initializeRenderingContext(canvasRef.current);
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
