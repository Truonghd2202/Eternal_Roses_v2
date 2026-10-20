import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const fract = (n) => n - Math.floor(n);
const rnd = (n) => fract(Math.sin(n * 127.1 + 78.233) * 43758.5453123);
function createCurvedPetalGeometry(variant) {
  const nx = 10;
  const ny = 14;
  const positions = [];
  const indices = [];
  const uvs = [];

  for (let iy = 0; iy <= ny; iy += 1) {
    const t = iy / ny;
    const base = Math.pow(Math.sin(Math.min(1, t) * Math.PI / 2), 0.72);
    const roundedCrown = 0.88 + 0.12 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.82) / 0.3, 2)));
    const width = base * roundedCrown * (variant === 'sister' ? 0.86 : 1);
    for (let ix = 0; ix <= nx; ix += 1) {
      const u = ix / nx * 2 - 1;
      const x = u * width * 0.82;
      const edge = Math.pow(Math.abs(u), 2.2);
      const y = t - edge * 0.16 * Math.pow(t, 4.5);
      const z =
        0.16 * (1 - u * u) * Math.sin(t * Math.PI) +
        0.27 * u * u * t * t -
        0.14 * t * t * t +
        0.018 * Math.sin(u * 3.4) * t * t;
      positions.push(x, y, z);
      uvs.push(ix / nx, t);
    }
  }

  for (let y = 0; y < ny; y += 1) {
    for (let x = 0; x < nx; x += 1) {
      const k = y * (nx + 1) + x;
      indices.push(k, k + 1, k + nx + 1, k + 1, k + nx + 2, k + nx + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function mergeGeometry(source, transforms, colors) {
  const srcPos = source.attributes.position;
  const srcNormal = source.attributes.normal;
  const srcIndex = source.index;
  const positions = [];
  const normals = [];
  const colorArray = [];
  const indices = [];
  const vec = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const localColor = new THREE.Color();

  transforms.forEach((matrix, idx) => {
    const base = positions.length / 3;
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    localColor.copy(colors[idx]);

    for (let i = 0; i < srcPos.count; i += 1) {
      vec.fromBufferAttribute(srcPos, i).applyMatrix4(matrix);
      nrm.fromBufferAttribute(srcNormal, i).applyMatrix3(normalMatrix).normalize();
      positions.push(vec.x, vec.y, vec.z);
      normals.push(nrm.x, nrm.y, nrm.z);
      const shade = 0.78 + 0.22 * srcPos.getY(i);
      colorArray.push(localColor.r * shade, localColor.g * shade, localColor.b * shade);
    }

    for (let i = 0; i < srcIndex.count; i += 1) {
      indices.push(base + srcIndex.getX(i));
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

function createRoseGeometry(variant, palette) {
  const petal = createCurvedPetalGeometry(variant);
  const transforms = [];
  const colors = [];

  const layers = variant === 'mother'
    ? [
      { count: 3, radius: 0.012, scale: 0.15, tilt: -1.34, height: 0.2 },
      { count: 5, radius: 0.045, scale: 0.18, tilt: -1.2, height: 0.16 },
      { count: 7, radius: 0.09, scale: 0.23, tilt: -1.04, height: 0.1 },
      { count: 10, radius: 0.16, scale: 0.29, tilt: -0.84, height: 0.035 },
      { count: 13, radius: 0.24, scale: 0.32, tilt: -0.64, height: -0.04 },
    ]
    : [
      { count: 3, radius: 0.012, scale: 0.14, tilt: -1.3, height: 0.18 },
      { count: 5, radius: 0.045, scale: 0.17, tilt: -1.15, height: 0.14 },
      { count: 7, radius: 0.09, scale: 0.22, tilt: -0.98, height: 0.08 },
      { count: 10, radius: 0.17, scale: 0.3, tilt: -0.74, height: -0.01 },
    ];

  layers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i += 1) {
      const angle = (i / layer.count) * Math.PI * 2 + layerIndex * 0.3;
      const matrix = new THREE.Matrix4();
      const scale = layer.scale * (0.9 + rnd(i + layerIndex * 13.7) * 0.18);
      const position = new THREE.Vector3(
        Math.cos(angle) * layer.radius,
        layer.height + (rnd(i + 91 + layerIndex * 11) - 0.5) * 0.018,
        Math.sin(angle) * layer.radius,
      );

      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          layer.tilt + (rnd(i + 7.1 + layerIndex * 2.2) - 0.5) * 0.12,
          (rnd(i + 14.7 + layerIndex * 8) - 0.5) * 0.26,
          angle - Math.PI / 2 + (rnd(i + 22.3 + layerIndex * 4) - 0.5) * 0.14,
          'ZYX',
        ),
      );

      matrix.compose(position, quaternion, new THREE.Vector3(scale * 1.34, scale * 0.78, scale * 0.96));
      transforms.push(matrix);
      colors.push(new THREE.Color(palette[(i + layerIndex * 2) % palette.length]));
    }
  });

  const budTransforms = [];
  const budColors = [];
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    const m = new THREE.Matrix4();
    const position = new THREE.Vector3(Math.cos(angle) * 0.025, 0.14, Math.sin(angle) * 0.025);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.03, 0.08 * Math.sin(angle), angle, 'ZYX'));
    m.compose(position, q, new THREE.Vector3(0.1, 0.1, 0.1));
    budTransforms.push(m);
    budColors.push(new THREE.Color(palette[2]));
  }

  const merged = mergeGeometry(petal, [...transforms, ...budTransforms], [...colors, ...budColors]);
  petal.dispose();
  return merged;
}

