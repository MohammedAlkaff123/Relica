// Dust, the storm and bursts. Owner: Set B.
//
//   const fx = createEffects({ scene, env, hero, gravity })   once per chapter, after buildWorld
//   fx.update(dt)                 every frame
//   fx.dispose()                  when the chapter ends; puts the sky and light back
//
//   fx.dust.shower(true)          the broken fender: dust arcs up from the right rear wheel and
//                                 rains on the rover. Also hides the fender. false = repaired
//   fx.storm.setLevel(0..1)       0 clear, 1 you can barely see the rover's own antenna
//   fx.liftoff(object)            one burst of dust along the ground, under a thing that takes off
//
// Wheel dust, rotor dust and the hero's shadow need no call: they follow how the hero moves.
// The shadow lies on the ground under the hero and slides away from the Sun as the hero rises,
// so in flight it shows how high you are.
// (hero.breakBlade() lives in characters/character.js.)
//
// On the Moon there is no air: dust flies in clean arcs and drops straight back. On Mars the thin
// air slows it and it hangs for a moment. That difference is on purpose.
import * as THREE from 'three';
import { heightAt } from './terrain.js';
import { DUST_POOL, presetFor } from './quality.js';

const STORM_SKY = new THREE.Color(0x7a5236);
const STORM_GROUND = new THREE.Color(0x6e4630);
const STORM_SUN = new THREE.Color(0xc9ae8c);
const DEAD = -9999;

// A fixed set of square dust specks, reused in a circle. One draw call.
function makePool(scene, count, color, size, map) {
  let active = count;
  const pos = new Float32Array(count * 3).fill(DEAD);
  const vel = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, map, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false, alphaTest: 0.03 });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  let next = 0;
  return {
    points, mat, pos, vel, life, count,
    setLimit(n) {
      active = Math.max(1, Math.min(count, n)); next = 0;
      for (let i = active; i < count; i++) { life[i] = 0; pos[i * 3 + 1] = DEAD; }
      geo.setDrawRange(0, active); geo.attributes.position.needsUpdate = true;
    },
    emit(x, y, z, vx, vy, vz, seconds) {
      const i = next * 3;
      pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
      vel[i] = vx; vel[i + 1] = vy; vel[i + 2] = vz;
      life[next] = seconds;
      next = (next + 1) % active;
    },
    // gravity pulls down, drag (0 on the Moon) slows, floor(x, z) is where a speck lands and dies.
    update(dt, gravity, drag, floor) {
      const keep = Math.max(0, 1 - drag * dt);
      for (let n = 0; n < active; n++) {
        if (life[n] <= 0) continue;
        const i = n * 3;
        vel[i + 1] -= gravity * dt;
        vel[i] *= keep; vel[i + 1] *= keep; vel[i + 2] *= keep;
        pos[i] += vel[i] * dt; pos[i + 1] += vel[i + 1] * dt; pos[i + 2] += vel[i + 2] * dt;
        life[n] -= dt;
        if (life[n] <= 0 || (vel[i + 1] < 0 && pos[i + 1] < floor(pos[i], pos[i + 2]))) { life[n] = 0; pos[i + 1] = DEAD; }
      }
      geo.attributes.position.needsUpdate = true;
    },
    dispose() { scene.remove(points); geo.dispose(); mat.dispose(); },
  };
}

