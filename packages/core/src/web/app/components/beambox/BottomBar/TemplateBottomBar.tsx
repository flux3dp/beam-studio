// List all elements in current page

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DeleteOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import Content from '@core/app/components/beambox/RightPanel/common/Content';
import { DimensionPanelContent } from '@core/app/components/beambox/RightPanel/DimensionPanel/DimensionPanel';
import { useTextOptions } from '@core/app/components/beambox/RightPanel/ObjectPanel/helper';
import ContentSection from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/ContentSection';
import type { TabKey } from '@core/app/components/beambox/RightPanel/ObjectPanel/tabs';
import { displayTabs } from '@core/app/components/beambox/RightPanel/ObjectPanel/tabs';
import InFillBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/InFillBlock';
import Divider from '@core/app/components/common/Divider';
import ElementPreview from '@core/app/components/common/ElementPreview';
import ListButtonGroup from '@core/app/components/common/ListButtonGroup';
import Popover from '@core/app/components/dialogs/popover/Popover';
import { CanvasElements } from '@core/app/constants/canvasElements';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { deleteSelectedElements } from '@core/app/svgedit/operations/delete';
import selectionManager from '@core/app/svgedit/selection';
import { createNewFitText } from '@core/app/svgedit/text/fitText';
import RwdModal from '@core/app/widgets/RwdModal';
import { ControlType } from '@core/helpers/element/editable/base';
import { mockT } from '@core/helpers/is-dev';
import { determineTargetLayer, isImportable, templateEventEmitter } from '@core/helpers/layer/templateTargetLayer';
import useI18n from '@core/helpers/useI18n';

import styles from './TemplateBottomBar.module.scss';

const TemplateObjectPanel = () => {
  const [open, setOpen] = useState(false);
  const selectedElement = useSelectedElementStore((state) => state.selectedElement)!;
  const textElems = useSelectedElementStore((state) => state.objectPanelData?.textElems ?? []);

  const withContentLibrary = useMemo(() => {
    return (
      !!document.querySelector(
        `#svg_defs defs [data-library-owner="${selectedElement.id}"]:not([data-image-symbol])`,
      ) || selectedElement.getAttribute('data-customer-upload') === 'true'
    );
  }, [selectedElement]);
  const tabs = useMemo(() => {
    const tabs_: TabKey[] = ['text_content', 'text_style', 'dimensions', 'infillPanel', 'infillPathPanel'];

    if (withContentLibrary) tabs_.unshift('content_library');

    return tabs_;
  }, [withContentLibrary]);

  const textTabs = useTextOptions({ elem: selectedElement, textElements: textElems });
  const dimensionTab = (
    <Content>
      <DimensionPanelContent elem={selectedElement} />
    </Content>
  );
  const libraryTab = <ContentSection elem={selectedElement} />;
  const ref = useRef<HTMLDivElement>(null);
  const content = displayTabs(tabs, {
    ...textTabs,
    content_library: libraryTab,
    dimensions: dimensionTab,
    infillPanel: <InFillBlock key="infill" type="infill" />,
    infillPathPanel: <InFillBlock key="path_infill" type="infillPath" />,
  });

  if (content === null) return null;

  return (
    <>
      <div className={styles.more} onClick={() => setOpen(!open)} ref={ref}>
        <EllipsisOutlined />
      </div>
      <RwdModal
        align={{ offset: [0, -40] }}
        getContainer={() => document.body}
        onOpenChange={setOpen}
        open={open}
        placement="top"
        reference={ref.current}
        title={mockT('編輯物件')}
      >
        {content}
      </RwdModal>
    </>
  );
};

const TemplateBottomBar = () => {
  const lang = useI18n();
  const t = lang.beambox.left_panel;
  const { toggleDrawerMode } = useCanvasStore();
  const [open, setOpen] = useState(false);
  const [canAddElement, setCanAddElement] = useState(isImportable);

  useEffect(() => {
    const updateCanAddElement = () => setCanAddElement(isImportable());

    templateEventEmitter.on('TEMPLATE_FILE_CHANGED', updateCanAddElement);

    return () => {
      templateEventEmitter.off('TEMPLATE_FILE_CHANGED', updateCanAddElement);
    };
  }, []);

  const elements = Array.from(document.querySelectorAll('g.layer > *, g[data-tempgroup="true"] > *'))
    .filter((elem) => CanvasElements.visibleElems.includes(elem.tagName) && elem.id)
    .sort((a, b) => a.id.localeCompare(b.id)) as SVGElement[];
  const selectedElements = useSelectedElementStore((state) => state.ungroupedElems);

  const addElementHandlerWrapper = useCallback(async (handler: () => void) => {
    setOpen(false);

    const layer = await determineTargetLayer();

    if (!layer) return;

    selectionManager.clearSelection();
    layerManager.setCurrentLayer(layer);
    handler();
  }, []);

  const items = [
    {
      children: t.label.elements,
      icon: <LeftPanelIcons.Element />,
      onClick: () => addElementHandlerWrapper(() => toggleDrawerMode('element-panel')),
    },
    {
      children: t.label.fit_text,
      icon: <LeftPanelIcons.TextBox />,
      onClick: () =>
        addElementHandlerWrapper(() =>
          createNewFitText(100, 100, { addToHistory: true, isToSelect: true, text: 'Text' }),
        ),
    },
    {
      children: t.label.photo,
      icon: <LeftPanelIcons.Photo />,
      onClick: () => addElementHandlerWrapper(() => FnWrapper.importImage()),
    },
  ];

  return (
    <div className={styles.container}>
      {canAddElement && (
        <>
          <Popover
            onOpenChange={setOpen}
            open={open}
            placement="topLeft"
            title={mockT('新增素材')}
            triggerComponent={
              <div className={classNames(styles.button, styles.addButton)}>
                <PlusOutlined />
              </div>
            }
          >
            <ListButtonGroup items={items} />
          </Popover>
          <Divider className={styles.divider} type="vertical" />
        </>
      )}
      {elements.length > 0 && (
        <div className={styles.elementList}>
          {elements.map((element) => {
            const isVisible = CanvasElements.visibleElems.includes(element.tagName);
            const isSelected = selectedElements?.some((elem) => elem.id === element.id);

            if (!isVisible) return null;

            return (
              <div
                className={classNames(styles.button, styles.elementButton, {
                  [styles.selected]: isSelected,
                })}
                key={element.id}
                onClick={() => selectionManager.selectOnly([element])}
              >
                <ElementPreview element={element as SVGGraphicsElement} />
                {isSelected && selectedElements.length === 1 && <TemplateObjectPanel />}
              </div>
            );
          })}
        </div>
      )}
      {selectedElements.length > 0 &&
        selectedElements.every(
          (elem) =>
            elem.getAttribute('data-editable') === '*' ||
            elem.getAttribute('data-editable')?.includes(String(ControlType.DELETE)),
        ) && (
          <div className={classNames(styles.button, styles.deleteButton)} onClick={() => deleteSelectedElements()}>
            <DeleteOutlined />
          </div>
        )}
    </div>
  );
};

export default TemplateBottomBar;
