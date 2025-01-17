import EmbeddedCanvasManager from 'app/widgets/FullWindowPanel/EmbeddedCanvasManager';
import findDefs from 'app/svgedit/utils/findDef';
import NS from 'app/constants/namespaces';
import svgStringToCanvas from 'helpers/image/svgStringToCanvas';

import styles from './PassThrough.module.scss';

export class PassThroughCanvasManager extends EmbeddedCanvasManager {
  private passThroughHeight: number;
  private passThroughContainer: SVGSVGElement;
  private passThroughSeparator: SVGGElement;
  private passThroughGuideStart: SVGPathElement;
  private passThroughGuideEnd: SVGPathElement;
  private currentGuideMark: { show: boolean; x: number; width: number };

  override renderContent = (): void => {
    this.initPassThroughContainer();
    const svgcontent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
    if (svgcontent) {
      this.svgcontent = svgcontent.cloneNode(true) as SVGSVGElement;
      this.svgcontent.id = '#pass-through-svgcontent';
      this.root.appendChild(this.svgcontent);
    }
  };

  private initPassThroughContainer = (): void => {
    this.passThroughContainer = document.createElementNS(NS.SVG, 'svg') as SVGSVGElement;
    this.passThroughContainer.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.passThroughContainer.classList.add(styles.passthrough);
    this.background.appendChild(this.passThroughContainer);
    this.passThroughSeparator = document.createElementNS(NS.SVG, 'g') as SVGGElement;
    this.passThroughSeparator.classList.add(styles.separator);
    this.passThroughContainer.appendChild(this.passThroughSeparator);
    this.passThroughGuideStart = document.createElementNS(NS.SVG, 'path') as SVGPathElement;
    this.passThroughGuideStart.classList.add(styles.guide);
    this.passThroughContainer.appendChild(this.passThroughGuideStart);
    this.passThroughGuideEnd = document.createElementNS(NS.SVG, 'path') as SVGPathElement;
    this.passThroughGuideEnd.classList.add(styles.guide);
    this.passThroughContainer.appendChild(this.passThroughGuideEnd);
  };

  setPassThroughHeight = (val: number): void => {
    this.passThroughHeight = val;
    if (this.passThroughSeparator) {
      this.passThroughSeparator.innerHTML = '';
      for (let i = 0; i < Math.ceil(this.height / this.passThroughHeight); i += 1) {
        const start = i * this.passThroughHeight;
        const end = Math.min(start + this.passThroughHeight, this.height);
        const line = document.createElementNS(NS.SVG, 'line');
        line.setAttribute('x1', '-50');
        line.setAttribute('x2', (this.width + 50).toString());
        line.setAttribute('y1', end.toString());
        line.setAttribute('y2', end.toString());
        this.passThroughSeparator.appendChild(line);
        const text = document.createElementNS(NS.SVG, 'text');
        text.setAttribute('x', '-50');
        text.setAttribute('y', ((start + end) / 2).toString());
        text.textContent = `Work Area ${i + 1}`;
        this.passThroughSeparator.appendChild(text);
      }
    }
    this.passThroughGuideEnd?.setAttribute('y1', this.passThroughHeight.toString());
    this.passThroughGuideEnd?.setAttribute('y2', this.passThroughHeight.toString());
    this.renderGuideMark();
  };

  setGuideMark = (show: boolean, x: number, width: number): void => {
    this.currentGuideMark = { show, x, width };
    this.renderGuideMark();
  };

  renderGuideMark = (): void => {
    if (this.currentGuideMark) {
      const { show, x, width } = this.currentGuideMark;
      if (!show) {
        this.passThroughGuideStart.style.display = 'none';
        this.passThroughGuideEnd.style.display = 'none';
      } else {
        this.passThroughGuideStart.style.display = 'block';
        this.passThroughGuideEnd.style.display = 'block';
        const left = (x - width / 2).toFixed(2);
        const right = (x + width / 2).toFixed(2);
        const halfHeight = width / Math.sqrt(3);
        const startMid = 0;
        const startTop = (startMid - halfHeight).toFixed(2);
        const startBottom = (startMid + halfHeight).toFixed(2);
        const endMid = this.passThroughHeight;
        const endTop = (endMid - halfHeight).toFixed(2);
        const endBottom = (endMid + halfHeight).toFixed(2);
        this.passThroughGuideStart.setAttribute(
          'd',
          `M ${left} ${startMid} L ${right} ${startTop} L ${right} ${startBottom} L ${left} ${startMid} Z`
        );
        this.passThroughGuideEnd.setAttribute(
          'd',
          `M ${left} ${endMid} L ${right} ${endTop} L ${right} ${endBottom} L ${left} ${endMid} Z`
        );
      }
    }
  };

  /**
   * generateRefImage
   * @param refHeight height of the reference image (px)
   */
  generateRefImage = async (refHeight: number, downScale = 5): Promise<(string | null)[]> => {
    const clonedDefs = findDefs()?.cloneNode(true) as SVGDefsElement;
    if (clonedDefs) {
      const uses = this.svgcontent.querySelectorAll('use');
      const promises: Promise<void>[] = [];
      uses.forEach((use) => {
        const href = use.getAttributeNS(NS.XLINK, 'href');
        if (href) {
          const symbol = clonedDefs.querySelector(href);
          const image = symbol?.querySelector('image');
          const imageHref = image?.getAttribute('href');
          if (imageHref?.startsWith('blob:file://')) {
            promises.push(
              // eslint-disable-next-line no-async-promise-executor
              new Promise<void>(async (resolve) => {
                const response = await fetch(imageHref);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = () => {
                  image.setAttribute('href', reader.result as string);
                  resolve();
                };
                reader.readAsDataURL(blob);
              })
            );
          }
        }
      });
      await Promise.allSettled(promises);
    }
    const svgString = `
    <svg
      width="${this.width}"
      height="${this.height}"
      viewBox="0 0 ${this.width} ${this.height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${clonedDefs?.outerHTML || ''}
      ${this.svgcontent.innerHTML}
    </svg>`;
    const canvas = await svgStringToCanvas(
      svgString,
      Math.round(this.width / downScale),
      Math.round(this.height / downScale)
    );
    const refImages: (string | null)[] = [];
    for (let i = 0; i < Math.ceil(this.height / this.passThroughHeight); i += 1) {
      if (i === 0) refImages.push(null);
      else {
        const y = Math.round((i * this.passThroughHeight - refHeight) / downScale);
        const height = Math.round(refHeight / downScale);
        const refCanvas = document.createElement('canvas');
        refCanvas.width = canvas.width;
        refCanvas.height = height;
        const refCtx = refCanvas.getContext('2d');
        refCtx.drawImage(canvas, 0, y, canvas.width, height, 0, 0, canvas.width, height);
        refImages.push(refCanvas.toDataURL('image/png'));
      }
    }
    return refImages;
  };
}

export default PassThroughCanvasManager;
