export interface IFont {
    family?: string,
    postscriptName?: string,
    style?: string,
}

export interface IFontQuery {
    family: string,
    style?: string,
    weight?: number,
    italic?: boolean //not sure about type
}
