// The machines' painted-metal surface. Owner: Set B.
//
//   metalSurface(object)   gives every mesh under `object` the surface: call it once the model is in
//
// Approved option D of tools/metal-texture-samples.html, medium strength, with shine.
// Texture: Poly Haven "Blue Metal Plate" (CC0, polyhaven.com/a/blue_metal_plate), stored in
// public/textures/metal_plate.jpg as one small picture of two halves:
//   left   red: how light or dark the photo is, centred on mid-grey and scaled so every texture
//                shows its marks equally (0.5 + (light - mean) / spread * 0.125)
//          green: the photo's own roughness
//   right  the photo's normal map (dents and scratches)
// "Our palette", as for the ground: the colours stay each machine's own; only the marks, the
// roughness and the dents come from the photo, so the cartoon look survives.
// The models carry neither texture coordinates nor normals, so the picture is laid on from the
// three sides (triplanar) and each face's direction is worked out in the shader.
import * as THREE from 'three';

const TILE = 0.45;     // metres of surface one copy of the picture covers
const STRENGTH = 1;    // medium
const METALNESS = 0.25, ROUGHNESS = 0.45; // the shine

let detail = null, sky = null;
function shared() {
  if (!detail) {
    detail = new THREE.TextureLoader().load(new URL('../../public/textures/metal_plate.jpg', import.meta.url).href);
    detail.wrapS = detail.wrapT = THREE.ClampToEdgeWrapping;
    detail.magFilter = detail.minFilter = THREE.LinearFilter; // no mipmaps: they would draw a seam where each copy meets the next
    detail.generateMipmaps = false;
    // What the shine reflects: a plain soft sky, bright above and dark below. Small, drawn once.
    const c = document.createElement('canvas'); c.width = 64; c.height = 32;
    const g = c.getContext('2d'), fade = g.createLinearGradient(0, 0, 0, 32);
    fade.addColorStop(0, '#f4f1ea'); fade.addColorStop(0.45, '#a8a49c'); fade.addColorStop(0.55, '#5b5650'); fade.addColorStop(1, '#2a2725');
    g.fillStyle = fade; g.fillRect(0, 0, 64, 32);
    sky = new THREE.CanvasTexture(c);
    sky.mapping = THREE.EquirectangularReflectionMapping;
    sky.colorSpace = THREE.SRGBColorSpace;
  }
  return { detail, sky };
}

function dress(material) {
  if (material.userData.metal || !material.isMeshStandardMaterial) return;
  material.userData.metal = true; // models share materials between copies: dress each one once
  const { detail, sky } = shared();
  material.metalness = METALNESS; material.roughness = ROUGHNESS;
  material.envMap = sky; material.envMapIntensity = 1;
  material.customProgramCacheKey = () => 'relica-metal';
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { tMetal: { value: detail }, uTile: { value: 1 / TILE }, uStrength: { value: STRENGTH } });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', 'varying vec3 vMetalP;\n#include <common>')
      // Measured from the part's own origin, so the marks travel with a moving machine.
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMetalP = (modelMatrix * vec4(position, 1.0)).xyz - modelMatrix[3].xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vMetalP; uniform sampler2D tMetal; uniform float uTile; uniform float uStrength;
        // One half of the picture (0 left, 1 right), seen from the three sides and blended by the
        // way this face points.
        vec3 metalSample(float side) {
          vec3 facing = normalize(cross(dFdx(vMetalP), dFdy(vMetalP)));
          vec3 w = pow(abs(facing), vec3(4.0)) + 1e-4; w /= (w.x + w.y + w.z);
          vec3 p = vMetalP * uTile;
          vec2 a = vec2(0.5, 1.0), o = vec2(side * 0.5, 0.0);
          return texture2D(tMetal, fract(p.zy) * a + o).rgb * w.x
               + texture2D(tMetal, fract(p.xz) * a + o).rgb * w.y
               + texture2D(tMetal, fract(p.xy) * a + o).rgb * w.z;
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 metalMarks = metalSample(0.0);
        diffuseColor.rgb *= clamp(1.0 + (metalMarks.r - 0.5) / 0.125 * 0.16 * uStrength, 0.45, 1.5);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(mix(roughnessFactor, metalMarks.g, min(1.0, 0.55 * uStrength)), 0.18, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = normalize(normal + (metalSample(1.0) * 2.0 - 1.0) * 0.9 * uStrength);`);
  };
  material.needsUpdate = true;
}

export function metalSurface(object) {
  object.traverse((o) => {
    if (!o.isMesh || o.material?.transparent) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) dress(m);
  });
}
