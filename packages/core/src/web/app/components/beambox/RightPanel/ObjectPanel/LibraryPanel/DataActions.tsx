import IconButton from '@core/app/components/beambox/RightPanel/common/IconButton';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { exportContents, importContents } from '@core/helpers/contentLibrary/manager';

import styles from './DataActions.module.scss';

interface Props {
  elem: SVGElement;
}

const DataActions = ({ elem }: Props) => {
  return (
    <div className={styles.container}>
      <IconButton
        icon={<ObjectPanelIcons.Upload />}
        onClick={(e) => {
          e.stopPropagation();
          importContents(elem);
        }}
      />
      <IconButton
        icon={<ObjectPanelIcons.Download />}
        onClick={(e) => {
          e.stopPropagation();
          exportContents(elem.id);
        }}
      />
    </div>
  );
};

export default DataActions;
