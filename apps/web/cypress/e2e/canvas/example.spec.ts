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
    beam: 'd4e9154a144a9a742c016f68e8fc879f',
  },
  {
    label: 'Example of Beambox',
    type: 'Example Files',
    ador: ['9c1a31175c421a17392cd3cc05c092b2', 'b2d80ef5c364fe9530a9a4f92df94ab8'],
    beam: '1e4436aa12db8fb12c9c17d94485fe4f',
  },
  {
    label: 'Material Engraving Test',
    type: 'Material Test',
    ador: ['22f173149936c6013852f36b4c8c7d2c', '595d3c88d037ea2477f2a67fc700b4d0'],
    beam: 'f123c86896564f55eb0a863093df2804',
  },
  {
    label: 'Material Engraving Test - Classic',
    type: 'Material Test',
    ador: ['c8106ce4d8aa62f980bbfc2f67ed218e', '056d39ce285be6d34ec4ad29d4607bab'],
    beam: '3b79e4ed6a970d48d7c71e29672acc64',
  },
  {
    label: 'Material Cutting Test',
    type: 'Material Test',
    ador: ['e3282d392ba4b4117d826bc968ce228a', '7eeef206425514a784595d4f92338cc5'],
    beam: 'b4a0f15fe65965e3a45ad68a335129f5',
  },
  {
    label: 'Material Cutting Test - Simple',
    type: 'Material Test',
    ador: ['cb190e98c4a193db5773daebf6a66f4b', 'c4e6034199673f77caed552f49fd293b'],
    beam: '901273c1ef562f00cb16cf8e1a457c1f',
  },
  {
    label: 'Material Line Test',
    type: 'Material Test',
    ador: [],
    beam: '335f2040e868be7883f0390a5aff7a0c',
  },
  {
    label: 'Material Printing Test',
    type: 'Material Test',
    ador: ['05e3c6a61f49072007e8b9990db6fd86', 'eeec36356b8bb8cbaab036e8719939e0'],
  },
  {
    label: 'Acrylic Focus Probe - 3mm',
    ador: [],
    beam: 'd5444e1ec2065635296e20af38f71eb7',
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