function createRibbonStripGeometry(length = 1.2, width = 0.1, segments = 24, phase = 0) {
  const geometry = new THREE.PlaneGeometry(width, length, 1, segments);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const t = (y + length / 2) / length;
    pos.setZ(i, Math.sin(t * Math.PI * 2 + phase) * 0.06);
    pos.setX(i, pos.getX(i) + Math.sin(t * Math.PI * 1.2 + phase * 0.5) * 0.03);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function createRosePositions(variant) {
  const positions = [];
  let id = 0;
  // A bouquet needs distinct, readable blooms, rather than a carpet of petals.
  const rings = variant === 'mother' ? 9 : 7;

  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings;
    const phi = t * Math.PI * 0.56;
    const radius = Math.sin(phi);
    const count = ring === 0 ? 1 : Math.round(6 + ring * 3);

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.33 + (rnd(id + 30) - 0.5) * 0.08;
      const x = Math.cos(angle) * radius * 2.2 * (0.98 + (rnd(id + 13) - 0.5) * 0.08);
      const z = Math.sin(angle) * radius * 1.75 * (0.96 + (rnd(id + 15) - 0.5) * 0.12);
      const y = 1.18 + Math.cos(phi) * 0.95 + (rnd(id + 17) - 0.5) * 0.08;
      const normal = new THREE.Vector3(x * 0.58, 0.64 + Math.cos(phi) * 0.72, z * 0.52).normalize();
      positions.push({
        position: [x, y, z],
        normal,
        scale: 0.8 + rnd(id + 21) * 0.22,
        yaw: rnd(id + 27) * Math.PI * 2,
      });
      id += 1;
    }
  }

  return positions.filter((item) => item.position[1] > 0.58 || Math.abs(item.position[2]) < 1.36);
}

