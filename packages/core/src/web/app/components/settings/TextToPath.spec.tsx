import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/useI18n', () => () => ({
  settings: {
    font_convert: 'Convert Text to Path',
    font_substitute: 'Substitute Unsupported Characters',
    groups: {
      text_to_path: 'Text',
    },
    help_center_urls: {
      font_convert: 'https://support.flux3dp.com/hc/Convert-Text-to-Path',
      font_substitute: 'https://support.flux3dp.com/hc/en-us/articles/360004496575',
    },
  },
}));

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

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
    />,
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
