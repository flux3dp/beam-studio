import EmbeddedCanvasManager from 'app/widgets/FullWindowPanel/EmbeddedCanvasManager';
import NS from 'app/constants/namespaces';
import { AutoFitContour } from 'interfaces/IAutoFit';

export class AutoFitCanvasManager extends EmbeddedCanvasManager {
  private backgroundImage: SVGImageElement;
  private _imageOpacity = 0.5;
  private contourGroups: SVGGElement[] = [];
  private data: AutoFitContour[][];
  private focusedIndex = -1;

  override renderContent = (): void => {
    this.backgroundImage = document.createElementNS(NS.SVG, 'image');
    this.backgroundImage.setAttribute('x', '0');
    this.backgroundImage.setAttribute('y', '0');
    this.backgroundImage.setAttribute('width', '100%');
    this.backgroundImage.setAttribute('height', '100%');
    this.backgroundImage.setAttribute('preserveAspectRatio', 'xMidYMid');
    this.backgroundImage.setAttribute('opacity', this._imageOpacity.toFixed(2));
    this.background.appendChild(this.backgroundImage);

    this.setupContent();
  };

  setImageUrl = (url: string): void => {
    this.backgroundImage.setAttributeNS(NS.XLINK, 'href', url);
  };

  get imageOpacity(): number {
    return this._imageOpacity;
  }

  set imageOpacity(opacity: number) {
    if (opacity >= 0 && opacity <= 1) {
      this._imageOpacity = opacity;
      this.backgroundImage?.setAttribute('opacity', this._imageOpacity.toFixed(2));
    }
  }

  setData = (data: AutoFitContour[][]): void => {
    if (data !== this.data) {
      this.data = data;
      this.renderContours();
      this.focusedIndex = -1;
      this.setFocusedIndex(0);
    }
  };

  private renderContours = (): void => {
    if (this.contourGroups) {
      this.contourGroups.forEach((group) => group.remove());
    }
    this.contourGroups = this.data.map((contours) => {
      const group = document.createElementNS(NS.SVG, 'g');
      contours.forEach(({ contour }) => {
        const path = document.createElementNS(NS.SVG, 'path');
        path.setAttribute(
          'd',
          contour.map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
        );
        path.setAttribute('opacity', '0.8');
        path.setAttribute('fill', '#1890ff');
        group.appendChild(path);
      });
      this.svgcontent.appendChild(group);
      group.setAttribute('display', 'none');
      return group;
    });
  };

  setFocusedIndex = (groupIndex: number): void => {
    if (this.focusedIndex !== -1) {
      this.contourGroups[this.focusedIndex]?.setAttribute('display', 'none');
    }
    this.focusedIndex = groupIndex;
    this.contourGroups[groupIndex]?.setAttribute('display', 'inline');
  };
}

export default AutoFitCanvasManager;
