import * as React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FirmwareUpdate from './FirmwareUpdate';

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

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnInstall).not.toHaveBeenCalled();
    fireEvent.click(getByText('UPLOAD'));
    expect(mockOnInstall).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    expect(mockOnDownload).not.toHaveBeenCalled();
    fireEvent.click(getByText('ONLINE UPDATE'));
    expect(mockOnDownload).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(2);

    fireEvent.click(getByText('LATER'));
    expect(mockOnClose).toHaveBeenCalledTimes(3);
  });
});
