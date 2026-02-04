import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import PathEditPanel from './PathEditPanel';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    beambox: {
      right_panel: {
        object_panel: {
          path_edit_panel: {
            connect: 'Connect',
            delete: 'Delete',
            disconnect: 'Disconnect',
            node_type: 'NODE TYPE',
            round: 'Round',
            sharp: 'Sharp',
          },
        },
        tabs: {
          path_edit: 'Path Edit',
        },
      },
    },
  },
}));

const setSelectedNodeType = jest.fn();
const deleteSelected = jest.fn();
const mockSetSharp = jest.fn();
const mockSetRound = jest.fn();
const mockDisconnectNode = jest.fn();
const toSelectMode = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        pathActions: {
          disconnectNode: (...args) => mockDisconnectNode(...args),
          setRound: (...args) => mockSetRound(...args),
          setSharp: (...args) => mockSetSharp(...args),
          toSelectMode: (...args) => toSelectMode(...args),
        },
      },
      Edit: {
        path: {
          path: {
            nodePoints: [
              {
                index: 0,
                isRound: () => false,
                isSharp: () => true,
                linkType: 0,
                next: 'mock-p1',
                prev: 'mock-p2',
              },
              {
                index: 1,
                isRound: () => false,
                isSharp: () => true,
                linkType: 0,
                next: 'mock-p2',
                prev: 'mock-p0',
              },
              {
                index: 2,
                isRound: () => false,
                isSharp: () => true,
                linkType: 0,
                next: 'mock-p0',
                prev: 'mock-p1',
              },
            ],
            selected_pts: [2],
            setSelectedNodeType: (...args) => setSelectedNodeType(...args),
          },
        },
      },
      Editor: {
        deleteSelected: (...args) => deleteSelected(...args),
      },
    }),
}));

describe('test PathEditPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should render correctly', () => {
    const { container, getByText, getByTitle } = render(<PathEditPanel />);

    expect(container).toMatchSnapshot();

    expect(setSelectedNodeType).not.toHaveBeenCalled();
    fireEvent.click(getByTitle('Smooth'));
    expect(setSelectedNodeType).toHaveBeenCalledTimes(1);
    expect(setSelectedNodeType).toHaveBeenLastCalledWith(1);

    expect(mockSetRound).not.toHaveBeenCalled();
    fireEvent.click(getByText('Round'));
    expect(mockSetRound).toHaveBeenCalledTimes(1);

    expect(mockSetSharp).not.toHaveBeenCalled();
    fireEvent.click(getByText('Sharp'));
    expect(mockSetRound).toHaveBeenCalledTimes(1);

    expect(mockDisconnectNode).not.toHaveBeenCalled();
    fireEvent.click(getByText('Disconnect'));
    expect(mockDisconnectNode).toHaveBeenCalledTimes(1);
  });

  test('should render correctly in mobile', async () => {
    useIsMobile.mockReturnValue(true);

    const { container, getByText, getByTitle } = render(<PathEditPanel />);
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;

    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-280px)))'));
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(container).toMatchSnapshot();

    expect(setSelectedNodeType).not.toHaveBeenCalled();
    fireEvent.click(getByTitle('Smooth'));
    expect(setSelectedNodeType).toHaveBeenCalledTimes(1);
    expect(setSelectedNodeType).toHaveBeenLastCalledWith(1);

    expect(mockSetRound).not.toHaveBeenCalled();
    fireEvent.click(getByText('Round'));
    expect(mockSetRound).toHaveBeenCalledTimes(1);

    expect(mockSetSharp).not.toHaveBeenCalled();
    fireEvent.click(getByText('Sharp'));
    expect(mockSetRound).toHaveBeenCalledTimes(1);

    expect(mockDisconnectNode).not.toHaveBeenCalled();
    fireEvent.click(getByText('Disconnect'));
    expect(mockDisconnectNode).toHaveBeenCalledTimes(1);

    expect(deleteSelected).not.toHaveBeenCalled();
    fireEvent.click(getByText('Delete'));
    expect(deleteSelected).toHaveBeenCalledTimes(1);

    expect(toSelectMode).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('.close-icon'));
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (0px)))'));
    await waitFor(() => expect(toSelectMode).toHaveBeenCalledTimes(1));
  });
});
