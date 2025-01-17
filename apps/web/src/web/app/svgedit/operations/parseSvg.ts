import getMainColorOfElement from 'helpers/color/getMainColorOfElement';
import SymbolMaker from 'helpers/symbol-maker';
import units, { Units } from 'helpers/units';
import { IBatchCommand } from 'interfaces/IHistory';

const { svgedit } = window;
const { NS } = svgedit;

const parseSvg = (
  batchCmd: IBatchCommand,
  svgElement: Element,
  type: string
): {
  symbols: SVGSymbolElement[];
  confirmedType: string;
} => {
  function unit2Pixel(val, unit?: Units) {
    if (val === false || val === undefined || val === null) {
      return false;
    }

    // is percentage
    if (val.substr(-1) === '%') {
      console.error('SVG Parse, Unsupported unit "%" for', val);
      return null;
    }
    if (!Number.isNaN(Number(val))) {
      return val;
    }
    // eslint-disable-next-line no-param-reassign
    unit = unit || val.substr(-2);
    const num = val.substr(0, val.length - 2);
    if (!units.unitMap[unit]) {
      console.warn(`unsupported unit ${unit} for ${val} use pixel instead`);
      return units.convertUnit(num, 'pt', 'px');
    }
    console.log(num, unit, 'convert');
    return units.convertUnit(num, 'pt', unit);
  }
  const removeComments = () => {
    // only remove comment which level is svg.children.
    // should traverse all svg level and remove all comments if you have time
    svgElement.childNodes.forEach((node) => {
      if (node.nodeType === Node.COMMENT_NODE) {
        svgElement.removeChild(node);
      }
    });
  };
  function symbolWrapper(symbolContents, unit?) {
    if (symbolContents.tagName === 'g' && symbolContents.childNodes.length === 0) {
      console.log('wrapping empty group, return null');
      return null;
    }
    const rootViewBox = svgElement.getAttribute('viewBox');
    const rootWidth = unit2Pixel(svgElement.getAttribute('width'), unit);
    const rootHeight = unit2Pixel(svgElement.getAttribute('height'), unit);
    const rootTransform = svgElement.getAttribute('transform') || '';

    const transformList = [];
    transformList.unshift(rootTransform);

    if (rootWidth && rootHeight && rootViewBox) {
      console.log('resize with width height viewbox');

      const resizeW = rootWidth / Number(rootViewBox.split(' ')[2]);
      const resizeH = rootHeight / Number(rootViewBox.split(' ')[3]);
      transformList.unshift(`scale(${resizeW}, ${resizeH})`);
    } else {
      // console.log('resize with 72 dpi');

      const svgUnitScaling = unit2Pixel('1px');
      transformList.unshift(`scale(${svgUnitScaling})`);
    }

    const wrappedSymbolContent = document.createElementNS(NS.SVG, 'g');
    if (symbolContents.length) {
      symbolContents.forEach((content) => {
        wrappedSymbolContent.appendChild(content);
      });
    } else {
      try {
        wrappedSymbolContent.appendChild(symbolContents);
      } catch (e) {
        console.log(e);
      }
    }
    if (wrappedSymbolContent.childNodes.length === 0) {
      return null;
    }
    wrappedSymbolContent.setAttribute('viewBox', rootViewBox);
    wrappedSymbolContent.setAttribute('transform', transformList.join(' '));

    return wrappedSymbolContent;
  }
  function parseSvgByLayer() {
    const defNodes = Array.from(svgElement.childNodes).filter(
      (node: Element) => node.tagName === 'defs'
    );
    let defChildren = [];
    defNodes.forEach((def: Element) => {
      defChildren = defChildren.concat(Array.from(def.childNodes));
    });
    const layerNodes = Array.from(svgElement.childNodes).filter(
      (node: Element) =>
        !['defs', 'title', 'style', 'metadata', 'sodipodi:namedview'].includes(node.tagName)
    );
    if (layerNodes.length === 0) return [];
    let elem = layerNodes[0];
    if (layerNodes.length > 1) {
      const g = document.createElementNS(NS.SVG, 'g');
      layerNodes.forEach((node) => {
        g.appendChild(node);
      });
      elem = g;

    }
    const symbol = SymbolMaker.makeSymbol(
      symbolWrapper(elem),
      [],
      batchCmd,
      defChildren,
      'layer'
    );
    return [symbol];
  }
  function parseSvgByColor(svg) {
    function getAllColorInNodes(nodes) {
      const allColorsInNodes: Set<string> = new Set();

      function traverseToGetAllColor(frontierNode) {
        Array.from(frontierNode.childNodes).forEach((child: Element) => {
          if (['polygon', 'path', 'line', 'rect', 'ellipse', 'circle'].includes(child.tagName)) {
            allColorsInNodes.add(getMainColorOfElement(child));
          } else if (child.tagName === 'g') {
            traverseToGetAllColor(child);
          }
        });
      }

      nodes.map((node) => traverseToGetAllColor(node));

      return allColorsInNodes;
    }

    function filterColor(filter, node) {
      const children = Array.from(node.childNodes);
      let color;
      children.forEach((grandchild: Element) => {
        if (
          ['polygon', 'path', 'line', 'rect', 'ellipse', 'circle'].indexOf(grandchild.tagName) >= 0
        ) {
          color = getMainColorOfElement(grandchild);
          if (color !== filter) {
            node.removeChild(grandchild);
          } else {
            node.setAttribute('data-color', color);
          }
        } else if (grandchild.tagName === 'g') {
          // TODO: Bug
          grandchild.setAttribute('data-color', color);
          filterColor(filter, grandchild);
        }
      });
    }

    const defNodes = Array.from(svg.childNodes).filter((node: Element) => node.tagName === 'defs');
    let defChildren = [];
    defNodes.forEach((def: Element) => {
      defChildren = defChildren.concat(Array.from(def.childNodes));
    });

    const parentNodes = [svg];
    const uses = Array.from(svg.getElementsByTagName('use')) as SVGUseElement[];
    uses.forEach((use) => {
      const href = $(svg).find(use.getAttribute('xlink:href'));
      if (href.length > 0) {
        const newElem = href[0].cloneNode(true);
        use.parentNode.appendChild(newElem);
        use.remove();
      }
    });
    const availableColors = getAllColorInNodes(parentNodes);
    // re-classify elements by their color
    const groupColorMap: { [key: string]: Element } = {};
    parentNodes.forEach((child: Element) => {
      Array.from(availableColors).forEach((strokeColor) => {
        const clonedGroup = child.cloneNode(true);
        filterColor(strokeColor, clonedGroup);
        if (!groupColorMap[strokeColor]) {
          groupColorMap[strokeColor] = document.createElementNS(NS.SVG, 'g') as Element;
          groupColorMap[strokeColor].setAttribute('data-color', strokeColor);
        }
        for (let i = clonedGroup.childNodes.length - 1; i >= 0; i -= 1) {
          groupColorMap[strokeColor].appendChild(clonedGroup.childNodes[i]);
        }
      });
    });

    const coloredLayerNodes = Object.values(groupColorMap);

    const symbols = coloredLayerNodes.map((node) => {
      const wrappedSymbolContent = symbolWrapper(node);
      const color = node.getAttribute('data-color');
      if (color) {
        wrappedSymbolContent.setAttribute('data-color', color);
      }
      const symbol = SymbolMaker.makeSymbol(
        wrappedSymbolContent,
        [],
        batchCmd,
        defChildren,
        'color'
      );
      return symbol;
    });
    return symbols;
  }
  function parseSvgByNolayer(svg) {
    // this is same as parseByLayer .....
    const defNodes = Array.from(svg.childNodes).filter((node: Element) => node.tagName === 'defs');
    const styleNodes = Array.from(svg.childNodes).filter(
      (node: Element) => node.tagName === 'style'
    );
    let defChildren = [];
    defNodes.forEach((def: Element) => {
      defChildren = defChildren.concat(Array.from(def.childNodes));
    });
    defChildren = defChildren.concat(styleNodes);

    const layerNodes = Array.from(svg.childNodes).filter(
      (node: Element) =>
        !['defs', 'title', 'style', 'metadata', 'sodipodi:namedview'].includes(node.tagName)
    );
    if (layerNodes.length === 0) return [];
    const wrappedSymbolContent = symbolWrapper(layerNodes);
    if (!wrappedSymbolContent) return [];
    const symbol = SymbolMaker.makeSymbol(
      wrappedSymbolContent,
      [],
      batchCmd,
      defChildren,
      type
    );

    return [symbol];
  }
  // return symbols
  // removeSvgText();
  removeComments();
  let symbols;
  switch (type) {
    case 'color':
      return {
        symbols: parseSvgByColor(svgElement),
        confirmedType: 'color',
      };

    case 'nolayer':
      return {
        symbols: parseSvgByNolayer(svgElement),
        confirmedType: 'nolayer',
      };
    case 'layer':
      symbols = parseSvgByLayer();
      if (symbols) {
        return {
          symbols,
          confirmedType: 'layer',
        };
      }
      console.log('Not valid layer. Use nolayer parsing option instead');
      return {
        symbols: parseSvgByNolayer(svgElement),
        confirmedType: 'nolayer',
      };
    case 'image-trace':
      return {
        symbols: parseSvgByColor(svgElement),
        confirmedType: 'color',
      };
    default:
      break;
  }
  return null;
};

export default parseSvg;
