// Not all domain listed, only list some important ones.
export interface IIcon {
    id: string,
    term: string,
    icon_url?: string,
    preview_url: string,
    preview_url_42: string,
    preview_url_84: string,
    uploader: {
        location: string,
        name: string,
        username: string,
    },
    uploader_id: string,
    isDefault?: boolean,
}

export interface IData {
    generated_at: string,
    icons: IIcon[],
}