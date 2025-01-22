import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    general: {
      choose_folder: 'Choose Folder',
    },
    monitor: {
      minute: 'm',
    },
    settings: {
      autosave_enabled: 'Auto Save',
      autosave_interval: 'Save Every',
      autosave_number: 'Number of Auto Save',
      autosave_path: 'Auto Save Location',
      autosave_path_not_correct: 'Specified path not found.',
      groups: {
        autosave: 'Auto Save',
      },
      help_center_urls: {
        fast_gradient: 'https://support.flux3dp.com/hc/en-us/articles/360004496235',
      },
    },
  },
}));

jest.mock('@core/app/components/settings/Control', () => 'mock-control');

jest.mock('@core/app/widgets/PathInput', () => ({
  __esModule: true,
  default: ({ buttonTitle, className, 'data-id': dataId, defaultValue, forceValidValue, getValue, type }: any) => (
    <div>
      mock-path-input id:{dataId}
      buttonTitle:{buttonTitle}
      type:{type}
      defaultValue:{defaultValue}
      forceValidValue:{forceValidValue ? 'true' : 'false'}
      className:{JSON.stringify(className)}
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

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

jest.mock(
  '@core/app/widgets/Unit-Input-v2',
  () =>
    ({ className, defaultValue, forceUsePropsUnit, getValue, id, max, min, unit }: any) => (
      <div>
        mock-unit-input id:{id}
        unit:{unit}
        min:{min}
        max:{max}
        defaultValue:{defaultValue}
        forceUsePropsUnit:{forceUsePropsUnit ? 'true' : 'false'}
        className:{JSON.stringify(className)}
        <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
      </div>
    ),
);

import AutoSave from './AutoSave';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initially no warning', () => {
    const updateState = jest.fn();
    const { container } = render(
      <AutoSave
        autoSaveOptions={[
          {
            label: 'On',
            selected: false,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: true,
            value: 'FALSE',
          },
        ]}
        editingAutosaveConfig={{
          directory: '/MyDocuments',
          enabled: false,
          fileNumber: 5,
          timeInterval: 10,
        }}
        isWeb={false}
        updateState={updateState}
        warnings={{}}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('.select-control'), {
      target: {
        value: 'TRUE',
      },
    });
    expect(updateState).toHaveBeenCalledTimes(1);
    expect(updateState).toHaveBeenNthCalledWith(1, {
      editingAutosaveConfig: {
        directory: '/MyDocuments',
        enabled: true,
        fileNumber: 5,
        timeInterval: 10,
      },
    });

    fireEvent.change(container.querySelector('input.path-input'), {
      target: { value: '/FolderNotExist, false' },
    });
    expect(updateState).toHaveBeenCalledTimes(2);
    expect(updateState).toHaveBeenNthCalledWith(2, {
      editingAutosaveConfig: {
        directory: '/FolderNotExist',
        enabled: false,
        fileNumber: 5,
        timeInterval: 10,
      },
      warnings: {
        autosave_directory: 'Specified path not found.',
      },
    });

    fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 5 } });
    expect(updateState).toHaveBeenCalledTimes(3);
    expect(updateState).toHaveBeenNthCalledWith(3, {
      editingAutosaveConfig: {
        directory: '/MyDocuments',
        enabled: false,
        fileNumber: 5,
        timeInterval: 5,
      },
    });

    fireEvent.change(container.querySelectorAll('input.unit-input')[1], { target: { value: 10 } });
    expect(updateState).toHaveBeenCalledTimes(4);
    expect(updateState).toHaveBeenNthCalledWith(4, {
      editingAutosaveConfig: {
        directory: '/MyDocuments',
        enabled: false,
        fileNumber: 10,
        timeInterval: 10,
      },
    });
  });

  test('initially with warning', () => {
    const updateState = jest.fn();
    const { container } = render(
      <AutoSave
        autoSaveOptions={[
          {
            label: 'On',
            selected: false,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: true,
            value: 'FALSE',
          },
        ]}
        editingAutosaveConfig={{
          directory: '/FolderNotExist',
          enabled: false,
          fileNumber: 5,
          timeInterval: 10,
        }}
        isWeb={false}
        updateState={updateState}
        warnings={{
          autosave_directory: 'Specified path not found.',
        }}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.path-input'), {
      target: { value: '/MyDocuments, true' },
    });
    expect(updateState).toHaveBeenCalledTimes(1);
    expect(updateState).toHaveBeenNthCalledWith(1, {
      editingAutosaveConfig: {
        directory: '/MyDocuments',
        enabled: false,
        fileNumber: 5,
        timeInterval: 10,
      },
      warnings: {},
    });
  });

  test('hide in web', () => {
    const updateState = jest.fn();
    const { container } = render(
      <AutoSave
        autoSaveOptions={[
          {
            label: 'On',
            selected: false,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: true,
            value: 'FALSE',
          },
        ]}
        editingAutosaveConfig={{
          directory: '/MyDocuments',
          enabled: false,
          fileNumber: 5,
          timeInterval: 10,
        }}
        isWeb
        updateState={updateState}
        warnings={{}}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
