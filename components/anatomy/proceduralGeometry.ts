import * as THREE from "three";
import type { Vec3 } from "@/data/anatomy/skeleton";
export type ModelPart = {
  id: string;
  geometry: THREE.BufferGeometry;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3;
  shade?: "cavity" | "tooth";
};
// Every part carries an educational ID, exactly like the GLTF adapter. The
// procedural geometry is a replaceable, deliberately simplified fallback.
export function createProceduralSkeleton(): ModelPart[] {
  const parts: ModelPart[] = [];
  const sphere = new THREE.SphereGeometry(1, 24, 20),
    box = new THREE.BoxGeometry(1, 1, 1);
  function ell(id: string, p: Vec3, s: Vec3, shade?: ModelPart["shade"]) {
    parts.push({ id, geometry: sphere, position: p, scale: s, shade });
  }
  function cube(
    id: string,
    p: Vec3,
    s: Vec3,
    r: Vec3 = [0, 0, 0],
    shade?: ModelPart["shade"],
  ) {
    parts.push({
      id,
      geometry: box,
      position: p,
      scale: s,
      rotation: r,
      shade,
    });
  }
  function tube(id: string, points: Vec3[], radius: number) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    parts.push({
      id,
      geometry: new THREE.TubeGeometry(
        curve,
        Math.max(18, points.length * 6),
        radius,
        8,
        false,
      ),
    });
  }
  function rod(id: string, a: Vec3, b: Vec3, r: number, end = 1.5) {
    const start = new THREE.Vector3(...a),
      endP = new THREE.Vector3(...b),
      length = start.distanceTo(endP);
    const profile = [
      [0, 0.0],
      [0.018, 0.88],
      [0.05, 1.05],
      [0.1, 0.81],
      [0.19, 0.61],
      [0.32, 0.48],
      [0.55, 0.45],
      [0.76, 0.53],
      [0.89, 0.73],
      [0.95, 1.04],
      [0.984, 0.98],
      [1, 0],
    ];
    const geom = new THREE.LatheGeometry(
      profile.map(([t, k]) => new THREE.Vector2(r * k, (t - 0.5) * length)),
      18,
    );
    geom.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        endP.clone().sub(start).normalize(),
      ),
    );
    geom.translate(...start.add(endP).multiplyScalar(0.5).toArray());
    parts.push({ id, geometry: geom });
    ell(id, a, [r * end, r * 1.2, r * 1.15]);
    ell(id, b, [r * end, r * 1.05, r * 1.1]);
  }
  // Cranial vault and face; cavities remain attached to their parent structure.
  ell("crane", [0, 8.03, -0.035], [0.37, 0.47, 0.34]);
  ell("crane", [0, 7.82, -0.1], [0.32, 0.27, 0.28]);
  ell("face", [0, 7.8, 0.2], [0.28, 0.25, 0.16]);
  for (const side of [-1, 1]) {
    ell("face", [side * 0.153, 7.94, 0.339], [0.115, 0.108, 0.025], "cavity");
    const ring = new THREE.TorusGeometry(0.109, 0.028, 8, 28);
    parts.push({
      id: "face",
      geometry: ring,
      position: [side * 0.15, 7.94, 0.34],
      scale: [1, 1.04, 0.7],
    });
    ell("face", [side * 0.258, 7.82, 0.22], [0.08, 0.074, 0.105]);
    tube(
      "face",
      [
        [side * 0.28, 7.87, 0.21],
        [side * 0.29, 7.67, 0.12],
        [side * 0.18, 7.57, 0.28],
        [0, 7.55, 0.32],
      ],
      0.045,
    );
    for (let i = 0; i < 5; i++) {
      const x = side * (0.025 + i * 0.039);
      const z = 0.377 - Math.abs(x) * 0.19;
      cube(
        "face",
        [x, 7.675, z],
        [0.034, 0.052, 0.042],
        [0, side * i * 0.07, 0],
        "tooth",
      );
      cube(
        "face",
        [x, 7.622, z],
        [0.033, 0.043, 0.04],
        [0, side * i * 0.07, 0],
        "tooth",
      );
    }
  }
  ell("face", [0, 7.79, 0.357], [0.043, 0.081, 0.022], "cavity");
  tube(
    "crane",
    [
      [-0.32, 8.17, 0.13],
      [-0.2, 8.25, 0.26],
      [-0.08, 8.27, 0.3],
      [0.04, 8.28, 0.3],
      [0.19, 8.25, 0.25],
      [0.3, 8.18, 0.15],
    ],
    0.004,
  );
  // Vertebral bodies, arches and spinous processes.
  function vertebra(id: string, y: number, r: number, z: number) {
    ell(id, [0, y, z], [r, 0.061, r * 0.88]);
    ell(id, [0, y, z - 0.12], [r * 0.74, 0.049, 0.1]);
    cube(id, [0, y - 0.012, z - 0.22], [0.052, 0.052, 0.18], [0.1, 0, 0]);
    for (const s of [-1, 1])
      ell(id, [s * r * 0.99, y, z - 0.08], [0.087, 0.035, 0.042]);
  }
  vertebra("axis", 7.39, 0.106, 0);
  ell("axis", [0, 7.47, 0], [0.035, 0.08, 0.036]);
  for (let i = 0; i < 6; i++)
    vertebra("cervicales", 7.5 - i * 0.095, 0.1, i * 0.005);
  for (let i = 0; i < 12; i++)
    vertebra(
      "thoraciques",
      6.91 - i * 0.112,
      0.115 + i * 0.001,
      -0.04 - Math.sin((i / 11) * Math.PI) * 0.1,
    );
  for (let i = 0; i < 5; i++)
    vertebra("lombaires", 5.53 - i * 0.15, 0.16, -0.06 + i * 0.022);
  const sacrumShape = new THREE.Shape();
  sacrumShape.moveTo(-0.24, 0.3);
  sacrumShape.quadraticCurveTo(0, 0.38, 0.24, 0.3);
  sacrumShape.lineTo(0.17, -0.05);
  sacrumShape.lineTo(0, -0.35);
  sacrumShape.lineTo(-0.17, -0.05);
  sacrumShape.closePath();
  parts.push({
    id: "sacrum",
    geometry: new THREE.ExtrudeGeometry(sacrumShape, {
      depth: 0.13,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.055,
      bevelThickness: 0.035,
    }),
    position: [0, 4.62, -0.18],
    rotation: [-0.12, 0, 0],
  });
  for (let i = 0; i < 4; i++)
    ell(
      "coccyx",
      [0, 4.26 - i * 0.065, -0.02 + i * 0.018],
      [0.064 - i * 0.01, 0.045, 0.05],
    );
  // Twelve paired ribs: curved back-to-front arcs with graduated length.
  for (let i = 0; i < 12; i++) {
    const width = 0.42 + Math.sin((Math.min(i, 9) / 11) * Math.PI) * 0.57;
    const y = 6.9 - i * 0.125;
    for (const s of [-1, 1]) {
      const points: Vec3[] = [
        [s * 0.1, y, -0.2],
        [s * width * 0.62, y + 0.04, -0.4],
        [s * width, y - 0.08, -0.18],
        [s * width * 0.92, y - 0.23, 0.2],
        [s * width * 0.56, y - 0.25, 0.43],
        [s * (i > 9 ? 0.32 : 0.09), y - 0.15, 0.45],
      ];
      tube(
        "cotes",
        i > 9 ? points.slice(0, 5) : points,
        0.028 + (i < 3 ? 0.004 : 0),
      );
    }
  }
  cube("sternum", [0, 6.7, 0.455], [0.16, 0.24, 0.07], [0, 0, 0]);
  cube("sternum", [0, 6.32, 0.46], [0.112, 0.55, 0.06], [0, 0, 0]);
  ell("sternum", [0, 6.0, 0.45], [0.046, 0.1, 0.033]);
  // Clavicles and scapulae.
  for (const s of [-1, 1]) {
    tube(
      "clavicule",
      [
        [s * 0.08, 6.99, 0.39],
        [s * 0.33, 7.04, 0.38],
        [s * 0.61, 7.01, 0.26],
        [s * 0.87, 7.07, 0.2],
        [s * 1.03, 7.05, 0.08],
      ],
      0.049,
    );
    const scap = new THREE.Shape();
    scap.moveTo(-0.24, 0.31);
    scap.quadraticCurveTo(0.08, 0.37, 0.27, 0.22);
    scap.lineTo(0.06, -0.43);
    scap.quadraticCurveTo(-0.14, -0.13, -0.24, 0.31);
    parts.push({
      id: "scapula",
      geometry: new THREE.ExtrudeGeometry(scap, {
        depth: 0.045,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.025,
        bevelSegments: 2,
      }),
      position: [s * 0.75, 6.65, -0.37],
      rotation: [0, s * 0.25, s * 0.23],
      scale: [s, 1, 1],
    });
    tube(
      "scapula",
      [
        [s * 0.57, 6.87, -0.42],
        [s * 0.82, 6.97, -0.4],
        [s * 1.08, 7.02, -0.17],
      ],
      0.045,
    );
    rod("humerus", [s * 1.08, 6.9, 0.02], [s * 1.38, 5.57, 0.01], 0.105, 1.35);
    ell("humerus", [s * 1.065, 6.91, 0.025], [0.15, 0.16, 0.14]);
    rod("radius", [s * 1.47, 5.51, 0.06], [s * 1.77, 4.49, 0.09], 0.066, 1.1);
    rod("ulna", [s * 1.32, 5.55, -0.01], [s * 1.61, 4.47, 0.015], 0.069, 1.2);
    ell("ulna", [s * 1.34, 5.57, -0.02], [0.07, 0.13, 0.08]);
    for (let i = 0; i < 8; i++)
      ell(
        "carpe",
        [
          s * (1.65 + (i % 4) * 0.052),
          4.4 - Math.floor(i / 4) * 0.075,
          0.05 + (i % 2) * 0.02,
        ],
        [0.036, 0.04, 0.04],
      );
    for (let i = 0; i < 5; i++) {
      const x = 1.61 + i * 0.067,
        y = 4.31 - (i === 0 ? 0.07 : 0),
        endX = x + (i - 2) * 0.018;
      rod(
        "metacarpe",
        [s * x, y, 0.05],
        [s * endX, 4.02 + (i === 0 ? 0.06 : 0), 0.07],
        0.028,
        1.15,
      );
      const segs = i === 0 ? 2 : 3;
      const fingerLength = [0.23, 0.38, 0.43, 0.39, 0.3][i];
      let start: Vec3 = [s * endX, 4.0 + (i === 0 ? 0.06 : 0), 0.07];
      for (let j = 0; j < segs; j++) {
        const end: Vec3 = [
          start[0] + s * (i - 2) * 0.017,
          start[1] - fingerLength / segs,
          0.08,
        ];
        rod("phalanges-main", start, end, 0.022 - j * 0.003, 1.18);
        start = [end[0], end[1] - 0.017, end[2]];
      }
    }
    // Iliac wings; the obturator foramen is bounded by ischium and pubis.
    const wing = new THREE.Shape();
    wing.moveTo(0.12, 0.3);
    wing.bezierCurveTo(0.32, 0.56, 0.77, 0.57, 0.79, 0.32);
    wing.bezierCurveTo(0.75, 0.05, 0.57, -0.02, 0.5, -0.25);
    wing.lineTo(0.29, -0.22);
    wing.quadraticCurveTo(0.19, 0.01, 0.12, 0.3);
    parts.push({
      id: "ilium",
      geometry: new THREE.ExtrudeGeometry(wing, {
        depth: 0.09,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelThickness: 0.06,
        bevelSize: 0.04,
      }),
      position: [0, 4.5, -0.08],
      scale: [s, 1, 1],
      rotation: [0, -s * 0.19, 0],
    });
    tube(
      "ischion",
      [
        [s * 0.53, 4.43, 0],
        [s * 0.59, 4.19, -0.06],
        [s * 0.4, 4.02, 0.0],
        [s * 0.22, 4.08, 0.16],
      ],
      0.075,
    );
    tube(
      "pubis",
      [
        [s * 0.52, 4.4, 0.02],
        [s * 0.3, 4.37, 0.24],
        [s * 0.055, 4.24, 0.33],
        [s * 0.16, 4.1, 0.25],
        [s * 0.28, 4.1, 0.19],
      ],
      0.059,
    );
    ell("ilium", [s * 0.53, 4.4, 0.005], [0.15, 0.15, 0.13]);
    // Femoral head, neck, shaft and paired distal condyles.
    rod("femur", [s * 0.62, 4.2, 0], [s * 0.43, 2.46, 0.02], 0.12, 1.38);
    rod("femur", [s * 0.61, 4.15, 0], [s * 0.39, 4.35, 0.02], 0.08, 1.05);
    ell("femur", [s * 0.37, 4.36, 0.025], [0.13, 0.13, 0.13]);
    for (const d of [-1, 1])
      ell("femur", [s * 0.43 + d * 0.085, 2.46, 0.015], [0.105, 0.13, 0.115]);
    ell("patella", [s * 0.43, 2.43, 0.2], [0.108, 0.13, 0.06]);
    rod("tibia", [s * 0.43, 2.3, 0.01], [s * 0.43, 0.72, 0.035], 0.112, 1.18);
    ell("tibia", [s * 0.43, 2.28, 0.015], [0.155, 0.08, 0.12]);
    rod(
      "fibula",
      [s * 0.64, 2.25, -0.035],
      [s * 0.64, 0.68, 0.02],
      0.047,
      1.42,
    );
    ell("tarse", [s * 0.45, 0.53, -0.025], [0.15, 0.15, 0.2]);
    ell("tarse", [s * 0.45, 0.63, 0.12], [0.13, 0.13, 0.13]);
    for (let i = 0; i < 5; i++)
      ell("tarse", [s * (0.3 + i * 0.07), 0.43, 0.23], [0.047, 0.07, 0.08]);
    for (let i = 0; i < 5; i++) {
      const x = 0.29 + i * 0.078;
      rod(
        "metatarse",
        [s * x, 0.41, 0.28],
        [s * (x + (i - 2) * 0.008), 0.3, 0.63 - i * 0.012],
        0.031,
        1.25,
      );
      const segs = i === 0 ? 2 : 3;
      let start: Vec3 = [s * x, 0.28, 0.67 - i * 0.012];
      for (let j = 0; j < segs; j++) {
        const end: Vec3 = [
          start[0],
          0.26 - j * 0.008,
          start[2] + (i === 0 ? 0.095 : 0.07),
        ];
        rod("phalanges-pied", start, end, 0.025 - j * 0.004, 1.2);
        start = [end[0], end[1], end[2] + 0.016];
      }
    }
  }
  cube("symphyse", [0, 4.22, 0.33], [0.065, 0.17, 0.072]);
  return parts;
}
