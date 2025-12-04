import type { MutableRefObject } from 'react';
import React, { forwardRef, useEffect, useRef, useState } from 'react';

import type Konva from 'konva';
import { Image, Transformer } from 'react-konva';
import useImage from 'use-image';

import NS from '@core/app/constants/namespaces';
import { setRotationAngle } from '@core/app/svgedit/transform/rotation';
import findDefs from '@core/app/svgedit/utils/findDef';
import updateElementColor from '@core/helpers/color/updateElementColor';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';
import symbolMaker from '@core/helpers/symbol-helper/symbolMaker';

import type { ImageDimension } from './dimension';

const getImageUrl = async (
  element: SVGElement,
  bbox: { height: number; width: number; x: number; y: number },
): Promise<string> => {
  const svgDefs = findDefs();
  const { height, width, x, y } = bbox;
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;

  clonedSvgContent.setAttribute('width', (width + 2).toString());
  clonedSvgContent.setAttribute('height', (height + 2).toString());
  clonedSvgContent.setAttribute('viewBox', `${x - 1} ${y - 1} ${width + 2} ${height + 2}`);

  const elementId = element.getAttribute('id');
  const clonedElement = clonedSvgContent.getElementById(elementId);

  setRotationAngle(clonedElement as SVGElement, 0);

  // keep title, filter and selected element, remove other elements
  const elementsToDelete = clonedSvgContent.querySelectorAll(`g.layer > *:not(filter):not(title):not(#${elementId})`);

  elementsToDelete.forEach((e) => e.remove());

  const defs = document.createElementNS(NS.SVG, 'defs');

  clonedSvgContent.appendChild(defs);

  const useElements =
    clonedElement.tagName === 'use' ? [clonedElement as SVGUseElement] : [...clonedElement.querySelectorAll('use')];

  useElements.forEach((useElement) => {
    symbolMaker.switchImageSymbol(useElement, false);

    const href = useElement.getAttribute('href') || useElement.getAttribute('xlink:href');
    const symbol = svgDefs.querySelector(href);

    if (!symbol) {
      return;
    }

    const clonedSymbol = symbol.cloneNode(true) as SVGSymbolElement;

    defs.appendChild(clonedSymbol);
    updateElementColor(useElement);
  });

  const svgStr = new XMLSerializer().serializeToString(clonedSvgContent);
  const canvas = await svgStringToCanvas(svgStr, width + 2, height + 2);

  return canvas.toDataURL();
};

interface Props {
  element: SVGElement;
  elementBBox: { height: number; width: number; x: number; y: number };
  initDimension: ImageDimension;
  isDragging: boolean;
  onChange: (imageDimension: Partial<ImageDimension>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const KonvaImage = forwardRef<Konva.Image, Props>(
  (
    { element, elementBBox, initDimension, isDragging, onChange, onMouseEnter, onMouseLeave }: Props,
    imageRef: MutableRefObject<Konva.Image>,
  ): React.JSX.Element => {
    const [imageUrl, setImageUrl] = useState<null | string>(null);
    const [image, status] = useImage(imageUrl);
    const transformerInited = useRef(false);
    const transformerRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
      getImageUrl(element, elementBBox).then(setImageUrl);
    }, [element, elementBBox]);

    useEffect(() => {
      if (!transformerInited.current && imageRef.current && transformerRef.current) {
        transformerRef.current.nodes([imageRef.current]);
        transformerInited.current = true;
      }
    });

    const { height, rotation, width, x, y } = initDimension;

    if (!image || status !== 'loaded') {
      return null;
    }

    return (
      <>
        <Image
          cursor="move"
          draggable={!isDragging}
          height={height}
          image={image}
          onDragEnd={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() });
          }}
          onDragMove={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() });
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onTransform={() => {
            const node = imageRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            onChange({
              height: node.height() * scaleY,
              rotation: node.rotation(),
              width: node.width() * scaleX,
              x: node.x(),
              y: node.y(),
            });
          }}
          onTransformEnd={() => {
            const node = imageRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);
            node.width(node.width() * scaleX);
            node.height(node.height() * scaleY);
            onChange({
              height: node.height(),
              rotation: node.rotation(),
              width: node.width(),
              x: node.x(),
              y: node.y(),
            });
          }}
          ref={imageRef}
          rotation={rotation}
          width={width}
          x={x}
          y={y}
        />
        <Transformer
          anchorSize={8}
          anchorStyleFunc={(anchor) => {
            anchor.width(8);
            anchor.height(8);
            anchor.strokeWidth(2);
            anchor.cornerRadius(4);

            if (anchor.hasName('rotater')) {
              anchor.fill('#12b700');
              anchor.stroke('#0000ff');
            } else {
              anchor.stroke('#000000');
            }
          }}
          borderDash={[5, 5]}
          borderStroke="#0000ff"
          flipEnabled={false}
          ref={transformerRef}
          rotateAnchorCursor="url(core-img/rotate.png) 12 12, auto"
          rotateAnchorOffset={20}
        />
      </>
    );
  },
);

export default KonvaImage;
