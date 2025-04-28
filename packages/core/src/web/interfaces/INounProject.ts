export interface IIcon {
  hidden?: boolean;
  id: string;
  thumbnail_url: string;
}

export interface IData {
  icons: IIcon[];
  next_page: string;
}
