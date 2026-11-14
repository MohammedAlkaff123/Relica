import * as THREE from 'three';
import { handheld } from '../cinematics/handheld.js';
export function createFollowCamera(camera,tuning) {
  const want=new THREE.Vector3(),look=new THREE.Vector3(),offset=new THREE.Vector3();
  let target=null,scale=1,snap=true,time=0,speaker=null,profile='lrv',storm=0,air=0;
  return {
    enabled:true,
    setTarget(object,s=1){target=object;scale=s;snap=true;},
    setProfile(name){profile=name;storm=air=0;speaker=null;},
    setMotion({storm:level=storm,airborne=air}={}){storm=level;air=airborne?1:0;},
    talkTo(object){speaker=object;},release(){speaker=null;},snap(){snap=true;},
    update(dt){
      time+=dt;if(!this.enabled||!target)return;
      const t={...tuning.camera,...tuning.cameraProfiles?.[profile]};
      const size=tuning.cameraProfiles?.[profile]?1:scale;
      let shake=t.shakeDeg,fov=t.fov;
      if(speaker){
        const name=speaker.name,distance=name==='ingenuity'?1.6:name==='pioneer'?2.5:3.3;
        offset.set(distance*.65,distance*.55,distance).applyQuaternion(speaker.quaternion);
        want.copy(speaker.position).add(offset);look.copy(speaker.position).add(new THREE.Vector3(0,.35,0));
        shake=name==='viking'?0:.3;fov=45;
      }else{
        const distance=THREE.MathUtils.lerp(t.distance,3.5,storm),height=THREE.MathUtils.lerp(t.height,1.2,storm)+air*.6;
        offset.set(0,0,-1).applyQuaternion(target.quaternion).setY(0).normalize();
        want.copy(target.position).addScaledVector(offset,distance*size);want.y+=height*size;
        look.copy(target.position);look.y+=.5*size;
        fov=THREE.MathUtils.lerp(t.fov+air*4,45,storm);shake=THREE.MathUtils.lerp(shake,1.2,storm);
      }
      if(snap){camera.position.copy(want);snap=false;}else camera.position.lerp(want,1-Math.exp(-(speaker?7:t.lag)*dt));
      camera.lookAt(look);camera.fov+=(fov-camera.fov)*(1-Math.exp(-6*dt));camera.updateProjectionMatrix();
      handheld(camera,time,shake,t.shakeSpeed);
    },
  };
}
