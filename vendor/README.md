# vendor/: the libraries, for playing without internet

Exact copies of the library files, so the game runs with no internet and no CDN. `index.html` loads them through its import map:

| File | From |
|---|---|
| `three.module.js` | three@0.160.0 `build/three.module.js` |
| `addons/loaders/GLTFLoader.js`, `addons/utils/BufferGeometryUtils.js` | three@0.160.0 `examples/jsm/` (for the .glb models) |
| `rapier.es.js` | @dimforge/rapier3d-compat@0.12.0 (the physics engine is inside it, no separate .wasm file) |
| `lil-gui.esm.min.js` | lil-gui@0.19.2 `dist/` |

Licences: Three.js MIT, Rapier Apache-2.0, lil-gui MIT.

## Adding a file

If someone uses another file from `three/addons/`, copy it from the same three@0.160.0 package into
`vendor/addons/` with the same folder path.

The fonts are local too (`public/brand/fonts/`), so the game looks the same offline.
