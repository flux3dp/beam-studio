// List all elements in current page

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { DeleteOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
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
import Header from '@core/app/components/dialogs/popover/Header';
import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { deleteSelectedElements } from '@core/app/svgedit/operations/delete';
import selectionManager from '@core/app/svgedit/selection';
import { createNewFitText } from '@core/app/svgedit/text/fitText';
import RwdModal from '@core/app/widgets/RwdModal';
import { ControlType } from '@core/helpers/element/editable/base';
import { useLayerChildElements } from '@core/helpers/hooks/useLayerChildElements';
import { determineTargetLayer, isImportable } from '@core/helpers/layer/templateTargetLayer';
import useI18n from '@core/helpers/useI18n';

import styles from './TemplateBottomBar.module.scss';

const TemplateObjectPanel = () => {
  const t = useI18n().beambox.right_panel.object_panel;
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
        floatingPopoverProps={{ placement: 'top', reference: ref.current }}
        onClose={() => setOpen(false)}
        open={open}
        title={t.edit_object}
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
  const canAddElement = useMemo(isImportable, []);
  const allLayers = useMemo(() => layerManager.getAllLayers().map((layer) => layer.getGroup()), []);
  const { childElements } = useLayerChildElements({ initialLayers: allLayers });
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
            arrow={false}
            content={
              <>
                <Header onClose={() => setOpen(false)} title={lang.beambox.svg_editor.add_new_object} />
                <ListButtonGroup items={items} />
              </>
            }
            onOpenChange={setOpen}
            open={open}
            placement="topLeft"
            trigger="click"
          >
            <div className={classNames(styles.button, styles.addButton)}>
              <PlusOutlined />
            </div>
          </Popover>
          <Divider className={styles.divider} type="vertical" />
        </>
      )}
      <div className={styles.elementList}>
        {allLayers.map((layer) =>
          childElements.get(layer)?.map((element) => {
            const isSelected = selectedElements.includes(element);

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
          }),
        )}
      </div>
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
