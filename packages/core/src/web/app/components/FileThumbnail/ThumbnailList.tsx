import React, { useEffect } from 'react';

import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Modal } from 'antd';

import dialogCaller from '@core/app/actions/dialog-caller';
import { restrictToParent } from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/ContentSection';
import AddButton from '@core/app/components/FileThumbnail/AddButton';
import Thumbnail from '@core/app/components/FileThumbnail/Thumbnail';
import { onThumbnailOrderChange, reorderThumbnails, thumbnails } from '@core/app/components/FileThumbnail/utils';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';

import styles from './ThumbnailList.module.scss';

const maxThumbnails = 10;

const modalId = 'thumbnail-setting-modal';

export const showThumbnailList = (resolve: () => void) => {
  dialogCaller.addDialogComponent(modalId, <ThumbnailList resolve={resolve} />);
};

const closeThumbnailList = () => {
  dialogCaller.popDialogById(modalId);
};

const SortableThumbnail = ({ thumbnailKey }: { thumbnailKey: string }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: thumbnailKey,
  });
  const style = {
    opacity: isDragging ? 0.5 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Thumbnail thumbnailKey={thumbnailKey} withActions />
    </div>
  );
};

const ThumbnailList = ({ resolve }: { resolve?: () => void }) => {
  const lang = useI18n();
  const forceUpdate = useForceUpdate();
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const sensors = useSensors(
    useSensor(isTouch ? TouchSensor : PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => onThumbnailOrderChange(forceUpdate), [forceUpdate]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const sourceIndex = thumbnails.indexOf(active.id as string);
    const destinationIndex = thumbnails.indexOf(over.id as string);

    reorderThumbnails(sourceIndex, destinationIndex);
  };

  const onClose = () => {
    closeThumbnailList();
    resolve?.();
  };

  return (
    <Modal
      centered
      closable={false}
      footer={
        <Button onClick={onClose} type="primary">
          {lang.alert.confirm}
        </Button>
      }
      onCancel={onClose}
      onClose={onClose}
      open
      // template_thumbnail.thumbnails (note: keep counter in title not i18n)
      title={`${lang.template_thumbnail.thumbnails} (${thumbnails.length - 1}/${maxThumbnails})`}
    >
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToParent]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        {/* Always use new array reference */}
        <SortableContext items={[...thumbnails]} strategy={rectSortingStrategy}>
          <div className={styles.grid}>
            {thumbnails.length <= maxThumbnails && <AddButton />}
            {thumbnails.map((key) => (
              <SortableThumbnail key={key} thumbnailKey={key} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </Modal>
  );
};

export default ThumbnailList;
