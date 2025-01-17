import React, { useRef, useContext } from 'react';
import * as THREE from 'three';
import { Stage, Edges } from '@react-three/drei';
import { Vector3 } from 'three';

import Canvas from 'app/widgets/three/Canvas';
import {
  getTopBottomShape,
  getFrontBackShape,
  getLeftRightShape,
} from 'app/components/boxgen/Shape';
import { BoxgenContext } from 'app/contexts/BoxgenContext';

const BoxFace = ({
  position,
  type,
}: {
  position: Vector3;
  type: 'TopBottom' | 'FrontBack' | 'LeftRight';
}): JSX.Element => {
  const { boxData } = useContext(BoxgenContext);
  const ref = useRef<THREE.Mesh>(null);
  const extrudeRef = useRef<THREE.ExtrudeGeometry>(null);

  const extrudeSettings = {
    steps: 2,
    depth: boxData.sheetThickness,
    bevelEnabled: false,
  };

  let rotation: THREE.Euler;
  let shape: { shape: THREE.Shape };
  switch (type) {
    case 'TopBottom':
      rotation = new THREE.Euler(Math.PI / 2, 0, 0, 'XYZ');
      shape = getTopBottomShape({ ...boxData, width: boxData.width, height: boxData.depth });
      break;
    case 'FrontBack':
      rotation = new THREE.Euler(0, 0, Math.PI, 'XYZ');
      shape = getFrontBackShape({ ...boxData, width: boxData.width, height: boxData.height });
      break;
    case 'LeftRight':
    default:
      rotation = new THREE.Euler(0, Math.PI / 2, Math.PI, 'XYZ');
      shape = getLeftRightShape({ ...boxData, width: boxData.depth, height: boxData.height });
      break;
  }
  return (
    // eslint-disable-next-line react/no-unknown-property
    <mesh position={position} rotation={rotation} ref={ref}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <extrudeGeometry ref={extrudeRef} args={[shape.shape, extrudeSettings]} />
      <meshNormalMaterial />
      <Edges />
    </mesh>
  );
};

const BoxCanvas = (): JSX.Element => {
  const { boxData } = useContext(BoxgenContext);

  return (
    <Canvas
      camera={{
        fov: 55,
        near: 0.1,
        far: 1000,
        position: [150, 150, 150],
      }}
    >
      <Stage adjustCamera={1.9} shadows={false} environment={null}>
        <BoxFace type="TopBottom" position={new Vector3(0, boxData.sheetThickness, 0)} />
        {boxData.cover ? (
          <BoxFace type="TopBottom" position={new Vector3(0, boxData.height, 0)} />
        ) : null}
        <BoxFace
          type="FrontBack"
          position={new Vector3(0, boxData.height / 2, -boxData.depth / 2)}
        />
        <BoxFace
          type="FrontBack"
          position={new Vector3(0, boxData.height / 2, boxData.depth / 2 - boxData.sheetThickness)}
        />
        <BoxFace
          type="LeftRight"
          position={new Vector3(-boxData.width / 2, boxData.height / 2, 0)}
        />
        <BoxFace
          type="LeftRight"
          position={new Vector3(boxData.width / 2 - boxData.sheetThickness, boxData.height / 2, 0)}
        />
        <gridHelper
          // eslint-disable-next-line react/no-unknown-property
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
