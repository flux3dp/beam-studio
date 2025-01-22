interface IWrappedTaskFile {
  data: ArrayBuffer | string;
  extension: string;
  index: number;
  name: string;
  size: number;
  thumbnailSize: number;
  totalFiles: number;
  type: string;
  uploadName: string;
}

interface IWrappedSwiftrayTaskFile {
  data: string;
  extension: string; // currently unused
  name: string; // currently unused
  thumbnail: string; // currently unused
  uploadName: string; // currently unused
}

export { IWrappedSwiftrayTaskFile, IWrappedTaskFile };
