import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import type { Object3D } from 'three';
import { BoxHelper, Color } from 'three';

interface Props {
  color?: string;
  target: null | Object3D;
}

/**
 * Wireframe box around an object, following it as it moves.
 *
 * `BoxHelper` is added straight to the scene rather than rendered as a child, because it derives its
 * own world transform from the target and would be transformed twice if it were parented to it.
 */
const BoundingBox = ({ color = '#0000FF', target }: Props): null => {
  const helperRef = useRef<BoxHelper | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    if (!target) return;

    target.updateMatrixWorld(true);

    const helper = new BoxHelper(target, new Color(color));

    helper.update();
    helperRef.current = helper;
    scene.add(helper);

    return () => {
      scene.remove(helper);
      helper.geometry.dispose();
      helper.material.dispose();
      helperRef.current = null;
    };
  }, [color, scene, target]);

  useFrame(() => {
    if (!helperRef.current || !target) return;

    target.updateMatrixWorld(true);
    helperRef.current.update();
  });

  return null;
};

export default BoundingBox;
