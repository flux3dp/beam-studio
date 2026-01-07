import React, { memo } from 'react';

import classNames from 'classnames';

import Select from '@core/app/widgets/AntdSelect';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

interface Props {
  enableJobOrigin: boolean;
  jobOrigin: number;
  setEnableJobOrigin: (val: boolean) => void;
  setJobOrigin: (val: number) => void;
}

const JobOriginBlock = memo(({ enableJobOrigin, jobOrigin, setEnableJobOrigin, setJobOrigin }: Props) => {
  const t = useI18n().beambox.document_panel;

  return (
    <>
      <div className={styles.separator}>{t.start_position}</div>
      <div className={styles.block}>
        <div className={styles.row}>
          <label className={styles.title} htmlFor="startFrom">
            {t.start_from}
          </label>
          <Select
            className={styles.control}
            id="startFrom"
            onChange={setEnableJobOrigin}
            options={
              [
                { label: t.origin, value: false },
                { label: t.current_position, value: true },
              ] as any
            }
            value={enableJobOrigin}
            variant="outlined"
          />
        </div>
        {enableJobOrigin && (
          <div className={styles.row}>
            <label className={styles.title}>{t.job_origin}</label>
            <div className={styles.control}>
              <div className={styles.radioGroup}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                  <input
                    checked={jobOrigin === val}
                    id={`jobOrigin-${val}`}
                    key={val}
                    name="jobOrigin"
                    onChange={() => setJobOrigin(val)}
                    type="radio"
                  />
                ))}
              </div>
              <div className={styles['job-origin-example']}>
                <img alt="Origin" src="core-img/document-panel/job-origin-example.jpg" />
                <div
                  className={classNames(styles.mark, {
                    [styles.b]: jobOrigin > 6,
                    [styles.c]: jobOrigin > 3 && jobOrigin <= 6,
                    [styles.l]: jobOrigin % 3 === 1,
                    [styles.m]: jobOrigin % 3 === 2,
                    [styles.r]: jobOrigin % 3 === 0,
                    [styles.t]: jobOrigin <= 3,
                  })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

export default JobOriginBlock;
