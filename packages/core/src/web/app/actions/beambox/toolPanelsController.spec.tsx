import * as React from 'react';

const mockOnObjectFocus = jest.fn();
const mockOnObjectBlur = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-global-interaction', () => ({
  onObjectBlur: mockOnObjectBlur,
  onObjectFocus: mockOnObjectFocus,
}));

jest.mock('@core/app/views/beambox/ToolPanels/ToolPanels', () => () => <div>This is dummy ToolPanels</div>);

import toolPanelsController from './toolPanelsController';

test('test render', async () => {
  expect(toolPanelsController.isVisible).toBeFalsy();
  expect(toolPanelsController.type).toBe('unknown');
  expect(toolPanelsController.data).toEqual({ distance: { dx: 0, dy: 0 }, rowcolumn: { column: 1, row: 1 } });

  toolPanelsController.setVisibility(true);
  expect(toolPanelsController.isVisible).toBeTruthy();
  expect(mockOnObjectFocus).toHaveBeenCalledTimes(1);

  toolPanelsController.setVisibility(false);
  expect(toolPanelsController.isVisible).toBeFalsy();
  expect(mockOnObjectBlur).toHaveBeenCalledTimes(1);

  toolPanelsController.setType('gridArray');
  expect(toolPanelsController.type).toBe('gridArray');

  toolPanelsController.setVisibility(true);
  document.body.innerHTML = '<div id="tool-panels-placeholder" />';
  toolPanelsController.render();
  await new Promise((r) => setTimeout(r, 0));
  expect(document.body.innerHTML).toBe('<div id="tool-panels-placeholder"><div>This is dummy ToolPanels</div></div>');

  toolPanelsController.setVisibility(false);
  toolPanelsController.render();
  expect(document.body.innerHTML).toBe('<div id="tool-panels-placeholder"></div>');
});
