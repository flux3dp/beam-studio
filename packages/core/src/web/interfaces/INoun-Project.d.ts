// Not all domain listed, only list some important ones.
export interface IIcon {
  icon_url?: string;
  id: string;
  isDefault?: boolean;
  preview_url: string;
  preview_url_42: string;
  preview_url_84: string;
  term: string;
  uploader: {
    location: string;
    name: string;
    username: string;
  };
  uploader_id: string;
}

export interface IData {
  generated_at: string;
  icons: IIcon[];
}
