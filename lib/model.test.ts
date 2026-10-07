import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Box3, Vector3 } from 'three';
import { mapModel } from '@/components/anatomy/SkeletonModel';
import { structures } from '@/data/anatomy/skeleton';

const bytes = readFileSync('public/models/oscar-skeleton.glb');
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const model = await new GLTFLoader().parseAsync(buffer, '');
const mapped = mapModel(model);
assert.deepEqual(mapped.unmatched, [], 'Every shipped mesh must map to a curriculum ID');
const bounds = new Box3();
const byId = new Map<string, Box3>();
for (const part of mapped.parts) {
  const p = part.geometry.getAttribute('position');
  assert.ok(p.count > 0);
  for (const value of p.array) assert.ok(Number.isFinite(value));
  const index = part.geometry.index;
  if (index) for (const value of index.array) assert.ok(value < p.count);
  part.geometry.computeBoundingBox();
  const box = part.geometry.boundingBox!;
  bounds.union(box);
  if (!byId.has(part.id)) byId.set(part.id, new Box3());
  byId.get(part.id)!.union(box);
}
for (const structure of structures) {
  if (structure.id === 'coxal') continue;
  assert.ok(byId.has(structure.id), `Missing quiz target: ${structure.id}`);
  assert.ok(byId.get(structure.id)!.clone().expandByScalar(.015).containsPoint(new Vector3(...structure.anchor)), `Anchor outside mesh: ${structure.id}`);
}
assert.ok(Math.abs(bounds.min.y - .15) < .001);
assert.ok(Math.abs(bounds.max.y - 8.45) < .001);
assert.ok(byId.get('crane')!.min.y > byId.get('femur')!.max.y);
assert.ok(byId.get('sternum')!.getCenter(new Vector3()).z > byId.get('thoraciques')!.getCenter(new Vector3()).z, 'Front must be +Z');
console.log(`Model checks passed: ${mapped.parts.length} meshes, ${byId.size} mesh targets and aggregate hip; all anchors covered.`);
