import React, { useState } from 'react';

import classNames from 'classnames';

interface AccordionSectionProps {
  children: React.ReactNode;
  title: string;
  value: string;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ children, title, value }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="tool-panel">
      <label className="controls accordion">
        <input className="accordion-switcher" defaultChecked type="checkbox" />
        <p className="caption" onClick={() => setIsCollapsed((prev) => !prev)}>
          {title}
          <span className="value">{value}</span>
        </p>
        <div className={classNames('tool-panel-body', { collapsed: isCollapsed })}>{children}</div>
      </label>
    </div>
  );
};

export default AccordionSection;
