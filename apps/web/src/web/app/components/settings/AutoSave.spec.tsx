/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    general: {
      choose_folder: 'Choose Folder',
    },
    monitor: {
      minute: 'm',
    },
    settings: {
      autosave_enabled: 'Auto Save',
      autosave_path: 'Auto Save Location',
      autosave_interval: 'Save Every',
      autosave_number: 'Number of Auto Save',
      autosave_path_not_correct: 'Specified path not found.',
      help_center_urls: {
        fast_gradient: 'https://support.flux3dp.com/hc/en-us/articles/360004496235',
      },
      groups: {
        autosave: 'Auto Save',
      },
    },
  },
}));

jest.mock('app/components/settings/Control', () => 'mock-control');

jest.mock('app/widgets/PathInput', () => ({
  __esModule: true,
  InputType: {
    FILE: 0,
    FOLDER: 1,
    BOTH: 2,
  },
  default: ({
    'data-id': dataId,
    buttonTitle,
    type,
    defaultValue,
    getValue,
    forceValidValue,
    className,
  }: any) => (
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
}));

jest.mock(
  'app/components/settings/SelectControl',
  () =>
    ({ id, label, onChange, options }: any) =>
      (
        <div>
          mock-select-control id:{id}
          label:{label}
          options:{JSON.stringify(options)}
          <input className="select-control" onChange={onChange} />
        </div>
      )
);

jest.mock(
  'app/widgets/Unit-Input-v2',
  () =>
    ({ id, unit, min, max, defaultValue, getValue, forceUsePropsUnit, className }: any) =>
      (
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
      )
);

// eslint-disable-next-line import/first
import AutoSave from './AutoSave';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initially no warning', () => {
    const updateState = jest.fn();
    const { container } = render(
      <AutoSave
        isWeb={false}
        autoSaveOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: false,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: true,
          },
        ]}
        editingAutosaveConfig={{
          enabled: false,
          directory: '/MyDocuments',
          timeInterval: 10,
          fileNumber: 5,
        }}
        warnings={{}}
        updateState={updateState}
      />
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
        enabled: true,
        directory: '/MyDocuments',
        timeInterval: 10,
        fileNumber: 5,
      },
    });

    fireEvent.change(container.querySelector('input.path-input'), {
      target: { value: '/FolderNotExist, false' },
    });
    expect(updateState).toHaveBeenCalledTimes(2);
    expect(updateState).toHaveBeenNthCalledWith(2, {
      editingAutosaveConfig: {
        enabled: false,
        directory: '/FolderNotExist',
        timeInterval: 10,
        fileNumber: 5,
      },
      warnings: {
        autosave_directory: 'Specified path not found.',
      },
    });

    fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 5 } });
    expect(updateState).toHaveBeenCalledTimes(3);
    expect(updateState).toHaveBeenNthCalledWith(3, {
      editingAutosaveConfig: {
        enabled: false,
        directory: '/MyDocuments',
        timeInterval: 5,
        fileNumber: 5,
      },
    });

    fireEvent.change(container.querySelectorAll('input.unit-input')[1], { target: { value: 10 } });
    expect(updateState).toHaveBeenCalledTimes(4);
    expect(updateState).toHaveBeenNthCalledWith(4, {
      editingAutosaveConfig: {
        enabled: false,
        directory: '/MyDocuments',
        timeInterval: 10,
        fileNumber: 10,
      },
    });
  });

  test('initially with warning', () => {
    const updateState = jest.fn();
    const { container } = render(
      <AutoSave
        isWeb={false}
        autoSaveOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: false,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: true,
          },
        ]}
        editingAutosaveConfig={{
          enabled: false,
          directory: '/FolderNotExist',
          timeInterval: 10,
          fileNumber: 5,
        }}
        warnings={{
          autosave_directory: 'Specified path not found.',
        }}
        updateState={updateState}
      />
    );
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.path-input'), {
      target: { value: '/MyDocuments, true' },
    });
    expect(updateState).toHaveBeenCalledTimes(1);
    expect(updateState).toHaveBeenNthCalledWith(1, {
      editingAutosaveConfig: {
        enabled: false,
        directory: '/MyDocuments',
        timeInterval: 10,
        fileNumber: 5,
      },
      warnings: {},
    });
  });

  test('hide in web', () => {
    const updateState = jest.fn();
    const { container } = render(
      <AutoSave
        isWeb
        autoSaveOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: false,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: true,
          },
        ]}
        editingAutosaveConfig={{
          enabled: false,
          directory: '/MyDocuments',
          timeInterval: 10,
          fileNumber: 5,
        }}
        warnings={{}}
        updateState={updateState}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
