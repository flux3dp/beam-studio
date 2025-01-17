interface IWrappedTaskFile {
  data: string | ArrayBuffer;
  name: string;
  uploadName: string;
  extension: string;
  type: string;
  size: number;
  thumbnailSize: number;
  index: number;
  totalFiles: number;
}

interface IWrappedSwiftrayTaskFile {
  data: string;
  name: string; // currently unused
  uploadName: string; // currently unused
  extension: string; // currently unused
  thumbnail: string; // currently unused
}

export {
  IWrappedTaskFile,
  IWrappedSwiftrayTaskFile
}
