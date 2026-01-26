/* eslint-disable no-prototype-builtins */
/* eslint-disable ts/no-unused-vars */
import React from 'react';

import { Switch } from 'antd';
import { mat4, vec3 } from 'gl-matrix';
import { funnel } from 'remeda';

import alertCaller from '@core/app/actions/alert-caller';
import constant, { promarkModels } from '@core/app/actions/beambox/constant';
import exportFuncs from '@core/app/actions/beambox/export-funcs';
import { dpiTextMap } from '@core/app/actions/beambox/export-funcs-swiftray';
import progressCaller from '@core/app/actions/progress-caller';
import Pointable from '@core/app/components/beambox/path-preview/Pointable';
import SidePanel from '@core/app/components/beambox/path-preview/SidePanel';
import ZoomBlock from '@core/app/components/common/ZoomBlock';
import { getAddOnInfo } from '@core/app/constants/addOn';
import alertConstants from '@core/app/constants/alert-constants';
import layoutConstants from '@core/app/constants/layout-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import workareaManager from '@core/app/svgedit/workarea';
import checkDeviceStatus from '@core/helpers/check-device-status';
import { checkBlockedSerial } from '@core/helpers/device/checkBlockedSerial';
import getDevice from '@core/helpers/device/get-device';
import getRotaryRatio from '@core/helpers/device/get-rotary-ratio';
import deviceMaster from '@core/helpers/device-master';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import getJobOrigin from '@core/helpers/job-origin';
import { DrawCommands } from '@core/helpers/path-preview/draw-commands';
import { GcodePreview } from '@core/helpers/path-preview/draw-commands/GcodePreview';
import units from '@core/helpers/units';
import {
  convertVariableText,
  extractVariableText,
  hasVariableText,
  removeVariableText,
} from '@core/helpers/variableText';
import VersionChecker from '@core/helpers/version-checker';

import { parseGcode } from '../../../views/beambox/tmpParseGcode';

import styles from './PathPreview.module.scss';
import ProgressBar from './ProgressBar';

const TOOLS_PANEL_HEIGHT = 100;
const MAJOR_GRID_SPACING = 50;
const MINOR_GRID_SPACING = 10;
const m4Identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const SIM_TIME = 0.1; // sec
const SIM_TIME_MINUTE = units.convertTimeUnit(SIM_TIME, 'm');
const SIM_TIME_MS = units.convertTimeUnit(SIM_TIME, 'ms');
const speedRatio = [0.5, 1, 2, 4, 8];

const canvasEventEmitter = eventEmitterFactory.createEventEmitter('canvas');
const zoomBlockEventEmitter = eventEmitterFactory.createEventEmitter('zoom-block');

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(
  gl: {
    COMPILE_STATUS: any;
    compileShader: (arg0: any) => void;
    createShader: (arg0: any) => any;
    deleteShader: (arg0: any) => void;
    getShaderInfoLog: (arg0: any) => any;
    getShaderParameter: (arg0: any, arg1: any) => any;
    shaderSource: (arg0: any, arg1: any) => void;
  },
  type: any,
  source: any,
) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);

    return null;
  }

  return shader;
}

//
// 初始化 shader 來告知WebGL怎麼畫
//
function initShaderProgram(
  gl: {
    attachShader: (arg0: any, arg1: any) => void;
    createProgram: () => any;
    FRAGMENT_SHADER: any;
    getProgramInfoLog: (arg0: any) => any;
    getProgramParameter: (arg0: any, arg1: any) => any;
    LINK_STATUS: any;
    linkProgram: (arg0: any) => void;
    VERTEX_SHADER: any;
  },
  vsSource: string,
  fsSource: string,
) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // 建立 shader 程式
  const shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // 錯誤處理
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);

    return null;
  }

  return shaderProgram;
}

const defaultVsSource = `
  attribute vec4 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  }
`;

const defaultFsSource = `
  precision mediump float;
  uniform bool isInverting;
  void main() {
    if (isInverting) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  }
`;