function RoseInstances({ variant, palette }) {
  const geometry = useMemo(() => createRoseGeometry(variant, palette), [variant, palette]);
  const rosePositions = useMemo(() => createRosePositions(variant), [variant]);
  const ref = useRef();

  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const obj = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    rosePositions.forEach((rose, i) => {
      obj.position.set(...rose.position);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, rose.normal);
      obj.quaternion.copy(quat).multiply(new THREE.Quaternion().setFromAxisAngle(rose.normal, rose.yaw));
      obj.scale.setScalar(rose.scale);
      obj.updateMatrix();
      ref.current.setMatrixAt(i, obj.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [rosePositions]);

  return (
    <group position={[0, -0.28, 0]}>
      <group position={[0, 1.2, 0]} scale={[1, 1.32, 1]}>
        <instancedMesh ref={ref} position={[0, -1.2, 0]} args={[geometry, undefined, rosePositions.length]} frustumCulled={false}>
          <meshStandardMaterial vertexColors roughness={0.76} metalness={0.05} side={THREE.DoubleSide} />
        </instancedMesh>
      </group>
    </group>
  );
}

function createBabyBreathSprays(variant) {
  const stems = [];
  const florets = [];
  const leaves = [];
  const count = variant === 'mother' ? 22 : 14;
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < count; i += 1) {
    const angle = i * 2.399963 + (rnd(i + 4) - 0.5) * 0.4;
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const radius = (variant === 'mother' ? 1.62 : 1.92) + rnd(i + 8) * 0.22;
    const x = radial.x * radius;
    const z = radial.z * radius * 0.78;
    const base = new THREE.Vector3(x, 1.22 + rnd(i + 12) * 0.12, z);
    const tip = new THREE.Vector3(x + radial.x * 0.025, 1.52 + rnd(i + 14) * 0.3, z + radial.z * 0.02);
    stems.push({ start: base, end: tip, radius: 0.0024 });

    for (let leaf = 0; leaf < 2; leaf += 1) {
      const t = 0.24 + leaf * 0.22;
      const side = leaf === 0 ? 1 : -1;
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
      const leafDirection = radial.clone().multiplyScalar(0.34 * side)
        .add(tangent.multiplyScalar(0.24 * side))
        .add(up.clone().multiplyScalar(0.88))
        .normalize();
      const position = base.clone().lerp(tip, t).addScaledVector(radial, 0.018);
      leaves.push({ position, direction: leafDirection, size: 0.78 + rnd(i * 17 + leaf) * 0.38, color: leaf === 0 ? '#6d8066' : '#7d896b' });
    }

    const branchCount = 3 + (i % 2);
    for (let branch = 0; branch < branchCount; branch += 1) {
      const t = 0.58 + branch * 0.16;
      const branchStart = base.clone().lerp(tip, t);
      const spread = (branch - (branchCount - 1) / 2) * 0.3 + (rnd(i * 5 + branch) - 0.5) * 0.1;
      const branchDirection = new THREE.Vector3(
        radial.x * Math.cos(spread) - radial.z * Math.sin(spread),
        0.82 + rnd(i * 7 + branch) * 0.18,
        radial.z * Math.cos(spread) + radial.x * Math.sin(spread),
      ).normalize();
      const head = branchStart.clone().addScaledVector(branchDirection, 0.045 + rnd(i * 9 + branch) * 0.025);
      stems.push({ start: branchStart, end: head, radius: 0.0018 });
      const normal = radial.clone().multiplyScalar(0.42).add(up.clone().multiplyScalar(0.91)).normalize();
      florets.push({ position: head, normal, size: 0.68 + rnd(i * 11 + branch) * 0.3, phase: rnd(i * 13 + branch) * Math.PI * 2 });
    }
  }

  return { stems, florets, leaves };
}

