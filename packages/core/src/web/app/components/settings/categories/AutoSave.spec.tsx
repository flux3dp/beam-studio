import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/app/widgets/PathInput', () => ({
  __esModule: true,
  default: ({ buttonTitle, 'data-id': dataId, defaultValue, error, forceValidValue, getValue, type }: any) => (
    <div>
      mock-path-input id:{dataId}
      buttonTitle:{buttonTitle}
      type:{type}
      defaultValue:{defaultValue}
      forceValidValue:{forceValidValue ? 'true' : 'false'}
      error:{error ? 'true' : 'false'}
      <input
        className="path-input"
        onChange={(e) => {
          const [val, isValid]: any[] = e.target.value.split(',');

          getValue(val, isValid.includes('true'));
        }}
      />
    </div>
  ),
  InputType: {
    BOTH: 2,
    FILE: 0,
    FOLDER: 1,
  },
}));

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({
  getPreference: mockGetPreference,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/components/settings/shared/hooks/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('../shared/components/SettingSelect');
jest.mock('../shared/components/SettingFormItem');
jest.mock('../shared/components/SettingSwitch');

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => mockIsWeb);

import AutoSave from './AutoSave';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initially no warning', () => {
    const setWarnings = jest.fn();
    const setEditingAutosaveConfig = jest.fn();
    const { container } = render(
      <AutoSave
        editingAutosaveConfig={{
          directory: '/MyDocuments',
          enabled: true,
          fileNumber: 5,
          timeInterval: 10,
        }}
        setEditingAutosaveConfig={setEditingAutosaveConfig}
        setWarnings={setWarnings}
        warnings={{}}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('.switch-control'));
    expect(setEditingAutosaveConfig).toHaveBeenCalledTimes(1);
    expect(setEditingAutosaveConfig).toHaveBeenNthCalledWith(1, {
      directory: '/MyDocuments',
      enabled: false,
      fileNumber: 5,
      timeInterval: 10,
    });

    fireEvent.change(container.querySelector('input.path-input'), {
      target: { value: '/FolderNotExist, false' },
    });
    expect(setEditingAutosaveConfig).toHaveBeenCalledTimes(2);
    expect(setEditingAutosaveConfig).toHaveBeenNthCalledWith(2, {
      directory: '/FolderNotExist',
      enabled: true,
      fileNumber: 5,
      timeInterval: 10,
    });

    expect(setWarnings).toHaveBeenCalledTimes(1);
    expect(setWarnings).toHaveBeenNthCalledWith(1, {
      autosave_directory: 'Specified path not found.',
    });

    fireEvent.change(container.querySelector('#save-every'), { target: { value: 5 } });
    expect(setEditingAutosaveConfig).toHaveBeenCalledTimes(3);
    expect(setEditingAutosaveConfig).toHaveBeenNthCalledWith(3, {
      directory: '/MyDocuments',
      enabled: true,
      fileNumber: 5,
      timeInterval: 5,
    });

    fireEvent.change(container.querySelector('#number-of-auto-save'), { target: { value: 10 } });
    expect(setEditingAutosaveConfig).toHaveBeenCalledTimes(4);
    expect(setEditingAutosaveConfig).toHaveBeenNthCalledWith(4, {
      directory: '/MyDocuments',
      enabled: true,
      fileNumber: 10,
      timeInterval: 10,
    });
  });

  test('initially with warning', () => {
    const setEditingAutosaveConfig = jest.fn();
    const setWarnings = jest.fn();
    const { container } = render(
      <AutoSave
        editingAutosaveConfig={{
          directory: '/MyDocuments',
          enabled: true,
          fileNumber: 5,
          timeInterval: 10,
        }}
        setEditingAutosaveConfig={setEditingAutosaveConfig}
        setWarnings={setWarnings}
        warnings={{
          autosave_directory: 'Specified path not found.',
        }}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.path-input'), {
      target: { value: '/MyDocuments, true' },
    });
    expect(setEditingAutosaveConfig).toHaveBeenCalledTimes(1);
    expect(setEditingAutosaveConfig).toHaveBeenNthCalledWith(1, {
      directory: '/MyDocuments',
      enabled: true,
      fileNumber: 5,
      timeInterval: 10,
    });
  });

  test('hide in web', () => {
    const setEditingAutosaveConfig = jest.fn();
    const setWarnings = jest.fn();

    mockIsWeb.mockReturnValue(true);

    const { container } = render(
      <AutoSave
        editingAutosaveConfig={{
          directory: '/MyDocuments',
          enabled: false,
          fileNumber: 5,
          timeInterval: 10,
        }}
        setEditingAutosaveConfig={setEditingAutosaveConfig}
        setWarnings={setWarnings}
        warnings={{}}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
