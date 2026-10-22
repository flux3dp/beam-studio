import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useStlStore } from '@core/app/stores/stlStore';

const mockMoveObjectsCenterTo = jest.fn();
const mockFitObjectsTo = jest.fn();

jest.mock('@core/app/components/beambox/InnerEngraving/utils/groupTransform', () => ({
  fitObjectsTo: (...args: unknown[]) => mockFitObjectsTo(...args),
  moveObjectsCenterTo: (...args: unknown[]) => mockMoveObjectsCenterTo(...args),
}));

const mockBox = jest.fn();

jest.mock('@core/app/components/beambox/InnerEngraving/utils/engravable', () => ({
  useEngravableBox: () => mockBox(),
}));

const mockShowPhotoTo3dModal = jest.fn();

jest.mock('@core/app/components/dialogs/PhotoTo3dModal', () => ({
  showPhotoTo3dModal: (...args: unknown[]) => mockShowPhotoTo3dModal(...args),
}));
jest.mock('@core/app/stores/screenStore', () => ({ isMobile: () => false }));

import ActionsPanelStl from './ActionsPanelStl';

const box = { center: [1, 2, 3], isValid: true };
const object = (id: string, kind?: 'photo' | 'point-cloud') => ({ id, kind }) as any;

describe('ActionsPanelStl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBox.mockReturnValue(box);
    document.body.innerHTML = '<svg><image id="photo" data-stl-photo="1" /><rect id="mesh" data-stl="1" /></svg>';
    useStlStore.setState({ objects: { mesh: object('mesh'), photo: object('photo', 'photo') } });
  });

  test('places the whole selection', () => {
    const { container } = render(<ActionsPanelStl ids={['mesh', 'photo']} />);

    fireEvent.click(container.querySelector('#stl-center')!);
    expect(mockMoveObjectsCenterTo).toHaveBeenCalledWith([object('mesh'), object('photo', 'photo')], box.center);
    fireEvent.click(container.querySelector('#stl-fit')!);
    expect(mockFitObjectsTo).toHaveBeenCalledWith([object('mesh'), object('photo', 'photo')], box);
    // a multi-selection has no photo to convert
    expect(container.querySelector('#stl-photo-to-3d')).toBeNull();
  });

  test('a single flat photo can be converted to 3D, even with no engravable area', () => {
    mockBox.mockReturnValue({ ...box, isValid: false });

    const { container } = render(<ActionsPanelStl ids={['photo']} />);
    const button = container.querySelector('#stl-photo-to-3d')!;

    expect(container.querySelector('#stl-center')).toBeDisabled();
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(mockShowPhotoTo3dModal).toHaveBeenCalledWith(document.getElementById('photo'));
  });

  test('a mesh or a photo already converted has no conversion', () => {
    useStlStore.setState({ objects: { mesh: object('mesh'), photo: object('photo', 'point-cloud') } });

    expect(render(<ActionsPanelStl ids={['photo']} />).container.querySelector('#stl-photo-to-3d')).toBeNull();
    expect(render(<ActionsPanelStl ids={['mesh']} />).container.querySelector('#stl-photo-to-3d')).toBeNull();
  });
});
