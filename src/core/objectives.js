// Zones and objectives. Owner: Set A.
//
//   const obj = createObjectives({ scene, hud, world, getHero })
//   await obj.goTo(x, z, 'Drive to the first science stop', { radius: 5 })
//   const { neat } = await obj.goTo(x, z, 'Park at stop 1', { radius: 6, park: true })
//       park: only counts once the hero has stopped inside the circle; neat = stopped near the middle
//   obj.update(dt)       every frame
//   obj.dispose()        removes markers
//
// A zone is a circle on the ground. While it is the current goal it shows a tall beam (visible from
// far away) and a ring on the ground, and the objective line shows the distance. It fires once,
// the first time the hero's centre enters it, then the marker disappears.
// Chapters use it through stage.goTo(...) in src/chapters/_stage.js.
import * as THREE from 'three';
import { heightAt } from './terrain.js';

const SIGNAL = 0xe3a23c;

function makeMarker(radius) {
  const group = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 60, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, fog: false }),
  );
  beam.position.y = 30;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.08, 6, 48),
    new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0.9, fog: false }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;
  group.add(beam, ring);
  group.userData = { beam, ring };
  return group;
}

export function createObjectives({ scene, hud, world, getHero, getSpeed = () => 0 }) {
  let current = null; // { x, z, radius, text, resolve, marker, shown }
  let time = 0;

  function clearCurrent() {
    if (!current) return;
    scene.remove(current.marker);
    current.marker.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    current = null;
    hud.setObjective('');
  }

  return {
    // Resolves when the hero reaches the circle. Starting a new goal replaces the old one.
    goTo(x, z, text, { radius = 5, showDistance = true, park = false } = {}) {
      clearCurrent();
      const marker = makeMarker(radius);
      marker.position.set(x, heightAt(world, x, z), z);
      scene.add(marker);
      return new Promise((resolve) => {
        current = { x, z, radius, text, resolve, marker, showDistance, park, shown: '' };
      });
    },
    get active() { return !!current; },
    // Change the words of the current goal without moving it.
    setText(text) { if (current) current.text = text; },
    update(dt) {
      time += dt;
      if (!current) return;
      const hero = getHero();
      if (!hero) return;
      const p = hero.object.position;
      const d = Math.hypot(p.x - current.x, p.z - current.z);
      const { beam, ring } = current.marker.userData;
      beam.material.opacity = 0.25 + 0.15 * Math.sin(time * 3);
      ring.scale.setScalar(1 + 0.04 * Math.sin(time * 4));
      const inside = d <= current.radius;
      let label = current.showDistance && !inside ? `${current.text} · ${Math.round(d)} m` : current.text;
      if (current.park && inside) label = 'Stop inside the circle';
      if (label !== current.shown) { hud.setObjective(label); current.shown = label; }
      if (inside && (!current.park || getSpeed() < 0.4)) {
        const done = current.resolve;
        const neat = d <= current.radius * 0.4;
        clearCurrent();
        done({ neat, distance: d });
      }
    },
    dispose() { clearCurrent(); },
  };
}
