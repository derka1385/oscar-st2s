# Replacing the temporary Oscar model

The shipped mesh is a procedural, simplified educational placeholder, explicitly labelled in the UI. It is not a realistic anatomical reconstruction.

1. Supply a licensed, anatomically verified GLB at `public/models/oscar-skeleton.glb`.
2. Map each structure's `modelMeshNames` in `data/anatomy/skeleton.ts` to exact node or mesh names. Blender suffixes such as `.001` are normalized; meshes may also inherit a mapped parent node name.
3. The adapter loads the model once, normalizes its height and position, and shares prepared geometry across interaction states. It reports missing mappings and keeps the complete procedural fallback active rather than silently omitting quiz targets.
4. Review every anchor after import. `anchor` drives labels, hints and camera framing. Update those positions for the real mesh's pose, using the normalized coordinate system (feet at y≈0.15, top at y≈8.45, front on +Z).
5. `Os coxal` is an aggregate of ilium, ischion and pubis, so selecting or isolating it selects all three. The symphysis is an articulation, not a bone.
6. Confirm orientation: front +Z, back −Z, left −X and right +X as camera viewpoints. The model should have an anatomical pose with relaxed abducted arms. Students can rotate to inspect hidden structures.

Anatomy content, quizzes, progress records and selection use stable educational IDs, never external mesh names. Keep those IDs stable when swapping assets. The model adapter deliberately rejects incomplete mappings so every exercise remains answerable.

The anatomy content is based on the supplied ST2S brief, cross-checked against OpenStax Anatomy and Physiology 2e (chapters 7–8). A teacher review against the original worksheet is recommended before classroom release; the original worksheet and final anatomical model were not provided.
