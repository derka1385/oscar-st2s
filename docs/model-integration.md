# Oscar anatomical mesh

`public/models/oscar-skeleton.glb` contains the attributed BodyParts3D skeleton adapted from BodyExplorer plus the sacrum from the BodyParts3D STL mirror. It is stored locally so runtime never depends on an external model host.

See [asset attribution and license](../public/models/ATTRIBUTION.md) for source links and the exact limitations: schematic coccyx and symphysis, approximate picking regions on fused hip bones. The geometry is substantially more detailed than the procedural fallback; it is not a clinically validated segmentation.

## Rebuild

Download the two inputs documented in the attribution file into a directory, then run `python3 scripts/prepare-skeleton.py /path/to/inputs`. This generates the GLB, `data/anatomy/model-anchors.json` and a checksum/coverage manifest. Native Z-up millimetre coordinates are converted to Y-up, front +Z, feet y≈0.15 and top y≈8.45.

The 29 mesh IDs correspond to educational structures; `coxal` is an aggregate of `ilium`, `ischion` and `pubis`. Source mesh names are independent of UI names and progress records. All 30 targets therefore remain available to selection, isolation, visibility, worksheets and revision. The adapter batches meshes by structure and shares geometry across interaction states. A loading overlay remains visible through download, geometry preparation and the first rendered frame. Incomplete mappings or failed loads show a retry message; the procedural skeleton is never displayed at runtime.

For a replacement GLB, map its node names in `data/anatomy/skeleton.ts`, preserve educational IDs, and regenerate/check anchors. Review front, back, side views and every exercise target after import. `npm run test:model` verifies GLB structure, coverage, normalization, mesh indices and anchor placement.