const generateProgramInfo = (
  gl: null | WebGLRenderingContext,
  vsSource = defaultVsSource,
  fsSource = defaultFsSource,
) => {
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const programInfo = {
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    program: shaderProgram,
    uniformLocations: {
      isInverting: gl.getUniformLocation(shaderProgram, 'isInverting'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      showRemaining: gl.getUniformLocation(shaderProgram, 'showRemaining'),
      showTraversal: gl.getUniformLocation(shaderProgram, 'showTraversal'),
    },
  };

  return programInfo;
};

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function initBuffers(
  gl: null | WebGLRenderingContext,
  width: number,
  height: number,
  offset?: { x: number; y: number },
) {
  // 建立一個 buffer 來儲存正方形的座標

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const { x = 0, y = 0 } = offset || {};
  const positions = [-x, y, width - x, y, -x, -height + y, width - x, -height + y];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
}

// Draw white square
function drawScene(
  gl: null | WebGLRenderingContext,
  programInfo: { attribLocations: any; program: any; uniformLocations: any },
  buffers: { position: any },
  camera: { fovy?: any; perspective: any; scale?: number; view: any; viewInv?: mat4 },
  isInverting: boolean,
  showTraversal: boolean,
  showRemaining: boolean,
) {
  gl.enable(gl.DEPTH_TEST); // Enable 深度測試
  gl.depthFunc(gl.ALWAYS); // Near things obscure far things

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, camera.perspective);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, camera.view);
  gl.uniform1i(programInfo.uniformLocations.isInverting, isInverting);
  gl.uniform1i(programInfo.uniformLocations.showTraversal, showTraversal);
  gl.uniform1i(programInfo.uniformLocations.showRemaining, showRemaining);

  {
    const offset = 0;
    const vertexCount = 4;

    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

const settings = {
  machineBeamDiameter: 0.2,
  machineBottomLeftX: 0,
  machineBottomLeftY: 0,
  machineHeight: 200,
  machineWidth: 300,
  showMachine: false,
  toolDisplayCache: false,
  toolGridMajorSpacing: 50,
  toolGridMinorSpacing: 10,
};

const defaultWorkspace = {
  cursorPos: [0, 0, 0],
  g0Rate: 7500,
  rotaryDiameter: 10,
  showCursor: true,
  showGcode: true,
  showRotary: false,
  showTraversal: true,
  simTime: 0,
};

const defaultCamera = {
  center: [150, -105, 0],
  eye: [150, -105, 300],
  fovy: Math.PI / 2.6,
  showPerspective: false,
  up: [0, 1, 0],
};

const dimensions = {
  height: 400,
  width: 400,
};

function calcCamera({
  center,
  eye,
  far,
  fovy,
  machineX,
  machineY,
  near,
  showPerspective,
  up,
  viewportHeight,
  viewportWidth,
}) {
  let perspective;
  // @ts-ignore
  let view = mat4.lookAt([], eye, center, up);

  // @ts-ignore
  view = mat4.translate([], view, [-machineX, -machineY, 0]);

  const yBound = vec3.distance(eye, center) * Math.tan(fovy / 2);
  const scale = viewportHeight / (2 * yBound);

  if (showPerspective) {
    perspective = mat4.perspective(new Float32Array(), fovy, viewportWidth / viewportHeight, near, far);
  } else {
    // @ts-ignore
    perspective = mat4.identity([]);
    // @ts-ignore
    view = mat4.mul(
      // @ts-ignore
      [],
      // @ts-ignore
      // -viewportWidth , viewportWidth, -viewportHeight, viewportHeight, near, far),
      mat4.ortho(
        [],
        -yBound * (viewportWidth / viewportHeight),
        yBound * (viewportWidth / viewportHeight),
        -yBound,
        yBound,
        near,
        far,
      ),
      view,
    );
    fovy = 0;
  }

  // @ts-ignore
  const viewInv = mat4.invert([], view);

  return {
    fovy,
    perspective,
    scale,
    view,
    viewInv,
  };
}

function objectHasMatchingFields(
  obj: { [x: string]: any },
  fields: { [x: string]: any; hasOwnProperty: (arg0: string) => any },
) {
  for (const key in fields) {
    if (fields.hasOwnProperty(key) && obj[key] !== fields[key]) {
      return false;
    }
  }

  return true;
}

function sameArrayContent(a: any[], b: any[] | Float32Array<ArrayBufferLike> | string) {
  return a.length === b.length && a.every((v: any, i: number | string) => v === b[i]);
}

function cacheDrawing(
  fn: { (): void; (arg0: any): void },
  state: { [x: string]: any; frameBuffer: { resize: (arg0: any, arg1: any) => void; texture: any } },
  args: {
    [x: string]: any;
    arrayVersion?: any;
    drawCommands?: any;
    g0Rate?: any;
    hasOwnProperty?: any;
    height?: any;
    isInverting?: boolean;
    perspective?: any;
    rotaryDiameter?: any;
    showRemaining?: boolean;
    showTraversal?: boolean;
    simTime?: any;
    view?: any;
    width?: any;
  },
) {
  const { drawCommands, height, width } = args;

  if (!objectHasMatchingFields(state, args)) {
    for (const key in args) {
      if (args.hasOwnProperty(key)) {
        state[key] = args[key];
      }
    }

    if (!state.frameBuffer) {
      state.frameBuffer = drawCommands.createFrameBuffer(width, height);
    } else {
      state.frameBuffer.resize(width, height);
    }

    drawCommands.useFrameBuffer(state.frameBuffer, () => {
      drawCommands.gl.clearColor(1, 1, 1, 0);
      drawCommands.gl.clear(drawCommands.gl.COLOR_BUFFER_BIT | drawCommands.gl.DEPTH_BUFFER_BIT);
      fn(args);
    });
  }

  drawCommands.image({
    perspective: m4Identity,
    selected: false,
    texture: state.frameBuffer.texture,
    transform2d: [2 / width, 0, 0, -2 / height, -1, 1],
    view: m4Identity,
  });
}

const drawTaskPreview = (
  taskPreview: GcodePreview,
  cachedDrawState: {},
  canvas: HTMLCanvasElement,
  drawCommands: any,
  workspace: {
    cursorPos?: number[];
    g0Rate: any;
    rotaryDiameter: any;
    showCursor?: boolean;
    showGcode?: boolean;
    showRotary?: boolean;
    showTraversal?: boolean;
    simTime: any;
  },
  camera: { fovy?: any; perspective: any; scale?: number; view: any; viewInv?: mat4 },
  drawingArgs: { isInverting?: boolean; showRemaining?: boolean; showTraversal?: boolean },
) => {
  const { isInverting = false, showRemaining = false, showTraversal = false } = drawingArgs;
  const draw = () => {
    taskPreview.draw(
      drawCommands,
      camera.perspective,
      camera.view,
      workspace.g0Rate,
      workspace.simTime,
      workspace.rotaryDiameter,
      isInverting,
      showTraversal,
      showRemaining,
    );
  };

  cacheDrawing(draw, cachedDrawState, {
    arrayVersion: taskPreview.arrayVersion,
    drawCommands,
    g0Rate: workspace.g0Rate,
    height: canvas.height,
    isInverting,
    perspective: camera.perspective,
    rotaryDiameter: workspace.rotaryDiameter,
    showRemaining,
    showTraversal,
    simTime: workspace.simTime,
    view: camera.view,
    width: canvas.width,
  });
};

class Grid {
  private maingrid: any;

  private origin: any;

  private width: any;

  private height: any;

  private origincount: any;

  draw(
    drawCommands: {
      basic: (arg0: {
        color: number[];
        count: any;
        offset: number;
        perspective: any;
        position: any;
        primitive: any;
        scale: number[];
        translate: number[];
        view: any;
      }) => void;
      gl: { LINES: any };
    },
    {
      height,
      major = MAJOR_GRID_SPACING,
      minor = MINOR_GRID_SPACING,
      offset = { x: 0, y: 0 },
      perspective,
      view,
      width,
    }: {
      height: number;
      major: number;
      minor: number;
      offset: undefined | { x: number; y: number };
      perspective: any;
      view: any;
      width: number;
    },
  ) {
    if (!this.maingrid || !this.origin || this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;

      const c = [];

      c.push(0, 0, 0, this.width, 0, 0);
      c.push(0, -this.height, 0, this.width, -this.height, 0);
      c.push(0, -this.height, 0, 0, 0, 0);
      c.push(this.width, -this.height, 0, this.width, 0, 0);

      this.origin = new Float32Array(c);
      this.origincount = c.length / 3;
    }

    const { x, y } = offset;

    drawCommands.basic({
      color: [0, 0, 0, 1],
      count: this.origincount,
      offset: 0,
      perspective,
      position: this.origin,
      primitive: drawCommands.gl.LINES,
      scale: [1, 1, 1],
      translate: [-x, y, 0],
      view,
    });
  }
}

enum PlayState {
  PAUSE = 2,
  PLAY = 1,
  STOP = 0,
}

interface Props {}

interface State {
  camera: {
    center: number[];
    eye: number[];
    fovy: number;
    showPerspective: boolean;
    up: number[];
  };
  height: number; // height of canvas
  isInverting: boolean;
  playState: PlayState;
  speedLevel: number;
  width: number; // width of canvas
  workspace: {
    cursorPos: number[];
    g0Rate: number;
    rotaryDiameter: number;
    showCursor: boolean;
    showGcode: boolean;
    showRotary: boolean;
    showTraversal: boolean;
    simTime: number;
  };
}

class PathPreview extends React.Component<Props, State> {
  private camera: any;
  private canvas: HTMLCanvasElement;
  private drawCommands: any;
  private grid: Grid;
  private fingers: any;
  private pointers: any;
  private position: any;
  private moveStarted: boolean;
  private adjustingCamera: boolean;
  private gcodePreview: GcodePreview;
  private simTimeMax: number;
  private timeDisplayRatio: number;
  private simInterval?: NodeJS.Timeout;
  private drawGcodeState: any;
  private gcodeString: string = '';
  private fastGradientGcodeString?: string;
  private isUpdating: boolean = false;
  private spaceKey: boolean = false;
  private jobOrigin?: { x: number; y: number };
  private resizeHandler: () => void;

  constructor(props: Props) {
    super(props);
    // TODO: make config interface
    this.canvas = null;
    this.position = [0, 0];
    this.grid = new Grid();

    let { width } = workareaManager;
    const { maxY, model } = workareaManager;
    const { dpmm } = constant;
    const height = maxY / dpmm;

    width /= dpmm;

    defaultCamera.eye = [width / 2, height / 2, 300];
    defaultCamera.center = [width / 2, height / 2, 0];
    settings.machineWidth = width;
    settings.machineHeight = height;
    this.camera = calcCamera({
      center: defaultCamera.center,
      eye: defaultCamera.eye,
      far: 2000,
      fovy: defaultCamera.fovy,
      machineX: settings.machineBottomLeftX,
      machineY: settings.machineBottomLeftY,
      near: 0.1,
      showPerspective: defaultCamera.showPerspective,
      up: defaultCamera.up,
      viewportHeight: dimensions.height,
      viewportWidth: dimensions.width,
    });
    this.pointers = [];
    this.moveStarted = false;
    this.adjustingCamera = false;
    this.gcodePreview = new GcodePreview();
    this.simTimeMax = 1;
    this.timeDisplayRatio = 1;

    this.drawGcodeState = {};

    this.state = {
      camera: defaultCamera,
      height: Math.max(dimensions.height, window.innerHeight - layoutConstants.topBarHeight - TOOLS_PANEL_HEIGHT),
      isInverting: false,
      playState: PlayState.STOP,
      speedLevel: 1,
      width: window.innerWidth - layoutConstants.sidePanelsWidth,
      workspace: defaultWorkspace,
    };

    this.resizeHandler = funnel(() => this.onContainerResized(), {
      minQuietPeriodMs: 300,
      triggerAt: 'end',
    }).call;
  }

  componentDidMount(): void {
    window.addEventListener('keydown', this.windowKeyDown);
    window.addEventListener('keyup', this.windowKeyUp);
    window.addEventListener('resize', this.resizeHandler);
    this.resetView();
    this.updateJobOrigin();
    this.updateGcode();

    canvasEventEmitter.on('canvas-change', this.onDeviceChange);
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    const { camera, height, isInverting, playState, speedLevel, width, workspace } = this.state;

    return (
      nextState.width !== width ||
      nextState.height !== height ||
      nextState.workspace.cursorPos !== workspace.cursorPos ||
      nextState.workspace.simTime !== workspace.simTime ||
      nextState.workspace.showTraversal !== workspace.showTraversal ||
      nextState.camera !== camera ||
      nextState.speedLevel !== speedLevel ||
      nextState.isInverting !== isInverting ||
      nextState.playState !== playState
    );
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.windowKeyDown);
    window.removeEventListener('keyup', this.windowKeyUp);
    window.removeEventListener('resize', this.resizeHandler);

    canvasEventEmitter.off('canvas-change', this.onDeviceChange);
  }

  setCameraAttrs = (attrs: {
    center: number[] | number[] | vec3;
    eye: number[] | number[] | vec3;
    fovy?: number;
    showPerspective?: boolean;
    up?: number[];
  }) => {
    const { camera } = this.state;

    this.setState(
      {
        camera: {
          ...camera,
          ...attrs,
        },
      },
      this.setCamera,
    );
  };

  // fixed
  setCamera() {
    const { camera, height, width } = this.state;
    const newCamera = calcCamera({
      center: camera.center,
      eye: camera.eye,
      far: 2000,
      fovy: camera.fovy,
      machineX: settings.machineBottomLeftX,
      machineY: settings.machineBottomLeftY,
      near: 0.1,
      showPerspective: camera.showPerspective,
      up: camera.up,
      viewportHeight: height,
      viewportWidth: width,
    });

    if (this.camera) {
      if (sameArrayContent(this.camera.perspective, newCamera.perspective)) {
        newCamera.perspective = this.camera.perspective;
      }

      if (sameArrayContent(this.camera.view, newCamera.view)) {
        newCamera.view = this.camera.view;
      }

      if (newCamera.scale !== this.camera.scale) {
        zoomBlockEventEmitter.emit('UPDATE_ZOOM_BLOCK');
      }
    }

    this.camera = newCamera;
  }

  updateJobOrigin = async () => {
    if (useDocumentStore.getState()['enable-job-origin'] && getAddOnInfo(workareaManager.model).jobOrigin) {
      this.jobOrigin = await getJobOrigin();
    } else {
      this.jobOrigin = undefined;
    }

    this.resetView();
  };

  updateGcode = async (): Promise<void> => {
    const { togglePathPreview } = useCanvasStore.getState();

    let fileTimeCost: number;
    let gcodeBlob: Blob | undefined;
    let useSwiftray: boolean;

    if (hasVariableText({ visibleOnly: true })) {
      const extractFn = extractVariableText();
      const revertConvert = await convertVariableText();
      const vtTask = await exportFuncs.getGcode();

      revertConvert?.();
      extractFn?.revert();

      const revertRemove = removeVariableText();
      const normalTask = await exportFuncs.getGcode();

      revertRemove?.();
      fileTimeCost = vtTask.fileTimeCost + normalTask.fileTimeCost;
      gcodeBlob =
        vtTask.gcodeBlob && normalTask.gcodeBlob
          ? new Blob([vtTask.gcodeBlob, normalTask.gcodeBlob])
          : vtTask.gcodeBlob || normalTask.gcodeBlob;
      useSwiftray = vtTask.useSwiftray || normalTask.useSwiftray;
    } else {
      ({ fileTimeCost, gcodeBlob, useSwiftray } = await exportFuncs.getGcode());
    }

    if (!gcodeBlob) {
      togglePathPreview();

      return;
    }

    progressCaller.openNonstopProgress({
      caption: 'Parsing GCode',
      id: 'parsing-gcode',
      timeout: 30000,
    });

    const fileReader = new FileReader();

    fileReader.onloadend = (e) => {
      if (useSwiftray) {
        this.gcodeString = e.target.result as string;
      } else {
        const result = (e.target.result as string).split('\n');

        result.splice(5, 0, 'G1 X0 Y0');
        this.gcodeString = result.join('\n');
      }

      if (this.gcodeString.length > 83) {
        const workarea = workareaManager.model;
        const isPromark = promarkModels.has(workarea);
        const parsedGcode = parseGcode(this.gcodeString, isPromark);
        // For Promark rotary display
        const rotaryRatio = getRotaryRatio(getAddOnInfo('fpm1'));

        this.gcodePreview.setParsedGcode(
          parsedGcode,
          isPromark,
          (dpiTextMap[useGlobalPreferenceStore.getState().engrave_dpi] || 254) / 25.4,
          rotaryRatio,
        );
        this.simTimeMax =
          Math.ceil((this.gcodePreview.g1Time + this.gcodePreview.g0Time) / SIM_TIME_MINUTE) * SIM_TIME_MINUTE +
          SIM_TIME_MINUTE / 2;
        this.timeDisplayRatio = fileTimeCost / (60 * this.simTimeMax);
        this.handleSimTimeChange(this.simTimeMax);
      }

      progressCaller.popById('parsing-gcode');
    };
    fileReader.readAsText(gcodeBlob);
  };

  private windowKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      this.spaceKey = true;
    }
  };

  private windowKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      this.spaceKey = false;
    }
  };

  private drawFlat = (canvas: HTMLCanvasElement, gl: null | WebGLRenderingContext) => {
    const { isInverting, workspace } = this.state;
    const programInfo = generateProgramInfo(gl);
    const showRemaining = false;
    const buffer = initBuffers(gl, settings.machineWidth, settings.machineHeight, this.jobOrigin);

    drawScene(gl, programInfo, buffer, this.camera, isInverting, workspace.showTraversal, showRemaining);

    this.grid.draw(this.drawCommands, {
      height: settings.machineHeight,
      major: Math.max(settings.toolGridMajorSpacing, 1),
      minor: Math.max(settings.toolGridMinorSpacing, 0.1),
      offset: this.jobOrigin,
      perspective: this.camera.perspective,
      view: this.camera.view,
      width: settings.machineWidth,
    });
    drawTaskPreview(this.gcodePreview, this.drawGcodeState, canvas, this.drawCommands, workspace, this.camera, {
      isInverting,
      showTraversal: workspace.showTraversal,
    });

    if (this.position[0] !== 0 && this.position[1] !== 0) {
      const crossPoints = [];
      const crossValue = 10 / this.camera.scale;

      crossPoints.push(
        this.position[0] - crossValue,
        -this.position[1],
        0,
        this.position[0] + crossValue,
        -this.position[1],
        0,
      );
      crossPoints.push(
        this.position[0],
        -this.position[1] - crossValue,
        0,
        this.position[0],
        -this.position[1] + crossValue,
        0,
      );

      const crossPosition = new Float32Array(crossPoints);

      this.drawCommands.basic({
        color: [0, 0.7, 0, 1],
        count: 4,
        offset: 0,
        perspective: this.camera.perspective,
        position: crossPosition,
        primitive: this.drawCommands.gl.LINES,
        scale: [1, 1, 1],
        translate: [0, 0, 0],
        view: this.camera.view,
      });
    }
  };

  onContainerResized = () => {
    const { height, width } = this.state;
    const elem = document.getElementById('path-preview-panel') as HTMLElement;

    if (!elem) return;

    const { offsetHeight, offsetWidth } = elem;

    if (width !== offsetWidth || height !== Math.max(dimensions.height, offsetHeight - TOOLS_PANEL_HEIGHT)) {
      this.setState(
        {
          height: Math.max(dimensions.height, offsetHeight - TOOLS_PANEL_HEIGHT),
          width: offsetWidth,
        },
        this.setCamera,
      );
    }
  };

  resetView = (): void => {
    const { height, width } = this.state;
    const { x: jobOriginX = 0, y: jobOriginY = 0 } = this.jobOrigin || {};
    const { machineHeight, machineWidth } = settings;
    const scale = Math.min(width / machineWidth, height / machineHeight) * 0.95;
    const cameraHeight = 300;
    let newFovy = 2 * Math.atan(height / (2 * cameraHeight * scale));

    newFovy = Math.max(0.1, Math.min(Math.PI - 0.1, newFovy));
    this.setCameraAttrs({
      center: [machineWidth / 2 - jobOriginX, -machineHeight / 2 + jobOriginY, 0],
      eye: [machineWidth / 2 - jobOriginX, -machineHeight / 2 + jobOriginY, cameraHeight],
      fovy: newFovy,
    });
  };

  setCanvas = (canvas: HTMLCanvasElement): void => {
    if (this.canvas === canvas) {
      return;
    }

    this.canvas = canvas;

    if (this.drawCommands) {
      this.drawCommands.destroy();
      this.drawCommands = null;
    }

    if (!canvas) {
      return;
    }

    if (!this.camera) {
      return;
    }

    const gl = canvas.getContext('webgl', {
      alpha: true,
      depth: true,
      preserveDrawingBuffer: true,
    });

    this.drawCommands = new DrawCommands(gl);

    const draw = () => {
      if (!this.canvas) {
        return;
      }

      if (settings.toolDisplayCache) {
        if (this.isUpdating) {
          this.isUpdating = false;
        } else {
          requestAnimationFrame(draw);

          return;
        }
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.94, 0.94, 0.94, 1);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);

      this.drawFlat(canvas, gl);

      requestAnimationFrame(draw);
    };

    draw();
  };

  private handleSpeedLevelChange = (speedLevel: string) => {
    this.setState({ speedLevel });
  };

  onDeviceChange = (): void => {
    const workarea: WorkAreaModel = workareaManager.model;
    const { height, width } = getWorkarea(workarea);

    settings.machineWidth = width;
    settings.machineHeight = height;

    if (promarkModels.has(workarea)) {
      this.setState(({ workspace }) => ({ workspace: { ...workspace, g0Rate: 240000 } }));
    } else {
      this.setState(({ workspace }) => ({
        workspace: { ...workspace, g0Rate: defaultWorkspace.g0Rate },
      }));
    }

    this.updateGcode();
  };

  onPointerCancel = (e: { pointerId: any; preventDefault: () => void }) => {
    e.preventDefault();
    this.pointers = this.pointers.filter((x: { pointerId: any }) => x.pointerId !== e.pointerId);
    this.fingers = null;
  };

  onPointerUp = (e: { pointerId: any; pointerType: any; preventDefault: () => void }) => {
    e.preventDefault();

    if (!this.pointers.length || e.pointerType !== this.pointers[0].pointerType) {
      return;
    }

    this.pointers = this.pointers.filter((x: { pointerId: any }) => x.pointerId !== e.pointerId);
    this.fingers = null;
  };

  onPointerDown = (e: {
    button: number;
    pageX: number;
    pageY: number;
    pointerId: any;
    pointerType: string;
    preventDefault: () => void;
    target: { setPointerCapture: (arg0: any) => void };
  }) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);

    const pathPreviewPanelElem = document.getElementById('path-preview-panel') as HTMLElement;
    const p = { left: pathPreviewPanelElem.offsetLeft, top: pathPreviewPanelElem.offsetTop };

    if (this.pointers.length && e.pointerType !== this.pointers[0].pointerType) {
      this.pointers = [];
    }

    if (e.pointerType === 'mouse') {
      this.pointers = [
        {
          button: e.button,
          origPageX: e.pageX - p.left,
          origPageY: e.pageY - p.top,
          pageX: e.pageX - p.left,
          pageY: e.pageY - p.top,
          pointerId: e.pointerId,
          pointerType: e.pointerType,
        },
      ];
      this.fingers = null;
      this.adjustingCamera = true;

      return;
    }

    // Does not enable left key dragging when space is not pressed
    if (e.pointerType !== 'touch' && e.button === 0 && !this.spaceKey) {
      return;
    }

    this.pointers.push({
      button: e.button,
      origPageX: e.pageX - p.left,
      origPageY: e.pageY - p.top,
      pageX: e.pageX - p.left,
      pageY: e.pageY - p.top,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
    });
    this.moveStarted = false;
    this.fingers = null;
    this.adjustingCamera = true;
  };

  onPointerMove = (e: {
    pageX: number;
    pageY: number;
    pointerId: any;
    pointerType: string;
    preventDefault: () => void;
  }) => {
    const p = {
      left: document.getElementById('path-preview-panel')!.offsetLeft,
      top: document.getElementById('path-preview-panel')!.offsetTop,
    };

    e.preventDefault();

    const pointer = this.pointers.find((x: { pointerId: any }) => x.pointerId === e.pointerId);

    if (!pointer) {
      return;
    }

    const dx = e.pageX - p.left - pointer.pageX;
    const dy = pointer.pageY - e.pageY + p.top;

    if (this.adjustingCamera) {
      pointer.pageX = e.pageX - p.left;
      pointer.pageY = e.pageY - p.top;

      if (e.pointerType === 'mouse') {
        this.pan(dx, dy);
      } else if (e.pointerType === 'touch') {
        if (Math.abs(dx) >= 10 || Math.abs(dy) >= 10) {
          this.moveStarted = true;
        }

        if (!this.moveStarted) {
          return;
        }

        if (this.pointers.length === 1) {
          this.pan(dx, dy);
        } else if (this.pointers.length >= 2) {
          const centerX =
            this.pointers.reduce((acc: any, o: { pageX: any }) => acc + o.pageX, 0) / this.pointers.length;
          const centerY =
            this.pointers.reduce((acc: any, o: { pageY: any }) => acc + o.pageY, 0) / this.pointers.length;
          const distance = dist(
            this.pointers[0].pageX,
            this.pointers[0].pageY,
            this.pointers[1].pageX,
            this.pointers[1].pageY,
          );

          if (this.fingers && this.fingers.num === this.pointers.length) {
            if (this.pointers.length >= 2) {
              const d = distance - this.fingers.distance;
              const origCenterX =
                this.pointers.reduce((acc: any, o: { origPageX: any }) => acc + o.origPageX, 0) / this.pointers.length;
              const origCenterY =
                this.pointers.reduce((acc: any, o: { origPageY: any }) => acc + o.origPageY, 0) / this.pointers.length;

              this.zoom(origCenterX, origCenterY, Math.exp(-d / 200), dx, dy);
            }
          }

          this.fingers = {
            centerX,
            centerY,
            distance,
            num: this.pointers.length,
          };
        }
      }
    }
  };

  wheel = (e: { ctrlKey: any; deltaX: number; deltaY: number; pageX: number; pageY: number }) => {
    // @ts-ignore
    const p = {
      left: document.getElementById('path-preview-panel')!.offsetLeft,
      top: document.getElementById('path-preview-panel')!.offsetTop,
    };
    const mouseInputDevice = useGlobalPreferenceStore.getState()['mouse_input_device'];
    const isTouchpad = mouseInputDevice === 'TOUCHPAD';

    if (isTouchpad) {
      if (e.ctrlKey) {
        this.zoom(e.pageX - p.left, e.pageY - p.top, Math.exp(e.deltaY / 200));
      } else {
        this.pan(-e.deltaX, e.deltaY);
      }
    } else {
      this.zoom(e.pageX - p.left, e.pageY - p.top, Math.exp(e.deltaY / 400));
    }
  };

  transferTime = (time: number, spliter: ':' | 'unit' = 'unit'): string => {
    let h = 0;
    let m = 0;
    let s = 0;
    let restTime = time * this.timeDisplayRatio;

    if (restTime > 60) {
      h = Math.floor(restTime / 60);
      restTime %= 60;
    }

    if (restTime > 1) {
      m = Math.floor(restTime);
      s = Math.floor((restTime - m) * 60);
    } else {
      s = Math.round(restTime * 60);
    }

    let str = '';

    if (spliter === ':') {
      if (h) {
        str += `${h}:`;
      }

      const padLeftZero = (num: number) => (num >= 10 ? num.toString() : `0${num}`);

      str += `${str.length > 0 ? padLeftZero(m) : m}:`;
      str += padLeftZero(s);

      return str;
    }

    return `${h > 0 ? `${h} h ` : ''}${m > 0 ? `${m} m ` : ''}${s} s`;
  };

  private setScale = (scale: number) => {
    if (!this.canvas) {
      return;
    }

    const { camera } = this.state;
    const r = this.canvas.getBoundingClientRect();
    // @ts-ignore
    const cameraHeight = vec3.distance(camera.eye, camera.center);
    let newFovy = 2 * Math.atan(r.height / (2 * cameraHeight * scale));

    newFovy = Math.max(0.1, Math.min(Math.PI - 0.1, newFovy));

    this.setCameraAttrs({
      center: camera.center,
      eye: camera.eye,
      fovy: newFovy,
    });
  };

  private playerIntervalHandler = () => {
    const { speedLevel, workspace } = this.state;

    if (workspace.simTime >= this.simTimeMax) {
      this.handleSimTimeChange(this.simTimeMax);
      clearInterval(this.simInterval);
      this.simInterval = undefined;
      this.setState({ playState: PlayState.STOP });
    } else {
      this.handleSimTimeChange(workspace.simTime + SIM_TIME_MINUTE * speedRatio[speedLevel]);
    }
  };

  private handlePlay = () => {
    clearInterval(this.simInterval);

    const { workspace } = this.state;

    if (workspace.simTime >= this.simTimeMax) {
      this.handleSimTimeChange(0);
    }

    this.simInterval = setInterval(this.playerIntervalHandler, SIM_TIME_MS);
    this.setState({ playState: PlayState.PLAY });
  };

  private handleStop = () => {
    if (this.simInterval) {
      clearInterval(this.simInterval);
    }

    this.setState({ playState: PlayState.STOP });
    this.handleSimTimeChange(0);
  };

  private handlePause = () => {
    if (this.simInterval) {
      clearInterval(this.simInterval);
    }

    this.setState({ playState: PlayState.PAUSE });
  };

  private handleSimTimeChange = (value: number) => {
    const { workspace } = this.state;

    this.position = this.gcodePreview.getSimTimeInfo(Number(value)).position;
    this.setState({
      workspace: {
        ...workspace,
        simTime: Number(value),
      },
    });
  };

  private renderPlayButtons = () => {
    const { playState } = this.state;
    const LANG = i18n.lang.beambox.path_preview;
    const controlButtons = [];

    if (playState === PlayState.STOP) {
      controlButtons.push(<img key="play" onClick={this.handlePlay} src="img/Play.svg" title={LANG.play} />);
      controlButtons.push(<img className="disabled" key="stop" src="img/Stop.svg" title={LANG.stop} />);
    } else if (playState === PlayState.PLAY) {
      controlButtons.push(<img key="pause" onClick={this.handlePause} src="img/Pause.svg" title={LANG.pause} />);
      controlButtons.push(<img key="stop" onClick={this.handleStop} src="img/Stop.svg" title={LANG.stop} />);
    } else if (playState === PlayState.PAUSE) {
      controlButtons.push(<img key="play" onClick={this.handlePlay} src="img/Play.svg" title={LANG.play} />);
      controlButtons.push(<img key="stop" onClick={this.handleStop} src="img/Stop.svg" title={LANG.stop} />);
    }

    return <div className={styles['play-control']}>{controlButtons}</div>;
  };

  private renderPosition = () => {
    if (this.position === -1) {
      return '0, 0 mm';
    }

    return `${Math.round(this.position[0])}, ${Math.round(this.position[1])} mm`;
  };

  private renderSize = () => {
    if (
      Number.isNaN(this.gcodePreview.maxX) ||
      this.gcodePreview.maxX - this.gcodePreview.minX < 0 ||
      this.gcodePreview.maxY - this.gcodePreview.minY < 0
    ) {
      return '0 x 0 mm';
    }

    return `${Math.ceil(this.gcodePreview.maxX - this.gcodePreview.minX)} x ${Math.ceil(
      this.gcodePreview.maxY - this.gcodePreview.minY,
    )} mm`;
  };

  private renderSpeed = () => {
    const { speedLevel } = this.state;

    return `x ${speedRatio[speedLevel]}`;
  };

  private searchParams = (gcodeList: string[], target: number) => {
    const enableAutofocus = useDocumentStore.getState()['enable-autofocus'];
    let U = -1;
    let F = -1;
    let Z = -1;
    let laserDetected = false;
    let isEngraving = false;

    for (let i = target; i > 0; i -= 1) {
      if (U < 0) {
        const match = gcodeList[i].match(/G1 U([-0-9.]*)/);

        if (match && match[1]) {
          U = Number.parseInt(match[1], 10);
        }
      }

      if (F < 0) {
        const match = gcodeList[i].match(/G1 F([-0-9.]*)/);

        if (match && match[1]) {
          F = Number.parseInt(match[1], 10);
        }
      }

      if (!laserDetected) {
        if (gcodeList[i].includes('G1S0')) {
          isEngraving = false;
          laserDetected = true;
        } else if (gcodeList[i].includes('G1V0')) {
          isEngraving = true;
          laserDetected = true;
        }
      }

      if (enableAutofocus && Z < 0 && gcodeList[i].includes('Z')) {
        const res = gcodeList[i].match(/Z([-0-9.]*)/);

        if (res && res[1]) {
          Z = Number.parseInt(res[1], 10);
        }
      }

      if (F > 0 && U > 0 && laserDetected && (!enableAutofocus || (enableAutofocus && Z > -1))) {
        break;
      }
    }

    return {
      F,
      isEngraving,
      U,
      Z,
    };
  };

  private handleStartHere = async (): Promise<void> => {
    const { workspace } = this.state;
    const { device } = await getDevice();

    if (!device) {
      return;
    }

    const serialOk = await checkBlockedSerial(device.serial);

    if (!serialOk) {
      return;
    }

    const currentWorkarea = workareaManager.model;
    const allowedWorkareas = constant.allowedWorkarea[device.model];
    const documentState = useDocumentStore.getState();

    if (currentWorkarea && allowedWorkareas) {
      if (!allowedWorkareas.includes(currentWorkarea)) {
        alertCaller.popUp({
          id: 'workarea unavailable',
          message: i18n.lang.message.unavailableWorkarea,
          type: alertConstants.SHOW_POPUP_ERROR,
        });

        return;
      }
    }

    if (workspace.simTime === 0) {
      const vc = VersionChecker(device.version);

      if (!vc.meetRequirement('USABLE_VERSION')) {
        alertCaller.popUp({
          id: 'fatal-occurred',
          message: i18n.lang.beambox.popup.should_update_firmware_to_continue,
          type: alertConstants.SHOW_POPUP_ERROR,
        });

        return;
      }

      exportFuncs.uploadFcode(device);

      return;
    }

    const generateTaskThumbnail = async () => {
      const canvas = document.createElement('canvas');
      const { machineHeight, machineWidth } = settings;

      canvas.width = machineWidth;
      canvas.height = machineHeight;

      const gl = canvas.getContext('webgl', {
        alpha: true,
        depth: true,
        preserveDrawingBuffer: true,
      });
      const drawCommands = new DrawCommands(gl);

      drawCommands.createFrameBuffer(600, 400);

      const cameraHeight = 300;
      const fovy = 2 * Math.atan(canvas.height / (2 * cameraHeight));
      const { x, y } = this.jobOrigin ?? { x: 0, y: 0 };
      const camera = calcCamera({
        center: [machineWidth / 2 - x, -machineHeight / 2 + y, 0],
        eye: [machineWidth / 2 - x, -machineHeight / 2 + y, cameraHeight],
        far: 2000,
        fovy,
        machineX: 0,
        machineY: 0,
        near: 0.1,
        showPerspective: false,
        up: [0, 1, 0],
        viewportHeight: canvas.height,
        viewportWidth: canvas.width,
      });

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.94, 0.94, 0.94, 1);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);

      const programInfo = generateProgramInfo(gl);
      const buffer = initBuffers(gl, settings.machineWidth, settings.machineHeight, this.jobOrigin);

      drawScene(gl, programInfo, buffer, camera, false, false, true);
      this.grid.draw(drawCommands, {
        height: machineHeight,
        major: Math.max(settings.toolGridMajorSpacing, 1),
        minor: Math.max(settings.toolGridMinorSpacing, 0.1),
        offset: this.jobOrigin,
        perspective: camera.perspective,
        view: camera.view,
        width: machineWidth,
      });
      drawTaskPreview(this.gcodePreview, {}, canvas, drawCommands, workspace, camera, {
        showRemaining: true,
      });

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve));
      const url = URL.createObjectURL(blob);

      return {
        base64: canvas.toDataURL(),
        url,
      };
    };
    const { base64: thumbnail, url: thumbnailUrl } = await generateTaskThumbnail();
    const convertToFcodeAndUpload = async (gcode: string) => {
      const gcodeToFcodeRes = await exportFuncs.gcodeToFcode(gcode, thumbnail);

      if (!gcodeToFcodeRes) {
        alertCaller.popUpError({
          message: 'Failed to generate task: failed to convert fcode.',
        });

        return;
      }

      const { fcodeBlob, fileTimeCost } = gcodeToFcodeRes;
      const report = await deviceMaster.getReport();

      if (report) {
        const res = await checkDeviceStatus(device);

        if (res) {
          await exportFuncs.openTaskInDeviceMonitor(device, {
            blob: fcodeBlob,
            taskTime: fileTimeCost,
            thumbnailUrl,
          });
        }
      }
    };

    let modifiedGcodeList = Array<string>();

    if (workspace.simTime > 0 && workspace.simTime < this.simTimeMax - SIM_TIME_MINUTE / 2) {
      progressCaller.openNonstopProgress({
        caption: i18n.lang.beambox.popup.progress.calculating,
        id: 'path-preview',
      });
      try {
        const simTimeInfo = this.gcodePreview.getSimTimeInfo(Number(workspace.simTime));
        const gcodeList = this.gcodeString.split('\n');
        let target = 0;
        let count = -2;

        for (let i = 0; i < gcodeList.length; i += 1) {
          if (gcodeList[i].includes('G1')) {
            count += 1;
          }

          if (count === simTimeInfo.index) {
            target = i;
            break;
          }
        }

        const preparation: string[] = [];

        for (let i = 0; i < gcodeList.length; i += 1) {
          preparation.push(gcodeList[i]);

          if (gcodeList[i].includes('F7500')) {
            break;
          }
        }

        if (useGlobalPreferenceStore.getState()['fast_gradient']) {
          if (!this.fastGradientGcodeString) {
            const fastGradientGcodeBlob = await exportFuncs.getFastGradientGcode();

            this.fastGradientGcodeString = await new Promise<string>((resolve) => {
              const fileReader = new FileReader();

              fileReader.onloadend = (e) => {
                resolve(e.target.result as string);
              };
              fileReader.readAsText(fastGradientGcodeBlob as Blob);
            });
          }

          let resolution = 0;
          let prefix;
          const fastGradientGcodeList = this.fastGradientGcodeString.split('\n');
          let isFastGradientEngraving = false;
          let targetY;

          // check if is fast gradient engraving and get target Y
          for (let i = target + 1; i > 0; i -= 1) {
            const matchX = gcodeList[i].match(/X(-?[0-9.]*)/);
            const matchY = gcodeList[i].match(/Y(-?[0-9.]*)/);
            const x = matchX ? matchX[1] : '';
            const y = matchY ? matchY[1] : '';

            if ((x && !y) || (!x && y)) {
              isFastGradientEngraving = true;
            }

            if (x && y && !isFastGradientEngraving) {
              break;
            }

            if (isFastGradientEngraving && y) {
              targetY = Number(y);
              break;
            }
          }

          if (isFastGradientEngraving) {
            // get resolution and prefix gcode
            let yFound = false;
            let cacheIndex = -1;
            let startX = -1;
            let startBytesIndex = -1;
            let engravingLineCount = 0;
            let resolutionLine = '';

            for (let i = 0; i < fastGradientGcodeList.length - 2; i += 1) {
              if (fastGradientGcodeList[i].includes('F16 1')) {
                const res = fastGradientGcodeList[i].match(/F16 1 ([H|M|L])/);

                switch (res[1]) {
                  case 'H':
                    resolution = 0.05;
                    break;
                  case 'M':
                    resolution = 0.1;
                    break;
                  case 'L':
                    resolution = 0.2;
                    break;
                  default:
                    break;
                }

                resolutionLine = fastGradientGcodeList[i];
              } else if (!prefix && fastGradientGcodeList[i].includes('G1 F')) {
                prefix = fastGradientGcodeList.slice(0, i + 1);
              }

              if (
                !yFound &&
                fastGradientGcodeList[i].includes('Y') &&
                (fastGradientGcodeList[i + 1]?.indexOf('F16 2') > -1 ||
                  fastGradientGcodeList[i + 2]?.indexOf('F16 2') > -1)
              ) {
                const matchY = fastGradientGcodeList[i].match(/Y([0-9.]*)/);
                const y = matchY ? Number(matchY[1]) : null;

                if (y === targetY) {
                  const matchX = fastGradientGcodeList[i].match(/X([0-9.]*)/);
                  const x = Number(matchX[1]);

                  cacheIndex = i;
                  startX = x;
                }

                i += 1;
                continue;
              }

              if (cacheIndex > -1) {
                if (fastGradientGcodeList[i].includes('F16 3')) {
                  if (startBytesIndex < 0) {
                    startBytesIndex = i;
                  }

                  engravingLineCount += 1;
                }

                if (fastGradientGcodeList[i].includes('F16 4')) {
                  const distBytesCalculation = Math.abs((simTimeInfo.position[0] - startX) / (32 * resolution));
                  const paddingEmptyBytes = Math.floor(distBytesCalculation);

                  if (engravingLineCount > distBytesCalculation) {
                    modifiedGcodeList = prefix;

                    const { F, U, Z } = this.searchParams(fastGradientGcodeList, cacheIndex);

                    if (documentState['enable-autofocus'] && Z > -1) {
                      modifiedGcodeList.push('G1 Z-1.0000');
                      modifiedGcodeList.push(`G1 Z${Z}`);
                    }

                    modifiedGcodeList.push(`G1 U${U}`);
                    modifiedGcodeList.push(`G1 F${F}`);

                    if (modifiedGcodeList.lastIndexOf('F16 5') > modifiedGcodeList.lastIndexOf(resolutionLine)) {
                      modifiedGcodeList.push(resolutionLine);
                    }

                    for (let j = cacheIndex; j < startBytesIndex; j += 1) {
                      modifiedGcodeList.push(fastGradientGcodeList[j]);
                    }

                    for (let j = 0; j < paddingEmptyBytes; j += 1) {
                      modifiedGcodeList.push('F16 3 0');
                    }

                    const fixedIndex = startBytesIndex + paddingEmptyBytes;
                    const matchByteInfo = fastGradientGcodeList[fixedIndex].match(/F16 3 ([-0-9]*)/);
                    const bytesInfo = Number.parseInt(matchByteInfo[1], 10);
                    const smallDist = Math.floor((distBytesCalculation - Math.floor(distBytesCalculation)) * 32);
                    let bitwiseOperand = '';

                    for (let d = 0; d < 32; d += 1) {
                      if (d < smallDist) {
                        bitwiseOperand += '0';
                      } else {
                        bitwiseOperand += '1';
                      }
                    }

                    modifiedGcodeList.push(`F16 3 ${bytesInfo & (bitwiseOperand as any)}`);
                    modifiedGcodeList = modifiedGcodeList.concat(fastGradientGcodeList.slice(fixedIndex + 1));

                    convertToFcodeAndUpload(modifiedGcodeList.join('\n'));
                    break;
                  } else {
                    yFound = false;
                    cacheIndex = -1;
                    startX = -1;
                    startBytesIndex = -1;
                    engravingLineCount = 0;
                    resolutionLine = '';
                  }
                }
              }
            }
          } else {
            for (let i = 0; i < fastGradientGcodeList.length - 1; i += 1) {
              if (
                fastGradientGcodeList[i].includes('G1') &&
                fastGradientGcodeList[i].includes('X') &&
                fastGradientGcodeList[i].includes('Y')
              ) {
                const matchX = fastGradientGcodeList[i].match(/X([0-9.]*)/);
                const matchY = fastGradientGcodeList[i].match(/Y([0-9.]*)/);

                if (matchX && matchY) {
                  const x = Number(matchX[1]);
                  const y = Number(matchY[1]);

                  if (Math.abs(x - simTimeInfo.next[0]) < 0.001 && Math.abs(y + simTimeInfo.next[1]) < 0.001) {
                    target = i;
                    break;
                  }
                }
              }
            }

            const { F, isEngraving, U, Z } = this.searchParams(fastGradientGcodeList, target);

            if (documentState['enable-autofocus'] && Z > 0) {
              preparation.push('G1 Z-1.0000');
              preparation.push(`G1 Z${Z}`);
            }

            preparation.push(`G1 U${U}`);
            preparation.push(`G1 X${simTimeInfo.position[0].toFixed(4)} Y${simTimeInfo.position[1].toFixed(4)}`);
            preparation.push(`G1 F${F}`);
            preparation.push(`G1${isEngraving ? 'V' : 'S'}0`);

            modifiedGcodeList = preparation.concat(fastGradientGcodeList.slice(target));

            convertToFcodeAndUpload(modifiedGcodeList.join('\n'));
          }
        } else {
          const { F, isEngraving, U, Z } = this.searchParams(gcodeList, target);

          if (documentState['enable-autofocus']) {
            preparation.push('G1 Z-1.0000');
            preparation.push(`G1 Z${Z}`);
          }

          preparation.push(`G1 U${U}`);
          preparation.push(`G1 X${simTimeInfo.position[0].toFixed(4)} Y${simTimeInfo.position[1].toFixed(4)}`);
          preparation.push(`G1 F${F}`);
          preparation.push(`G1${isEngraving ? 'V' : 'S'}0`);

          modifiedGcodeList = preparation.concat(gcodeList.slice(target));
          convertToFcodeAndUpload(modifiedGcodeList.join('\n'));
        }
      } catch (error) {
        console.error(error);
        alertCaller.popUpError({
          message: `Failed to generate task ${error}`,
        });
      } finally {
        progressCaller.popById('path-preview');
      }
    }
  };

  private toggleIsInverting = () => {
    const { isInverting } = this.state;

    this.setState({ isInverting: !isInverting });
  };

  private toggleTraversalMoves = () => {
    const { workspace } = this.state;

    this.setState({ workspace: { ...workspace, showTraversal: !workspace.showTraversal } });
  };

  zoom(pageX: number, pageY: number, amount: number, panX = 0, panY = 0): void {
    if (!this.canvas) {
      return;
    }

    const r = this.canvas.getBoundingClientRect();
    const { camera } = this.state;
    const newFovy = Math.max(0.1, Math.min(Math.PI - 0.1, camera.fovy * amount));
    // @ts-ignore
    const oldScale = (vec3.distance(camera.eye, camera.center) * Math.tan(camera.fovy / 2)) / (r.height / 2);
    // @ts-ignore
    const newScale = (vec3.distance(camera.eye, camera.center) * Math.tan(newFovy / 2)) / (r.height / 2);
    const dx = Math.round(pageX - (r.left + r.right) / 2) * (newScale - oldScale);
    const dy = Math.round(-pageY + (r.top + r.bottom) / 2) * (newScale - oldScale);
    const scaledPanX = panX * newScale;
    const scaledPanY = panY * newScale;
    // @ts-ignore
    const adjX = vec3.scale(
      [],
      vec3.cross([], vec3.normalize([], vec3.sub([], camera.center, camera.eye)), camera.up),
      -dx - scaledPanX,
    );
    // @ts-ignore
    const adjY = vec3.scale([], camera.up, -dy - scaledPanY);
    // @ts-ignore
    const adj = vec3.add([], adjX, adjY);
    // @ts-ignore
    const newEye = vec3.add([], camera.eye, adj);

    this.setCameraAttrs({
      // @ts-ignore
      center: vec3.add([], camera.center, adj),
      eye: newEye,
      fovy: newFovy,
    });
  }

  private pan(dx: number, dy: number) {
    const { camera, height, width } = this.state;
    const { view } = calcCamera({
      center: [0, 0, 0],
      // @ts-ignore
      eye: [0, 0, vec3.distance(camera.eye, camera.center)],
      far: 2000,
      fovy: camera.fovy,
      machineX: settings.machineBottomLeftX,
      machineY: settings.machineBottomLeftY,
      near: 0.1,
      showPerspective: false,
      up: [0, 1, 0],
      viewportHeight: height,
      viewportWidth: width,
    });
    const scale = 2 / width / view[0];
    const scaledDx = dx * scale;
    const scaledDy = dy * scale;
    // @ts-ignore
    const n = vec3.normalize([], vec3.cross([], camera.up, vec3.sub([], camera.eye, camera.center)));

    // console.log(camera);
    this.setCameraAttrs({
      // @ts-ignore
      center: vec3.add(
        [],
        camera.center,
        // @ts-ignore
        vec3.add([], vec3.scale([], n, -scaledDx), vec3.scale([], camera.up, -scaledDy)),
      ),
      // @ts-ignore
      eye: vec3.add(
        [],
        camera.eye,
        // @ts-ignore
        vec3.add([], vec3.scale([], n, -scaledDx), vec3.scale([], camera.up, -scaledDy)),
      ),
    });
  }

  renderDataBlock(label: string, value: string): React.JSX.Element {
    return (
      <div className="data-block">
        <div className="item">{label}</div>
        <div className="value">{value}</div>
      </div>
    );
  }

  render(): React.JSX.Element {
    const { height, isInverting, playState, speedLevel, width, workspace } = this.state;
    const LANG = i18n.lang.beambox.path_preview;

    return (
      <div className={styles.container}>
        <div className={styles.main} id="path-preview-panel" style={{ touchAction: 'none', userSelect: 'none' }}>
          <Pointable
            onPointerCancel={this.onPointerCancel}
            onPointerDown={this.onPointerDown}
            onPointerMove={this.onPointerMove}
            onPointerUp={this.onPointerUp}
            onWheel={this.wheel}
            style={{ height, width }}
            touchAction="none"
          >
            <canvas
              height={Math.round(height * window.devicePixelRatio)}
              ref={this.setCanvas}
              style={{ height, width }}
              width={Math.round(width * window.devicePixelRatio)}
            />
          </Pointable>
          <div className={styles['tools-panel']}>
            <ProgressBar
              handleSimTimeChange={this.handleSimTimeChange}
              simTime={workspace.simTime}
              simTimeMax={this.simTimeMax}
            />
            <div className={styles.options}>
              {this.renderPlayButtons()}
              <div className={styles['speed-control']}>
                <div className={styles.label}>{LANG.play_speed}</div>
                <input
                  id="speed"
                  max={4}
                  min={0}
                  onChange={(e) => this.handleSpeedLevelChange(e.target.value)}
                  step="1"
                  type="range"
                  value={speedLevel}
                />
                <div>{this.renderSpeed()}</div>
              </div>
              <div className={styles['switch-control']}>
                <div className={styles.control}>
                  <Switch
                    checked={workspace.showTraversal}
                    className={styles.switch}
                    id="show_traversal"
                    onChange={this.toggleTraversalMoves}
                    size="small"
                  />
                </div>
                <label className={styles.label} htmlFor="show_traversal">
                  {LANG.travel_path}
                </label>
              </div>
              <div className={styles['switch-control']}>
                <div className={styles.control}>
                  <Switch
                    checked={isInverting}
                    className={styles.switch}
                    id="invert_color"
                    onChange={this.toggleIsInverting}
                    size="small"
                  />
                </div>
                <label className={styles.label} htmlFor="invert_color">
                  {LANG.invert}
                </label>
              </div>
              <div className={styles['current-time']}>{this.transferTime(workspace.simTime, ':')}</div>
              <div />
            </div>
          </div>
          <ZoomBlock
            className={styles['zoom-block']}
            getZoom={() => this.camera.scale}
            resetView={this.resetView}
            setZoom={this.setScale}
          />
        </div>
        <SidePanel
          currentPosition={this.renderPosition()}
          cutDist={`${Math.round(this.gcodePreview.g1DistReal)} mm`}
          estTime={this.transferTime(this.simTimeMax)}
          handleStartHere={this.handleStartHere}
          isStartHereEnabled={playState !== PlayState.PLAY}
          lightTime={this.transferTime(this.gcodePreview.g1TimeReal)}
          rapidDist={`${Math.round(this.gcodePreview.g0DistReal)} mm`}
          rapidTime={this.transferTime(this.gcodePreview.g0TimeReal)}
          size={this.renderSize()}
        />
      </div>
    );
  }
}

export default PathPreview;