export function createEffects({ scene, env, hero, gravity = 3.71 }) {
  const world = env.name;
  const airless = world === 'moon' || world === 'space';
  const drag = airless ? 0 : 1.6;
  const dustColor = new THREE.Color(env.look.ground ?? 0x888888).lerp(new THREE.Color(0xffffff), 0.25);
  const floor = (x, z) => heightAt(world, x, z);
  // A restrained irregular dust fleck, fading at its edges; no additive glow or square confetti.
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
  const brush = sprite.getContext('2d');
  const fade = brush.createRadialGradient(15, 15, 3, 16, 16, 15);
  fade.addColorStop(0, '#fff'); fade.addColorStop(.5, '#ffffff99'); fade.addColorStop(1, '#ffffff00');
  brush.fillStyle = fade; brush.beginPath(); brush.ellipse(16, 16, 15, 11, .4, 0, Math.PI * 2); brush.fill();
  const dustMap = new THREE.CanvasTexture(sprite);
  const dustPool = makePool(scene, DUST_POOL, dustColor, 0.13, dustMap);
  let qualityLevel = env.quality ?? 'medium', preset = presetFor(qualityLevel);
  hero.ready?.then(() => hero.object.traverse((o) => {
    if (o.isMesh && !o.material?.transparent) { o.castShadow = true; o.receiveShadow = true; }
  }));
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---- how the hero is moving, worked out from where it was last frame ----
  const last = hero.object.position.clone();
  const vel = new THREE.Vector3();
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), p = new THREE.Vector3();
  let wheelDebt = 0, showerDebt = 0, rotorDebt = 0;
  let showerOn = false;

  // A point given in the hero's own space (x left, z forward), on the ground under it.
  function heroPoint(x, z) {
    return p.copy(hero.object.position).addScaledVector(right, -x).addScaledVector(fwd, z).setY(hero.object.position.y - hero.half[1]);
  }

  function updateDust(dt) {
    const o = hero.object;
    vel.copy(o.position).sub(last).divideScalar(Math.max(dt, 1e-4));
    last.copy(o.position);
    fwd.set(0, 0, 1).applyQuaternion(o.quaternion);
    right.set(-1, 0, 0).applyQuaternion(o.quaternion);
    const speed = Math.hypot(vel.x, vel.z);
    const onGround = Math.abs(vel.y) < 0.6;
    const hx = hero.half[0], hz = hero.half[2];

    if (hero.spec.wheels && onGround && speed > 0.8) {
      // Wheel dust: a little from each rear wheel, thrown back and up.
      wheelDebt += Math.min(speed, 8) * 5 * preset.dustScale * dt;
      while (wheelDebt >= 1) {
        wheelDebt -= 1;
        const side = Math.random() < 0.5 ? -1 : 1;
        heroPoint(side * hx * 0.85, -hz * 0.7);
        dustPool.emit(p.x, p.y + 0.05, p.z,
          -fwd.x * speed * 0.25 + rand(-0.5, 0.5), rand(0.5, 1.4), -fwd.z * speed * 0.25 + rand(-0.5, 0.5), airless ? 3 : 1.2);
      }
      // The broken fender: a tall rooster tail from the right rear wheel that comes down on the rover.
      if (showerOn) {
        showerDebt += 75 * preset.dustScale * dt;
        while (showerDebt >= 1) {
          showerDebt -= 1;
          heroPoint(-hx * 0.85, -hz * 0.7);
          const up = rand(1.8, 3.4), along = speed * rand(0.85, 1.25);
          dustPool.emit(p.x, p.y + 0.3, p.z, fwd.x * along + right.x * rand(-0.7, 0.3), up, fwd.z * along + right.z * rand(-0.7, 0.3), 5);
        }
      }
    }

    // Rotor dust: a ring pushed outward along the ground while the helicopter is low.
    if (hero.spec.rotor && hero.rotorSpeed > 5) {
      const ground = floor(o.position.x, o.position.z);
      const height = o.position.y - hero.half[1] - ground;
      if (height < 3) {
        rotorDebt += (1 - Math.max(0, height) / 3) * 50 * preset.dustScale * dt;
        while (rotorDebt >= 1) {
          rotorDebt -= 1;
          const a = Math.random() * Math.PI * 2, r = rand(0.3, 0.7), v = rand(2, 4);
          dustPool.emit(o.position.x + Math.cos(a) * r, ground + 0.05, o.position.z + Math.sin(a) * r, Math.cos(a) * v, rand(0.2, 0.9), Math.sin(a) * v, 1.1);
        }
      }
    }
    dustPool.update(dt, gravity, drag, floor);
  }

  // ---- the shadow ----
  // Low uses this contact shadow. Medium/High use the world sun shadow:
  // a blob for a rover, a small body and two spinning blade lines for the helicopter.
  let shadow = null, ink = null, inkBase = 0;
  const bladeShadows = [];
  if (env.ground && env.sunDirection) {
    shadow = new THREE.Group();
    inkBase = airless ? 0.6 : 0.32; // hard and black on the Moon, soft on Mars
    ink = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: inkBase, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const blob = new THREE.Mesh(new THREE.CircleGeometry(1, 14), ink);
    blob.rotation.x = -Math.PI / 2;
    blob.scale.set(hero.half[0] * 1.15, hero.half[2] * 1.15, 1);
    shadow.add(blob);
    if (hero.spec.rotor) {
      blob.scale.set(0.16, 0.16, 1);
      for (const [turn, dir] of [[0, 1], [Math.PI / 2, -1]]) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.07), ink);
        line.rotation.x = -Math.PI / 2;
        const holder = new THREE.Group();
        holder.rotation.y = turn;
        holder.userData.dir = dir;
        holder.add(line);
        shadow.add(holder);
        bladeShadows.push(holder);
      }
    }
    scene.add(shadow);
  }
  const UP = new THREE.Vector3(0, 1, 0), slope = new THREE.Vector3(), tiltQ = new THREE.Quaternion(), yawQ = new THREE.Quaternion();

  function updateShadow(dt) {
    if (!shadow) return;
    shadow.visible = !preset.shadows;
    const o = hero.object.position, sun = env.sunDirection;
    const height = Math.max(0, o.y - hero.half[1] - floor(o.x, o.z));
    // A low Sun would throw the shadow far out of view, so it moves a third of the true distance.
    const slide = (height * 0.33) / Math.max(0.3, sun.y);
    const x = o.x - sun.x * slide, z = o.z - sun.z * slide;
    shadow.position.set(x, floor(x, z) + 0.04, z);
    // Lie along the slope of the ground, turned the way the hero faces.
    slope.set(floor(x - 0.6, z) - floor(x + 0.6, z), 1.2, floor(x, z - 0.6) - floor(x, z + 0.6)).normalize();
    tiltQ.setFromUnitVectors(UP, slope);
    yawQ.setFromAxisAngle(UP, Math.atan2(fwd.x, fwd.z));
    shadow.quaternion.copy(tiltQ).multiply(yawQ);
    shadow.scale.setScalar(1 + height * 0.06);
    ink.opacity = inkBase * (1 - Math.min(0.7, height / 14)) * (1 - 0.75 * level); // fades with height and in the storm
    for (const b of bladeShadows) b.rotation.y += b.userData.dir * (hero.rotorSpeed || 0) * dt;
  }

  // ---- the storm ----
  const STORM_COUNT = 320, BOX = 26; // specks blowing through a box that follows the hero
  const stormPos = new Float32Array(STORM_COUNT * 3);
  for (let i = 0; i < stormPos.length; i++) stormPos[i] = (Math.random() - 0.5) * BOX;
  const stormGeo = new THREE.BufferGeometry();
  stormGeo.setAttribute('position', new THREE.BufferAttribute(stormPos, 3));
  const stormMat = new THREE.PointsMaterial({ color: 0xc9a17a, map: dustMap, size: 0.24, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, alphaTest: .02, fog: false });
  const stormPoints = new THREE.Points(stormGeo, stormMat);
  stormPoints.frustumCulled = false;
  stormPoints.visible = false;
  scene.add(stormPoints);

  // What the world looked like before the storm, so it can be mixed back.
  const clear = {
    sky: scene.background.clone(),
    fog: scene.fog ? { near: scene.fog.near, far: scene.fog.far } : { near: 300, far: 3000 },
    hadFog: !!scene.fog,
    sun: env.sun.intensity,
    ambient: env.ambient.intensity,
    ground: env.ground ? env.ground.color.clone() : null,
    apron: env.ground?.userData.apron?.color.clone(),
  };
  const disc = env.sunDisc?.getObjectByName('disc') ?? null;
  const halo = env.sunDisc?.getObjectByName('halo') ?? null;
  if (disc) clear.disc = disc.material.color.clone();
  if (halo) clear.halo = halo.material.opacity;
  let level = 0;
  const mix = new THREE.Color();

  function applyStorm() {
    const t = level, e = t * t * (3 - 2 * t);
    mix.copy(clear.sky).lerp(STORM_SKY, e);
    scene.background.copy(mix);
    if (t > 0 && !scene.fog) scene.fog = new THREE.Fog(mix, clear.fog.near, clear.fog.far);
    if (scene.fog) {
      scene.fog.color.copy(mix);
      // The far edge of what you can see comes in from hundreds of metres to nine.
      scene.fog.near = THREE.MathUtils.lerp(clear.fog.near, 0.5, e);
      scene.fog.far = clear.fog.far * Math.pow(9 / clear.fog.far, e);
      if (t === 0 && !clear.hadFog) scene.fog = null;
    }
    env.sun.intensity = clear.sun * (1 - 0.8 * e);
    env.ambient.intensity = clear.ambient * (1 - 0.35 * e);
    if (clear.ground) env.ground.color.copy(clear.ground).lerp(STORM_GROUND, e);
    if (clear.apron) env.ground.userData.apron.color.copy(clear.apron).lerp(STORM_GROUND, e);
    if (disc) {
      // The Sun shrinks to a pale dot and its halo goes.
      disc.material.color.copy(clear.disc).lerp(STORM_SUN, e);
      disc.scale.setScalar(1 - 0.25 * e);
      if (halo) halo.material.opacity = clear.halo * (1 - e);
    }
    stormMat.opacity = Math.min(1, t * 1.2) * 0.45;
    stormPoints.visible = t > 0.01;
  }

  function updateStorm(dt) {
    if (level <= 0.01) return;
    const wind = 6 + level * 16, half = BOX / 2;
    for (let i = 0; i < preset.stormSpecks * 3; i += 3) {
      stormPos[i] += wind * dt;
      stormPos[i + 1] += Math.sin((stormPos[i] + i) * 0.7) * 0.8 * dt;
      stormPos[i + 2] += wind * 0.35 * dt;
      if (stormPos[i] > half) stormPos[i] -= BOX;
      if (stormPos[i + 2] > half) stormPos[i + 2] -= BOX;
    }
    stormGeo.attributes.position.needsUpdate = true;
    stormPoints.position.copy(hero.object.position);
  }

  function applyQuality(value, name) {
    qualityLevel = name ?? (typeof value === 'string' ? value : qualityLevel);
    preset = typeof value === 'object' ? value : presetFor(qualityLevel);
    dustPool.setLimit(Math.round(DUST_POOL * preset.dustScale));
    stormGeo.setDrawRange(0, preset.stormSpecks);
    if (shadow) shadow.visible = !preset.shadows;
    scene.traverse((o) => o.userData.applyQuality?.(preset));
  }
  applyQuality(preset, qualityLevel);
  return {
    applyQuality,
    get quality() { return qualityLevel; },
    get budget() { return { dust: Math.round(DUST_POOL * preset.dustScale), storm: preset.stormSpecks }; },
    dust: {
      shower(on) {
        showerOn = !!on;
        const fender = hero.part?.('fender_RR');
        if (fender) fender.visible = !showerOn;
      },
      get showering() { return showerOn; },
    },
    storm: {
      setLevel(v) { level = Math.max(0, Math.min(1, v)); applyStorm(); },
      get level() { return level; },
    },
    // A flat ring of dust racing outward from under `where` (an object or a Vector3).
    liftoff(where, strength = 1) {
      const c = where.isObject3D ? where.getWorldPosition(new THREE.Vector3()) : where;
      const y = floor(c.x, c.z) + 0.1;
      for (let i = 0; i < Math.round(180 * preset.dustScale); i++) {
        const a = Math.random() * Math.PI * 2, r = rand(0.5, 2.5), v = rand(5, 14) * strength;
        dustPool.emit(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r, Math.cos(a) * v, rand(0.1, 1.2) * strength, Math.sin(a) * v, airless ? 4 : 1.8);
      }
    },
    update(dt) {
      env.updateShadow?.(hero.object);
      updateDust(dt);
      updateStorm(dt);
      updateShadow(dt);
    },
    dispose() {
      level = 0;
      applyStorm();
      dustPool.dispose();
      dustMap.dispose();
      if (shadow) { scene.remove(shadow); shadow.traverse((o) => o.geometry?.dispose()); ink.dispose(); }
      scene.remove(stormPoints);
      stormGeo.dispose();
      stormMat.dispose();
    },
  };
}
