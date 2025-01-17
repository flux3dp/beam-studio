/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, RenderProps, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

import CanvasController from './CanvasController';

interface CameraProps {
  zoomKey: number;
  zoomRatio?: number;
}

const Camera = ({ zoomKey, zoomRatio = 1.5 }: CameraProps) => {
  const currentZoomKey = useRef(zoomKey);
  const [position, setPosition] = useState(null);

  useFrame(({ camera }) => {
    if (zoomKey !== currentZoomKey.current) {
      if (zoomKey === 0) {
        setPosition(null);
      } else if (zoomKey > 0) {
        setPosition(
          new THREE.Vector3(
            camera.position.x / zoomRatio,
            camera.position.y / zoomRatio,
            camera.position.z / zoomRatio
          )
        );
      } else {
        setPosition(
          new THREE.Vector3(
            camera.position.x * zoomRatio,
            camera.position.y * zoomRatio,
            camera.position.z * zoomRatio
          )
        );
      }
      currentZoomKey.current = zoomKey;
    }
    if (position) {
      const dist = camera.position.distanceTo(position);
      if (dist < 1) setPosition(null);
      else camera.position.lerp(position, 0.1);
    }
  });

  return null;
};

interface Props extends RenderProps<HTMLCanvasElement> {
  children?: React.ReactNode;
  withControler?: boolean;
  orbitControls?: React.ReactNode;
}

const ThreeCanvas = ({ children, withControler = true, orbitControls, ...props }: Props): JSX.Element => {
  const [resetKey, setResetKey] = useState(0);
  const [zoomKey, setZoomKey] = useState(0);

  return (
    <>
      {withControler && <CanvasController setResetKey={setResetKey} setZoomKey={setZoomKey} />}
      <Canvas key={resetKey} {...props}>
        {children}
        {orbitControls ?? <OrbitControls dampingFactor={0.3} />}
        <Camera zoomKey={zoomKey} />
      </Canvas>
    </>
  );
};

export default ThreeCanvas;
