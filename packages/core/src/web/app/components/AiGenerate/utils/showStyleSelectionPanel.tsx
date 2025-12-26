import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';

import StyleSelectionPanel from '../components/StyleSelectionPanel';

export const showStyleSelectionPanel = (onSelect: (style: string) => void): void => {
  const id = 'style-selection-panel';

  if (isIdExist(id)) {
    return;
  }

  addDialogComponent(
    id,
    <StyleSelectionPanel
      onClose={() => popDialogById(id)}
      onSelect={(style) => {
        onSelect(style);
      }}
    />,
  );
};
