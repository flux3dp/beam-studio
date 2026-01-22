import constant from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import { bb2PerspectiveGrid } from '@core/app/components/dialogs/camera/common/solvePnPConstants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import type { PerspectiveGrid } from '@core/interfaces/FisheyePreview';

import type BasePreviewManager from './BasePreviewManager';

export function RegionPreviewMixin<TBase extends new (...args: any[]) => BasePreviewManager>(Base: TBase) {
  return class RegionPreviewManager extends Base {
    protected regionPreviewGrid: PerspectiveGrid = bb2PerspectiveGrid;
    protected regionPreviewOffset: { x: number; y: number };
    private cameraPpmm = 5;
    protected previewPpmm = 10;

    constructor(...args: any[]) {
      super(...args);

      this.regionPreviewOffset = {
        x: this.regionPreviewGrid.x[0] + (this.regionPreviewGrid.x[1] - this.regionPreviewGrid.x[0]) / 2,
        y: this.regionPreviewGrid.y[0] + (this.regionPreviewGrid.y[1] - this.regionPreviewGrid.y[0]) / 2,
      };
    }

    setRegionPreviewGrid = (grid: PerspectiveGrid) => {
      this.regionPreviewGrid = grid;
      this.regionPreviewOffset = {
        x: this.regionPreviewGrid.x[0] + (this.regionPreviewGrid.x[1] - this.regionPreviewGrid.x[0]) / 2,
        y: this.regionPreviewGrid.y[0] + (this.regionPreviewGrid.y[1] - this.regionPreviewGrid.y[0]) / 2,
      };
    };

    /**
     * getPreviewPosition
     * @param x x in px
     * @param y y in px
     * @returns preview camera position x, y in mm
     */
    getPreviewPosition = (x: number, y: number): { x: number; y: number } => {
      let newX = x / constant.dpmm - this.regionPreviewOffset.x;
      let newY = y / constant.dpmm - this.regionPreviewOffset.y;
      const { displayHeight, height: origH, width } = getWorkarea(this.workarea);
      const height = displayHeight ?? origH;

      newX = Math.min(Math.max(newX, -this.regionPreviewGrid.x[0]), width - this.regionPreviewGrid.x[1]);
      newY = Math.min(Math.max(newY, -this.regionPreviewGrid.y[0]), height - this.regionPreviewGrid.y[1]);

      return { x: newX, y: newY };
    };

    preprocessRegionPreviewImage = async (
      imgUrl: string,
      opts: { overlapFlag?: number; overlapRatio?: number } = {},
    ): Promise<HTMLCanvasElement> => {
      const { overlapFlag = 0, overlapRatio = 0 } = opts;
      const img = new Image();

      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = imgUrl;
      });

      const canvas = document.createElement('canvas');
      const ratio = this.previewPpmm / this.cameraPpmm;

      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.scale(ratio, ratio);
      ctx.drawImage(img, 0, 0);

      const { height, width } = canvas;
      const overlapWidth = Math.round(width * overlapRatio);
      const overlapHeight = Math.round(height * overlapRatio);

      if (overlapWidth > 0 || overlapHeight > 0) {
        const imageData = ctx.getImageData(0, 0, width, height);

        for (let x = 0; x < width; x += 1) {
          for (let y = 0; y < height; y += 1) {
            const tDist = overlapFlag & 1 ? y : overlapHeight;
            const rDist = overlapFlag & 2 ? width - x - 1 : overlapWidth;
            const bDist = overlapFlag & 4 ? height - y - 1 : overlapHeight;
            const lDist = overlapFlag & 8 ? x : overlapWidth;
            const xDist = overlapWidth ? Math.min((Math.min(lDist, rDist) + 1) / overlapWidth, 1) : 1;
            const yDist = overlapHeight ? Math.min((Math.min(tDist, bDist) + 1) / overlapHeight, 1) : 1;
            let alphaRatio = xDist * yDist;

            if (alphaRatio < 1) {
              const i = (y * width + x) * 4;

              imageData.data[i + 3] = Math.round(imageData.data[i + 3] * alphaRatio);
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      return canvas;
    };

    regionPreviewAtPoint = async (
      x: number,
      y: number,
      opts: { overlapFlag?: number; overlapRatio?: number } = {},
    ): Promise<boolean> => {
      if (this.ended) return false;

      const { overlapFlag, overlapRatio = 0 } = opts;
      const cameraPosition = this.getPreviewPosition(x, y);
      const imgUrl = await this.getPhotoAfterMoveTo(cameraPosition.x, cameraPosition.y);
      const imgCanvas = await this.preprocessRegionPreviewImage(imgUrl, { overlapFlag, overlapRatio });
      const drawCenter = {
        x: (cameraPosition.x + this.regionPreviewOffset.x) * constant.dpmm,
        y: (cameraPosition.y + this.regionPreviewOffset.y) * constant.dpmm,
      };

      await previewModeBackgroundDrawer.drawImageToCanvas(imgCanvas, drawCenter.x, drawCenter.y, {
        opacityMerge: overlapRatio > 0,
      });

      return true;
    };

    regionPreviewArea = async (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      { overlapRatio = 0.05 }: { overlapRatio?: number } = {},
    ): Promise<boolean> => {
      const getPoints = () => {
        const imgW = (this.regionPreviewGrid.x[1] - this.regionPreviewGrid.x[0]) * constant.dpmm;
        const imgH = (this.regionPreviewGrid.y[1] - this.regionPreviewGrid.y[0]) * constant.dpmm;
        const { x: l, y: t } = this.constrainPreviewXY(Math.min(x1, x2), Math.min(y1, y2));
        const { x: r, y: b } = this.constrainPreviewXY(Math.max(x1, x2), Math.max(y1, y2));

        const res: Array<{ overlapFlag: number; point: [number, number] }> = [];
        const xStep = imgW * (1 - overlapRatio);
        const yStep = imgH * (1 - overlapRatio);
        const xTotal = Math.max(1, Math.ceil((r - l) / xStep));
        const yTotal = Math.max(1, Math.ceil((b - t) / yStep));

        for (let j = 0; j < yTotal; j += 1) {
          const y = t + imgH / 2 + j * yStep;
          const row: Array<{ overlapFlag: number; point: [number, number] }> = [];

          for (let i = 0; i < xTotal; i += 1) {
            const x = l + imgW / 2 + i * xStep;
            let overlapFlag = 0;

            // 1: top, 2: right, 4: bottom, 8: left
            if (j !== 0) overlapFlag += 1;

            if (i !== xTotal - 1) overlapFlag += 2;

            if (j !== yTotal - 1) overlapFlag += 4;

            if (i !== 0) overlapFlag += 8;

            row.push({ overlapFlag, point: [x, y] });
          }

          if (j % 2 !== 0) row.reverse();

          res.push(...row);
        }

        return res;
      };

      return this.previewRegionFromPoints(x1, y1, x2, y2, { getPoints, overlapRatio });
    };
  };
}

export type RegionPreviewManager = InstanceType<ReturnType<typeof RegionPreviewMixin>>;

export default RegionPreviewMixin;
