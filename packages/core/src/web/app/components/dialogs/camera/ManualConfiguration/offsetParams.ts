import type {
  FisheyeCameraParametersV2,
  FisheyeCameraParametersV3,
  FisheyeCameraParametersV4,
  WideAngleRegion,
} from '@core/interfaces/FisheyePreview';

/** every saved fisheye format that carries the manual `offset` (V1 is deprecated and has none) */
export type OffsetParams = FisheyeCameraParametersV2 | FisheyeCameraParametersV3 | FisheyeCameraParametersV4;

export const isOffsetParams = (data: unknown): data is OffsetParams =>
  typeof data === 'object' && data !== null && [2, 3, 4].includes((data as OffsetParams).v);

export type RegionOffsets = Record<WideAngleRegion, [number, number]>;

/** laid out like the bed, row by row; same keys as the V4 polyfits */
export const REGIONS: WideAngleRegion[] = [
  'topLeft',
  'top',
  'topRight',
  'left',
  'center',
  'right',
  'bottomLeft',
  'bottom',
  'bottomRight',
];

export const sameForAll = (xy: [number, number]): RegionOffsets =>
  Object.fromEntries(REGIONS.map((region) => [region, xy])) as RegionOffsets;

/** all nine regions carry the same pair: the table was written from the single-offset mode */
export const isUniform = (regions: RegionOffsets): boolean =>
  REGIONS.every((region) => regions[region][0] === regions.topLeft[0] && regions[region][1] === regions.topLeft[1]);

export interface ParamsSource {
  /** fetch once and share: two blocks may edit different fields of the same file */
  load: () => Promise<null | OffsetParams>;
  /** merge a patch into the latest params, write the whole file, keep the merged copy for the next save */
  save: (patch: Partial<Pick<FisheyeCameraParametersV4, 'offset' | 'region_offsets'>>) => Promise<void>;
}

/**
 * One stored params file (or store entry) as a shared source. Saves are merged into one cached object,
 * so the second block saving right after the first never writes stale fields back.
 */
export const createParamsSource = (
  read: () => Promise<unknown>,
  write: (params: OffsetParams) => Promise<void>,
): ParamsSource => {
  let cached: null | OffsetParams | undefined;
  let loading: Promise<null | OffsetParams> | undefined;

  const load = () => {
    loading ??= read()
      .then((data) => (isOffsetParams(data) ? data : null))
      .catch(() => null)
      .then((params) => {
        cached = params;

        return params;
      });

    return loading;
  };

  const save = async (patch: Partial<Pick<FisheyeCameraParametersV4, 'offset' | 'region_offsets'>>) => {
    const next = { ...cached!, ...patch } as OffsetParams;

    await write(next);
    cached = next;
  };

  return { load, save };
};
