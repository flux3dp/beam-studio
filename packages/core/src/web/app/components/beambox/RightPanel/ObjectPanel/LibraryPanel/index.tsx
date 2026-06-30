import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import { ObjectPanelItem } from '@core/app/components/beambox/RightPanel/common/ObjectPanelItem';
import ContentSection from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/ContentSection';
import CustomDataToggle from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/CustomDataToggle';
import DataActions from '@core/app/components/beambox/RightPanel/ObjectPanel/LibraryPanel/DataActions';
import Divider from '@core/app/components/common/Divider';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/screenStore';
import { ControlType } from '@core/helpers/element/editable/base';
import { mockT } from '@core/helpers/is-dev';

import styles from './index.module.scss';
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
      title={
        <ControlBlock className={styles.block} type={ControlType.LIBRARY}>
          <span>{mockT('圖形庫')}</span>
          <DataActions elem={elem} />
        </ControlBlock>
      }
    />
  ) : (
    <div>
      <ControlBlock type={ControlType.LIBRARY}>
        <span>{mockT('圖形庫')}</span>
        <DataActions elem={elem} />
      </ControlBlock>
      <ContentSection elem={elem} />
      <CustomDataToggle elem={elem} />
    </div>
  );
};

export default LibraryPanel;
