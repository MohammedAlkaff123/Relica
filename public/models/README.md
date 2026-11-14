# Models

Every file here except `lrv.glb` (see below) is adapted from NASA's open 3D models:
<https://github.com/nasa/NASA-3D-Resources> (also at <https://science.nasa.gov/3d-resources/>).
NASA states these are free and without copyright, and asks to be acknowledged as the source.
These belong in the **References** field of the upload form.

| File | NASA source model | Triangles (NASA → ours) | Parts |
|---|---|---|---|
| `opportunity.glb` | Mars Exploration Rover - Opportunity (MER-B) | 3,845 → 3,754 | `body`, `head`, `antenna`, `wheel_FL` `wheel_ML` `wheel_RL` `wheel_FR` `wheel_MR` `wheel_RR` |
| `ingenuity.glb` | Ingenuity Mars Helicopter | 9,124 → 4,796 | `body`, `blade_top` (with child `blade_tip`), `blade_bottom`, markers `head` `antenna` |
| `pioneer.glb` | Pioneer 10 | 8,189 → 4,805 | `body`, markers `head` `antenna` |
| `viking.glb` | Viking Lander | 99,526 → 4,793 | `body`, markers `head` `antenna` |
| `lunarModule.glb` | Apollo Lunar Module | 97,588 → 4,733 | `descent`, `ascent` |
| `astronaut.glb` | Astronaut | 6,381 → 2,996 | `body`, `visor` |
| `perseverance.glb` | Mars 2020 Perseverance Rover | 199,521 → 4,472 | `body` |

## The Moon rover is ours

NASA publishes no 3D model of the Lunar Roving Vehicle, so `lrv.glb` is built by us from boxes,
cylinders and a dish, shaped after the pack photos in `public/nasa/apollo_lunar_roving_vehicle/`.
The script is `tools/models/build_lrv.mjs`: change a number there and run it again.

- 1,062 triangles, 46 KB, 1.66 × 1.78 × 2.67 m. The lowest point is the bottom of the physics box.
- Parts: `body`, `wheel_FL` `wheel_FR` `wheel_RL` `wheel_RR` (each turns about its axle),
  `head` (the TV camera on its post: the eyes go here), `antenna` (the umbrella dish on its mast: the mouth),
  and `fender_RR`, the right rear fender, separate because it is the one that breaks in chapter 1.

## What we changed

Done by the script in `tools/models/`:

- Removed every texture, so there is no flag, logo or patch. Each surface has one plain colour, taken from the average of its old texture.
- Removed normals, so the game draws them flat-shaded.
- Removed animations and compression (the files load with the plain `GLTFLoader`).
- Cut the triangle count to under 5,000.
- Rescaled to metres, front along +Z, up +Y.
- Split into named parts. A part's origin is where it should turn: a wheel's axle, the base of the mast, the rotor shaft.
- The astronaut has a dark visor and a plain white suit. Perseverance is one grey, because it is only a background shape.
- The two flag panels on the Lunar Module are deleted.

## Where the origin is

- **Characters** (`opportunity`, `viking`, `ingenuity`): centred in X and Z, with the lowest point at the bottom of the physics box in `CAST` (`y = -height / 2`). So the model drops straight into the place of the boxes.
- **`pioneer`**: origin at the middle of the dish. Real size (dish 2.74 m).
- **Props** (`lunarModule`, `astronaut`, `perseverance`): centred in X and Z, feet on `y = 0`.

## Sizes

| File | Width × height × length (m) | Note |
|---|---|---|
| `opportunity.glb` | 1.40 × 1.18 × 2.05 | Width matches `CAST`. The arm reaches 0.35 m past the front of the box |
| `ingenuity.glb` | 0.99 × 0.56 × 1.11 | Real size. The legs fit the 0.5 m box; the rotors reach past it |
| `viking.glb` | 1.80 × 1.29 × 2.40 | Width matches `CAST`. The sampler arm points forward |
| `pioneer.glb` | 4.52 × 8.25 × 2.54 | Real size. The long boom points down |
| `lunarModule.glb` | 8.98 × 7.00 × 8.97 | |
| `astronaut.glb` | 1.72 × 1.85 × 0.69 | Arms out. Not rigged |
| `perseverance.glb` | 2.70 × 1.85 × 3.11 | Real size |
