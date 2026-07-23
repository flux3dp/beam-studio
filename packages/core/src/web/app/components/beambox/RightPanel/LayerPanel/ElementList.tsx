import React from 'react';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import selectionManager from '@core/app/svgedit/selection';
import { getOS } from '@core/helpers/getOS';

import ElementListItem, { ElementDropPlaceholder } from './ElementListItem';
import { getSelectedElementList } from './elementListUtils';

interface Props {
  /** Cross-layer id -> element lookup (an id may resolve to an element from another layer while dragging). */
  elementById: Map<string, SVGElement>;
  /** Element ids in render order for this layer (drag override or DOM order); also the range-selection siblings. */
  elementIds: string[];
}

const ElementList = ({ elementById, elementIds }: Props): React.ReactNode => {
  const elements = elementIds.map((id) => elementById.get(id)).filter(Boolean) as SVGElement[];

  const handleSelect = (element: SVGElement, e: React.MouseEvent<HTMLDivElement>) => {
    // stop the click from bubbling to the layer item, which would re-select the layer
    e.stopPropagation();

    const isCtrlOrCmd = (getOS() === 'MacOS' && e.metaKey) || (getOS() !== 'MacOS' && e.ctrlKey);

    if (isCtrlOrCmd) {
      // toggle this element in/out of the current selection
      const selected = getSelectedElementList();
      const next = selected.includes(element) ? selected.filter((el) => el !== element) : [...selected, element];

      selectionManager.multiSelect(next);
    } else if (e.shiftKey) {
      // extend selection contiguously from the current anchor to this element within the layer
      const selected = getSelectedElementList();
      const anchor = selected.find((el) => elements.includes(el)) ?? element;
      const anchorIndex = elements.indexOf(anchor);
      const targetIndex = elements.indexOf(element);

      if (anchorIndex < 0 || targetIndex < 0) {
        selectionManager.multiSelect([...new Set([...selected, element])]);

        return;
      }

      const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
      const range = elements.slice(start, end + 1);

      selectionManager.multiSelect([...new Set([...selected, ...range])]);
    } else {
      selectionManager.selectOnly([element], true);
    }
  };

  return (
    <SortableContext items={elementIds} strategy={verticalListSortingStrategy}>
      {elementIds.map((id, index) => {
        const element = elementById.get(id);

        // ids that don't resolve to an element are the layer's trailing drop placeholder
        return element ? (
          <ElementListItem element={element} index={index} key={id} onSelect={handleSelect} />
        ) : (
          <ElementDropPlaceholder empty={elements.length === 0} id={id} key={id} />
        );
      })}
    </SortableContext>
  );
};

export default ElementList;
