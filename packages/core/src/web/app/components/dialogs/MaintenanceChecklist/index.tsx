import React from 'react';

import { ToolOutlined } from '@ant-design/icons';
import { ConfigProvider, Divider } from 'antd';

import DraggableModal from '@core/app/widgets/DraggableModal';
import useI18n from '@core/helpers/useI18n';

import Body from './components/Body';
import Celebration from './components/Celebration';
import Footer from './components/Footer';
import Header from './components/Header';
import HistoryModal from './components/HistoryModal';
import styles from './styles.module.scss';

interface Props {
  onClose: () => void;
}

/** Shell only: `showMaintenanceChecklist` seeds the store, `MachineSelect` owns the machine roster. */
const MaintenanceChecklist = ({ onClose }: Props): React.JSX.Element => {
  const t = useI18n().maintenance;

  return (
    <ConfigProvider theme={{ token: { borderRadius: 6, colorPrimary: '#1890ff' } }}>
      <DraggableModal
        footer={<Footer />}
        onCancel={onClose}
        open
        title={
          <span className={styles.title}>
            <ToolOutlined />
            {t.title}
          </span>
        }
        width={680}
      >
        <Header />
        <Divider className={styles.divider} />
        <Body />
      </DraggableModal>
      <Celebration />
      <HistoryModal />
    </ConfigProvider>
  );
};

export default MaintenanceChecklist;
