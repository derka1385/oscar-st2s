# Oscar — interactive ST2S anatomy

A French 3D skeleton learning workspace: exploration, anatomy hierarchy, region visibility, X-ray, isolation, worksheet labels, model-based revision and locally persisted mastery.

## Run

```sh
npm install
npm run dev
```

`npm run typecheck` checks TypeScript. `npm run build` produces a Sites-compatible Cloudflare build using Vinext (the Next.js-compatible runtime). Tailwind is available; the workspace uses a bespoke CSS design system, Inter, Lucide, Framer Motion, Zustand, React Three Fiber, Drei and Three.js.

## Learning modes

- **Explorer:** select a bone in 3D or the keyboard-accessible index. Double-click isolates it. Escape restores the full skeleton. Group chips, layer controls and camera presets operate on the same model.
- **Réviser:** eight exercises, mixing direct localization, identification, anatomical groups, multiple selection and proximal-to-distal ordering. Incorrect answers allow retries; after two failures a general area is highlighted. Keyboard alternatives are available through the index and reorder buttons. Tibia and fibula may be ordered either way because they are parallel structures.
- **Mode fiche:** ten anchored fill-in labels, accent-insensitive matching, historical aliases, correction and error-specific revision.
- **Ma progression:** per-structure and per-group mastery, due structures, saved revisions and recent sessions.

All records begin at zero. localStorage stores mastery, correct/wrong counts, recent performance, review dates, streaks, saved structures, XP and sessions. Mastery decays with elapsed time; scheduling weights low mastery, recent errors and overdue dates. No accounts or remote database are needed. Storage is per browser, per origin.

## Architecture

`data/anatomy/` contains the typed content and mesh mapping. `lib/` contains assessment, mastery and review scheduling. `store/` separates view state, persistent progress, worksheet and quiz sessions. `components/anatomy/` owns geometry, loading, raycasting, cameras and projected labels. Learning and exercise panels consume educational IDs.

**Anatomical model:** the included GLB uses BodyParts3D meshes adapted from BodyExplorer, supplemented with a BodyParts3D sacrum. All 30 educational targets remain selectable, including the aggregate hip bone. The coccyx and pubic symphysis are schematic; picking regions on the fused hip bones are approximate. See [model integration](docs/model-integration.md) and [asset attribution](public/models/ATTRIBUTION.md).

Privacy: progress stays on the device. There are no analytics, uploads, external AI calls, sign-up forms or invented example scores. Hosting is owner-private by default.
