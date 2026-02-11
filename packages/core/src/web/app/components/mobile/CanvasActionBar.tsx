import React from 'react';

import { TabBar } from 'antd-mobile';

import svgEditor from '@core/app/actions/beambox/svg-editor';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import { TrashIcon } from '@core/app/icons/icons';

const CanvasActionBar = (): React.JSX.Element => {
  const { selectedElement } = React.use(SelectedElementContext);
  const [activeKey, setActiveKey] = React.useState('dmkt');

  const tabs = [
    {
      disabled: !selectedElement,
      icon: <TrashIcon />,
      key: 'trash',
      title: '刪除',
    },
  ];

  const handleTabClick = (key: string) => {
    if (key === 'trash') {
      svgEditor.deleteSelected();
    }

    setActiveKey('dmkt');
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderTop: 'solid 1px #CCC',
        bottom: 50,
        overflowX: 'scroll',
        position: 'fixed',
        width: '100%',
        zIndex: 998,
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
            <TabBar.Item aria-disabled={item.disabled} icon={item.icon} key={item.key} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default CanvasActionBar;
