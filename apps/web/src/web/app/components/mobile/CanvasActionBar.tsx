import React from 'react';
import { TabBar } from 'antd-mobile';

import svgEditor from 'app/actions/beambox/svg-editor';
import { SelectedElementContext } from 'app/contexts/SelectedElementContext';
import { TrashIcon } from 'app/icons/icons';

const CanvasActionBar = (): JSX.Element => {
  const { selectedElement } = React.useContext(SelectedElementContext);
  const [activeKey, setActiveKey] = React.useState('dmkt');

  const tabs = [
    {
      key: 'trash',
      title: '刪除',
      icon: <TrashIcon />,
      disabled: (!selectedElement)
    },
  ];

  const handleTabClick = (key: string) => {
    if (key === 'trash') {
      svgEditor.deleteSelected();
    }
    setActiveKey('dmkt');
  };

  return (
    <div style={{
      position: 'fixed',
      width: '100%',
      borderTop: 'solid 1px #CCC',
      background: '#FFFFFF',
      zIndex: 998,
      overflowX: 'scroll',
      bottom: 50,
    }}
    >
      <div style={{ width: '100%' }}>
        <TabBar
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
            handleTabClick(key);
          }}
        >
          {tabs.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} aria-disabled={item.disabled} />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default CanvasActionBar;
