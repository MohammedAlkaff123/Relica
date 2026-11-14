// Shared set-up and helpers for chapters, so each chapter file only holds its own story. Owner: Set A.
//
// A chapter file is:
//
//   export default makeChapter({
//     id, world, character,          which stage to build
//     vehicle: 'rover' | 'heli' | null,
//     start: [x, z, yaw],            where the hero starts
//     cameraScale,                   camera distance multiplier for small or large machines
//     async script(stage, ctx, opts) the story, top to bottom (opts.jump = pitch-mode jump target)
//     tick(dt, stage, ctx)           optional, every frame
//   })
//
// Inside script, use the stage helpers below. They all stop the script cleanly when the player jumps
// to another chapter or restarts (they throw a `Gone` that makeChapter swallows), so a script needs
// no `if (!stage.alive) return` checks as long as it only waits through stage helpers.
// If you await something on ctx directly, check stage.alive afterwards, or wrap it: await stage.do(p).
//
//   await stage.wait(2)                       seconds of game time
//   await stage.fade(true, 1.5)               fade to black (false = back from black)
//   stage.lockControls() / unlockControls()
//   await stage.goTo(x, z, 'Drive to ...', { radius })
//   await stage.hold('KeyE', 2, 'Hold E to study the pebbles')
//   await stage.until(() => condition)        checked every frame
//   await stage.card(title, sub) / say(dialogueId) / photo(nasaId) / shot(shotId, anchor)
//   stage.every((dt) => {...})                per-frame task, removed with the chapter; returns remove()
//   stage.add(object3d)                       added to the scene, removed with the chapter
//   stage.prop(name, x, z, yaw)               a prop standing on the ground (see _props.js)
//   stage.ground(x, z)                        ground height
//   stage.counter(label, value, planned)      HUD counter ("Sol 91 / 90 planned")
//   stage.battery(0..1)                       HUD battery
import * as THREE from 'three';
import { buildWorld } from '../world/world.js';
import { createCharacter } from '../characters/character.js';
import { createRover } from '../vehicles/rover.js';
import { createHeli } from '../vehicles/heli.js';
import { heightAt, conformWorld } from '../core/terrain.js';
import { createObjectives } from '../core/objectives.js';
import { fadeTo } from '../core/fade.js';
import { makeProp, makeDust, makeStorm } from './_props.js';

// Thrown into a chapter script when its chapter has been left. Not an error.
export class Gone extends Error {
  constructor() { super('chapter left'); this.name = 'Gone'; }
}

const TERRAIN_WORLDS = new Set(['moon', 'mars']);

