import React, { forwardRef, MutableRefObject, useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import useImage from 'use-image';
import { Image, Transformer } from 'react-konva';
import { setRotationAngle } from 'app/svgedit/transform/rotation';

import findDefs from 'app/svgedit/utils/findDef';
import NS from 'app/constants/namespaces';
import svgStringToCanvas from 'helpers/image/svgStringToCanvas';
import symbolMaker from 'helpers/symbol-maker';
import updateElementColor from 'helpers/color/updateElementColor';

import { ImageDimension } from './dimension';

const getImageUrl = async (
  element: SVGElement,
  bbox: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  const svgDefs = findDefs();
  const { x, y, width, height } = bbox;
  const svgContent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
  const clonedSvgContent = svgContent.cloneNode(true) as SVGSVGElement;
  clonedSvgContent.setAttribute('width', (width + 2).toString());
  clonedSvgContent.setAttribute('height', (height + 2).toString());
  clonedSvgContent.setAttribute('viewBox', `${x - 1} ${y - 1} ${width + 2} ${height + 2}`);
  const elementId = element.getAttribute('id');
  const clonedElement = clonedSvgContent.getElementById(elementId);
  setRotationAngle(clonedElement as SVGElement, 0);
  // keep title, filter and selected element, remove other elements
  const elementsToDelete = clonedSvgContent.querySelectorAll(
    `g.layer > *:not(filter):not(title):not(#${elementId})`
  );
  elementsToDelete.forEach((e) => e.remove());
  const defs = document.createElementNS(NS.SVG, 'defs');
  clonedSvgContent.appendChild(defs);
  const useElements =
    clonedElement.tagName === 'use'
      ? [clonedElement as SVGUseElement]
      : [...clonedElement.querySelectorAll('use')];

  useElements.forEach((useElement) => {
    symbolMaker.switchImageSymbol(useElement, false);
    const href = useElement.getAttribute('href') || useElement.getAttribute('xlink:href');
    const symbol = svgDefs.querySelector(href);
    if (!symbol) return;
    const clonedSymbol = symbol.cloneNode(true) as SVGSymbolElement;
    defs.appendChild(clonedSymbol);
    updateElementColor(useElement);
  });
  const svgStr = new XMLSerializer().serializeToString(clonedSvgContent);
  const canvas = await svgStringToCanvas(svgStr, width + 2, height + 2);
  return canvas.toDataURL();
};

interface Props {
  isDragging: boolean;
  element: SVGElement;
  elementBBox: { x: number; y: number; width: number; height: number };
  initDimension: ImageDimension;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onChange: (imageDimension: Partial<ImageDimension>) => void;
}

const KonvaImage = forwardRef<Konva.Image, Props>(
  (
    {
      isDragging,
      element,
      elementBBox,
      initDimension,
      onChange,
      onMouseEnter,
      onMouseLeave,
    }: Props,
    imageRef: MutableRefObject<Konva.Image>
  ): JSX.Element => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
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

    const { x, y, width, height, rotation } = initDimension;
    if (!image || status !== 'loaded') return null;

    return (
      <>
        <Image
          ref={imageRef}
          draggable={!isDragging}
          image={image}
          x={x}
          y={y}
          width={width}
          height={height}
          rotation={rotation}
          cursor="move"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onDragMove={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() });
          }}
          onDragEnd={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() });
          }}
          onTransform={() => {
            const node = imageRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            onChange({
              x: node.x(),
              y: node.y(),
              width: node.width() * scaleX,
              height: node.height() * scaleY,
              rotation: node.rotation(),
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
              x: node.x(),
              y: node.y(),
              width: node.width(),
              height: node.height(),
              rotation: node.rotation(),
            });
          }}
        />
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
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
          borderStroke="#0000ff"
          borderDash={[5, 5]}
          rotateAnchorCursor="url(js/lib/svgeditor/images/rotate.png) 12 12, auto"
          rotateAnchorOffset={20}
        />
      </>
    );
  }
);

export default KonvaImage;
