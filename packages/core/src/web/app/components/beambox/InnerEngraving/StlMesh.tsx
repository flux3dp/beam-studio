import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TransformControls } from '@react-three/drei';
import type { Group, Mesh, Texture } from 'three';
import { DoubleSide, Euler, SRGBColorSpace, TextureLoader, Vector3 } from 'three';

import type { StlObject } from '@core/app/stores/stlStore';
import { getPhotoTextureUrl, photoPlaneEvents } from '@core/app/svgedit/stl/photoPlane';

import BoundingBox from './BoundingBox';
import { SELECTION_COLOR } from './constants';
import { MM_TO_SCENE } from './utils/coordinates';
import { updateProjectionRect } from './utils/projection';
import { ROTATION_SNAP_RAD, snapPosition, snapScale, TRANSLATION_SNAP } from './utils/snapping';
import { getBaseSize, getMeshCenter, setTransform } from './utils/transform';
import { useLayerColor } from './utils/useLayerColor';
import { useViewStore } from './viewStore';

/** Below this the object is invisible and the transform is not invertible; scaling stops here. */
const MIN_SCALE = 1e-3;

interface StlMeshProps {
  object: StlObject;
  onSelect: (id: string) => void;
  /** Space is held: the drag belongs to the camera, so neither the gizmo nor selection may take it. */
  panning: boolean;
  selected: boolean;
  snapActive: boolean;
  snapCenter: [number, number, number];
}

/**
 * One STL object in the 3D canvas.
 *
 * Two nested objects rather than one, matching how the transform is stored:
 * - the **anchor group** carries position / rotation / scale, all positive, which is what
 *   TransformControls can manipulate and decompose without surprises
 * - the **mesh** inside carries the mirror and the shift that puts the mesh's own centre on the
 *   group's origin, so rotation and scaling happen about the object's centre rather than about
 *   whatever origin the STL's author happened to leave behind
 */
