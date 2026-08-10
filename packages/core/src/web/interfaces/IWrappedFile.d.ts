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
  /**
   * Inner engraving meshes, keyed by the id of their `data-stl` projection rect in `data`.
   *
   * Base64 of the original STL file bytes. Sent as a sibling of `file` in the `loadSVG` payload,
   * not inside it — `swiftrayClient.loadSVG` lifts it out.
   */
  stlObjects?: Record<string, string>;
  thumbnail: string; // currently unused
  uploadName: string; // currently unused
}

export { IWrappedSwiftrayTaskFile, IWrappedTaskFile };
