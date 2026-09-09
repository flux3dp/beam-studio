import { downgradeInnerEngravingElements } from './downgrade';

describe('downgradeInnerEngravingElements', () => {
  test('removes every 3D marker while preserving the visible 2D elements', () => {
    document.body.innerHTML = `
      <svg id="svgcontent" data-stl-document="1">
        <rect id="mesh" data-stl="1" data-stl-matrix="matrix" fill="none" />
        <image id="photo" data-stl-photo="1" data-stl-transform="transform" href="photo.png" />
        <g id="plain" data-layer="1" />
      </svg>
    `;

    const root = document.getElementById('svgcontent')!;

    downgradeInnerEngravingElements(root);

    expect(root.querySelectorAll('[data-stl], [data-stl-photo], [data-stl-transform]')).toHaveLength(0);
    expect(Array.from(root.attributes).some(({ name }) => name.startsWith('data-stl'))).toBe(false);
    expect(document.getElementById('mesh')).toHaveAttribute('fill', 'none');
    expect(document.getElementById('photo')).toHaveAttribute('href', 'photo.png');
    expect(document.getElementById('plain')).toHaveAttribute('data-layer', '1');
  });
});