function BabyBreath({ variant }) {
  const data = useMemo(() => createBabyBreathSprays(variant), [variant]);
  const stemRef = useRef();
  const leafRef = useRef();
  const petalRef = useRef();
  const centerRef = useRef();
  const stemGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 5), []);
  const leafGeometry = useMemo(() => {
    const vertices = [];
    const indices = [];
    const segments = 6;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const width = Math.sin(t * Math.PI) * 0.065;
      const curve = Math.sin(t * Math.PI) * 0.018;
      vertices.push(-width, t, curve, width, t, curve);
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  const petalGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  const centerGeometry = useMemo(() => new THREE.SphereGeometry(1, 7, 5), []);

  useLayoutEffect(() => {
    const stemMesh = stemRef.current;
    const leafMesh = leafRef.current;
    const petalMesh = petalRef.current;
    const centerMesh = centerRef.current;
    if (!stemMesh || !leafMesh || !petalMesh || !centerMesh) return undefined;

    const dummy = new THREE.Object3D();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3();
    const petalOffset = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const petalRotation = new THREE.Quaternion();
    const floretRotation = new THREE.Quaternion();
    const palePetal = new THREE.Color('#fff8f1');
    const blushPetal = new THREE.Color('#f4e3e1');
    const leafGreen = new THREE.Color();

    data.stems.forEach((stem, index) => {
      direction.subVectors(stem.end, stem.start);
      dummy.position.copy(stem.start).add(stem.end).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(yAxis, direction.clone().normalize());
      dummy.scale.set(stem.radius, direction.length(), stem.radius);
      dummy.updateMatrix();
      stemMesh.setMatrixAt(index, dummy.matrix);
    });

    data.leaves.forEach((leaf, index) => {
      direction.copy(leaf.direction);
      dummy.position.copy(leaf.position);
      dummy.quaternion.setFromUnitVectors(yAxis, direction);
      dummy.scale.set(0.58 * leaf.size, 0.2 * leaf.size, 0.008);
      dummy.updateMatrix();
      leafMesh.setMatrixAt(index, dummy.matrix);
      leafMesh.setColorAt(index, leafGreen.set(leaf.color));
    });

    data.florets.forEach((floret, index) => {
      normal.copy(floret.normal);
      petalRotation.setFromUnitVectors(yAxis, normal);
      const petalCount = 5;
      for (let petal = 0; petal < petalCount; petal += 1) {
        const angle = (petal / petalCount) * Math.PI * 2 + floret.phase;
        petalOffset.set(Math.cos(angle) * 0.014, 0, Math.sin(angle) * 0.014).applyQuaternion(petalRotation);
        dummy.position.copy(floret.position).add(petalOffset);
        floretRotation.setFromAxisAngle(yAxis, angle);
        dummy.quaternion.copy(petalRotation).multiply(floretRotation);
        dummy.scale.set(0.019 * floret.size, 0.006 * floret.size, 0.011 * floret.size);
        dummy.updateMatrix();
        const petalIndex = index * petalCount + petal;
        petalMesh.setMatrixAt(petalIndex, dummy.matrix);
        petalMesh.setColorAt(petalIndex, petal % 3 === 0 ? blushPetal : palePetal);
      }

      dummy.position.copy(floret.position);
      dummy.quaternion.copy(petalRotation);
      dummy.scale.setScalar(0.0065 * floret.size);
      dummy.updateMatrix();
      centerMesh.setMatrixAt(index, dummy.matrix);
    });

    stemMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    petalMesh.instanceMatrix.needsUpdate = true;
    centerMesh.instanceMatrix.needsUpdate = true;
    if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true;
    return undefined;
  }, [data]);

  return (
    <group>
      <instancedMesh ref={stemRef} args={[stemGeometry, undefined, data.stems.length]}>
        <meshStandardMaterial color="#667c63" roughness={0.94} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[leafGeometry, undefined, data.leaves.length]}>
        <meshStandardMaterial color="#ffffff" roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={petalRef} args={[petalGeometry, undefined, data.florets.length * 5]}>
        <meshStandardMaterial color="#fff8f1" roughness={0.82} />
      </instancedMesh>
      <instancedMesh ref={centerRef} args={[centerGeometry, undefined, data.florets.length]}>
        <meshStandardMaterial color="#e8d5b1" roughness={0.75} />
      </instancedMesh>
    </group>
  );
}

function createFloralAccents(variant, palette) {
  const flowers = [];
  const leaves = [];
  const leafStems = [];
  const flowerCount = variant === 'mother' ? 30 : 18;
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < flowerCount; i += 1) {
    const angle = i * 2.399963 + (rnd(i + 41) - 0.5) * 0.16;
    const phi = 0.42 + rnd(i + 47) * 1.45;
    const radius = Math.sin(phi);
    const x = Math.cos(angle) * radius * 2.2;
    const z = Math.sin(angle) * radius * 1.75;
    const y = 1.18 + Math.cos(phi) * 0.95;
    const normal = new THREE.Vector3(x * 0.58, 0.64 + Math.cos(phi) * 0.72, z * 0.52).normalize();
    const position = new THREE.Vector3(x, y, z).addScaledVector(normal, 0.4);
    flowers.push({
      position,
      normal,
      size: (variant === 'mother' ? 1.3 : 1.08) + rnd(i + 51) * 0.3,
      phase: rnd(i + 55) * Math.PI * 2,
      color: palette.accent[i % palette.accent.length],
    });
  }

  for (let i = 0; i < 28; i += 1) {
    const angle = i * 2.399963 + 1.1;
    const phi = 0.82 + rnd(i + 73) * 0.86;
    const radius = Math.sin(phi);
    const x = Math.cos(angle) * radius * 2.2;
    const z = Math.sin(angle) * radius * 1.75;
    const y = 1.18 + Math.cos(phi) * 0.95;
    const normal = new THREE.Vector3(x * 0.58, 0.64 + Math.cos(phi) * 0.72, z * 0.52).normalize();
    const tangent = new THREE.Vector3(-Math.sin(angle), 0.08, Math.cos(angle)).normalize();
    const base = new THREE.Vector3(x, y, z).addScaledVector(normal, 0.09);
    const branchDirection = tangent.clone().addScaledVector(normal, 0.24).normalize();
    const tip = base.clone().addScaledVector(branchDirection, 0.2 + rnd(i + 79) * 0.06);
    leafStems.push({ start: base, end: tip });

    for (let leafIndex = 0; leafIndex < 4; leafIndex += 1) {
      const t = 0.12 + leafIndex * 0.22;
      const side = leafIndex % 2 === 0 ? 1 : -1;
      const leafDirection = tangent.clone().multiplyScalar(side * 0.78)
        .addScaledVector(normal, 0.48)
        .addScaledVector(up, 0.12)
        .normalize();
      leaves.push({
        position: base.clone().lerp(tip, t),
        direction: leafDirection,
        size: 0.76 + rnd(i * 7 + leafIndex + 81) * 0.38,
        color: ['#87957d', '#99a187', '#74866f'][leafIndex % 3],
      });
    }
  }

  return { flowers, leaves, leafStems };
}