export function setupStage(ctx, cfg) {
  const { scene, physics, tuning, input } = ctx;
  const world = cfg.world;
  const gravity = ctx.facts.worlds[world].gravity.value;
  physics.resetWorld(gravity);
  fadeTo(cfg.startBlack ? 1 : 0, 0);

  const env = buildWorld(world, scene);
  conformWorld(env, world);
  const hero = createCharacter(cfg.character);
  scene.add(hero.object);
  ctx.characters.clear();
  ctx.characters.set(cfg.character, hero);

  const [sx, sz, syaw] = cfg.start ?? [0, 0, 0];
  let body = null;
  let controller = null;
  if (cfg.vehicle) {
    if (TERRAIN_WORLDS.has(world)) physics.addTerrain(world);
    else physics.addGround();
    const y = heightAt(world, sx, sz) + hero.half[1] + 0.05;
    body = physics.addBox(hero.object, hero.half, [sx, y, sz], { round: cfg.vehicle === 'rover' ? 0.15 : 0.05 });
    body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), syaw), true);
    const args = { body, hero, world, tuning, input };
    controller = cfg.vehicle === 'heli' ? createHeli(args) : createRover(args);
  } else {
    hero.object.position.set(sx, heightAt(world, sx, sz) + hero.half[1], sz);
    hero.object.rotation.y = syaw;
  }

  ctx.followCam.setTarget(hero.object, cfg.cameraScale ?? 1);
  ctx.hud.setWorld(world);
  ctx.hud.setObjective('');
  ctx.audio.setWorld?.(world);

  const objectives = createObjectives({ scene, hud: ctx.hud, world, getHero: () => hero });
  const dust = makeDust(env, scene);
  const storm = world === 'mars' ? makeStorm(env, scene) : null;

  const added = [];
  const tasks = new Set();
  const pending = new Set(); // { reject } of every helper promise still waiting
  let clock = 0;

  // A promise that rejects with Gone if the chapter is left first.
  function guarded(executor) {
    if (!stage.alive) return Promise.reject(new Gone());
    let entry;
    const p = new Promise((resolve, reject) => {
      entry = { reject };
      pending.add(entry);
      executor((v) => { pending.delete(entry); resolve(v); });
    });
    p.catch(() => {}); // never an "unhandled rejection" warning when a chapter is left
    return p;
  }
  // After awaiting someone else's promise: stop here if the chapter was left meanwhile.
  async function after(promise) {
    const v = await promise;
    if (!stage.alive) throw new Gone();
    return v;
  }

  const stage = {
    cfg, env, hero, body, controller, gravity, world, dust, storm, objectives,
    alive: true,      // false once the chapter has been left
    controls: false,  // true while the player drives or flies
    get time() { return clock; },

    // ---- time and control ----
    wait(seconds) {
      const end = clock + seconds;
      return guarded((done) => {
        const task = () => { if (clock >= end) { tasks.delete(task); done(); } };
        tasks.add(task);
      });
    },
    until(test) {
      return guarded((done) => {
        const task = (dt) => { if (test(dt)) { tasks.delete(task); done(); } };
        tasks.add(task);
      });
    },
    fade(toBlack, seconds = 1) {
      fadeTo(toBlack ? 1 : 0, seconds);
      return stage.wait(seconds);
    },
    lockControls() { stage.controls = false; },
    unlockControls() { stage.controls = true; },
    every(fn) { tasks.add(fn); return () => tasks.delete(fn); },

    // ---- goals ----
    goTo(x, z, text, opts) {
      return guarded((done) => { objectives.goTo(x, z, text, opts).then(done); });
    },
    // Hold a key for `seconds` (in total; letting go pauses it). Shows a progress bar on the objective line.
    hold(code, seconds, text) {
      let held = 0, shown = '';
      return guarded((done) => {
        const task = (dt) => {
          if (ctx.input.down(code)) held += dt;
          const n = Math.min(10, Math.floor((held / seconds) * 10));
          const label = `${text}  ${'▮'.repeat(n)}${'▯'.repeat(10 - n)}`;
          if (label !== shown) { ctx.hud.setObjective(label); shown = label; }
          if (held >= seconds) { tasks.delete(task); ctx.hud.setObjective(''); done(); }
        };
        tasks.add(task);
      });
    },

    // ---- other people's systems, wrapped so a chapter switch stops the script ----
    do: after,
    card: (title, sub) => after(ctx.card.show(title, sub)),
    say: (id) => after(ctx.dialogue.play(id)),
    photo: (id) => after(ctx.memory.show(id)),
    // A missing shot file is not fatal: the script carries on after a short pause.
    async shot(id, anchor = hero.object) {
      try {
        await after(ctx.cinematics.play(id, anchor));
      } catch (err) {
        if (err instanceof Gone) throw err;
        console.info(`shot "${id}" is not in content/shots/ yet, skipping it`);
        await stage.wait(0.5);
      }
    },

    // ---- world ----
    ground: (x, z) => heightAt(world, x, z),
    add(object) { scene.add(object); added.push(object); return object; },
    prop(name, x = 0, z = 0, yaw = 0) {
      const p = makeProp(name);
      p.position.set(x, heightAt(world, x, z), z);
      p.rotation.y = yaw;
      return stage.add(p);
    },
    // Walk or drive a prop across the ground to (x, z) in `seconds`, turning to face where it goes.
    moveTo(object, x, z, seconds, { face = true, above = 0 } = {}) {
      const from = object.position.clone();
      let t = 0;
      if (face) object.rotation.y = Math.atan2(x - from.x, z - from.z);
      return stage.until((dt) => {
        t = Math.min(1, t + dt / seconds);
        const u = t * t * (3 - 2 * t);
        const px = from.x + (x - from.x) * u, pz = from.z + (z - from.z) * u;
        object.position.set(px, heightAt(world, px, pz) + above, pz);
        return t >= 1;
      });
    },
    // Takes a prop off whatever it rides on and puts it back in the scene where it was.
    detach(object) { scene.attach(object); if (!added.includes(object)) added.push(object); return object; },
    counter(label, value, planned) {
      const v = typeof value === 'number' ? Math.floor(value).toLocaleString('en') : value;
      if (ctx.hud.setCounter) ctx.hud.setCounter(label, v, planned);
      else ctx.hud.setStat(label, planned != null ? `${v} / ${planned} planned` : v);
    },
    battery(level) {
      const v = THREE.MathUtils.clamp(level, 0, 1);
      if (ctx.hud.setBattery) ctx.hud.setBattery(v);
      else ctx.hud.setStat('battery', Math.round(v * 100) + ' %');
    },

    update(dt) {
      clock += dt;
      if (controller) {
        if (stage.controls) controller.update(dt);
        else controller.idle(dt);
      }
      hero.update(dt);
      objectives.update(dt);
      dust.update(dt, gravity);
      for (const task of [...tasks]) task(dt);
    },
    dispose() {
      stage.alive = false;
      for (const entry of pending) entry.reject(new Gone());
      pending.clear();
      tasks.clear();
      objectives.dispose();
      dust.dispose();
      storm?.dispose();
      for (const o of added) scene.remove(o);
      scene.remove(hero.object);
      env.dispose();
      ctx.characters.clear();
      ctx.followCam.enabled = true;
    },
  };
  return stage;
}

export function makeChapter(cfg) {
  let stage = null;

  return {
    id: cfg.id,
    // opts.jump: pitch-mode shortcut into the middle of the chapter (keys 6-9, see main.js)
    async start(ctx, opts = {}) {
      const s = stage = setupStage(ctx, cfg);
      try {
        await cfg.script(s, ctx, opts);
      } catch (err) {
        if (!(err instanceof Gone)) throw err;
      }
    },
    update(dt, ctx) {
      if (!stage) return;
      stage.update(dt);
      if (cfg.tick && stage.alive) cfg.tick(dt, stage, ctx);
    },
    dispose() {
      if (stage) stage.dispose();
      stage = null;
    },
  };
}
