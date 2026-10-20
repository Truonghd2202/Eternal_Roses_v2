import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = typeof window !== 'undefined' && window.innerWidth < 700 ? 18 : 34;
const rand = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function createPetalGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.18, 0.08, -0.22, 0.38, -0.08, 0.58);
  shape.quadraticCurveTo(0, 0.67, 0.08, 0.58);
  shape.bezierCurveTo(0.22, 0.38, 0.18, 0.08, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 10);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    pos.setZ(i, Math.sin(y * 5.2) * 0.055 + Math.abs(x) * 0.03);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function FallingPetals({ color = '#d4a5a3' }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    x: (rand(i + 1) - 0.5) * 9,
    y: rand(i + 2) * 8 - 2.5,
    z: rand(i + 3) < 0.45 ? 1.2 + rand(i + 30) * 1.8 : -2.6 + rand(i + 30) * 2.5,
    speed: 0.16 + rand(i + 4) * 0.27,
    drift: 0.16 + rand(i + 5) * 0.3,
    phase: rand(i + 6) * Math.PI * 2,
    spin: (rand(i + 7) - 0.5) * 1.2,
    scale: 0.075 + rand(i + 8) * 0.11,
  })), []);
  const geometry = useMemo(createPetalGeometry, []);

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return;
    const time = clock.elapsedTime;
    const step = Math.min(delta, 0.04);
    data.forEach((petal, index) => {
      petal.y -= petal.speed * step;
      if (petal.y < -4.5) {
        petal.y = 5 + rand(index + Math.floor(time) * 13) * 2.4;
        petal.x = (rand(index + Math.floor(time) + 1) - 0.5) * 9;
      }
      dummy.position.set(petal.x + Math.sin(time * 0.46 + petal.phase) * petal.drift, petal.y, petal.z + Math.sin(time * 0.2 + petal.phase) * 0.12);
      dummy.rotation.set(time * 0.22 + petal.phase, Math.sin(time * 0.3 + petal.phase) * 0.5, Math.sin(time * 0.4 + petal.phase) * 0.35 + petal.spin);
      dummy.scale.setScalar(petal.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, COUNT]} frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={0.72} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}
