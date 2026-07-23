import { useCallback, useEffect, useMemo, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, Modifier } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { Button } from 'antd';

import Row from '@core/app/components/beambox/RightPanel/common/Row';
import ButtonGrid from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/ButtonGrid';
import ContentGrid, {
  SortableContentGrid,
} from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/ContentGrid';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { setMouseMode } from '@core/app/stores/canvas/utils/mouseMode';
import { templateModes, useWithinInteractionModes } from '@core/app/stores/interactionModeStore';
import type { TContent } from '@core/helpers/contentLibrary/manager';
import {
  addContentFromDialog,
  changeContent,
  contentLibraryManager,
  getCurrentContentId,
  getCustomerUploadAllowed,
  LibraryType,
  removeContent,
  reorderContents,
  setDefaultContent,
} from '@core/helpers/contentLibrary/manager';
import useI18n from '@core/helpers/useI18n';

import styles from './ContentSection.module.scss';

export const restrictToParent: Modifier = ({ activeNodeRect, containerNodeRect, transform }) => {
  if (!activeNodeRect || !containerNodeRect) {
    return transform;
  }

  let { x, y } = transform;

  // 左邊界
  if (activeNodeRect.left + x < containerNodeRect.left) {
    x = containerNodeRect.left - activeNodeRect.left;
  }

  // 右邊界
  if (activeNodeRect.right + x > containerNodeRect.right) {
    x = containerNodeRect.right - activeNodeRect.right;
  }

  // 上邊界
  if (activeNodeRect.top + y < containerNodeRect.top) {
    y = containerNodeRect.top - activeNodeRect.top;
  }

  // 下邊界
  if (activeNodeRect.bottom + y > containerNodeRect.bottom) {
    y = containerNodeRect.bottom - activeNodeRect.bottom;
  }

  return {
    ...transform,
    x,
    y,
  };
};

interface Props {
  elem: SVGElement;
}

const ContentSection = ({ elem: owner }: Props) => {
  const { library } = useI18n().beambox.right_panel.object_panel;
  const isWithinTemplateModes = useWithinInteractionModes(templateModes);
  const [contents, setContents] = useState<TContent[]>([]);
  const [current, setCurrent] = useState<null | SVGSymbolElement>(null);
  const [selected, setSelected] = useState<null | SVGSymbolElement>(null);
  const allowUpload = useMemo(() => getCustomerUploadAllowed(owner), [owner]);
  const isImage = contentLibraryManager.type === LibraryType.IMAGE;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const sensors = useSensors(
    useSensor(isTouch ? TouchSensor : PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onUpdate = useCallback(() => {
    setContents(contentLibraryManager.getContent());
    setCurrent(document.getElementById(getCurrentContentId(owner)) as null | SVGSymbolElement);
  }, [owner]);

  useEffect(() => {
    return contentLibraryManager.init(owner, onUpdate);
  }, [owner, onUpdate]);

  if (isWithinTemplateModes) {
    return (
      <div className={styles.container}>
        {allowUpload && <ButtonGrid icon={<PlusOutlined />} onClick={() => addContentFromDialog(owner)} />}
        {contents.map(({ element: content, image, isDefault }) => (
          <ContentGrid
            image={image}
            isDefault={isDefault}
            isImage={isImage}
            isSelected={current === content}
            key={content.id}
            onSelected={() => {
              changeContent(owner, content);
              setCurrent(content);
            }}
          />
        ))}
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const isBackward =
      (over.data.current as { index: number }).index > (active.data.current as { index: number }).index;

    reorderContents(active.id as string, over.id as string, isBackward);
  };

  const contentIds = contents.map(({ element }) => element.id);

  return (
    <div>
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToParent]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext items={contentIds} strategy={rectSortingStrategy}>
          <div className={styles.container}>
            {contents.map(({ element: content, image, isDefault }, index) => (
              <SortableContentGrid
                id={content.id}
                image={image}
                index={index}
                isDefault={isDefault}
                isImage={isImage}
                isSelected={selected === content}
                key={content.id}
                onRemove={() => removeContent(content)}
                onSelected={() => setSelected(content)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Row className={styles.controls}>
        <Button icon={<ObjectPanelIcons.AddFile />} onClick={() => addContentFromDialog(owner)} size="large" />
        <Button icon={<ObjectPanelIcons.Pick />} onClick={() => setMouseMode('pick')} size="large" />
        <Button
          className={styles.wide}
          disabled={!selected}
          icon={<ObjectPanelIcons.Star />}
          onClick={() => {
            setDefaultContent(owner, selected!);
            onUpdate();
          }}
          size="large"
          type="primary"
        >
          {library.set_as_default}
        </Button>
      </Row>
    </div>
  );
};

export default ContentSection;
