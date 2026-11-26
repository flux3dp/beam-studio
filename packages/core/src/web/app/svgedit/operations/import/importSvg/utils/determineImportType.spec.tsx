import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { sprintf } from 'sprintf-js';

import RadioSelectDialog from '@core/app/components/dialogs/RadioSelectDialog';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import langTw from '@core/app/lang/zh-tw';
import i18n from '@core/helpers/i18n';
import type { ImportType } from '@core/interfaces/ImportSvg';

const mockShowRadioSelectDialog = jest.fn();
const mockOpen = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showRadioSelectDialog: (...args: unknown[]) => mockShowRadioSelectDialog(...args),
}));
jest.mock('@core/implementations/browser', () => ({ open: (...args: unknown[]) => mockOpen(...args) }));

import { determineImportType } from './determineImportType';
import type { SvgSource } from './detectSvgSource';

describe('determineImportType export guide', () => {
  const laser = LayerModule.LASER_10W_DIODE;
  const { lang } = i18n;

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowRadioSelectDialog.mockResolvedValue('layer');
    useGlobalPreferenceStore.getState().set('1-import-type', 'color');
  });

  test.each<[SvgSource, string, string]>([
    ['illustrator', 'Adobe Illustrator', '4405279401487'],
    ['affinity', 'Affinity Designer', '360001558716'],
    ['inkscape', 'Inkscape', '4405279437839'],
  ])('opens the %s guide and preserves the selected layering option', async (source, name, article) => {
    await expect(determineImportType(undefined, laser, false, lang, source)).resolves.toBe('layer');

    const props = mockShowRadioSelectDialog.mock.calls[0][0];
    const onOk = jest.fn();
    const onCancel = jest.fn();
    const { getByRole } = render(<RadioSelectDialog<ImportType> {...props} onCancel={onCancel} onOk={onOk} />);
    const link = getByRole('link', { name: sprintf(lang.beambox.popup.import_svg.export_guide, name) });
    const url = `https://support.flux3dp.com/hc/en-us/articles/${article}`;

    expect(link).toHaveAttribute('href', url);
    expect(getByRole('radio', { name: lang.beambox.popup.layer_by_color })).toBeChecked();
    fireEvent.click(getByRole('radio', { name: lang.beambox.popup.nolayer }));
    fireEvent.click(link);
    expect(mockOpen).toHaveBeenCalledWith(url);
    expect(onOk).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByRole('radio', { name: lang.beambox.popup.nolayer })).toBeChecked();
    fireEvent.click(getByRole('button', { name: lang.alert.ok }));
    expect(onOk).toHaveBeenCalledWith('nolayer');
  });

  test.each<[SvgSource, string, string]>([
    ['illustrator', 'Adobe Illustrator', '4405279401487'],
    ['affinity', 'Affinity Designer', '360001558716'],
    ['inkscape', 'Inkscape', '4405279437839'],
  ])('uses Traditional Chinese copy and URL for %s', async (source, name, article) => {
    await determineImportType(undefined, laser, false, langTw, source);

    const { getByRole } = render(mockShowRadioSelectDialog.mock.calls[0][0].description);
    const link = getByRole('link');
    const url = `https://support.flux3dp.com/hc/zh-tw/articles/${article}`;

    expect(link.textContent).toBe(`了解更多關於 ${name} 的匯出方式`);
    expect(link).toHaveAttribute('href', url);
    fireEvent.click(link);
    expect(mockOpen).toHaveBeenCalledWith(url);
  });

  test('omits the guide for unknown sources and retains the available options and defaults', async () => {
    await determineImportType(undefined, laser, false, lang);
    expect(mockShowRadioSelectDialog).toHaveBeenCalledWith({
      defaultValue: 'color',
      description: undefined,
      id: '1-import-type',
      options: [
        { label: lang.beambox.popup.layer_by_layer, value: 'layer' },
        { label: lang.beambox.popup.layer_by_color, value: 'color' },
        { label: lang.beambox.popup.nolayer, value: 'nolayer' },
      ],
      title: lang.beambox.popup.select_import_method,
    });
  });

  test('does not attach an SVG tutorial to AI conversion', async () => {
    await determineImportType(undefined, laser, true, lang, 'illustrator');
    expect(mockShowRadioSelectDialog.mock.calls[0][0]).toMatchObject({
      description: undefined,
      id: '1-skip-by-layer-import-type',
      options: [
        { label: lang.beambox.popup.layer_by_color, value: 'color' },
        { label: lang.beambox.popup.nolayer, value: 'nolayer' },
      ],
    });
  });

  test('keeps the existing printing choices', async () => {
    await determineImportType(undefined, LayerModule.PRINTER, false, lang, 'inkscape');
    expect(mockShowRadioSelectDialog.mock.calls[0][0].options).toEqual([
      { label: lang.beambox.popup.layer_by_layer, value: 'layer' },
      { label: lang.beambox.popup.nolayer, value: 'nolayer' },
    ]);
  });

  test('does not create a dialog for an explicit type or a single available option', async () => {
    await expect(determineImportType('color', laser, false, lang, 'illustrator')).resolves.toBe('color');
    await expect(determineImportType(undefined, LayerModule.PRINTER, true, lang, 'inkscape')).resolves.toBe('nolayer');
    expect(mockShowRadioSelectDialog).not.toHaveBeenCalled();
  });
});
