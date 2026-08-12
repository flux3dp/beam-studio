export interface IFile {
  created_at: string;
  /**
   * Whether the file is an inner engraving (3D) document.
   *
   * Optional because the cloud listing does not carry it yet — the local browser reads it out of
   * the .beam header, and 【Flux-id】 is to add the matching metadata field to the list API. Read it
   * through `isInnerEngravingFile`, never by guessing from the work area.
   */
  innerEngraving?: boolean;
  last_modified_at: string;
  name: string;
  size: number;
  thumbnail_url: null | string;
  uuid: string;
  workarea: null | string;
}
