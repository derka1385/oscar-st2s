"""Rebuild Oscar's educational GLB from downloaded, attributed source meshes.
Usage: python3 scripts/prepare-skeleton.py /path/to/source-directory
See public/models/ATTRIBUTION.md for source URLs and licensing.
"""
import collections
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

source = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
raw = (source / 'skeleton.glb').read_bytes()
json_length = struct.unpack_from('<I', raw, 12)[0]
original = json.loads(raw[20:20 + json_length])
binary = raw[28 + json_length:]

def attribute(index):
    a = original['accessors'][index]
    view = original['bufferViews'][a['bufferView']]
    components = {'SCALAR': 1, 'VEC3': 3}[a['type']]
    fmt = {5123: 'H', 5125: 'I', 5126: 'f'}[a['componentType']]
    start = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    length = a['count'] * components * struct.calcsize(fmt)
    return list(struct.iter_unpack('<' + fmt * components, binary[start:start + length]))

def identify(name):
    if name == 'axis': return 'axis'
    if name == 'atlas' or 'cervical vertebra' in name: return 'cervicales'
    if 'thoracic vertebra' in name: return 'thoraciques'
    if 'lumbar vertebra' in name: return 'lombaires'
    if name in ['body of sternum', 'manubrium', 'xiphoid process']: return 'sternum'
    if name.endswith(' rib'): return 'cotes'
    pairs = {'clavicle':'clavicule', 'scapula':'scapula', 'humerus':'humerus', 'radius':'radius', 'ulna':'ulna', 'femur':'femur', 'patella':'patella', 'tibia':'tibia', 'fibula':'fibula'}
    for word, target in pairs.items():
        if name in ['left ' + word, 'right ' + word]: return target
    if 'hip bone' in name: return 'hip'
    if 'metacarpal' in name: return 'metacarpe'
    if 'metatarsal' in name: return 'metatarse'
    if 'phalanx' in name: return 'phalanges-main' if ('finger' in name or 'thumb' in name) else 'phalanges-pied'
    if any(x in name for x in ['capitate','hamate','lunate','pisiform','scaphoid','trapezium','trapezoid','triquetrum']): return 'carpe'
    if any(x in name for x in ['calcaneus','talus','cuboid','cuneiform','navicular']): return 'tarse'
    if any(x in name for x in ['frontal','occipital','sphenoid','ethmoid','parietal','temporal']): return 'crane'
    if any(x in name for x in ['lacrimal','maxilla','nasal bone','palatine','zygomatic','mandible','vomer']): return 'face'
    # Hyoid and foot sesamoids are outside the supplied ST2S target list.
    return None

parts = []
ignored = []
for mesh in original['meshes']:
    name = mesh['name']; target = identify(name)
    if not target:
        ignored.append(name); continue
    for primitive in mesh['primitives']:
        positions = attribute(primitive['attributes']['POSITION'])
        normals = attribute(primitive['attributes']['NORMAL'])
        indices = [v[0] for v in attribute(primitive['indices'])]
        if target == 'hip':
            # Adult hip bones are fused. Partition triangles for educational
            # picking only; preserve the original surface without gaps or overlaps.
            regions = collections.defaultdict(list)
            for i in range(0, len(indices), 3):
                triangle = indices[i:i + 3]
                x, y, z = [sum(positions[k][c] for k in triangle)/3 for c in range(3)]
                region = 'ilium' if z > 846 else ('pubis' if y < -86 and abs(x) < 83 else 'ischion')
                regions[region].extend(triangle)
            for region, faces in regions.items(): parts.append((region, positions, normals, faces))
        else: parts.append((target, positions, normals, indices))

# BodyParts3D 3.0 sacrum, in the same native millimetre coordinate frame.
stl = (source / 'sacrum.stl').read_bytes()
vertices = []; normals = []
for i in range(struct.unpack_from('<I', stl, 80)[0]):
    row = struct.unpack_from('<12f', stl, 84 + 50*i)
    vertices.extend([row[3:6], row[6:9], row[9:12]])
    normals.extend([row[:3]] * 3)
parts.append(('sacrum', vertices, normals, list(range(len(vertices)))))

def ellipsoid(target, center, radii):
    positions = []; normals = []; faces = []
    rows, cols = 10, 16
    for r in range(rows + 1):
        a = math.pi*r/rows
        for c in range(cols + 1):
            t = 2*math.pi*c/cols
            unit = (math.sin(a)*math.cos(t), math.sin(a)*math.sin(t), math.cos(a))
            positions.append(tuple(center[i] + unit[i]*radii[i] for i in range(3)))
            normal = [unit[i]/radii[i] for i in range(3)]
            length = math.sqrt(sum(v*v for v in normal))
            normals.append(tuple(v/length for v in normal))
    for r in range(rows):
        for c in range(cols):
            a = r*(cols+1)+c; b = a+cols+1
            faces.extend([a,b,a+1,a+1,b,b+1])
    parts.append((target, positions, normals, faces))

