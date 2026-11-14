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
// Wheel dust and rotor dust need no call: they follow how the hero moves.
// (hero.breakBlade() lives in characters/character.js.)
//
// On the Moon there is no air: dust flies in clean arcs and drops straight back. On Mars the thin
// air slows it and it hangs for a moment. That difference is on purpose.
import * as THREE from 'three';
import { heightAt } from './terrain.js';

const STORM_SKY = new THREE.Color(0x7a5236);
const STORM_GROUND = new THREE.Color(0x6e4630);
const DEAD = -9999;

// A fixed set of square dust specks, reused in a circle. One draw call.
function makePool(scene, count, color, size) {
  const pos = new Float32Array(count * 3).fill(DEAD);
  const vel = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  let next = 0;
  return {
    points, mat, pos, vel, life, count,
    emit(x, y, z, vx, vy, vz, seconds) {
      const i = next * 3;
      pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
      vel[i] = vx; vel[i + 1] = vy; vel[i + 2] = vz;
      life[next] = seconds;
      next = (next + 1) % count;
    },
    // gravity pulls down, drag (0 on the Moon) slows, floor(x, z) is where a speck lands and dies.
    update(dt, gravity, drag, floor) {
      const keep = Math.max(0, 1 - drag * dt);
      for (let n = 0; n < count; n++) {
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
  const dustPool = makePool(scene, 700, dustColor, 0.09);
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
      wheelDebt += Math.min(speed, 8) * 5 * dt;
      while (wheelDebt >= 1) {
        wheelDebt -= 1;
        const side = Math.random() < 0.5 ? -1 : 1;
        heroPoint(side * hx * 0.85, -hz * 0.7);
        dustPool.emit(p.x, p.y + 0.05, p.z,
          -fwd.x * speed * 0.25 + rand(-0.5, 0.5), rand(0.5, 1.4), -fwd.z * speed * 0.25 + rand(-0.5, 0.5), airless ? 3 : 1.2);
      }
      // The broken fender: a tall rooster tail from the right rear wheel that comes down on the rover.
      if (showerOn) {
        showerDebt += 110 * dt;
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
        rotorDebt += (1 - Math.max(0, height) / 3) * 70 * dt;
        while (rotorDebt >= 1) {
          rotorDebt -= 1;
          const a = Math.random() * Math.PI * 2, r = rand(0.3, 0.7), v = rand(2, 4);
          dustPool.emit(o.position.x + Math.cos(a) * r, ground + 0.05, o.position.z + Math.sin(a) * r, Math.cos(a) * v, rand(0.2, 0.9), Math.sin(a) * v, 1.1);
        }
      }
    }
    dustPool.update(dt, gravity, drag, floor);
  }

  // ---- the storm ----
  const STORM_COUNT = 900, BOX = 26; // specks blowing through a box that follows the hero
  const stormPos = new Float32Array(STORM_COUNT * 3);
  for (let i = 0; i < stormPos.length; i++) stormPos[i] = (Math.random() - 0.5) * BOX;
  const stormGeo = new THREE.BufferGeometry();
  stormGeo.setAttribute('position', new THREE.BufferAttribute(stormPos, 3));
  const stormMat = new THREE.PointsMaterial({ color: 0xc9a17a, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
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
  };
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
    stormMat.opacity = Math.min(1, t * 1.2) * 0.9;
    stormPoints.visible = t > 0.01;
  }

  function updateStorm(dt) {
    if (level <= 0.01) return;
    const wind = 6 + level * 16, half = BOX / 2;
    for (let i = 0; i < stormPos.length; i += 3) {
      stormPos[i] += wind * dt;
      stormPos[i + 1] += Math.sin((stormPos[i] + i) * 0.7) * 0.8 * dt;
      stormPos[i + 2] += wind * 0.35 * dt;
      if (stormPos[i] > half) stormPos[i] -= BOX;
      if (stormPos[i + 2] > half) stormPos[i + 2] -= BOX;
    }
    stormGeo.attributes.position.needsUpdate = true;
    stormPoints.position.copy(hero.object.position);
  }

  return {
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
      for (let i = 0; i < 260; i++) {
        const a = Math.random() * Math.PI * 2, r = rand(0.5, 2.5), v = rand(5, 14) * strength;
        dustPool.emit(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r, Math.cos(a) * v, rand(0.1, 1.2) * strength, Math.sin(a) * v, airless ? 4 : 1.8);
      }
    },
    update(dt) {
      updateDust(dt);
      updateStorm(dt);
    },
    dispose() {
      level = 0;
      applyStorm();
      dustPool.dispose();
      scene.remove(stormPoints);
      stormGeo.dispose();
      stormMat.dispose();
    },
  };
}
