// Shot coordinates are relative to an anchor. Named look targets remain live.
import * as THREE from 'three';
import { handheld } from './handheld.js';
import { loadJSON } from '../core/content.js';
import { fadeTo } from '../core/fade.js';
import { el } from '../ui/dom.js';
const ease = (u) => u*u*(3-2*u);
export function createCinematics({ camera, followCam, tuning, root, audio, getCharacter }) {
  const bars=el('div','bars hidden',root), years=el('div','years hidden',root), cache=new Map();
  const eyes=el('div','launch-eyes hidden',root);
  el('span','',eyes);el('span','',eyes);
  // The launch, seen from inside the folded rover: engine light leaking in from below and a shaking
  // frame while the rocket climbs; then a still, cool light once it is weightless (shot.eyes).
  const launchLight=el('div','launch-light hidden',root);
  el('div','launch-glow',launchLight);el('div','launch-slit',launchLight);
  el('div','launch-label',launchLight,'Inside the rocket · داخل الصاروخ');
  let active=null, generation=0, clock=0;
  const vector=new THREE.Vector3(), other=new THREE.Vector3();
  const load=(id)=> { if(!cache.has(id))cache.set(id,loadJSON(`content/shots/${id}.json`));return cache.get(id); };
  function finish(cancelled=false) {
    const old=active;active=null;
    root.classList.remove('cinema');bars.classList.add('hidden');years.classList.add('hidden');
    eyes.classList.add('hidden');launchLight.classList.add('hidden');
    followCam.enabled=true;followCam.snap();
    if(cancelled)fadeTo(0,0);
    old?.resolve?.();
  }
  function begin(shot, anchor, bindings, type) {
    finish();followCam.release();followCam.enabled=false;root.classList.add('cinema');
    bars.classList.toggle('hidden',!shot.letterbox);years.classList.toggle('hidden',!shot.years);
    eyes.classList.toggle('hidden',!shot.eyes);launchLight.classList.toggle('hidden',!shot.eyes);
    const origin=anchor?.getWorldPosition(new THREE.Vector3())??new THREE.Vector3();
    const rotation=anchor?.getWorldQuaternion(new THREE.Quaternion())??new THREE.Quaternion();
    active={shot,anchor,bindings:{hero:anchor,...bindings},origin,rotation,type,t:0,event:0};
  }
  function point(value,out,state) {
    if(typeof value==='string') {
      const object=state.bindings[value];
      if(object)return object.getWorldPosition(out);
      return out.copy(state.origin);
    }
    out.fromArray(value??[0,.5,0]);
    if(state.shot.local)out.applyQuaternion(state.rotation);
    return out.add(state.origin);
  }
  function draw(k0,k1,u,state) {
    // Hold the previous pose until a hard cut. Never fly through the gap between distant sets.
    if(k1.cut)u=0;
    camera.position.copy(point(k0.pos,vector,state).lerp(point(k1.pos,other,state),u));
    camera.lookAt(point(k0.look,vector,state).lerp(point(k1.look,other,state),u));
    camera.fov=THREE.MathUtils.lerp(k0.fov??50,k1.fov??50,u);camera.updateProjectionMatrix();
    camera.rotateZ(THREE.MathUtils.degToRad(THREE.MathUtils.lerp(k0.roll??0,k1.roll??0,u)));
    handheld(camera,clock,THREE.MathUtils.lerp(k0.shake??0,k1.shake??0,u),tuning.camera.shakeSpeed);
    if(k0.black!==undefined||k1.black!==undefined)fadeTo(THREE.MathUtils.lerp(k0.black??0,k1.black??0,u),0);
  }
  function update(dt) {
    clock+=dt;if(!active)return;
    const s=active;s.t+=dt;
    if(s.type==='dialogue'){if(s.frame)draw(s.frame,s.frame,0,s);return;}
    const keys=s.shot.keys,end=keys.at(-1).t,t=Math.min(s.t,end);
    if(s.shot.eyes){
      const climbing=t<7, rise=Math.min(1,t/1.5); // the engines build up over the first second and a half
      const jx=climbing?(Math.random()-.5)*9*rise:0, jy=climbing?(Math.random()-.5)*7*rise:0;
      eyes.classList.toggle('weightless',!climbing);
      eyes.style.transform=`translate(calc(-50% + ${jx}px),calc(-50% + ${jy}px)) rotate(${climbing?Math.sin(t*19)*2.5:0}deg)`;
      launchLight.classList.toggle('weightless',!climbing);
      launchLight.style.transform=`translate(${jx*.6}px,${jy*.6}px)`;
      launchLight.style.setProperty('--burn',climbing?(rise*(.75+Math.random()*.25)).toFixed(2):'0');
    }
    let i=0;while(i<keys.length-2&&t>=keys[i+1].t)i++;
    const a=keys[i],b=keys[Math.min(i+1,keys.length-1)];
    draw(a,b,ease(THREE.MathUtils.clamp((t-a.t)/Math.max(b.t-a.t,.0001),0,1)),s);
    const events=s.shot.events??[];
    while(s.event<events.length&&events[s.event].t<=t){
      const event=events[s.event++];
      if(event.emotion)getCharacter?.(event.who)?.setEmotion(event.emotion);
      if(event.sound)audio?.play?.(event.sound);
    }
    if(s.shot.years)years.textContent=Math.round(THREE.MathUtils.lerp(...s.shot.years,ease(t/end)));
    if(s.t>=end)finish();
  }
  return {
    async play(id,anchor,bindings={}) {
      const request=++generation,shot=await load(id);if(request!==generation)return;
      if(!shot.keys?.length)throw new Error(`Shot ${id} has no timed keys`);
      begin(shot,anchor,bindings,'timed');
      return new Promise((resolve)=>{active.resolve=resolve;update(0);});
    },
    async conversation(id,dialogueId,anchor,bindings,dialogue,{onFrame}={}) {
      const request=++generation,shot=await load(id);if(request!==generation)return;
      begin(shot,anchor,bindings,'dialogue');const state=active;
      try {
        await dialogue.play(dialogueId,{camera:false,onLine:(line,index)=>{
          if(active!==state)return;
          const frame=shot.lines?.[index]??shot.speakers?.[line.who];
          if(!frame)throw new Error(`Missing camera for ${id} line ${index}`);
          const subject=bindings[frame.subject??line.who]??anchor;
          state.origin.copy(subject.getWorldPosition(new THREE.Vector3()));
          state.rotation.copy(subject.getWorldQuaternion(new THREE.Quaternion()));
          onFrame?.(frame);
          state.frame=frame;draw(frame,frame,0,state);
        }});
      }finally{if(active===state)finish();}
    },
    update,
    cancel(){generation++;finish(true);},
    get playing(){return !!active;},get kind(){return active?.type??null;},
  };
}
