import { renderHook } from '@testing-library/react';

import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';

import {
  checkInnerEngraving,
  disableInnerEngraving,
  enableInnerEngraving,
  getInnerEngraving,
  isInnerEngravingActive,
  resolveInnerEngravingActive,
  supportInnerEngraving,
  useInnerEngravingActive,
} from './innerEngraving';

jest.mock('@core/app/stores/documentStore');
jest.mock('@core/helpers/checkFeature');
jest.mock('@core/helpers/device/promark/promark-info');

const desktopInfo = { laserType: LaserType.Desktop, watt: 20 } as const;
const uvInfo = { laserType: LaserType.UV, watt: 5 } as const;

describe('inner engraving add-on', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPromarkInfo(desktopInfo);
    useDocumentStore.setState({
      'customized-dimension': { fpm1: { height: 70, width: 70 } },
      'inner-engraving': false,
      workarea: 'fbb1b',
    });
  });

  test('supports inner engraving only on the 70x70 fpm1 work area with a UV laser source', () => {
    expect(supportInnerEngraving('fpm1', uvInfo)).toBe(true);
    expect(supportInnerEngraving('fpm1', desktopInfo)).toBe(false);
    expect(supportInnerEngraving('fbb1b', uvInfo)).toBe(false);
    expect(
      supportInnerEngraving('fpm1', uvInfo, {
        fpm1: { height: 110, width: 110 },
      }),
    ).toBe(false);
  });

  test('exposes capability and effective-state helpers', () => {
    expect(checkInnerEngraving({ promarkInfo: uvInfo, workarea: 'fpm1' })).toBe(true);
    expect(
      checkInnerEngraving({
        promarkInfo: uvInfo,
        values: { 'customized-dimension': { fpm1: { height: 200, width: 200 } } },
        workarea: 'fpm1',
      }),
    ).toBe(false);
    expect(
      getInnerEngraving({
        promarkInfo: uvInfo,
        values: { 'inner-engraving': true, workarea: 'fpm1' },
      }),
    ).toBe(true);
    expect(
      getInnerEngraving({
        promarkInfo: uvInfo,
        values: { 'inner-engraving': false, workarea: 'fpm1' },
      }),
    ).toBe(false);
  });

  test('enables the document flag and PromarkInfo, and can build a draft without runtime changes', () => {
    const update = jest.fn();

    enableInnerEngraving({ promarkInfo: uvInfo, update });

    expect(update).toHaveBeenCalledWith({
      'customized-dimension': { fpm1: { height: 70, width: 70 } },
      'inner-engraving': true,
    });
    expect(getPromarkInfo()).toEqual(uvInfo);

    setPromarkInfo(desktopInfo);
    enableInnerEngraving({ applyRuntime: false, update });
    expect(getPromarkInfo()).toEqual(desktopInfo);

    disableInnerEngraving({ update });
    expect(update).toHaveBeenLastCalledWith({ 'inner-engraving': false });
  });

  test('resolves the document toggle together with the add-on and PromarkInfo', () => {
    expect(resolveInnerEngravingActive({ 'inner-engraving': true, workarea: 'fpm1' }, uvInfo)).toBe(true);
    expect(resolveInnerEngravingActive({ 'inner-engraving': false, workarea: 'fpm1' }, uvInfo)).toBe(false);
    expect(resolveInnerEngravingActive({ 'inner-engraving': true, workarea: 'fpm1' }, desktopInfo)).toBe(false);
    expect(resolveInnerEngravingActive({ 'inner-engraving': true, workarea: 'fbb1b' }, uvInfo)).toBe(false);
  });

  test('reads the current PromarkInfo in both imperative and hook forms', () => {
    setPromarkInfo(uvInfo);
    useDocumentStore.setState({
      'customized-dimension': { fpm1: { height: 70, width: 70 } },
      'inner-engraving': true,
      workarea: 'fpm1',
    });

    expect(isInnerEngravingActive()).toBe(true);
    expect(renderHook(() => useInnerEngravingActive()).result.current).toBe(true);
  });
});
