export interface IFileThumbnail {
  isVisible: boolean;
  key: string;
  src: string;
}

export interface IMyCloudFileThumbnail {
  is_visible: boolean;
  key: string;
  url: null | string;
}

export interface IFile {
  created_at: string;
  is_public: boolean;
  is_template: boolean;
  last_modified_at: string;
  name: string;
  size: number;
  thumbnail_url: null | string;
  thumbnails?: IFileThumbnail[];
  thumbnails_data?: IMyCloudFileThumbnail[];
  uuid: string;
  workarea: null | string;
}
