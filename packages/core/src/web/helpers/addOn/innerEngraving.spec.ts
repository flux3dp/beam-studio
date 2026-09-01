import { renderHook } from '@testing-library/react';

import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { setPromarkInfo } from '@core/helpers/device/promark/promark-info';

import {
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
    useDocumentStore.setState({ 'inner-engraving': false, workarea: 'fbb1b' });
  });

  test('supports inner engraving only on fpm1 with a UV laser source', () => {
    expect(supportInnerEngraving('fpm1', uvInfo)).toBe(true);
    expect(supportInnerEngraving('fpm1', desktopInfo)).toBe(false);
    expect(supportInnerEngraving('fbb1b', uvInfo)).toBe(false);
  });

  test('resolves the document toggle together with the add-on and PromarkInfo', () => {
    expect(resolveInnerEngravingActive({ 'inner-engraving': true, workarea: 'fpm1' }, uvInfo)).toBe(true);
    expect(resolveInnerEngravingActive({ 'inner-engraving': false, workarea: 'fpm1' }, uvInfo)).toBe(false);
    expect(resolveInnerEngravingActive({ 'inner-engraving': true, workarea: 'fpm1' }, desktopInfo)).toBe(false);
    expect(resolveInnerEngravingActive({ 'inner-engraving': true, workarea: 'fbb1b' }, uvInfo)).toBe(false);
  });

  test('reads the current PromarkInfo in both imperative and hook forms', () => {
    setPromarkInfo(uvInfo);
    useDocumentStore.setState({ 'inner-engraving': true, workarea: 'fpm1' });

    expect(isInnerEngravingActive()).toBe(true);
    expect(renderHook(() => useInnerEngravingActive()).result.current).toBe(true);
  });
});
