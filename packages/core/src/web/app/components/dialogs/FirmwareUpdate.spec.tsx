import * as React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FirmwareUpdate from './FirmwareUpdate';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    update: {
      download: 'ONLINE UPDATE',
      firmware: {
        caption: 'A Firmware Update to the machine is available',
        message_pattern_1: '"%s" is now ready for firmware update.',
        message_pattern_2: '%s Firmware v%s is now available - You have v%s.',
      },
      later: 'LATER',
      release_note: 'Release Note:',
      skip: 'Skip This Version',
      upload: 'UPLOAD',
    },
  },
}));

const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('@app/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
  set: (...args) => mockSet(...args),
}));

const mockOnDownload = jest.fn();
const mockOnClose = jest.fn();
const mockOnInstall = jest.fn();

describe('test update dialog', () => {
  test('should render correctly', () => {
    const { baseElement, getByText } = render(
      <FirmwareUpdate
        currentVersion="1.0.0"
        deviceModel="Beamo"
        deviceName="flux"
        latestVersion="1.0.1"
        onClose={mockOnClose}
        onDownload={mockOnDownload}
        onInstall={mockOnInstall}
        releaseNote="fix bugs"
      />,
    );

    expect(baseElement).toMatchSnapshot();

    expect(mockOnClose).not.toBeCalled();
    expect(mockOnInstall).not.toBeCalled();
    fireEvent.click(getByText('UPLOAD'));
    expect(mockOnInstall).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledTimes(1);

    expect(mockOnDownload).not.toBeCalled();
    fireEvent.click(getByText('ONLINE UPDATE'));
    expect(mockOnDownload).toBeCalledTimes(1);
    expect(mockOnClose).toBeCalledTimes(2);

    fireEvent.click(getByText('LATER'));
    expect(mockOnClose).toBeCalledTimes(3);
  });
});