function FloralAccents({ variant, palette }) {
  const data = useMemo(() => createFloralAccents(variant, palette), [variant, palette]);
  const flowerRef = useRef();
  const centerRef = useRef();
  const leafRef = useRef();
  const leafStemRef = useRef();
  const petalGeometry = useMemo(() => new THREE.SphereGeometry(1, 9, 7), []);
  const centerGeometry = useMemo(() => new THREE.SphereGeometry(1, 7, 5), []);
  const leafGeometry = useMemo(() => {
    const positions = [];
    const colors = [];
    const indices = [];
    const along = 8;
    const across = 4;
    const outerColor = new THREE.Color('#82927b');
    const veinColor = new THREE.Color('#bac0a3');
    for (let row = 0; row <= along; row += 1) {
      const t = row / along;
      const width = Math.pow(Math.sin(t * Math.PI), 0.82) * 0.48;
      for (let col = 0; col <= across; col += 1) {
        const u = (col / across) * 2 - 1;
        const ridge = Math.sin(t * Math.PI) * (0.018 + (1 - Math.abs(u)) * 0.018);
        positions.push(u * width, t, ridge);
        colors.push(...(col === 2 ? veinColor : outerColor).toArray());
        if (row < along && col < across) {
          const a = row * (across + 1) + col;
          const b = a + across + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  const leafStemGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 5), []);

  useLayoutEffect(() => {
    const flowerMesh = flowerRef.current;
    const centerMesh = centerRef.current;
    const leafMesh = leafRef.current;
    const leafStemMesh = leafStemRef.current;
    if (!flowerMesh || !centerMesh || !leafMesh || !leafStemMesh) return undefined;

    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const petalOffset = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const flowerRotation = new THREE.Quaternion();
    const leafRotation = new THREE.Quaternion();
    const upAxis = new THREE.Vector3(0, 1, 0);
    const stemDirection = new THREE.Vector3();
    const around = new THREE.Quaternion();
    const color = new THREE.Color();
    const petalCount = 5;

    data.flowers.forEach((flower, index) => {
      normal.copy(flower.normal);
      flowerRotation.setFromUnitVectors(up, normal);
      for (let petal = 0; petal < petalCount; petal += 1) {
        const angle = (petal / petalCount) * Math.PI * 2 + flower.phase;
        petalOffset.set(Math.cos(angle) * 0.062, 0, Math.sin(angle) * 0.062).applyQuaternion(flowerRotation);
        dummy.position.copy(flower.position).add(petalOffset);
        around.setFromAxisAngle(up, angle);
        dummy.quaternion.copy(flowerRotation).multiply(around);
        dummy.scale.set(0.078 * flower.size, 0.024 * flower.size, 0.054 * flower.size);
        dummy.updateMatrix();
        const petalIndex = index * petalCount + petal;
        flowerMesh.setMatrixAt(petalIndex, dummy.matrix);
        flowerMesh.setColorAt(petalIndex, color.set(flower.color));
      }

      dummy.position.copy(flower.position);
      dummy.quaternion.copy(flowerRotation);
      dummy.scale.setScalar(0.009 * flower.size);
      dummy.updateMatrix();
      centerMesh.setMatrixAt(index, dummy.matrix);
    });

    data.leaves.forEach((leaf, index) => {
      dummy.position.copy(leaf.position);
      leafRotation.setFromUnitVectors(up, leaf.direction);
      dummy.quaternion.copy(leafRotation);
      dummy.scale.set(0.09 * leaf.size, 0.22 * leaf.size, 0.032 * leaf.size);
      dummy.updateMatrix();
      leafMesh.setMatrixAt(index, dummy.matrix);
      leafMesh.setColorAt(index, color.set(leaf.color));
    });

    data.leafStems.forEach((stem, index) => {
      stemDirection.subVectors(stem.end, stem.start);
      dummy.position.copy(stem.start).add(stem.end).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(upAxis, stemDirection.clone().normalize());
      dummy.scale.set(0.0035, stemDirection.length(), 0.0035);
      dummy.updateMatrix();
      leafStemMesh.setMatrixAt(index, dummy.matrix);
    });

    flowerMesh.instanceMatrix.needsUpdate = true;
    centerMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    leafStemMesh.instanceMatrix.needsUpdate = true;
    if (flowerMesh.instanceColor) flowerMesh.instanceColor.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    return undefined;
  }, [data]);

  return (
    <group position={[0, -0.28, 0]}>
      <group position={[0, 1.2, 0]} scale={[1, 1.32, 1]}>
        <instancedMesh ref={leafRef} position={[0, -1.2, 0]} args={[leafGeometry, undefined, data.leaves.length]}>
          <meshStandardMaterial color="#ffffff" roughness={0.9} side={THREE.DoubleSide} vertexColors />
        </instancedMesh>
        <instancedMesh ref={leafStemRef} position={[0, -1.2, 0]} args={[leafStemGeometry, undefined, data.leafStems.length]}>
          <meshStandardMaterial color="#67775f" roughness={0.94} />
        </instancedMesh>
        <instancedMesh ref={flowerRef} position={[0, -1.2, 0]} args={[petalGeometry, undefined, data.flowers.length * 5]}>
          <meshStandardMaterial color="#edb8ca" roughness={0.82} />
        </instancedMesh>
        <instancedMesh ref={centerRef} position={[0, -1.2, 0]} args={[centerGeometry, undefined, data.flowers.length]}>
          <meshStandardMaterial color="#ead6a8" roughness={0.78} />
        </instancedMesh>
      </group>
    </group>
  );
}

function PaperLayer({ index, total, inner = false, colors }) {
  const geometry = useMemo(() => {
    const width = inner ? 2.02 : 2.58;
    const height = inner ? 1.72 : 2.08;
    const cornerRadius = inner ? 0.5 : 0.62;
    const geo = new THREE.PlaneGeometry(width, height, 20, 20);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const rawX = pos.getX(i);
      const y = pos.getY(i);
      const absY = Math.abs(y);
      const cornerStart = height / 2 - cornerRadius;
      const cornerDepth = Math.max(0, absY - cornerStart);
      const roundedHalfWidth = width / 2 - cornerRadius + Math.sqrt(
        Math.max(0, cornerRadius * cornerRadius - cornerDepth * cornerDepth),
      );
      const x = (rawX / (width / 2)) * roundedHalfWidth;
      const bend = Math.pow((y + height / 2) / height, 1.35);
      const fold = Math.sin((rawX / width) * Math.PI * 2.2 + index * 0.48) * 0.035;
      const softDrape = Math.sin((y / height + 0.5) * Math.PI) * (0.05 + Math.abs(rawX) * 0.055);
      pos.setZ(i, Math.abs(x) * 0.09 + bend * (inner ? 0.26 : 0.4) + fold + softDrape);
      pos.setX(i, x + Math.sin((y + index * 0.25) * 1.55) * 0.055);
    }
    geo.computeVertexNormals();
    return geo;
  }, [index, inner]);

  const angle = (index / total) * Math.PI * 2;
  const radius = inner ? 1.34 : 1.67;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius * 1.05;
  const y = inner ? -0.52 : -0.48;
  const rotationY = -angle + Math.PI / 2;
  const rotationZ = Math.cos(angle * 2) * 0.065 + (inner ? 0.035 : 0.08);

  return (
    <group position={[x, y, z]} rotation={[0.05, rotationY, rotationZ]}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={colors[index % colors.length]}
          roughness={0.66}
          clearcoat={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function CollarBand({ color }) {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh>
        <cylinderGeometry args={[0.58, 0.72, 0.42, 48, 1, true]} />
        <meshPhysicalMaterial color={color} roughness={0.42} transmission={0.05} thickness={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <torusGeometry args={[0.66, 0.02, 12, 80]} />
        <meshStandardMaterial color="#b68a51" roughness={0.45} />
      </mesh>
    </group>
  );
}

function Paper({ recipient }) {
  const wrapperColors = recipient.palette.wrapper;
  return (
    <group position={[0, 0.18, 0]}>
      <mesh position={[0, 1.02, 0]} scale={[1.97, 0.72, 1.48]}>
        <sphereGeometry args={[1, 40, 22, 0, Math.PI * 2, 0, Math.PI / 2.14]} />
        <meshStandardMaterial color={wrapperColors[0]} roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.03, 0]} scale={[1.72, 0.9, 1.36]}>
        <sphereGeometry args={[1, 40, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color={wrapperColors[0]} roughness={0.78} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <PaperLayer key={`outer-${i}`} index={i} total={8} colors={wrapperColors} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <PaperLayer key={`inner-${i}`} index={i} total={6} inner colors={wrapperColors} />
      ))}
      <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.72, 1.6, 32, 1, true]} />
        <meshPhysicalMaterial color={wrapperColors[1]} roughness={0.72} clearcoat={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.54, 0]}>
        <cylinderGeometry args={[0.26, 0.38, 0.8, 20]} />
        <meshStandardMaterial color={wrapperColors[0]} roughness={0.48} />
      </mesh>
      <CollarBand color={wrapperColors[0]} />
    </group>
  );
}