# Explicitly schematic supplements: upstream has no separate coccyx or pubic disk.
for i in range(4):
    ellipsoid('coccyx', (0,-77-i*2,791-i*7), (6-i,5-i*.7,5))
ellipsoid('symphyse', (0,-128,802), (4,9,16))

all_positions = [v for _, p, _, _ in parts for v in p]
minimum = [min(v[i] for v in all_positions) for i in range(3)]
maximum = [max(v[i] for v in all_positions) for i in range(3)]
scale = 8.3/(maximum[2]-minimum[2])
center_x = (maximum[0]+minimum[0])/2
center_y = (maximum[1]+minimum[1])/2

def transform(v): return ((v[0]-center_x)*scale, (v[2]-minimum[2])*scale+.15, -(v[1]-center_y)*scale)

out = {'asset':{'version':'2.0','generator':'Oscar educational BodyParts3D adapter'}, 'scene':0, 'scenes':[{'nodes':[]}], 'nodes':[], 'meshes':[], 'accessors':[], 'bufferViews':[], 'buffers':[]}
chunks = []; offset = 0; anchors = collections.defaultdict(list); counts = collections.Counter()

def pack(values, fmt, type_name, minimum=None, maximum=None):
    global offset
    flat = [x for row in values for x in row] if type_name == 'VEC3' else values
    chunk = struct.pack('<'+fmt*len(flat), *flat)
    view = len(out['bufferViews']); out['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(chunk)})
    padding = b'\0' * (-len(chunk)%4); chunks.append(chunk+padding); offset += len(chunk)+len(padding)
    acc = {'bufferView':view,'componentType':5126 if fmt == 'f' else 5125,'count':len(values),'type':type_name}
    if minimum is not None: acc.update(min=minimum, max=maximum)
    index = len(out['accessors']); out['accessors'].append(acc); return index

for target, p, n, indices in parts:
    # Remove vertices unused after hip segmentation.
    used = sorted(set(indices)); remap = {old:new for new, old in enumerate(used)}
    p = [transform(p[i]) for i in used]; n = [(n[i][0],n[i][2],-n[i][1]) for i in used]
    indices = [remap[i] for i in indices]
    lo = [min(v[i] for v in p) for i in range(3)]; hi = [max(v[i] for v in p) for i in range(3)]
    pos = pack(p,'f','VEC3',lo,hi); normal = pack(n,'f','VEC3'); idx = pack(indices,'I','SCALAR')
    counts[target] += 1; name = target + '_' + str(counts[target]).zfill(3)
    mesh = len(out['meshes']); out['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':pos,'NORMAL':normal},'indices':idx}]})
    out['scenes'][0]['nodes'].append(len(out['nodes'])); out['nodes'].append({'name':name,'mesh':mesh})
    anchors[target].extend(v for v in p if v[0] >= -.025)

out['buffers'] = [{'byteLength':offset}]
js = json.dumps(out,separators=(',',':')).encode(); js += b' '*(-len(js)%4)
bin_chunk = b''.join(chunks)
glb = struct.pack('<III',0x46546c67,2,28+len(js)+len(bin_chunk))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(bin_chunk),0x004e4942)+bin_chunk
(root/'public/models/oscar-skeleton.glb').write_bytes(glb)
resolved = {}
for target, p in anchors.items():
    if not p: continue
    resolved[target] = [round((min(v[i] for v in p)+max(v[i] for v in p))/2,4) for i in range(3)]
resolved['coxal'] = resolved['ilium']
(root/'data/anatomy/model-anchors.json').write_text(json.dumps(resolved,indent=2)+'\n')
(root/'public/models/model-manifest.json').write_text(json.dumps({'sourceCommit':'7d04bf3c4de2bd9cb234dd51d7e6857c099afafd','meshes':len(parts),'triangles':sum(len(p[3])//3 for p in parts),'structures':dict(counts),'schematic':['coccyx','symphyse'],'approximatePickingRegions':['ilium','ischion','pubis'],'omittedOutsideCurriculum':ignored,'sourceSha256':hashlib.sha256(raw).hexdigest(),'sacrumSha256':hashlib.sha256(stl).hexdigest(),'outputSha256':hashlib.sha256(glb).hexdigest()},indent=2)+'\n')
print('Wrote',len(glb),'bytes;',len(parts),'meshes;',len(counts),'educational targets')
