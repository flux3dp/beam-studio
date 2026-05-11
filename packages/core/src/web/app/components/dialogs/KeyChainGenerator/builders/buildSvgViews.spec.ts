import NS from '@core/app/constants/namespaces';
import { EXPLODED_GAP_PX, KEYCHAIN_COLORS } from '../constants';

import { buildSvgView } from './buildSvgViews';

const makeParams = (overrides: Record<string, any> = {}) => ({
  bounds: { height: 100, width: 200, x: 10, y: 20 } as any,
  decorations: { emboss: [] as SVGElement[], engraving: [] as SVGElement[], refPaths: [] as SVGPathElement[] },
  defaultViewBox: { height: 120, width: 220, x: 5, y: 15 },
  innerPath: null as any,
  resultBasePath: { pathData: 'M0 0 L100 100' } as any,
  ...overrides,
});

describe('buildSvgView', () => {
  it('should create an SVG element with correct viewBox for design mode', () => {
    const svg = buildSvgView('design', makeParams());

    expect(svg.tagName).toBe('svg');
    expect(svg.getAttribute('width')).toBe('100%');
    expect(svg.getAttribute('height')).toBe('100%');

    const viewBox = svg.getAttribute('viewBox');

    // computeDesignViewBox: left=min(10-5, 5)=5, top=min(20-5, 15)=15
    // right=max(10+200+5, 5+220)=225, bottom=max(20+100+5, 15+120)=135
    expect(viewBox).toBe('5 15 220 120');
  });

  it('should render base path with design colors', () => {
    const svg = buildSvgView('design', makeParams());
    const paths = svg.querySelectorAll('path');

    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('d')).toBe('M0 0 L100 100');
    expect(paths[0].getAttribute('stroke')).toBe(KEYCHAIN_COLORS.design.base);
  });

  it('should render engraving decorations with fill color', () => {
    const engravingEl = document.createElementNS(NS.SVG, 'path');

    engravingEl.setAttribute('d', 'M1 1');

    const svg = buildSvgView(
      'design',
      makeParams({ decorations: { emboss: [], engraving: [engravingEl], refPaths: [] } }),
    );
    const children = Array.from(svg.children);

    // base path + cloned engraving
    expect(children.length).toBe(2);
    expect(children[1].getAttribute('fill')).toBe(KEYCHAIN_COLORS.design.engraving);
  });

  it('should render emboss decorations with stroke-only style', () => {
    const embossEl = document.createElementNS(NS.SVG, 'path');

    embossEl.setAttribute('d', 'M2 2');

    const svg = buildSvgView(
      'design',
      makeParams({ decorations: { emboss: [embossEl], engraving: [], refPaths: [] } }),
    );
    const children = Array.from(svg.children);
    // base path + emboss (stroke-only) + inner path (from hasInnerContent due to emboss.length > 0 but innerPath is null)
    const embossChild = children[1];

    expect(embossChild.getAttribute('fill')).toBe('none');
    expect(embossChild.getAttribute('stroke')).toBe(KEYCHAIN_COLORS.design.embossAlign);
    expect(embossChild.getAttribute('vector-effect')).toBe('non-scaling-stroke');
  });

  it('should render inner path when provided', () => {
    const svg = buildSvgView('design', makeParams({ innerPath: { pathData: 'M10 10 L20 20' } }));
    const paths = svg.querySelectorAll('path');

    // base path + inner path
    expect(paths.length).toBe(2);
    expect(paths[1].getAttribute('d')).toBe('M10 10 L20 20');
    expect(paths[1].getAttribute('stroke')).toBe(KEYCHAIN_COLORS.design.embossAlign);
  });

  it('should render refPaths before engraving decorations', () => {
    const refPath = document.createElementNS(NS.SVG, 'path');

    refPath.setAttribute('data-textpath-ref', 'true');
    refPath.setAttribute('id', 'ref-1');

    const engravingEl = document.createElementNS(NS.SVG, 'text');

    const svg = buildSvgView(
      'design',
      makeParams({ decorations: { emboss: [], engraving: [engravingEl], refPaths: [refPath as SVGPathElement] } }),
    );
    const children = Array.from(svg.children);

    // base path, refPath clone, engraving clone
    expect(children.length).toBe(3);
    expect(children[1].getAttribute('data-textpath-ref')).toBe('true');
    expect(children[2].tagName).toBe('text');
  });

  it('should extend viewBox height in exploded mode with inner content', () => {
    const svg = buildSvgView('exploded', makeParams({ innerPath: { pathData: 'M10 10 L20 20' } }));
    const viewBox = svg.getAttribute('viewBox')!;
    const [, , , height] = viewBox.split(' ').map(Number);

    // design height 120 + bounds.height(100) + EXPLODED_GAP_PX
    expect(height).toBe(120 + 100 + EXPLODED_GAP_PX);
  });

  it('should add translated group in exploded mode with inner path', () => {
    const svg = buildSvgView('exploded', makeParams({ innerPath: { pathData: 'M10 10 L20 20' } }));
    const groups = svg.querySelectorAll('g');

    expect(groups.length).toBe(1);

    const dy = 100 + EXPLODED_GAP_PX; // bounds.height + gap

    expect(groups[0].getAttribute('transform')).toBe(`translate(0, ${dy})`);

    // Group contains translated inner path
    const groupPaths = groups[0].querySelectorAll('path');

    expect(groupPaths.length).toBe(1);
    expect(groupPaths[0].getAttribute('d')).toBe('M10 10 L20 20');
    expect(groupPaths[0].getAttribute('stroke')).toBe(KEYCHAIN_COLORS.exploded.emboss);
  });

  it('should add emboss decorations in exploded group', () => {
    const embossEl = document.createElementNS(NS.SVG, 'path');

    embossEl.setAttribute('d', 'M2 2');

    const svg = buildSvgView(
      'exploded',
      makeParams({
        decorations: { emboss: [embossEl], engraving: [], refPaths: [] },
        innerPath: { pathData: 'M10 10' },
      }),
    );
    const group = svg.querySelector('g')!;
    const groupChildren = Array.from(group.children);

    // inner path + emboss clone
    expect(groupChildren.length).toBe(2);
    expect(groupChildren[1].getAttribute('stroke')).toBe(KEYCHAIN_COLORS.exploded.emboss);
  });

  it('should use exploded colors for engraving decorations', () => {
    const engravingEl = document.createElementNS(NS.SVG, 'path');

    engravingEl.setAttribute('d', 'M1 1');

    const svg = buildSvgView(
      'exploded',
      makeParams({ decorations: { emboss: [], engraving: [engravingEl], refPaths: [] } }),
    );
    const children = Array.from(svg.children);

    expect(children[1].getAttribute('fill')).toBe(KEYCHAIN_COLORS.exploded.engraving);
  });

  it('should not extend viewBox or add group in exploded mode without inner content', () => {
    const svg = buildSvgView('exploded', makeParams());
    const viewBox = svg.getAttribute('viewBox')!;
    const [, , , height] = viewBox.split(' ').map(Number);

    expect(height).toBe(120); // no extension
    expect(svg.querySelectorAll('g').length).toBe(0);
  });

  it('should extend viewBox in exploded mode with emboss but no innerPath', () => {
    const embossEl = document.createElementNS(NS.SVG, 'path');

    embossEl.setAttribute('d', 'M2 2');

    const svg = buildSvgView(
      'exploded',
      makeParams({ decorations: { emboss: [embossEl], engraving: [], refPaths: [] } }),
    );
    const viewBox = svg.getAttribute('viewBox')!;
    const [, , , height] = viewBox.split(' ').map(Number);

    // hasInnerContent is true because emboss.length > 0
    expect(height).toBe(120 + 100 + EXPLODED_GAP_PX);
  });
});
