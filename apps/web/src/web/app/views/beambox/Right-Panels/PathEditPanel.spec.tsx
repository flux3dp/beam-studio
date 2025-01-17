/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import PathEditPanel from './PathEditPanel';

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      right_panel: {
        object_panel: {
          path_edit_panel: {
            node_type: 'NODE TYPE',
            sharp: 'Sharp',
            round: 'Round',
            connect: 'Connect',
            disconnect: 'Disconnect',
            delete: 'Delete',
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
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => callback({
    Edit: {
      path: {
        path: {
          setSelectedNodeType: (...args) => setSelectedNodeType(...args),
          selected_pts: [2],
          nodePoints: [
            {
              index: 0,
              linkType: 0,
              isSharp: () => true,
              isRound: () => false,
              prev: 'mock-p2',
              next: 'mock-p1'
            },
            {
              index: 1,
              linkType: 0,
              isSharp: () => true,
              isRound: () => false,
              prev: 'mock-p0',
              next: 'mock-p2'
            },
            {
              index: 2,
              linkType: 0,
              isSharp: () => true,
              isRound: () => false,
              prev: 'mock-p1',
              next: 'mock-p0'
            },
          ],
        },
      },
    },
    Editor: {
      deleteSelected: (...args) => deleteSelected(...args),
    },
    Canvas: {
      pathActions: {
        setSharp: (...args) => mockSetSharp(...args),
        setRound: (...args) => mockSetRound(...args),
        disconnectNode: (...args) => mockDisconnectNode(...args),
        toSelectMode: (...args) => toSelectMode(...args),
      }
    }
  }),
}));

describe('test PathEditPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should render correctly', () => {
    const { container, getByText, getByTitle } = render(<PathEditPanel />);
    expect(container).toMatchSnapshot();

    expect(setSelectedNodeType).not.toBeCalled();
    fireEvent.click(getByTitle('Smooth'));
    expect(setSelectedNodeType).toBeCalledTimes(1);
    expect(setSelectedNodeType).toHaveBeenLastCalledWith(1);

    expect(mockSetRound).not.toBeCalled();
    fireEvent.click(getByText('Round'));
    expect(mockSetRound).toBeCalledTimes(1);

    expect(mockSetSharp).not.toBeCalled();
    fireEvent.click(getByText('Sharp'));
    expect(mockSetRound).toBeCalledTimes(1);

    expect(mockDisconnectNode).not.toBeCalled();
    fireEvent.click(getByText('Disconnect'));
    expect(mockDisconnectNode).toBeCalledTimes(1);
  });

  test('should render correctly in mobile', async () => {
    useIsMobile.mockReturnValue(true);
    const { container, getByText, getByTitle } = render(<PathEditPanel />);
    const panelEl = container.querySelector('.adm-floating-panel') as HTMLElement;
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (-280px)))'));
    await waitFor(() => expect(panelEl.getAttribute('data-animating')).toBe('false'));
    expect(container).toMatchSnapshot();

    expect(setSelectedNodeType).not.toBeCalled();
    fireEvent.click(getByTitle('Smooth'));
    expect(setSelectedNodeType).toBeCalledTimes(1);
    expect(setSelectedNodeType).toHaveBeenLastCalledWith(1);

    expect(mockSetRound).not.toBeCalled();
    fireEvent.click(getByText('Round'));
    expect(mockSetRound).toBeCalledTimes(1);

    expect(mockSetSharp).not.toBeCalled();
    fireEvent.click(getByText('Sharp'));
    expect(mockSetRound).toBeCalledTimes(1);

    expect(mockDisconnectNode).not.toBeCalled();
    fireEvent.click(getByText('Disconnect'));
    expect(mockDisconnectNode).toBeCalledTimes(1);

    expect(deleteSelected).not.toBeCalled();
    fireEvent.click(getByText('Delete'));
    expect(deleteSelected).toBeCalledTimes(1);

    expect(toSelectMode).not.toBeCalled();
    fireEvent.click(container.querySelector('.close-icon'));
    await waitFor(() => expect(panelEl.style.transform).toBe('translateY(calc(100% + (0px)))'));
    await waitFor(() => expect(toSelectMode).toBeCalledTimes(1));
  });
});
