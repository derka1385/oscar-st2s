# Oscar — 3D asset attribution

BodyParts3D, © The Database Center for Life Science.

The Oscar skeleton mesh is distributed under **Creative Commons Attribution-Share Alike 2.1 Japan**, preserving the terms stated by the source distributors. This license applies to the model asset, separately from application code.

- License: https://creativecommons.org/licenses/by-sa/2.1/jp/
- Original project: https://lifesciencedb.jp/bp3d/
- Database and current license information: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (the original database now offers CC BY 4.0; the derivative sources below state CC BY-SA 2.1 Japan).
- Primary skeleton: Johan Bellander / BodyExplorer, `public/skeleton.glb`, commit `7d04bf3c4de2bd9cb234dd51d7e6857c099afafd`. https://github.com/JohanBellander/BodyExplorer
- Sacrum: BodyParts3D 3.0, FMA16202, STL conversion by Kevin Mattheus Moerman. https://github.com/Kevin-Mattheus-Moerman/BodyParts3D/blob/main/assets/BodyParts3D_data/stl/FMA16202.stl
- Reference paper: Mitsuhashi et al., BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

## Oscar adaptations

Converted native millimetre coordinates (Z up, anterior −Y) to the app's coordinate system (Y up, anterior +Z), normalized height, renamed meshes to stable educational IDs, grouped bones, added the sacrum, omitted hyoid and foot sesamoids outside the requested curriculum, and generated matching annotation anchors. Original anatomical surfaces are preserved.

Adult hip bones are fused in the source. Their triangles are partitioned into approximate ilium, ischium and pubis picking regions without changing the visible surface. These boundaries are learning aids, not anatomical segmentations. Coccyx and pubic symphysis are explicitly schematic supplements made for Oscar. A teacher should review these regions before classroom assessment.

The reproducible conversion script is `scripts/prepare-skeleton.py`. Download the two input files as `skeleton.glb` and `sacrum.stl` into one directory, then pass that directory to the script. Source/output checksums, mesh counts and approximation metadata are in `model-manifest.json`.
