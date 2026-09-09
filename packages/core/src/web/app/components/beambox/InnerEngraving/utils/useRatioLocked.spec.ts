import { act, renderHook, waitFor } from '@testing-library/react';

import useRatioLocked from './useRatioLocked';

describe('useRatioLocked', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('reads the setting from each projection element', () => {
    document.body.innerHTML = `
      <svg>
        <rect data-ratiofixed="true" id="locked" />
        <rect data-ratiofixed="false" id="unlocked" />
        <rect id="legacy" />
      </svg>
    `;

    const { rerender, result } = renderHook(({ id }) => useRatioLocked(id), {
      initialProps: { id: 'locked' },
    });

    expect(result.current).toBe(true);

    rerender({ id: 'unlocked' });

    expect(result.current).toBe(false);

    rerender({ id: 'legacy' });

    expect(result.current).toBe(false);
  });

  test('follows attribute changes made by undo and redo', async () => {
    document.body.innerHTML = '<svg><rect data-ratiofixed="true" id="stl" /></svg>';

    const { result } = renderHook(() => useRatioLocked('stl'));
    const elem = document.getElementById('stl')!;

    expect(result.current).toBe(true);

    await act(async () => elem.setAttribute('data-ratiofixed', 'false'));
    await waitFor(() => expect(result.current).toBe(false));

    await act(async () => elem.setAttribute('data-ratiofixed', 'true'));
    await waitFor(() => expect(result.current).toBe(true));
  });
});
