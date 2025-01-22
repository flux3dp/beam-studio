import getClipperLib from './getClipperLib';

const ctx: Worker = self as unknown as Worker;
const ClipperLib = getClipperLib();
let instance: any;
let type: 'clipper' | 'offset';

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
    const { endType, joinType, path } = data;

    instance.AddPaths(path, joinType, endType);
    ctx.postMessage({ id });
  } else if (cmd === 'execute') {
    const { args } = data;

    instance.Execute(...args);

    const res = type === 'offset' ? args[0] : args[1];

    ctx.postMessage({ data: res, id });
  }
};

export default null;
