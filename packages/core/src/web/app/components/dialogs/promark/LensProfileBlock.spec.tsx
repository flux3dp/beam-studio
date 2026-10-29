import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LaserType } from '@core/app/constants/promark-constants';

import LensProfileBlock from './LensProfileBlock';

const mockOnChange = jest.fn();
const mockOnSetDefault = jest.fn();
const mockOnUseCloud = jest.fn();

const uvInfo = { laserType: LaserType.UV, watt: 5 };

const renderBlock = (props: Partial<React.ComponentProps<typeof LensProfileBlock>> = {}) =>
  render(
    <LensProfileBlock
      canUseCloud={false}
      info={uvInfo}
      invalidProfiles={[]}
      isDefault={false}
      isSynced={false}
      onChange={mockOnChange}
      onSetDefault={mockOnSetDefault}
      onUseCloud={mockOnUseCloud}
      status={{ state: 'saved' }}
      value={{ innerEngraving: false, workarea: 70 }}
      {...props}
    />,
  );

describe('test LensProfileBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows the laser source and the status', () => {
    const { getByTestId, getByText } = renderBlock({ status: { inherited: 'legacy', state: 'saved' } });

    expect(getByTestId('lens-laser-source')).toHaveTextContent('UV - 5W');
    expect(getByText('Saved')).toBeInTheDocument();
    expect(getByText('Using parameters from an earlier version')).toBeInTheDocument();
  });

  test('the engraving mode is only shown for UV', () => {
    const { queryByText } = renderBlock({
      info: { laserType: LaserType.MOPA, watt: 20 },
      value: { innerEngraving: false, workarea: 110 },
    });

    expect(queryByText('Engraving Mode')).not.toBeInTheDocument();
    expect(queryByText('MOPA - 20W')).toBeInTheDocument();
  });

  test('shows the unset and edited states', () => {
    const { getByText, rerender } = renderBlock({ status: { state: 'unset' } });

    expect(getByText('Not set')).toBeInTheDocument();
    rerender(
      <LensProfileBlock
        canUseCloud={false}
        info={uvInfo}
        invalidProfiles={[]}
        isDefault
        isSynced
        onChange={mockOnChange}
        onSetDefault={mockOnSetDefault}
        onUseCloud={mockOnUseCloud}
        status={{ state: 'edited' }}
        value={{ innerEngraving: false, workarea: 70 }}
      />,
    );
    expect(getByText('Edited')).toBeInTheDocument();
    expect(getByText('Default')).toBeInTheDocument();
    expect(getByText('Synced')).toBeInTheDocument();
  });

  test('sets the shown lens as the default', () => {
    const { getByText } = renderBlock();

    fireEvent.click(getByText('Set as Default'));
    expect(mockOnSetDefault).toHaveBeenCalledTimes(1);
  });

  test('offers the cloud parameters when not synced', () => {
    const { getByTestId, getByText, queryByTestId, rerender } = renderBlock();

    expect(getByText('Not synced')).toBeInTheDocument();
    expect(queryByTestId('use-cloud-lens')).not.toBeInTheDocument();
    rerender(
      <LensProfileBlock
        canUseCloud
        info={uvInfo}
        invalidProfiles={[]}
        isDefault={false}
        isSynced={false}
        onChange={mockOnChange}
        onSetDefault={mockOnSetDefault}
        onUseCloud={mockOnUseCloud}
        status={{ state: 'saved' }}
        value={{ innerEngraving: false, workarea: 70 }}
      />,
    );
    fireEvent.click(getByTestId('use-cloud-lens'));
    expect(mockOnUseCloud).toHaveBeenCalledTimes(1);
  });

  test('lists other lenses with values out of range', () => {
    const { getByText } = renderBlock({
      invalidProfiles: [
        { innerEngraving: false, workarea: 70 },
        { innerEngraving: false, workarea: 200 },
      ],
    });

    expect(getByText('Values out of range in: 200 mm・Flat')).toBeInTheDocument();
  });

  test('names lenses by work area alone for laser types without engraving modes', () => {
    const { getByText } = renderBlock({
      info: { laserType: LaserType.MOPA, watt: 20 },
      invalidProfiles: [{ innerEngraving: false, workarea: 220 }],
      value: { innerEngraving: false, workarea: 110 },
    });

    expect(getByText('Values out of range in: 220 mm')).toBeInTheDocument();
  });

  test('switches to inner engraving on the 70 mm lens', () => {
    const { getByText } = renderBlock();

    fireEvent.click(getByText('Inner Engraving'));
    expect(mockOnChange).toHaveBeenCalledWith({ innerEngraving: true, workarea: 70 });
  });

  test('inner engraving is unavailable on other lenses', () => {
    const { container } = renderBlock({ value: { innerEngraving: false, workarea: 200 } });

    expect(container.querySelectorAll('.ant-segmented-item-disabled')).toHaveLength(1);
  });
});
