import React, { useRef } from 'react';

import { Edges, Stage } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';

import { getFrontBackShape, getLeftRightShape, getTopBottomShape } from '@core/app/components/boxgen/Shape';
import { useBoxgenStore } from '@core/app/stores/boxgenStore';
import Canvas from '@core/app/widgets/three/Canvas';

const BoxFace = ({
  position,
  type,
}: {
  position: Vector3;
  type: 'FrontBack' | 'LeftRight' | 'TopBottom';
}): React.JSX.Element => {
  const boxData = useBoxgenStore((state) => state.boxData);
  const ref = useRef<THREE.Mesh>(null);
  const extrudeRef = useRef<THREE.ExtrudeGeometry>(null);

  const extrudeSettings = {
    bevelEnabled: false,
    depth: boxData.sheetThickness,
    steps: 2,
  };

  let rotation: THREE.Euler;
  let shape: { shape: THREE.Shape };

  switch (type) {
    case 'TopBottom':
      rotation = new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ');
      shape = getTopBottomShape({ ...boxData, height: boxData.depth, width: boxData.width });
      break;
    case 'FrontBack':
      rotation = new THREE.Euler(0, 0, Math.PI, 'XYZ');
      shape = getFrontBackShape({ ...boxData, height: boxData.height, width: boxData.width });
      break;
    case 'LeftRight':
    default:
      rotation = new THREE.Euler(0, Math.PI / 2, Math.PI, 'XYZ');
      shape = getLeftRightShape({ ...boxData, height: boxData.height, width: boxData.depth });
      break;
  }

  return (
    <mesh position={position} ref={ref} rotation={rotation}>
      {}
      <extrudeGeometry args={[shape.shape, extrudeSettings]} ref={extrudeRef} />
      <meshNormalMaterial />
      <Edges />
    </mesh>
  );
};

const BoxCanvas = (): React.JSX.Element => {
  const boxData = useBoxgenStore((state) => state.boxData);

  return (
    <Canvas
      camera={{
        far: 1000,
        fov: 55,
        near: 0.1,
        position: [150, 150, 150],
      }}
    >
      <Stage adjustCamera={1.9} environment={null} shadows={false}>
        <BoxFace position={new Vector3(0, boxData.sheetThickness, 0)} type="TopBottom" />
        {boxData.cover ? <BoxFace position={new Vector3(0, boxData.height, 0)} type="TopBottom" /> : null}
        <BoxFace position={new Vector3(0, boxData.height / 2, -boxData.depth / 2)} type="FrontBack" />
        <BoxFace
          position={new Vector3(0, boxData.height / 2, boxData.depth / 2 - boxData.sheetThickness)}
          type="FrontBack"
        />
        <BoxFace position={new Vector3(-boxData.width / 2, boxData.height / 2, 0)} type="LeftRight" />
        <BoxFace
          position={new Vector3(boxData.width / 2 - boxData.sheetThickness, boxData.height / 2, 0)}
          type="LeftRight"
        />
        <gridHelper
          args={[
            Math.max(boxData.width, boxData.height, boxData.depth) + 20,
            (Math.max(boxData.width, boxData.height, boxData.depth) + 20) / 10,
          ]}
        />
      </Stage>
    </Canvas>
  );
};

export default BoxCanvas;
