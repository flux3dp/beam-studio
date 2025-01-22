import React from 'react';

import ReactDOMServer from 'react-dom/server';

const wrapSVG = (width: number, height: number, content: React.JSX.Element[]): string =>
  `<?xml version="1.0" standalone="no"?>\n` +
  `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n` +
  `${ReactDOMServer.renderToString(
    <svg
      height={`${height}mm`}
      version="1.0"
      viewBox={`0 0 ${width} ${height}`}
      width={`${width}mm`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {content}
    </svg>,
  )}`;

export default wrapSVG;
