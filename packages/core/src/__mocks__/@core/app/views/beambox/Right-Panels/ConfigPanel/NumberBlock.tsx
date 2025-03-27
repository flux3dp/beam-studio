import React from 'react';

interface Props {
  configKey: string;
  /** not detect inch or mm, always use props unit */
  forceUsePropsUnit?: boolean;
  hasSlider?: boolean;
  id?: string;
  lightTitle?: boolean;
  max?: number;
  min?: number;
  /**  Number input or button for panel-item */
  panelType?: 'button' | 'input';
  precision?: number;
  precisionInch?: number;
  sliderStep?: number;
  step?: number;
  title: string;
  tooltip?: string;
  type?: 'default' | 'modal' | 'panel-item';
  unit?: string;
}

const MockNumberBlock = ({
  configKey,
  forceUsePropsUnit,
  hasSlider,
  id,
  lightTitle,
  max,
  min,
  panelType,
  precision,
  precisionInch,
  sliderStep,
  step,
  title,
  tooltip,
  type,
  unit,
}: Props) => {
  return (
    <div>
      MockNumberBlock
      <p>configKey: {configKey}</p>
      {forceUsePropsUnit && <p>forceUsePropsUnit</p>}
      {hasSlider && <p>hasSlider</p>}
      {id && <p>id: {id}</p>}
      {lightTitle && <p>lightTitle</p>}
      {max !== undefined && <p>max: {max}</p>}
      {min !== undefined && <p>min: {min}</p>}
      {panelType && <p>panelType: {panelType}</p>}
      {precision !== undefined && <p>precision: {precision}</p>}
      {precisionInch !== undefined && <p>precisionInch: {precisionInch}</p>}
      {sliderStep !== undefined && <p>sliderStep: {sliderStep}</p>}
      {step !== undefined && <p>step: {step}</p>}
      {title && <p>title: {title}</p>}
      {tooltip && <p>tooltip: {tooltip}</p>}
      {type && <p>type: {type}</p>}
      {unit && <p>unit: {unit}</p>}
    </div>
  );
};

export default MockNumberBlock;
