import { md5 } from '../../support/utils';

const exampleList = [
  {
    label: 'Example of beamo',
    type: 'Example Files',
    beam: '4fc7f9ac03bac24119f46ff69dcc9e9d',
  },
  {
    label: 'Example of Beambox',
    type: 'Example Files',
    beam: 'f6b070aa2155eb32bc426a6bdd87ea6c',
  },
  {
    label: 'Material Engraving Test',
    type: 'Material Test',
    beam: 'cb4f37849e575a18124cee706fb2d0e6',
  },
  {
    label: 'Material Engraving Test - Classic',
    type: 'Material Test',
    beam: '62f575b3059bf2967ff8ca182605429f',
  },
  {
    label: 'Material Cutting Test',
    type: 'Material Test',
    beam: '69c51e0e37aeedec90413c1f7c7617ca',
  },
  {
    label: 'Material Cutting Test - Simple',
    type: 'Material Test',
    beam: '9170c84993be2fa25455ab148acba590',
  },
  {
    label: 'Material Line Test',
    type: 'Material Test',
    beam: 'efba377f0a2e9d51aa1f7caf2d66d9ba',
  },
  {
    label: 'Acrylic Focus Probe - 3mm',
    type: undefined,
    beam: '40541b74a60ee5c1a37cbba3651de17a',
  },
];

const openExample = (name: string, type?: string) => {
  cy.get('div[data-testid="top-bar-menu"]').click();
  cy.contains('File').click();
  cy.contains('Examples').click();

  if (type) cy.contains(type).click();

  cy.contains(name).click();
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
