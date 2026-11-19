import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Carousel } from 'antd';
import { flushSync } from 'react-dom';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import type { ILang } from '@core/interfaces/ILang';

import styles from './Tips.module.scss';

const getTips = (workarea: WorkAreaModel) => {
  const keys: Array<keyof ILang['tips']> = [
    'canvas_hold_space_to_pan',
    'feature_auto_fit',
    'feature_box_generator',
    'feature_code_generator',
    'feature_elements',
    'feature_layer_color_configurations',
    'feature_material_test',
    'layer_execution_order',
    'machine_clean_mirror',
    'machine_no_unattended_operation',
    'machine_regular_start',
    'object_edit_image_to_erase',
    'object_polygon_sides',
    'object_rounded_rectangle',
    'object_sharpen_portrait',
    'settings_default_text_font',
  ];

  if (!isWeb()) {
    keys.push('settings_auto_save');
  }

  if (workarea === 'fpm1') {
    keys.push('task_parameters_for_promark_color');
  } else if (workarea !== 'fuv1') {
    keys.push(
      'task_focus_lower_for_cutting',
      'task_leather_moisten_reduce_burn',
      'task_slower_for_smoother_acrylic_edge',
    );
  }

  return keys.sort(() => Math.random() - 0.5);
};

const Tips = () => {
  const lang = useI18n().tips;
  const workarea = useWorkarea();
  const tips = useMemo(() => getTips(workarea).map((key) => lang[key]), [workarea, lang]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWidth, setHasWidth] = useState(false);

  // The carousel measures its width once when it mounts and gives every slide that width. A modal
  // renders its content while still hidden, so it would measure 0 and stack the text one character
  // per line until its debounced resize handler runs, which can wait for seconds while the export
  // keeps the main thread busy. Mount it only once the container has been laid out.
  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || container.offsetWidth > 0 || typeof ResizeObserver === 'undefined') {
      setHasWidth(true);

      return undefined;
    }

    const observer = new ResizeObserver(() => {
      if (container.offsetWidth === 0) return;

      observer.disconnect();
      flushSync(() => setHasWidth(true));
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.tips} ref={containerRef}>
      {hasWidth && (
        <Carousel autoplay autoplaySpeed={10000} dots={false} fade speed={300}>
          {tips.map((tip, i) => (
            <div key={i}>
              {lang.tips} {tip}
            </div>
          ))}
        </Carousel>
      )}
    </div>
  );
};

export default Tips;
