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
//   stage.onDispose(() => {...})              runs when the chapter is left (stop a sound loop...)
//   stage.add(object3d)                       added to the scene, removed with the chapter
//   stage.prop(name, x, z, yaw)               a prop standing on the ground (see _props.js)
//   stage.ground(x, z)                        ground height
//   stage.counter(label, value, planned)      HUD counter ("Sol 91 / 90 planned")
//   stage.battery(0..1)                       HUD battery
//   stage.sound(name, standIn)                Set C's audio.play(name); standIn plays until Set C has the name
//   stage.loop(name, on) / loopLevel(name, 0..1)  looping sounds, stopped with the chapter
import * as THREE from 'three';
import { buildWorld } from '../world/world.js';
import { disposeObject } from '../world/resources.js';
import { createCharacter } from '../characters/character.js';
import { createRover } from '../vehicles/rover.js';
import { createHeli } from '../vehicles/heli.js';
import { heightAt } from '../core/terrain.js';
import { createEffects } from '../world/effects.js';
import { createObjectives } from '../core/objectives.js';
import { fadeTo } from '../core/fade.js';
import { makeProp } from './_props.js';

// Thrown into a chapter script when its chapter has been left. Not an error.
export class Gone extends Error {
  constructor() { super('chapter left'); this.name = 'Gone'; }
}

// A script may start something without awaiting it straight away (a shot that plays over a bounce, a
// park that runs beside a dialogue). If the chapter is left meanwhile, that promise ends with Gone and
// nobody is listening. That is normal, so it is not reported as an error.
window.addEventListener('unhandledrejection', (e) => { if (e.reason instanceof Gone) e.preventDefault(); });

const TERRAIN_WORLDS = new Set(['moon', 'mars', 'jezero']);

