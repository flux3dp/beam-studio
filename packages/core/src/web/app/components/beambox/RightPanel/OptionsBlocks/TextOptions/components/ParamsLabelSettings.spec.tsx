import type { ReactElement } from 'react';
import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import langEn from '@core/app/lang/en';
import { setStorage } from '@core/app/stores/storageStore';

const allConfigKeys = ['layerName', 'power', 'speed'] as const;

const mockAddDialogComponent = jest.fn();
const mockIsIdExist = jest.fn();
const mockPopDialogById = jest.fn();
const mockGetLabelKeys = jest.fn();
const mockGetRecommendedConfigKeys = jest.fn();
const mockSetStorageParamsLabelKeys = jest.fn();
const mockToParamsLabelKeys = jest.fn();
const mockWriteLabelKeys = jest.fn();

jest.mock('@core/app/actions/dialog-controller', () => ({
  addDialogComponent: mockAddDialogComponent,
  isIdExist: mockIsIdExist,
  popDialogById: mockPopDialogById,
}));

jest.mock('@core/app/stores/storageStore');
jest.mock('@core/helpers/i18n');

jest.mock('@core/app/svgedit/text/paramsLabel', () => ({
  allConfigKeys,
  getLabelKeys: mockGetLabelKeys,
  getRecommendedConfigKeys: mockGetRecommendedConfigKeys,
  layerNameKey: 'layerName',
  setStorageParamsLabelKeys: mockSetStorageParamsLabelKeys,
  toParamsLabelKeys: mockToParamsLabelKeys,
  writeLabelKeys: mockWriteLabelKeys,
}));

import ParamsLabelSettings, { showParamsLabelSettings } from './ParamsLabelSettings';

const getConfigCheckbox = (key: (typeof allConfigKeys)[number]) =>
  screen.getByRole('checkbox', { name: key === 'layerName' ? langEn.params_label.layer_name : key });

describe('ParamsLabelSettings', () => {
  const mockTextElement = document.createElement('text') as unknown as SVGTextElement;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLabelKeys.mockReturnValue(['layerName', 'power']);
    mockGetRecommendedConfigKeys.mockReturnValue(['layerName', 'speed']);
    mockIsIdExist.mockReturnValue(false);
    mockToParamsLabelKeys.mockImplementation((stored) => (Array.isArray(stored) ? stored : null));
    setStorage('default-params-label-keys', undefined);
  });

  test('should render the current keys and disable the saved default when none exists', () => {
    render(<ParamsLabelSettings elem={mockTextElement} onClose={mockOnClose} />);

    expect(mockGetLabelKeys).toHaveBeenCalledWith(mockTextElement);
    expect(getConfigCheckbox('layerName')).toBeChecked();
    expect(getConfigCheckbox('power')).toBeChecked();
    expect(getConfigCheckbox('speed')).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: langEn.params_label.check_all })).toBePartiallyChecked();
    expect(screen.getByRole('button', { name: langEn.params_label.use_default })).toBeDisabled();
  });

  test('should support selecting all, recommended, and custom keys', () => {
    render(<ParamsLabelSettings elem={mockTextElement} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('checkbox', { name: langEn.params_label.check_all }));
    allConfigKeys.forEach((key) => expect(getConfigCheckbox(key)).toBeChecked());

    fireEvent.click(screen.getByRole('button', { name: langEn.params_label.use_recommended }));
    expect(mockGetRecommendedConfigKeys).toHaveBeenCalledWith(mockTextElement);
    expect(getConfigCheckbox('layerName')).toBeChecked();
    expect(getConfigCheckbox('power')).not.toBeChecked();
    expect(getConfigCheckbox('speed')).toBeChecked();

    fireEvent.click(getConfigCheckbox('layerName'));
    expect(getConfigCheckbox('layerName')).not.toBeChecked();
    expect(getConfigCheckbox('speed')).toBeChecked();
  });

  test('should disable save as default and apply when no keys are selected', () => {
    render(<ParamsLabelSettings elem={mockTextElement} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('checkbox', { name: langEn.params_label.check_all }));
    allConfigKeys.forEach((key) => expect(getConfigCheckbox(key)).toBeChecked());
    expect(screen.getByRole('checkbox', { name: langEn.params_label.check_all })).toBeChecked();
    expect(screen.getByRole('button', { name: langEn.params_label.save_as_default })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: langEn.global.apply })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: langEn.params_label.check_all }));
    allConfigKeys.forEach((key) => expect(getConfigCheckbox(key)).not.toBeChecked());
    expect(screen.getByRole('checkbox', { name: langEn.params_label.check_all })).not.toBeChecked();
    expect(screen.getByRole('button', { name: langEn.params_label.save_as_default })).toBeDisabled();
    expect(screen.getByRole('button', { name: langEn.global.apply })).toBeDisabled();
  });

  test('should load the saved default keys', () => {
    setStorage('default-params-label-keys', ['speed']);

    render(<ParamsLabelSettings elem={mockTextElement} onClose={mockOnClose} />);

    const useDefaultButton = screen.getByRole('button', { name: langEn.params_label.use_default });

    expect(useDefaultButton).toBeEnabled();
    fireEvent.click(useDefaultButton);
    expect(getConfigCheckbox('layerName')).not.toBeChecked();
    expect(getConfigCheckbox('power')).not.toBeChecked();
    expect(getConfigCheckbox('speed')).toBeChecked();
  });

  test('should save the selected keys as default and apply them to the label', () => {
    render(<ParamsLabelSettings elem={mockTextElement} onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole('button', { name: langEn.params_label.save_as_default }));
    expect(mockSetStorageParamsLabelKeys).toHaveBeenCalledWith(['layerName', 'power']);

    fireEvent.click(getConfigCheckbox('layerName'));
    fireEvent.click(getConfigCheckbox('power'));
    fireEvent.click(getConfigCheckbox('speed'));
    fireEvent.click(screen.getByRole('button', { name: langEn.global.apply }));
    expect(mockWriteLabelKeys).toHaveBeenCalledWith(mockTextElement, ['speed']);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('should close without applying when cancelled', () => {
    render(<ParamsLabelSettings elem={mockTextElement} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText(langEn.alert.close));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockWriteLabelKeys).not.toHaveBeenCalled();
  });

  test('should add only one settings dialog per label', () => {
    mockTextElement.id = 'label-1';

    showParamsLabelSettings(mockTextElement);

    const id = 'params-label-settings-label-1';

    expect(mockIsIdExist).toHaveBeenCalledWith(id);
    expect(mockAddDialogComponent).toHaveBeenCalledWith(id, expect.anything());

    const dialog = mockAddDialogComponent.mock.calls[0][1] as ReactElement<{ onClose: () => void }>;

    dialog.props.onClose();
    expect(mockPopDialogById).toHaveBeenCalledWith(id);

    mockIsIdExist.mockReturnValue(true);
    showParamsLabelSettings(mockTextElement);
    expect(mockAddDialogComponent).toHaveBeenCalledTimes(1);
  });
});
