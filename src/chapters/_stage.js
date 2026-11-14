// Shared set-up for chapters, so each chapter file only holds what is special about it. Owner: Set A.
//
// makeChapter(config) builds a chapter that runs this stub script:
//   title card -> intro dialogue -> player has control -> press E -> outro dialogue
//   -> memory photo -> cutscene -> next chapter
//
// config:
//   id, world, character        which stage to build
//   vehicle                     'rover' | 'heli' | null (no physics body)
//   cameraScale                 camera distance multiplier for small or large machines
//   card { title, sub }, date   title card text and the date row on the HUD
//   intro, outro                dialogue ids from content/dialogue.json
//   objective                   text shown while the player has control
//   memory                      NASA photo id shown at the end
//   cutscene                    shot id from content/shots/
//   setup(stage, ctx)           runs once when the player gets control
//   tick(dt, stage, ctx)        runs every frame while the player has control
//   end(stage, ctx)             runs after the cutscene, before the next chapter
//
// "Press E to finish" is only there so the whole game can be played end to end from day one.
// Replace it with real goals inside tick(), and call stage.finish() when the chapter is done.
import { buildWorld } from '../world/world.js';
import { createCharacter } from '../characters/character.js';
import { createRover } from '../vehicles/rover.js';
import { createHeli } from '../vehicles/heli.js';

export function setupStage(ctx, cfg) {
  const { scene, physics, tuning, input } = ctx;
  const gravity = ctx.facts.worlds[cfg.world].gravity.value;
  physics.resetWorld(gravity);

  const env = buildWorld(cfg.world, scene);
  const hero = createCharacter(cfg.character);
  scene.add(hero.object);
  ctx.characters.clear();
  ctx.characters.set(cfg.character, hero);

  let body = null;
  let controller = null;
  if (cfg.vehicle) {
    physics.addGround();
    body = physics.addBox(hero.object, hero.half, [0, hero.half[1] + 0.3, 0]);
    controller = cfg.vehicle === 'heli'
      ? createHeli(body, hero.half[1], tuning, input, hero)
      : createRover(body, hero.half[1], tuning, input);
  }

  ctx.followCam.setTarget(hero.object, cfg.cameraScale ?? 1);
  ctx.hud.setWorld(cfg.world);

  const stage = {
    cfg, env, hero, body, controller, gravity,
    alive: true,      // false once the chapter has been left; check it after every await
    controls: false,  // true while the player is driving
    finish: null,     // set by makeChapter
    update(dt) {
      if (controller) {
        if (stage.controls) controller.update(dt);
        else controller.idle(dt);
      }
      hero.update(dt);
    },
    dispose() {
      stage.alive = false;
      scene.remove(hero.object);
      env.dispose();
      ctx.characters.clear();
    },
  };
  return stage;
}

export function makeChapter(cfg) {
  let stage = null;

  async function finish(ctx, s) {
    if (!s.controls) return;
    s.controls = false;
    ctx.hud.setObjective('');
    if (cfg.outro) { await ctx.dialogue.play(cfg.outro); if (!s.alive) return; }
    if (cfg.memory) { await ctx.memory.show(cfg.memory); if (!s.alive) return; }
    if (cfg.cutscene) { await ctx.cinematics.play(cfg.cutscene, s.hero.object); if (!s.alive) return; }
    if (cfg.end) { await cfg.end(s, ctx); if (!s.alive) return; }
    ctx.next();
  }

  return {
    id: cfg.id,
    async start(ctx) {
      const s = stage = setupStage(ctx, cfg);
      s.finish = () => finish(ctx, s);
      if (cfg.date) ctx.hud.setStat('date', cfg.date);
      s.hero.setEmotion('sleepy');
      await ctx.card.show(cfg.card.title, cfg.card.sub);
      if (!s.alive) return;
      s.hero.setEmotion('curious');
      if (cfg.intro) { await ctx.dialogue.play(cfg.intro); if (!s.alive) return; }
      if (cfg.setup) cfg.setup(s, ctx);
      s.controls = true;
      ctx.hud.setObjective(cfg.objective ?? '');
    },
    update(dt, ctx) {
      if (!stage) return;
      stage.update(dt);
      if (!stage.controls) return;
      if (cfg.tick) cfg.tick(dt, stage, ctx);
      if (ctx.input.pressed('KeyE')) stage.finish();
    },
    dispose() {
      if (stage) stage.dispose();
      stage = null;
    },
  };
}
