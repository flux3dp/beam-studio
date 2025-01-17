export const LINKTYPE_CORNER = 0;
export const LINKTYPE_SMOOTH = 1; // same direction, different dist
export const LINKTYPE_SYMMETRIC = 2; // same direction, same dist
export type NodeLinkType = typeof LINKTYPE_CORNER |
                           typeof LINKTYPE_SMOOTH |
                           typeof LINKTYPE_SYMMETRIC;
