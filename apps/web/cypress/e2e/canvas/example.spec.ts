import { md5 } from '../../support/utils';

const isWindows = Cypress.platform === 'win32';

const exampleList = [
  {
    label: 'Example of Ador Laser',
    type: 'Example Files',
    // md5 hash of the SVG content, Linux and Windows by order
    ador: ['21094e29e4aa055e51f2579e0ddcdcc9', '15d666bd132d14ed8523d30fcd9a23db'],
  },
  {
    label: 'Example of Ador Printing - Single Color',
    type: 'Example Files',
    ador: ['1f6a7c0a62535d5f7adbbd96f8084f19', '563eef5be9cb01775c20c0d063ab7a55'],
  },
  {
    label: 'Example of Ador Printing - Full Color',
    type: 'Example Files',
    ador: ['f5fae608f9a4e41d205bdb77edad7d55', '748ed74784e3a3f563a29e144966ef57'],
  },
  {
    label: 'Example of beamo',
    type: 'Example Files',
    ador: ['7c07caadd8e494ad3586a7f773cbac8a', '12051f21f4d243e9ac12e71fe1c6ddd5'],
    beam: '85f6e6c628d3d9c0c0ba6d31b047ef34',
  },
  {
    label: 'Example of Beambox',
    type: 'Example Files',
    ador: ['9c1a31175c421a17392cd3cc05c092b2', 'a9729db6420b9d0897e5b4858162ef7a'],
    beam: 'fab4ae5c44610a362d589a7e705d70f7',
  },
  {
    label: 'Material Engraving Test',
    type: 'Material Test',
    ador: ['22f173149936c6013852f36b4c8c7d2c', '96110ef8909d3c090df5e2776dea9f19'],
    beam: 'cb4f37849e575a18124cee706fb2d0e6',
  },
  {
    label: 'Material Engraving Test - Classic',
    type: 'Material Test',
    ador: ['c8106ce4d8aa62f980bbfc2f67ed218e', 'c90f847d07e19d1852595626ad07cf4b'],
    beam: '62f575b3059bf2967ff8ca182605429f',
  },
  {
    label: 'Material Cutting Test',
    type: 'Material Test',
    ador: ['e3282d392ba4b4117d826bc968ce228a', '8f772db3439e86d00034969f21c7f0e8'],
    beam: '69c51e0e37aeedec90413c1f7c7617ca',
  },
  {
    label: 'Material Cutting Test - Simple',
    type: 'Material Test',
    ador: ['cb190e98c4a193db5773daebf6a66f4b', '5fffea828692ee5bf2a15aa070c314e5'],
    beam: '9170c84993be2fa25455ab148acba590',
  },
  {
    label: 'Material Line Test',
    type: 'Material Test',
    ador: [],
    beam: 'efba377f0a2e9d51aa1f7caf2d66d9ba',
  },
  {
    label: 'Material Printing Test',
    type: 'Material Test',
    ador: ['05e3c6a61f49072007e8b9990db6fd86', 'ff9fd1a1a692a51f73823f6bfb92a099'],
  },
  {
    label: 'Acrylic Focus Probe - 3mm',
    ador: ['c8330a4265f8ac6d20fc073613dff692', 'c0858b4bd9ee2e5996a96eba6b30028e'],
    beam: '7054b6487496178cfe6c47f0352b6b13',
  },
];

const openExample = (name, type) => {
  cy.get('div.menu-btn-container').click();
  cy.contains('File').click();
  cy.contains('Examples').click();

  if (type) cy.contains(type).click();

  cy.contains(name).click();
};

const validateExample = (expectedHash?: string) => {
  if (!expectedHash) {
    cy.get('.ant-modal-content')
      .contains('The selected example file is not supported by current workarea.')
      .should('exist');
    return;
  }

  cy.findByTestId('Layer 1', { timeout: 10000 }).should('not.exist');
  cy.get('#svgcontent')
    .invoke('prop', 'outerHTML')
    .then((html) => {
      expect(md5(html)).to.equal(expectedHash);
    });
};

describe('Example Import', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  exampleList.forEach(({ label, ador, beam, type }) => {
    it(`Import ${label} in Ador`, () => {
      cy.changeWorkarea('Ador');
      openExample(label, type);

      const expectedHash = isWindows ? ador[1] : ador[0];

      validateExample(expectedHash);
    });

    if (beam) {
      it(`Import ${label} in BeamSeries`, () => {
        openExample(label, type);
        validateExample(beam);
      });
    }
  });
});