export function setupStage(ctx, cfg) {
  const { scene, physics, tuning, input } = ctx;
  const world = cfg.world;
  // Which facts.json world gives gravity and the HUD panel. Jezero is on Mars: cfg.factsWorld = 'mars'.
  const factsWorld = cfg.factsWorld ?? world;
  const gravity = ctx.facts.worlds[factsWorld].gravity.value;
  physics.resetWorld(gravity);
  fadeTo(cfg.startBlack ? 1 : 0, 0);

  const env = buildWorld(world, scene, { quality: ctx.quality?.get() });
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

  ctx.followCam.setProfile(cfg.character);
  ctx.followCam.setTarget(hero.object, cfg.cameraScale ?? 1);
  ctx.hud.setWorld(factsWorld);
  ctx.hud.setObjective('');
  ctx.audio.setWorld?.(factsWorld);

  const objectives = createObjectives({ scene, hud: ctx.hud, world, navigation: ctx.navigation, getHero: () => hero, getSpeed: () => controller?.speed ?? 0 });
  // Set B's effects: wheel and rotor dust follow the hero on their own; dust shower and storm on call.
  const fx = createEffects({ scene, env, hero, gravity });
  const dust = { shower: (on) => fx.dust.shower(on) };
  const storm = fx.storm;

  const added = [];
  const tasks = new Set();
  const pending = new Set(); // { reject } of every helper promise still waiting
  const cleanups = [];       // run when the chapter is left (stop loops, music...)
  let clock = 0;
  let idleLookTime = 0;

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
    cfg, env, hero, body, controller, gravity, world, dust, storm, fx, objectives,
    actors: { hero: hero.object },
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
    onDispose(fn) { cleanups.push(fn); },

    // ---- goals ----
    goTo(x, z, text, opts) {
      return guarded((done) => { objectives.goTo(x, z, text, opts).then(done); });
    },
    // Hold a key for `seconds` (in total; letting go pauses it). Shows a progress bar on the objective line.
    // Set C draws it as a keycap and one bar that fills from green to red (hud.setHold). A hold never asks
    // for more than 2 seconds: long enough to be a choice, short enough not to feel stuck.
    hold(code, seconds, text) {
      let held = 0, shown = '';
      const need = Math.min(seconds, 1); // Set C: a hold never takes more than 1 second (playtest feedback)
      const key = code.replace(/^Key/, '');
      return guarded((done) => {
        const task = (dt) => {
          const pressing = ctx.input.down(code);
          if (pressing) held += dt;
          const progress = Math.min(1, held / need);
          if (ctx.hud.setHold) {
            const label = `${progress.toFixed(2)}${pressing}`;
            if (label !== shown) { ctx.hud.setHold({ key, text, progress, pressing }); shown = label; }
          } else {
            const n = Math.min(10, Math.floor(progress * 10));
            const label = `${text}  ${'▮'.repeat(n)}${'▯'.repeat(10 - n)}`;
            if (label !== shown) { ctx.hud.setObjective(label); shown = label; }
          }
          if (held >= need) { tasks.delete(task); ctx.hud.setObjective(''); if (ctx.hud.setHold) ctx.hud.setHold({ key, text, progress: 1, confirmed: true }); done(); }
        };
        tasks.add(task);
        stage.onDispose(() => ctx.hud.setHold?.(null));
      });
    },

    // ---- other people's systems, wrapped so a chapter switch stops the script ----
    do: after,
    card: (title, sub) => after(ctx.card.show(title, sub)),
    async say(id, { keepControls = false } = {}) {
      const resume=stage.controls;
      if (!keepControls) stage.lockControls();
      try { return await after(ctx.dialogue.play(id)); }
      finally { if (stage.alive && !keepControls) stage.controls=resume; }
    },
    photo: (id) => after(ctx.memory.show(id)),
    // A missing shot file is not fatal: the script carries on after a short pause.
    // Returns true if the shot played, false if it does not exist yet.
    async shot(id, anchor = hero.object) {
      let destination=null;
      const points={moon_to_mars:[8,34,60],storm_to_jezero:[50,26,90],mars_to_space:[25,70,90]};
      if(points[id]){
        destination=new THREE.Mesh(new THREE.SphereGeometry(id==='moon_to_mars'?3: .3,24,16),new THREE.MeshBasicMaterial({color:id==='moon_to_mars'?0xb76c43:0xffe3b0,fog:false}));
        destination.position.fromArray(points[id]).applyQuaternion(anchor.quaternion).add(anchor.position);
        scene.add(destination);
      }
      const cleanup=()=>{if(destination){scene.remove(destination);destination.geometry.dispose();destination.material.dispose();destination=null;}};
      stage.onDispose(cleanup);
      try {
        await after(ctx.cinematics.play(id, anchor, { ...stage.actors, hero: anchor }));
        return true;
      } catch (err) {
        if (err instanceof Gone) throw err;
        console.info(`shot "${id}" is not in content/shots/ yet, skipping it`);
        await stage.wait(0.5);
        return false;
      } finally { cleanup(); }
    },

    // A named one-shot sound from Set C. New names are listed in SOUND_HANDOFF.md. Until Set C has
    // a name (audio.has(name) is true), the stand-in sound plays instead, if one is given.
    sound(name, standIn) {
      const has = typeof ctx.audio.has === 'function' && ctx.audio.has(name);
      ctx.audio.play?.(has || !standIn ? name : standIn);
    },
    // A looping sound (motor, dust, whirlwind): on while the chapter runs, stopped when it is left.
    loop(name, on = true) {
      ctx.audio.loop?.(name, on);
      if (on) stage.onDispose(() => ctx.audio.loop?.(name, false));
    },
    loopLevel(name, level) { ctx.audio.loopLevel?.(name, Math.max(0, Math.min(1, level))); },

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
      const v = typeof value === 'number' ? Math.floor(value) : value;
      if (ctx.hud.setCounter) ctx.hud.setCounter(label, v, planned);
      else ctx.hud.setStat(label, planned != null ? `${v} / ${planned} planned` : String(v));
    },
    battery(level) {
      const v = THREE.MathUtils.clamp(level, 0, 1);
      if (ctx.hud.setBattery) ctx.hud.setBattery(v);
      else ctx.hud.setStat('battery', Math.round(v * 100) + ' %');
    },

    update(dt) {
      clock += dt;
      if (cfg.vehicle === 'rover' && controller) stage.loopLevel('hum', controller.speed / (tuning.rover.speed || 5));
      if (controller) {
        if (stage.controls) controller.update(dt);
        else controller.idle(dt);
      }
      const idle = stage.controls && (controller?.speed ?? 0) < 0.1 && !controller?.flying && !ctx.cinematics.playing;
      idleLookTime = idle ? idleLookTime + dt : 0;
      // Set C: the keys bar. Always while flying the helicopter; for the rover, after a few seconds standing still.
      const busy = !stage.controls || ctx.cinematics.playing || controller?.broken;
      ctx.hud.setControls?.(busy || !controller ? null
        : cfg.vehicle === 'heli' ? (controller.flying ? 'heli-air' : 'heli-ground')
        : idleLookTime > 6 ? 'rover' : null);
      hero.lookBack?.(idleLookTime > 2, ctx.camera);
      hero.update(dt);
      if (cfg.character === 'lrv') ctx.followCam.setMotion({ airborne: controller && !controller.grounded });
      objectives.update(dt);
      scene.traverse((o) => o.userData.updateFigure?.(dt));
      fx.update(dt);
      for (const task of [...tasks]) task(dt);
    },
    dispose() {
      stage.alive = false;
      ctx.hud.setControls?.(null);
      for (const fn of cleanups) { try { fn(); } catch (err) { console.error(err); } }
      for (const entry of pending) entry.reject(new Gone());
      pending.clear();
      tasks.clear();
      objectives.dispose();
      fx.dispose();
      for (const o of added) {
        o.traverse((child) => { child.userData.disposed = true; child.userData.act?.(null); });
        scene.remove(o); disposeObject(o);
      }
      hero.dispose();
      scene.remove(hero.object);
      env.dispose();
      ctx.characters.clear();
      ctx.followCam.enabled = true;
    },
  };
  return stage;
}

function startMotorHum(stage) {
  if (stage.cfg.vehicle === 'rover') stage.loop('hum', true);
}

export function makeChapter(cfg) {
  let stage = null;

  return {
    id: cfg.id,
    // opts.jump: pitch-mode shortcut into the middle of the chapter (keys 6-9, see main.js)
    async start(ctx, opts = {}) {
      const s = stage = setupStage(ctx, cfg);
      ctx.stage = s; // for the browser console: relica.stage.controller, relica.stage.hero ...
      await ctx.quality?.attach(s); // the new world starts in the chosen graphics mode
      if (!s.alive) return;
      startMotorHum(s);
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
