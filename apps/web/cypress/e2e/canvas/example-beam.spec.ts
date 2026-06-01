import { md5 } from '../../support/utils';

const exampleList = [
  {
    label: 'Example of beamo',
    type: 'Example Files',
    beam: '53c06499b15f0b162170d929790e1d87',
  },
  {
    label: 'Example of Beambox',
    type: 'Example Files',
    beam: '0374f17a0bc6d270d98519449ab4dbb7',
  },
  {
    label: 'Material Engraving Test',
    type: 'Material Test',
    beam: 'dc0059300c0d91ed75ba7dbbf31eb7c4',
  },
  {
    label: 'Material Engraving Test - Classic',
    type: 'Material Test',
    beam: '63f9def50943f0fe6cc7e6b30dc458a7',
  },
  {
    label: 'Material Cutting Test',
    type: 'Material Test',
    beam: 'bb0e5fc669c771746c9866232ae9fdf6',
  },
  {
    label: 'Material Cutting Test - Simple',
    type: 'Material Test',
    beam: '45fa0879d8a11a9a62849dc7577303e6',
  },
  {
    label: 'Material Line Test',
    type: 'Material Test',
    beam: '9e9b561a9a7bd09ccfc9b3d4693c47b5',
  },
  {
    label: 'Acrylic Focus Probe - 3mm',
    type: undefined,
    beam: '901ddbfb57d6c73b1ca3cac308254d37',
  },
];

const openExample = (name: string, type?: string) => {
  cy.getMenuItem(type ? ['File', 'Examples', type] : ['File', 'Examples'], name).click();
};

const validateExample = (expectedHash: string) => {
  cy.findByTestId('Layer 1', { timeout: 10000 }).should('not.exist');
  cy.get('#svgcontent')
    .invoke('prop', 'outerHTML')
    .then((html) => {
      expect(md5(html)).to.equal(expectedHash);
    });
};

describe('Example Import (BeamSeries)', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  exampleList.forEach(({ label, beam, type }) => {
    it(`Import ${label} in BeamSeries`, () => {
      openExample(label, type);
      validateExample(beam);
    });
  });
});
