import getClipperLib from './getClipperLib';

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as unknown as Worker;
const ClipperLib = getClipperLib();
let instance: any;
let type: 'offset' | 'clipper';
ctx.onmessage = async (e) => {
  const { cmd, data, id } = e.data;
  console.log('clipper.worker.ts', cmd, data, id);
  if (cmd === 'initOffset') {
    const { args } = data;
    instance = new ClipperLib.ClipperOffset(...args);
    type = 'offset';
    ctx.postMessage({ id });
  } else if (cmd === 'initClipper') {
    const { args } = data;
    instance = new ClipperLib.Clipper(...args);
    type = 'clipper';
    ctx.postMessage({ id });
  } else if (cmd === 'addPaths') {
    const { path, joinType, endType } = data;
    instance.AddPaths(path, joinType, endType);
    ctx.postMessage({ id });
  } else if (cmd === 'execute') {
    const { args } = data;
    instance.Execute(...args);
    const res = type === 'offset' ? args[0] : args[1];
    ctx.postMessage({ id, data: res });
  }
};

export default null;
