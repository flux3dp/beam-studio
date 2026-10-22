import React, { useState } from 'react';

import { Button } from 'antd';

import { isPhotoPlaneProjection } from '@core/app/svgedit/stl/getters';
import { applyPhotoPointCloud } from '@core/app/svgedit/stl/photoPointCloud';
import { generatePhotoPointCloud } from '@core/app/svgedit/stl/photoPointCloudGenerator';
import { isUvDev } from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';

import styles from './ThreeDOptions.module.scss';

interface Props {
  elem: Element;
}

/**
 * Object-level options of a 3D projection.
 *
 * Currently only the uvDev tool that turns a photo into a test point cloud; it reads the dot and
 * layer spacing from the photo's layer. How an object is engraved is a layer parameter (ConfigPanel).
 */
const ThreeDOptions = ({ elem }: Props): null | React.JSX.Element => {
  const { inner_engraving_settings: t } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<null | string>(null);

  if (!isPhotoPlaneProjection(elem) || !isUvDev()) return null;

  const generateTestPointCloud = async () => {
    setGenerationError(null);
    setIsGenerating(true);

    try {
      const buffer = await generatePhotoPointCloud(elem as SVGImageElement);

      applyPhotoPointCloud(elem.id, buffer);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Unable to generate point cloud');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.block}>
      <Button block loading={isGenerating} onClick={generateTestPointCloud} size="small">
        {t.generate_test_point_cloud ?? 'Generate Test Point Cloud'}
      </Button>
      {generationError ? <div className={styles.error}>{generationError}</div> : null}
    </div>
  );
};

export default ThreeDOptions;
