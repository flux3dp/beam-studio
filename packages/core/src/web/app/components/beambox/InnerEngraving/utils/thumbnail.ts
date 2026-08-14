import {
  AmbientLight,
  Box3,
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { match } from 'ts-pattern';

import { useStlStore } from '@core/app/stores/stlStore';
import workareaManager from '@core/app/svgedit/workarea';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';

import { FLOOR_COLOR, FLOOR_MARGIN, FLOOR_Z, MATERIAL_COLOR, MATERIAL_OPACITY } from '../constants';
import { VIEW_DIRECTIONS } from '../viewStore';

import type { Material } from './material';
import { getMaterial } from './material';
import { getMatrix } from './transform';

/** Longest side of the produced image, in pixels. Matches what the 2D thumbnails are scaled to. */
const DEFAULT_SIZE = 300;
/** Breathing room around the fitted content, as a fraction of its size. */
const PADDING_RATIO = 1.08;

const getMaterialGeometry = ({ depth, height, shape, width }: Material) =>
  match(shape)
    .with('box', () => new BoxGeometry(width, depth, height))
    // three.js builds cylinders around Y; the mesh below stands it up onto Z
    .with('cylinder', () => new CylinderGeometry(width / 2, width / 2, height, 48))
    .with('sphere', () => {
      const radius = width / 2;
      // filled with liquid up to `height`, so the cap above that level is not part of the workpiece
      const thetaStart = Math.acos(Math.min(1, Math.max(-1, (height - radius) / radius)));

      return new SphereGeometry(radius, 48, 24, 0, Math.PI * 2, thetaStart, Math.PI - thetaStart);
    })
    .exhaustive();

/**
 * The layer colour of an STL object, read straight from the DOM.
 *
 * The non-React twin of `useLayerColor`: a thumbnail is rendered once, outside any component, so
 * there is nothing to subscribe to. Layer colours are always applied here regardless of the
 * `use_layer_color` preference — that preference is about editing legibility, while a thumbnail is
 * a picture of the job, and a file browser full of black silhouettes tells the user nothing.
 */
const getObjectColor = (id: string): string => {
  const elem = document.getElementById(id);
  const layer = elem ? getObjectLayer(elem as unknown as SVGElement)?.elem : null;

  return layer?.getAttribute('data-color') ?? '#000';
};

/**
 * Render the inner engraving scene to an offscreen canvas, from the default isometric view.
 *
 * A .beam thumbnail and a job thumbnail are both built from `svgcontent`, which for an inner
 * engraving document holds nothing but flat projection rects — a picture of the outlines, not of
 * the work. This draws the same scene the 3D canvas shows instead.
 *
 * Fixed isometric + orthographic rather than the user's current camera: a thumbnail is an identifier
 * as much as a preview, so the same document has to produce the same picture every time, and the
 * machine panel shows it at a size where a perspective view of a small model is unreadable.
 *
 * The framing covers the **work area, the material and every object** — the work area so the job's
 * placement inside the field is visible (a model in the corner should look like one), the material
 * because a workpiece larger than the field is normal and cropping it would misrepresent the setup.
 *
 * @returns the rendered canvas, or null when there is nothing to draw or WebGL is unavailable
 */
export const renderInnerEngravingThumbnail = (size: number = DEFAULT_SIZE): HTMLCanvasElement | null => {
  const { objects } = useStlStore.getState();
  const material = getMaterial();
  const { height: areaHeight, width: areaWidth } = workareaManager;
  const scene = new Scene();
  // every disposable this function creates, so a failure part-way still frees the GPU buffers
  const disposables = Array.of<{ dispose: () => void }>();
  let renderer: null | WebGLRenderer = null;

  try {
    // no scene background: a thumbnail is shown on a card, a machine panel and a file browser, each
    // with its own backdrop, and baking the canvas's grey in would put a grey rectangle on all of
    // them. Transparent lets the host decide, and the work area floor still shows the field itself.
    scene.add(new AmbientLight(0xffffff, 1.2));

    const light = new DirectionalLight(0xffffff, 2);

    light.position.set(areaWidth, -areaHeight, Math.hypot(areaWidth, areaHeight));
    scene.add(light);

    // the work area floor, the same white backdrop the canvas draws
    const floorGeometry = new PlaneGeometry(areaWidth + FLOOR_MARGIN * 2, areaHeight + FLOOR_MARGIN * 2);
    const floorMaterial = new MeshBasicMaterial({ color: FLOOR_COLOR, side: DoubleSide });
    const floor = new Mesh(floorGeometry, floorMaterial);

    floor.position.set(areaWidth / 2, areaHeight / 2, FLOOR_Z);
    scene.add(floor);
    disposables.push(floorGeometry, floorMaterial);

    // the workpiece. Drawn in one piece, unlike the canvas: the in-range / out-of-range split needs
    // clipping planes and reads as noise at thumbnail size
    const materialGeometry = getMaterialGeometry(material);
    const materialMesh = new Mesh(
      materialGeometry,
      new MeshBasicMaterial({
        color: MATERIAL_COLOR,
        depthWrite: false,
        opacity: MATERIAL_OPACITY,
        transparent: true,
      }),
    );

    materialMesh.position.set(
      material.center[0],
      material.center[1],
      material.shape === 'sphere' ? material.width / 2 : material.center[2],
    );

    if (material.shape !== 'box') materialMesh.rotation.set(Math.PI / 2, 0, 0);

    scene.add(materialMesh);
    disposables.push(materialGeometry, materialMesh.material as MeshBasicMaterial);

    const content = new Group();

    Object.values(objects).forEach((object) => {
      const meshMaterial = new MeshStandardMaterial({ color: getObjectColor(object.id), side: DoubleSide });
      const mesh = new Mesh(object.geometry, meshMaterial);

      // the geometry is shared with the live canvas and must not be disposed of here, so only the
      // matrix is applied — never baked into the vertices
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(getMatrix(object));
      content.add(mesh);
      disposables.push(meshMaterial);
    });
    scene.add(content);

    // the object meshes carry a hand-set matrix (matrixAutoUpdate off), so world matrices have to
    // be composed before anything measures them
    scene.updateMatrixWorld(true);

    // frame the union rather than any one of the three: the field shows where the job sits, the
    // material can be larger than the field, and a tall object can rise above the material
    const bounds = new Box3()
      .setFromObject(materialMesh)
      .union(new Box3().setFromCenterAndSize(floor.position.clone(), new Vector3(areaWidth, areaHeight, 0)));

    if (content.children.length) bounds.union(new Box3().setFromObject(content));

    const target = bounds.getCenter(new Vector3());
    const extent = bounds.getSize(new Vector3()).length();

    if (!Number.isFinite(extent) || extent <= 0) return null;

    // an orthographic box wide enough for any orbit of `bounds`, so the fit cannot clip a corner
    const half = (extent / 2) * PADDING_RATIO;
    const camera = new OrthographicCamera(-half, half, half, -half, 0.1, extent * 4);
    const direction = new Vector3(...VIEW_DIRECTIONS.isometric).normalize();

    camera.up.set(0, 0, 1);
    camera.position.copy(target).addScaledVector(direction, extent * 1.5);
    camera.lookAt(target);
    camera.updateProjectionMatrix();

    // three's own default is NoToneMapping, which is what the live canvas asks r3f for with `flat`,
    // so the colours here come out the same as on screen without any further setup
    renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearAlpha(0);
    renderer.setSize(size, size, false);
    renderer.render(scene, camera);

    // copied out into a plain canvas: the renderer's own drawing buffer dies with the context below,
    // and a WebGL canvas cannot be handed to `toBlob` after that
    const output = document.createElement('canvas');

    output.width = size;
    output.height = size;
    output.getContext('2d')!.drawImage(renderer.domElement, 0, 0);

    return output;
  } catch (error) {
    console.error('Failed to render the inner engraving thumbnail:', error);

    return null;
  } finally {
    disposables.forEach((disposable) => disposable.dispose());
    // WebGL contexts are a scarce per-page resource; leaking one per save would eventually make
    // the browser drop the canvas's own context
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
};
