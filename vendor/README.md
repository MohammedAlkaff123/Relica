# vendor/: the libraries, for playing without internet (TASKS.md A-13)

Exact copies of the files `index.html` loads from the CDN, same versions:

| File | From |
|---|---|
| `three.module.js` | three@0.160.0 `build/three.module.js` |
| `addons/loaders/GLTFLoader.js`, `addons/utils/BufferGeometryUtils.js` | three@0.160.0 `examples/jsm/` (for the .glb models) |
| `rapier.es.js` | @dimforge/rapier3d-compat@0.12.0 (the physics engine is inside it, no separate .wasm file) |
| `lil-gui.esm.min.js` | lil-gui@0.19.2 `dist/` |

Licences: Three.js MIT, Rapier Apache-2.0, lil-gui MIT.

## Switching the game to these files

`index.html` is not in Set A's folders, so it has not been changed yet. Once the team agrees, replace the
import map in `index.html` with:

```html
<script type="importmap">
{
  "imports": {
    "three": "./vendor/three.module.js",
    "three/addons/": "./vendor/addons/",
    "@dimforge/rapier3d-compat": "./vendor/rapier.es.js",
    "lil-gui": "./vendor/lil-gui.esm.min.js"
  }
}
</script>
```

If Set B uses another file from `three/addons/`, copy it from the same three@0.160.0 package into
`vendor/addons/` with the same folder path.

The fonts still come from Google Fonts. Without internet the page falls back to the system fonts, which
looks different but works. Arabic still shows (any system Arabic font).
