import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/app/actions/dialog-controller', () => ({
  addDialogComponent: jest.fn(),
  isIdExist: jest.fn(),
  popDialogById: jest.fn(),
}));
jest.mock('@core/app/constants/addOn', () => ({
  CHUCK_ROTARY_DIAMETER: 40,
  getAddOnInfo: () => ({ innerEngraving: { maxMaterialHeight: 80 } }),
  RotaryType: { Roller: 'roller' },
}));
jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: () => ({ height: 70, width: 70 }),
}));
jest.mock('@core/app/stores/documentStore');
jest.mock('@core/app/stores/storageStore');
jest.mock(
  '@core/app/widgets/DraggableModal',
  () =>
    ({ children, onOk }: { children: React.ReactNode; onOk: () => void }) => (
      <div>
        {children}
        <button onClick={onOk}>save-dialog</button>
      </div>
    ),
);
jest.mock('@core/app/widgets/UnitInput', () => ({ id, max, min, onChange, value }: any) => (
  <input
    aria-label={id}
    max={max}
    min={min}
    onChange={(event) => onChange?.(Number(event.target.value))}
    value={value}
  />
));
jest.mock('@core/helpers/is-dev', () => () => false);
jest.mock('@core/helpers/useI18n', () => () => ({
  global: { cancel: 'cancel', save: 'save' },
  inner_engraving_settings: new Proxy({}, { get: (_target, key) => String(key) }),
}));

import { useDocumentStore } from '@core/app/stores/documentStore';

import InnerEngravingSettings from './InnerEngravingSettings';

describe('InnerEngravingSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDocumentStore.setState({
      'inner-engraving-base-height': 10,
      'inner-engraving-diameter': 40,
      'inner-engraving-height': 50,
      'inner-engraving-shape': 'sphere',
      workarea: 'fpm1',
    });
  });

  test('shows sphere liquid guidance and Z-height tooltips', () => {
    const { getByLabelText, getByText } = render(<InnerEngravingSettings onClose={jest.fn()} />);

    expect(getByLabelText('base_height')).toHaveAttribute('max', '40');
    expect(getByLabelText('height')).toHaveAttribute('min', '50');
    expect(getByLabelText('sphere_base_height info')).toBeInTheDocument();
    expect(getByLabelText('height info')).toBeInTheDocument();
    expect(getByLabelText('refractive_index info')).toBeInTheDocument();
    expect(getByLabelText('focal_length info')).toBeInTheDocument();
    expect(getByText('sphere_liquid_alert')).toBeInTheDocument();
  });

  test('saves the sphere base and keeps the liquid above the sphere', () => {
    const onClose = jest.fn();
    const { getByLabelText, getByRole } = render(<InnerEngravingSettings onClose={onClose} />);

    fireEvent.change(getByLabelText('base_height'), { target: { value: '20' } });
    fireEvent.click(getByRole('button', { name: 'save-dialog' }));

    expect(useDocumentStore.getState()).toEqual(
      expect.objectContaining({
        'inner-engraving-base-height': 20,
        'inner-engraving-diameter': 40,
        'inner-engraving-height': 60,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
