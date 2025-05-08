import deviceMaster from '@core/helpers/device-master';

type FileMap = {
  fisheye: 'checkpoint.json' | 'fisheye_params.json' | 'wide-angle.json';
};

export const uploadJson = async <D extends keyof FileMap, N extends FileMap[D], T>(
  data: T,
  directory: D,
  fileName: N,
): Promise<void> => {
  const dataString = JSON.stringify(data);
  const dataBlob = new Blob([dataString], { type: 'application/json' });

  await deviceMaster.uploadToDirectory(dataBlob, directory, fileName);
};

export const loadJson = async <D extends keyof FileMap, N extends FileMap[D]>(
  directory: D,
  fileName: N,
): Promise<unknown> => {
  try {
    const data = await deviceMaster.downloadFile(directory, fileName);
    const [, blob] = data;
    const dataString = await (blob as Blob).text();

    return JSON.parse(dataString);
  } catch (err) {
    console.log('Fail to load data', err instanceof Error ? err?.message : err);
    throw new Error(`Unable to load data ${directory} ${fileName}`);
  }
};
