# Approved ground texture: sample G

Moayad selected G for **Moon and Mars**, with **Ready-made (CC0)** and **Our palette** in `tools/texture-samples.html`.

- Source: [Sand 01](https://polyhaven.com/a/sand_01), Rob Tuytel / Poly Haven; [CC0](https://polyhaven.com/license).
- Source map: `sand_01_diff_1k.jpg`; SHA-256 `a73b90eaa6d675ef57e7d48a8cf23e1f412e353ab2e29cf73930b8ecd4e76875`.
- Processing: weighted luminance, mean-centered contrast 1.5, brightness 0.82 and JPEG quality 84. Reproduce with `tools/textures/make.mjs` (requires Sharp).
- Variants: 256 / 512 / 1024 px for Low / Medium / High, approximately 13 / 54 / 199 kB. The Moon stays gray; Meridiani and Jezero use their Mars palettes. Repeat scale matches the review page: 8 metres.
- Runtime loads local files only. The original download is excluded from Git; playing does not need a Poly Haven connection.

The superseded H / Rocks Ground 05 images are replaced. This is an artistic surface treatment, not NASA terrain measurement. Photo sets retain their documented viewpoints and original-photo reveals.

## metal_plate.jpg (the machines' painted metal)

- Source: [Blue Metal Plate](https://polyhaven.com/a/blue_metal_plate), Poly Haven; [CC0](https://polyhaven.com/license).
- Made from the 1k `diff`, `rough` and `nor_gl` maps, each scaled to 128 x 128. Left half: red is the colour map's brightness centred on mid-grey (0.5 + (light - mean) / spread * 0.125), green is the roughness map. Right half: the normal map.
- Used by src/world/surface.js. Only the marks, roughness and dents are used; the machines keep their own colours.