const StlMesh = ({ object, onSelect, panning, selected, snapActive, snapCenter }: StlMeshProps): React.JSX.Element => {
  // a callback ref rather than useRef: TransformControls needs the resolved Object3D, which is not
  // available on the first render
  const [anchor, setAnchor] = useState<Group | null>(null);
  const meshRef = useRef<Mesh>(null);
  const { geometry, id, transform } = object;
  const { flip, position, rotation, scale } = transform;
  const { ratioLocked, transformMode } = useViewStore();
  const color = useLayerColor(id);
  const [textureSource, setTextureSource] = useState(object.textureUrl);
  const [texture, setTexture] = useState<null | Texture>(null);
  const center = useMemo(() => getMeshCenter(geometry), [geometry]);
  const baseSize = useMemo(() => getBaseSize(geometry), [geometry]);
  const mirrored = flip.some(Boolean);
  // the scale at the start of a drag, so a locked ratio can be enforced against it
  const dragStartScale = useRef(new Vector3(1, 1, 1));

  useEffect(() => {
    if (object.kind !== 'photo') return;

    const elem = document.getElementById(id) as unknown as null | SVGImageElement;

    if (!elem) return;

    const update = () => setTextureSource(getPhotoTextureUrl(elem) ?? object.textureUrl);
    const handleTextureChanged = (changedId: string, nextSource: string) => {
      if (changedId === id) setTextureSource(nextSource);
    };
    const observer = new MutationObserver(update);

    update();
    photoPlaneEvents.on('texture-changed', handleTextureChanged);
    observer.observe(elem, { attributeFilter: ['href', 'origImage', 'xlink:href'], attributes: true });

    return () => {
      photoPlaneEvents.off('texture-changed', handleTextureChanged);
      observer.disconnect();
    };
  }, [id, object.kind, object.textureUrl]);

  useEffect(() => {
    if (object.kind !== 'photo' || !textureSource) {
      setTexture(null);

      return;
    }

    let active = true;
    let loaded: null | Texture = null;

    new TextureLoader().load(textureSource, (next) => {
      loaded = next;
      next.colorSpace = SRGBColorSpace;

      if (active) setTexture(next);
      else next.dispose();
    });

    return () => {
      active = false;
      loaded?.dispose();
    };
  }, [object.kind, textureSource]);

  const meshScale = useMemo<[number, number, number]>(
    () => [flip[0] ? -1 : 1, flip[1] ? -1 : 1, flip[2] ? -1 : 1],
    [flip],
  );
  // mirror about the mesh centre: the offset has to be mirrored too, or flipping would also move it
  const meshPosition = useMemo<[number, number, number]>(
    () => [-center.x * meshScale[0], -center.y * meshScale[1], -center.z * meshScale[2]],
    [center, meshScale],
  );

  const handleMouseDown = useCallback(() => {
    if (anchor) dragStartScale.current.copy(anchor.scale);
  }, [anchor]);

  // while dragging, write straight to the projection rect and leave the store alone: updating the
  // store mid-drag would feed the transform back through the props below and fight the gizmo
  const handleObjectChange = useCallback(() => {
    const elem = document.getElementById(id) as unknown as null | SVGElement;

    if (!anchor || !meshRef.current) return;

    if (transformMode === 'scale' && ratioLocked) {
      // the gizmo scales one axis at a time; with the ratio locked, the axis that moved sets the
      // factor for all three
      const start = dragStartScale.current;
      const ratios = [anchor.scale.x / start.x, anchor.scale.y / start.y, anchor.scale.z / start.z];
      const factor = ratios.reduce((far, ratio) => (Math.abs(Math.log(ratio)) > Math.abs(Math.log(far)) ? ratio : far));

      anchor.scale.set(start.x * factor, start.y * factor, start.z * factor);
    }

    anchor.scale.set(
      Math.max(anchor.scale.x, MIN_SCALE),
      Math.max(anchor.scale.y, MIN_SCALE),
      Math.max(anchor.scale.z, MIN_SCALE),
    );

    if (snapActive) {
      if (transformMode === 'translate') {
        snapPosition(anchor.position, snapCenter);
      } else if (transformMode === 'scale') {
        const objectScale = anchor.scale.clone().divideScalar(MM_TO_SCENE);

        snapScale(objectScale, baseSize, ratioLocked);
        anchor.scale.copy(objectScale.multiplyScalar(MM_TO_SCENE));
      }
    }

    anchor.updateMatrixWorld(true);

    if (elem) updateProjectionRect(elem, geometry, meshRef.current.matrixWorld);
  }, [anchor, baseSize, geometry, id, ratioLocked, snapActive, snapCenter, transformMode]);

  const handleDragEnd = useCallback(() => {
    if (!anchor) return;

    // read the parts back rather than decomposing a matrix: the mirror lives on the child mesh, so
    // the group's own scale stays positive and means exactly what the panel shows
    const euler = new Euler().setFromQuaternion(anchor.quaternion, 'XYZ');

    setTransform(object, {
      ...object.transform,
      position: anchor.position.toArray(),
      rotation: [euler.x, euler.y, euler.z],
      scale: [anchor.scale.x / MM_TO_SCENE, anchor.scale.y / MM_TO_SCENE, anchor.scale.z / MM_TO_SCENE],
    });
  }, [anchor, object]);

  return (
    <>
      <group
        position={position}
        ref={setAnchor}
        rotation={rotation}
        scale={[scale[0] * MM_TO_SCENE, scale[1] * MM_TO_SCENE, scale[2] * MM_TO_SCENE]}
      >
        <mesh
          geometry={geometry}
          onClick={(e) => {
            if (panning) return;

            e.stopPropagation();
            onSelect(id);
          }}
          position={meshPosition}
          ref={meshRef}
          scale={meshScale}
        >
          {/* selection is shown with an outline rather than a colour change, so the layer colour
              stays readable while the object is being edited. DoubleSide because a mirrored mesh
              has its winding reversed, and back-face culling would hollow it out */}
          {object.kind === 'photo' ? (
            <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} transparent />
          ) : (
            <meshStandardMaterial color={color} side={mirrored ? DoubleSide : undefined} />
          )}
        </mesh>
      </group>
      {selected && anchor && (
        <>
          <TransformControls
            // the gizmo sits on top of everything, so leaving it live would swallow every pan that
            // happened to start over it
            enabled={!panning}
            mode={transformMode}
            object={anchor}
            onMouseDown={handleMouseDown}
            onMouseUp={handleDragEnd}
            onObjectChange={handleObjectChange}
            rotationSnap={snapActive ? ROTATION_SNAP_RAD : null}
            showZ={object.kind !== 'photo' || transformMode !== 'scale'}
            // arrows along the work area's axes, which is what "move in X / Y / Z" means here
            space="world"
            translationSnap={snapActive ? TRANSLATION_SNAP : null}
          />
          <BoundingBox color={SELECTION_COLOR} target={anchor} />
        </>
      )}
    </>
  );
};

export default StlMesh;
