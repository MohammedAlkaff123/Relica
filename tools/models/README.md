# Model cleanup script

Turns NASA's GLB models into the game models in `public/models/`.

1. Download the seven source models from <https://github.com/nasa/NASA-3D-Resources> (folder `3D Models`) into `tools/models/nasa_source/`, named `opportunity.glb`, `ingenuity.glb`, `pioneer.glb`, `viking.glb`, `lunar_module.glb`, `astronaut.glb`, `perseverance.glb`. That folder is not committed.
2. In `tools/models/`: `npm install @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions draco3dgltf meshoptimizer sharp`
3. `node clean.mjs all` (or one name). It writes to `public/models/`. Rename `lunar_module.glb` to `lunarModule.glb` afterwards.

Each model's rules (parts, scale, colours, triangle budget) are in the `MODELS` table at the top of `clean.mjs`.
