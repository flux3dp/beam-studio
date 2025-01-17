import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ChangeLog from './ChangeLog';

jest.mock('helpers/i18n', () => ({
  lang: {
    change_logs: {
      change_log: 'Change Logs:',
      added: 'Added:',
      fixed: 'Fixed:',
      changed: 'Changed:',
      see_older_version: 'See Older Versions',
      help_center_url: 'https://support.flux3dp.com/hc/en-us/sections/360000421876',
    },
  },
  getActiveLang: () => 'en',
}));

const mockOpen = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

jest.mock('implementations/changelog', () => ({
  CHANGES_TW: {
    added: [
      '提升「銳化」功能，高品質照片雕刻，讓照片更細緻與立體感。',
      '新增 為 Beam Studio 評分功能。',
    ],
    fixed: ['提升匯入 SVG 檔案的速度。', '提升「解散圖檔」的速度。'],
    changed: [
      '移除偏好設定內「文字路徑計算優化」設定，並且預設開啟。',
      '更改物件群組後圖層歸屬邏輯。\n- 當選取物件圖層一致時，群組後的新物件會在原圖層。\n- 當選取物件圖層不一致時，群組後的新物件會建立在選取物件中的最上層。',
    ],
  },
  CHANGES_EN: {
    added: [
      'Enhance the "Sharpen" function. High-quality photo engraving and make photos engrave result more detailed.',
      'Added "Rate for Beam Studio" function.',
    ],
    fixed: [
      'Increase the speed of import the SVG file.',
      'Increase the speed of the "Disassemble" function.',
    ],
    changed: ['changed: 1', 'changed: 2'],
  },
}));

window.FLUX.version = '1.2.3';

describe('test ChangeLog', () => {
  it('should render correctly', () => {
    const onClose = jest.fn();
    const { baseElement, getByText } = render(<ChangeLog onClose={onClose} />);
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByText('OK'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText('See Older Versions'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenLastCalledWith(
      'https://support.flux3dp.com/hc/en-us/sections/360000421876'
    );
  });
});
