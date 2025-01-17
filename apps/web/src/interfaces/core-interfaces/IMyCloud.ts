export interface IFile {
  uuid: string;
  name: string;
  size: number;
  thumbnail_url: string | null;
  workarea: string | null;
  created_at: string;
  last_modified_at: string;
}
