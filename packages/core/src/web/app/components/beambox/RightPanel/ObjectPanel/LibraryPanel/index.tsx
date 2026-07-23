import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import ContentSection from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/ContentSection';
import CustomDataToggle from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/CustomDataToggle';
import DataActions from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/DataActions';
import Divider from '@core/app/components/common/Divider';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

export const LibraryPanelTitle = ({ elem }: { elem: SVGElement }) => {
  const { sections } = useI18n().beambox.right_panel.object_panel;

  return (
    <ControlBlock className={styles.block} type={ControlType.LIBRARY}>
      <span>{sections.library}</span>
      <DataActions elem={elem} />
    </ControlBlock>
  );
};

interface Props {
  elem: SVGElement;
}

const LibraryPanel = ({ elem }: Props) => {
  const isTablet = useIsTabletOrMobile();

  return isTablet ? (
    <ObjectPanelItem
      icon={<ObjectPanelIcons.Library />}
      id="library"
      renderContent={() => (
        <>
          <CustomDataToggle elem={elem} />
          <Divider marginBottom={10} marginTop={10} />
          <ContentSection elem={elem} />
        </>
      )}
      title={<LibraryPanelTitle elem={elem} />}
    />
  ) : (
    <div className={styles.panel}>
      <ContentSection elem={elem} />
      <CustomDataToggle elem={elem} />
    </div>
  );
};

export default LibraryPanel;
