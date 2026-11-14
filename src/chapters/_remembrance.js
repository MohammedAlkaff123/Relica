// The four voices have four separate resting places. They never share a physical scene.
import * as THREE from 'three';
import { buildWorld } from '../world/world.js';
import { heightAt } from '../core/terrain.js';
import { createCharacter } from '../characters/character.js';

export async function rememberTheMachines(s, ctx) {
  const previous=ctx.scene.children.map((o)=>[o,o.visible]);
  const sets={},actors={},worlds=[],characters=[];
  const background=ctx.scene.background,fog=ctx.scene.fog;
  for(const [id,world] of [['lrv','moon'],['viking','mars'],['opportunity','mars'],['ingenuity','jezero']]) {
    const set=new THREE.Scene();
    worlds.push(buildWorld(world,set));
    const hero=createCharacter(id);characters.push(hero);
    hero.object.position.set(0,heightAt(world,0,0)+hero.half[1],0);
    hero.setEmotion('sleepy');set.add(hero.object);
    if(id==='ingenuity')hero.breakBlade();
    set.visible=false;ctx.scene.add(set);sets[id]=set;actors[id]=hero.object;
    ctx.characters.set(id,hero);
  }
  // Loading is bounded by the existing model fallback; all geometry is already visible as stand-ins.
  const stop=s.every((dt)=>{
    previous.forEach(([o])=>{o.visible=false;});
    characters.forEach((hero)=>hero.update(dt));
  });
  previous.forEach(([o])=>{o.visible=false;});ctx.scene.fog=null;
  let cleaned=false;
  const cleanup=()=>{
    if(cleaned)return;cleaned=true;stop();
    Object.entries(sets).forEach(([id,set])=>{ctx.scene.remove(set);ctx.characters.delete(id);});
    worlds.forEach((env)=>env.dispose());
    previous.forEach(([o,v])=>{o.visible=v;});ctx.scene.background=background;ctx.scene.fog=fog;
  };
  s.onDispose(cleanup);
  try {
    await s.do(ctx.cinematics.conversation('where_they_are','ep_voices',s.hero.object,actors,ctx.dialogue,{
      onFrame(frame){
        for(const [id,set] of Object.entries(sets))set.visible=id===frame.show;
        ctx.scene.background=new THREE.Color(frame.sky);
      },
    }));
  }finally{cleanup();}
}
