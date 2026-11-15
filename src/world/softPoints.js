// Soft round puffs of dust: any number of them in one draw call. Owner: Set B.
//
//   const puffs = softPoints(200, 0xc79a72)
//   scene.add(puffs.points)
//   puffs.pos / puffs.size / puffs.alpha     one entry per puff: where (x, y, z), how wide in
//                                            metres, how solid (0 to 1). Change them, then
//   puffs.touch()                            tell the GPU.
//   puffs.dispose()
//
// Used by the whirlwind (props.js) and the wheel dust (effects.js). Each puff can have its own
// size and fade, which the plain points material cannot do, and they thin out in the haze like
// everything else.
import * as THREE from 'three';

let picture = null;
function puffPicture() {
  if (!picture) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), fade = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    fade.addColorStop(0, 'rgba(255,255,255,1)'); fade.addColorStop(0.45, 'rgba(255,255,255,0.55)'); fade.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = fade; g.fillRect(0, 0, 64, 64);
    picture = new THREE.CanvasTexture(c); // kept for the whole game: every puff shares it
  }
  return picture;
}

const view = new THREE.Vector2();
export const HIDDEN = -9999; // a puff parked here is out of sight

export function softPoints(count, color) {
  const pos = new Float32Array(count * 3).fill(HIDDEN), size = new Float32Array(count), alpha = new Float32Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { color: { value: new THREE.Color(color) }, halfHeight: { value: 400 }, map: { value: null } }]),
    vertexShader: `
      attribute float aSize; attribute float aAlpha; varying float vAlpha; uniform float halfHeight;
      #include <fog_pars_vertex>
      void main() {
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * projectionMatrix[1][1] * halfHeight / max(0.1, -mvPosition.z); // metres to pixels
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 color; varying float vAlpha;
      #include <fog_pars_fragment>
      void main() {
        float a = texture2D(map, gl_PointCoord).a * vAlpha;
        if (a < 0.004) discard;
        gl_FragColor = vec4(color, a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, fog: true,
  });
  material.uniforms.map.value = puffPicture();
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.onBeforeRender = (renderer) => { material.uniforms.halfHeight.value = renderer.getDrawingBufferSize(view).y * 0.5; };
  return {
    points, pos, size, alpha, geo, material,
    touch() { geo.attributes.position.needsUpdate = geo.attributes.aSize.needsUpdate = geo.attributes.aAlpha.needsUpdate = true; },
    dispose() { geo.dispose(); material.dispose(); },
  };
}
