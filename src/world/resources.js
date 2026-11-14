// Cached GLB templates and palette materials stay resident. Per-scene resources are released.
export function shareResources(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.userData.shared = true;
    for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
      m.userData.shared = true;
      for (const v of Object.values(m)) if (v?.isTexture) v.userData.shared = true;
    }
  });
}
export function disposeObject(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
      if (m.userData.shared) continue;
      materials.add(m);
      for (const v of Object.values(m)) if (v?.isTexture && !v.userData.shared) textures.add(v);
    }
    if (o.isInstancedMesh) o.dispose();
  });
  textures.forEach((v) => v.dispose());
  materials.forEach((v) => v.dispose());
  geometries.forEach((v) => v.dispose());
}
