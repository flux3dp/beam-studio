import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/useI18n', () => () => ({
  settings: {
    font_substitute: 'Substitute Unsupported Characters',
    font_convert: 'Convert Text to Path',
    help_center_urls: {
      font_substitute: 'https://support.flux3dp.com/hc/en-us/articles/360004496575',
      font_convert: 'https://support.flux3dp.com/hc/Convert-Text-to-Path',
    },
    groups: {
      text_to_path: 'Text',
    },
  },
}));

jest.mock('app/components/settings/SelectControl', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, label, onChange, options, url }: any) => (
    <div>
      mock-select-control id:{id}
      label:{label}
      url:{url}
      options:{JSON.stringify(options)}
      <input className="select-control" onChange={onChange} />
    </div>
  )
);

// eslint-disable-next-line import/first
import TextToPath from './TextToPath';

test('should render correctly', () => {
  const getBeamboxPreferenceEditingValue = jest.fn();
  getBeamboxPreferenceEditingValue.mockImplementation((key: string) => {
    if (key === 'font-substitute') {
      return true;
    }
    return '1.0';
  });
  const updateBeamboxPreferenceChange = jest.fn();
  const { container } = render(
    <TextToPath
      getBeamboxPreferenceEditingValue={getBeamboxPreferenceEditingValue}
      updateBeamboxPreferenceChange={updateBeamboxPreferenceChange}
    />
  );
  expect(container).toMatchSnapshot();

  const controls = container.querySelectorAll('.select-control');
  fireEvent.change(controls[0], { target: { value: 'FALSE' } });
  expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(1);
  expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(1, 'font-substitute', 'FALSE');

  fireEvent.change(controls[1], { target: { value: '2.0' } });
  expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(2);
  expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(2, 'font-convert', '2.0');
});
