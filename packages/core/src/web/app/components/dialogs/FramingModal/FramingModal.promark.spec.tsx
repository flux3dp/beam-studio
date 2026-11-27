import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FramingTaskManager from '@core/helpers/device/framing';
import i18n from '@core/helpers/i18n';

import FramingModal from './FramingModal.promark';

jest.mock('@core/app/actions/beambox/export/GoButton/handleExportClick', () => ({ handleExportClick: jest.fn() }));
jest.mock('@core/helpers/shortcuts', () => ({ on: () => jest.fn() }));
jest.mock('@core/app/widgets/DraggableModal', () => ({ children }: React.PropsWithChildren) => <div>{children}</div>);
jest.mock('@core/helpers/device/framing', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    on: jest.fn(),
    startFraming: jest.fn().mockResolvedValue(true),
    stopFraming: jest.fn(),
  })),
  framingOptions: { Framing: { description: 'framing_desc', title: 'framing' } },
  FramingType: { Framing: 'Framing' },
  getFramingOptions: () => ['Framing'],
}));

test('BeamGo framing dialog sends the selected power; Promark keeps zero', () => {
  const { getByLabelText, getByRole, unmount } = render(
    <FramingModal
      device={{ model: 'fbg1' } as React.ComponentProps<typeof FramingModal>['device']}
      onClose={jest.fn()}
    />,
  );
  const input = getByLabelText(i18n.lang.beamgo.framing_power);

  fireEvent.change(input, { target: { value: '5' } });
  fireEvent.blur(input);
  fireEvent.click(getByRole('button', { name: i18n.lang.framing.framing }));
  expect(jest.mocked(FramingTaskManager).mock.results.at(-1)!.value.startFraming).toHaveBeenCalledWith('Framing', {
    lowPower: 5,
  });
  unmount();

  const promark = render(
    <FramingModal
      device={{ model: 'fpm1' } as React.ComponentProps<typeof FramingModal>['device']}
      onClose={jest.fn()}
    />,
  );

  expect(promark.queryByLabelText(i18n.lang.beamgo.framing_power)).toBeNull();
  fireEvent.click(promark.getByRole('button', { name: i18n.lang.framing.framing }));
  expect(jest.mocked(FramingTaskManager).mock.results.at(-1)!.value.startFraming).toHaveBeenCalledWith('Framing', {
    lowPower: 0,
  });
});