function Ribbon({ palette }) {
  const colors = palette.ribbon;
  const strips = useMemo(
    () => [
      createRibbonStripGeometry(1.35, 0.11, 32, 0),
      createRibbonStripGeometry(1.1, 0.1, 28, 0.8),
      createRibbonStripGeometry(1.28, 0.095, 28, 1.4),
      createRibbonStripGeometry(1.05, 0.08, 24, 2.1),
    ],
    [],
  );

  return (
    <group position={[0, -0.15, 0.66]}>
      <mesh position={[-0.18, 0.0, 0]} rotation={[0.2, 0.2, 0.8]} scale={[1, 1.05, 1]}>
        <torusGeometry args={[0.21, 0.08, 12, 32, Math.PI * 1.9]} />
        <meshPhysicalMaterial color={colors[0]} roughness={0.32} clearcoat={0.32} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.18, 0.0, 0]} rotation={[0.2, -0.2, -0.8]} scale={[1, 1.05, 1]}>
        <torusGeometry args={[0.21, 0.08, 12, 32, Math.PI * 1.9]} />
        <meshPhysicalMaterial color={colors[1]} roughness={0.3} clearcoat={0.34} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.02, 0.01]}>
        <sphereGeometry args={[0.11, 18, 14]} />
        <meshStandardMaterial color={colors[0]} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.02, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.026, 10, 72]} />
        <meshStandardMaterial color={colors[1]} roughness={0.36} />
      </mesh>
      {strips.map((geo, i) => (
        <mesh
          key={i}
          geometry={geo}
          position={[-0.14 + i * 0.095, -0.56 - i * 0.06, -0.04 + i * 0.02]}
          rotation={[0.08 * i, 0.08 * (i - 1), (i - 1.3) * 0.12 + Math.PI]}
        >
          <meshPhysicalMaterial
            color={colors[i % colors.length]}
            roughness={0.34}
            clearcoat={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Bouquet({ recipient }) {
  const variant = recipient.bouquet;
  return (
    <group position={[0, -0.35, 0]}>
      <Paper recipient={recipient} />
      <RoseInstances variant={variant} palette={recipient.palette.rose} />
      <FloralAccents variant={variant} palette={recipient.palette} />
      <BabyBreath variant={variant} />
      <Ribbon palette={recipient.palette} />
    </group>
  );
}
