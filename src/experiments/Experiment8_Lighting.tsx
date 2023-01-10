
import { type Vector3, type Matrix4, v3, v4, m4 } from '../util/matrix';

import * as React from 'react';
import { type UseAnimationFrameCallback, useAnimationFrame } from '../util/reactUtil';

import { type AttributeLocation } from '../util/webgl/webglUtil';
import * as WebGLUtil from '../util/webgl/webglUtil';
import * as Geometry from '../util/webgl/geometry/Geometry';


/*
Experiment 8: add lighting
  - Add support for normal vectors
*/

// ---
// Utilities (reusable)
// ---

type ResourceBuffer = Array<Array<number>>;
type UniformDescriptor = (
  | { type: 'uniformMatrix4fv', transpose?: boolean, data: Matrix4 }
);
type AttributeSource = (
  | { type: 'buffer', buffer: string }
  | { type: 'position' }
);
type AttributeDescriptor = (
  //index: AttributeLocation, size: number, dataType: number, normalized: boolean, stride: number, offset: number,
  | { type: 'vec3', source: AttributeSource }
  | { type: 'vec4', source: AttributeSource }
);
type Resource = {
  mesh: Geometry.Mesh,
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
  attributeLocations: Record<string, AttributeLocation>,
};
const webglResourceUtil = {
  compileResource(gl: WebGL2RenderingContext, resource: Resource): ResourceCompiled {
    const program: WebGLProgram = WebGLUtil.compileProgram(gl, {
      vertexShader: resource.vertexShader.trim(),
      fragmentShader: resource.fragmentShader.trim(),
    });
    
    const buffers: Record<string, ResourceCompiledBuffer> = Object.fromEntries(Object.entries(resource.buffers).map(
      ([bufferName, bufferSpec]) => {
        const buffer: WebGLBuffer = WebGLUtil.createArrayBuffer(gl, bufferSpec.flat());
        return [bufferName, { type: 'arrayBuffer', buffer }];
      },
    ));
    
    return {
      resource,
      program,
      buffers: {
        ...buffers,
        indices: { type: 'indexBuffer', buffer: WebGLUtil.createIndexBuffer(gl, resource.mesh.indices) },
        position:  { type: 'arrayBuffer', buffer: WebGLUtil.createVertexBuffer(gl, resource.mesh.vertices) },
      },
      uniformLocations: Object.fromEntries(Object.entries(resource.uniforms).map(
        ([uniformName]) => [uniformName, WebGLUtil.getUniformLocation(gl, program, uniformName)],
      )),
      attributeLocations: Object.fromEntries(Object.entries(resource.attributes).map(
        ([attributeName]) => [attributeName, WebGLUtil.getAttributeLocation(gl, program, attributeName)],
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
      const attributeLocation: AttributeLocation = attributeLocations[attributeName];
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
      
      uniform mat4 transformLocalToClip;
      uniform mat4 transformLocalToWorld;
      uniform mat4 transformLocalToWorldInverseTransposed;
      
      in vec3 vertex_position;
      in vec4 vertex_color;
      in vec3 vertex_normal;
      out vec4 color;
      out vec3 normal;
      
      void main(void) {
        transformLocalToWorld; // Unused
        
        gl_Position = transformLocalToClip * vec4(vertex_position.xyz, 1.0);
        normal = mat3(transformLocalToWorldInverseTransposed) * vertex_normal;
        color = vertex_color;
      }
    `.trim(),
    fragmentShader: `
      #version 300 es
      precision highp float;
      
      // in vec4 color;
      in vec3 normal;
      out vec4 outColor;
      
      void main(void) {
        vec3 norm = normalize(normal);
        //outColor = vec4(norm / 2.0 + 0.5, 1.0); // To test the normal through color output
        
        vec4 color = vec4(0.0, 0.8, 0.0, 1.0); // Green
        
        vec3 lightDirection = vec3(1.0, -1.0, -1.0); // Light coming from top-left corner (and from behind)
        vec3 lightDirectionReversed = lightDirection * -1.0; // Reverse the light direction to point along the normal
        float light = clamp(dot(norm, lightDirectionReversed), 0.0, 1.0);
        
        outColor = vec4(color.rgb * 0.5 + color.rgb * (light * 0.5), color.a);
      }
    `.trim(),
    buffers: {
      color: colors,
      normal: Geometry.cube().normals,
    },
    uniforms: {
      transformLocalToWorld: { type: 'uniformMatrix4fv', data: m4.identity() },
      transformLocalToWorldInverseTransposed: { type: 'uniformMatrix4fv', data: m4.identity() },
      transformLocalToClip: { type: 'uniformMatrix4fv', data: m4.identity() },
    },
    attributes: {
      vertex_position: { type: 'vec3', source: { type: 'position' } },
      vertex_color: { type: 'vec4', source: { type: 'buffer', buffer: 'color' } },
      vertex_normal: { type: 'vec3', source: { type: 'buffer', buffer: 'normal' } },
    },
  };
  
  const cubeCompiled = webglResourceUtil.compileResource(gl, cube);
  
  return {
    resource: cubeCompiled,
  };
};

type Transforms = {
  transformLocalToWorld: Matrix4,
  transformLocalToClip: Matrix4,
};
const renderCube = (gl: WebGL2RenderingContext, cube: ResourceCompiled, transforms: Transforms): void => {
  webglResourceUtil.useResource(gl, cube);
  gl.uniformMatrix4fv(cube.uniformLocations.transformLocalToWorld, true, transforms.transformLocalToWorld.flat());
  // For normal scaling. See: https://webgl2fundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html
  gl.uniformMatrix4fv(
    cube.uniformLocations.transformLocalToWorldInverseTransposed,
    true,
    m4.transpose(m4.invert(transforms.transformLocalToWorld)).flat(),
  );
  gl.uniformMatrix4fv(cube.uniformLocations.transformLocalToClip, true, transforms.transformLocalToClip.flat());
  
  gl.drawElements(gl.TRIANGLES, cube.resource.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
};

type TimingInfo = { time: number, delta: number };
const renderExperiment = (gl: WebGL2RenderingContext, app: AppContext, timing: TimingInfo): void => {
  // Configure the viewport (just in case the resolution has changed)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
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
  
  // Generate a world transform
  const localToWorld = (position: Vector3): Matrix4 => {
    const dir = 1; // +1 for counterclockwise, -1 for clockwise
    const angleX = dir * timing.time / 2000;
    const angleY = dir * timing.time / 1000;
    const angleZ = dir * timing.time / 2000;
    
    // Map from the local model space to the world space (i.e. "place" the model in the world)
    return m4.multiplyPiped(
      m4.scaling([0.3, 0.3, 0.3]),
      m4.rotationX(angleX),
      m4.rotationY(angleY),
      m4.rotationZ(angleZ),
      m4.translation(position),
    );
  };
  
  // Generate a camera transform
  const worldToCamera = () => {
    return m4.identity();
    
    // Side view of the spinning cubes
    const nearCubes = 5;
    const farCube = 6;
    const distanceToObject = nearCubes + (farCube - nearCubes) / 2;
    
    //const target = v4.toVector3(m4.multiplyVector(localToWorld([-0.6, 0.4, -5]), v4.zero()));
    // return m4.invert(m4.lookAt([0, 0, 0], [-0.6, 0.4, -5]));
    
    return m4.multiplyPiped(
      m4.translation([0, 0, distanceToObject]), // Translate to the center of the object
      m4.rotationY((timing.time / 2000) * Math.PI), // Rotate around the object
      // m4.rotationX(0.2 * Math.PI),
      m4.translation([0, 0, -distanceToObject]), // Move backwards
    );
  };
  
  const cameraToClip = () => {
    const aspect = gl.canvas.width / gl.canvas.height;
    const fov = 0.3 * (0.5 * Math.PI); // Vertical field of view (in radians)
    const near = 1;
    const far = 1000;
    return m4.perspectiveProjection(fov, aspect, near, far);
  };
  
  const worldToClip = m4.multiplyPiped(worldToCamera(), cameraToClip());
  const tf = (transformLocalToWorld: Matrix4): Transforms => {
    return {
      transformLocalToWorld,
      transformLocalToClip: m4.multiplyPiped(transformLocalToWorld, worldToClip),
    };
  };
  renderCube(gl, cubeResource, tf(localToWorld([-0.6, 0.4, -5])));
  renderCube(gl, cubeResource, tf(localToWorld([0.6, 0.4, -5])));
  renderCube(gl, cubeResource, tf(localToWorld([0, -0.5, -5])));
  renderCube(gl, cubeResource, tf(localToWorld([0, 0, -6]))); // Further back along Z
  
  // const x: Vector3 = [1, 1, 1]; // A vector in local space
  // const p: Vector3 = [0, 0, -30]; // The position in world space
  // const T = m4.multiplyPiped(localToWorld(p), worldToClip);
  // console.log(m4.print(T));
  // console.log('local', x);
  // console.log('world', m4.multiplyVector(localToWorld(p), [...x, 1], false));
  // console.log('clip (1)', m4.multiplyVector(T, [...x, 1], false));
  // console.log('clip (2)', m4.multiplyVector(T, [...x, 1], true));
};

export const Experiment8 = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [glContext, setGlContext] = React.useState<null | WebGL2RenderingContext>(null);
  const [appContext, setAppContext] = React.useState<null | AppContext>(null);
  const [running, setRunning] = React.useState(true); // Whether the animation is currently running
  const ready = canvasRef.current !== null && glContext !== null && appContext !== null && running;
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const glContext = WebGLUtil.initializeRenderingContext(canvasRef.current);
      setGlContext(glContext);
      setAppContext(initExperiment(canvas, glContext));
    }
  }, [canvasRef]);
  
  const animate = React.useCallback<UseAnimationFrameCallback>(({ time, delta }) => {
    const canvas = canvasRef.current;
    if (canvas === null || glContext === null) { throw new Error(`Missing initialized WebGL canvas`); }
    if (appContext === null) { throw new Error(`App was not initialized properly`); }
    
    renderExperiment(glContext, appContext, { time, delta });
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
