import { md5 } from '../../support/utils';

const isWindows = Cypress.platform === 'win32';

const exampleList = [
  {
    label: 'Example of Ador Laser',
    type: 'Example Files',
    // md5 hash of the SVG content, Linux and Windows by order
    ador: ['21094e29e4aa055e51f2579e0ddcdcc9', '409ee0da9a9277ff78450f8413c15234'],
  },
  {
    label: 'Example of Ador Printing - Single Color',
    type: 'Example Files',
    ador: ['1f6a7c0a62535d5f7adbbd96f8084f19', '5030263d3b95ab1a969dff315f2d1e99'],
  },
  {
    label: 'Example of Ador Printing - Full Color',
    type: 'Example Files',
    ador: ['f5fae608f9a4e41d205bdb77edad7d55', '4d6ee54cd6ac873c4b0ec20bce98ea4b'],
  },
  {
    label: 'Example of beamo',
    type: 'Example Files',
    ador: ['7c07caadd8e494ad3586a7f773cbac8a', '86cabcae6bf8c83c3f06b4c4db3ddb8b'],
    beam: '95b1331b843d02427d960a70306d0ba1',
  },
  {
    label: 'Example of Beambox',
    type: 'Example Files',
    ador: ['9c1a31175c421a17392cd3cc05c092b2', 'b2d80ef5c364fe9530a9a4f92df94ab8'],
    beam: '49dfd3e462f6016e782e000746836d0f',
  },
  {
    label: 'Material Engraving Test',
    type: 'Material Test',
    ador: ['22f173149936c6013852f36b4c8c7d2c', '595d3c88d037ea2477f2a67fc700b4d0'],
    beam: '0147483207a6d8366461ee54513e0b77',
  },
  {
    label: 'Material Engraving Test - Classic',
    type: 'Material Test',
    ador: ['c8106ce4d8aa62f980bbfc2f67ed218e', '056d39ce285be6d34ec4ad29d4607bab'],
    beam: 'b969ef63e9c3dc7daaf865cdd7455208',
  },
  {
    label: 'Material Cutting Test',
    type: 'Material Test',
    ador: ['e3282d392ba4b4117d826bc968ce228a', '7eeef206425514a784595d4f92338cc5'],
    beam: '78cc9788d1454173416b2f82340774cd',
  },
  {
    label: 'Material Cutting Test - Simple',
    type: 'Material Test',
    ador: ['cb190e98c4a193db5773daebf6a66f4b', 'c4e6034199673f77caed552f49fd293b'],
    beam: 'f8c85c1949620307fa8f833e39b58c1b',
  },
  {
    label: 'Material Line Test',
    type: 'Material Test',
    ador: [],
    beam: '905f46c1c4ebf4782a7ee886b385b4b8',
  },
  {
    label: 'Material Printing Test',
    type: 'Material Test',
    ador: ['05e3c6a61f49072007e8b9990db6fd86', 'eeec36356b8bb8cbaab036e8719939e0'],
  },
  {
    label: 'Acrylic Focus Probe - 3mm',
    ador: [],
    beam: 'c0e3309e50c763e25f2c7ce8b0f782e3',
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
