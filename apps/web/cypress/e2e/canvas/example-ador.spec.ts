import { md5 } from '../../support/utils';

const isWindows = Cypress.platform === 'win32';

const exampleList = [
  {
    label: 'Example of Ador Laser',
    type: 'Example Files',
    ador: ['21094e29e4aa055e51f2579e0ddcdcc9', '42bcb11aeec12ec95da5c91e526d744e'],
  },
  {
    label: 'Example of Ador Printing - Single Color',
    type: 'Example Files',
    ador: ['1f6a7c0a62535d5f7adbbd96f8084f19', '11329b4f386ce67e9ef34bba98e067b7'],
  },
  {
    label: 'Example of Ador Printing - Full Color',
    type: 'Example Files',
    ador: ['f5fae608f9a4e41d205bdb77edad7d55', '60225a6d1ca959908299c2ca90af9958'],
  },
  {
    label: 'Example of beamo',
    type: 'Example Files',
    ador: ['7c07caadd8e494ad3586a7f773cbac8a', '6ff1db48ee4ad9d555a4c67181c813ae'],
  },
  {
    label: 'Example of Beambox',
    type: 'Example Files',
    ador: ['9c1a31175c421a17392cd3cc05c092b2', '5e211a1b39c3e9f47d34756adb46cc0c'],
  },
  {
    label: 'Material Engraving Test',
    type: 'Material Test',
    ador: ['22f173149936c6013852f36b4c8c7d2c', '8c2156bcf2a648867f3fef33c62e8d39'],
  },
  {
    label: 'Material Engraving Test - Classic',
    type: 'Material Test',
    ador: ['c8106ce4d8aa62f980bbfc2f67ed218e', '08ba188cf8446aa89159d763d22d3135'],
  },
  {
    label: 'Material Cutting Test',
    type: 'Material Test',
    ador: ['e3282d392ba4b4117d826bc968ce228a', '286e77d0bc163f576b9b22fd7927aaef'],
  },
  {
    label: 'Material Cutting Test - Simple',
    type: 'Material Test',
    ador: ['cb190e98c4a193db5773daebf6a66f4b', '11fd8f0c7c6bf43cb8c40d70ddf14e8d'],
  },
  {
    label: 'Material Printing Test',
    type: 'Material Test',
    ador: ['05e3c6a61f49072007e8b9990db6fd86', 'b56f547249cddc4b4c344e503b3ac946'],
  },
  {
    label: 'Acrylic Focus Probe - 3mm',
    type: undefined,
    ador: ['c8330a4265f8ac6d20fc073613dff692', 'f4b37f41d13fc07be613e20e6864a69f'],
  },
];

const openExample = (name: string, type?: string) => {
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

describe('Example Import (Ador)', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  exampleList.forEach(({ label, ador, type }) => {
    it(`Import ${label} in Ador`, () => {
      cy.changeWorkarea('Ador');
      openExample(label, type);

      const expectedHash = isWindows ? ador[1] : ador[0];

      validateExample(expectedHash);
    });
  });
});
