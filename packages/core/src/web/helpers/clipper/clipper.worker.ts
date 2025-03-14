import getClipperLib from './getClipperLib';

const ClipperLib = getClipperLib();
let instance: any;
let type: 'clipper' | 'offset';

onmessage = async ({ data: { cmd, data, id } }) => {
  if (!cmd) return;

  const startTime = performance.now();

  if (cmd === 'initOffset') {
    const { args } = data;

    instance = new ClipperLib.ClipperOffset(...args);
    type = 'offset';

    postMessage({ id });
  } else if (cmd === 'initClipper') {
    const { args } = data;

    instance = new ClipperLib.Clipper(...args);
    type = 'clipper';

    postMessage({ id });
  } else if (cmd === 'addPaths') {
    const { endType, joinType, path } = data;

    instance.AddPaths(path, joinType, endType);
    postMessage({ id });
  } else if (cmd === 'execute') {
    const { args } = data;

    instance.Execute(...args);

    const res = type === 'offset' ? args[0] : args[1];

    postMessage({ data: res, id });
  }

  console.log('clipper.worker.ts operationTime', performance.now() - startTime);
};
