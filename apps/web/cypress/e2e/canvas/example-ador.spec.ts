import { md5 } from '../../support/utils';

const isWindows = Cypress.platform === 'win32';

const exampleList = [
  {
    label: 'Example of Ador Laser',
    type: 'Example Files',
    ador: 'a9b703b1728273974be394b71eb15aa7',
  },
  {
    label: 'Example of Ador Printing - Single Color',
    type: 'Example Files',
    ador: 'a5834194978f3243d201cc71917e476e',
  },
  {
    label: 'Example of Ador Printing - Full Color',
    type: 'Example Files',
    ador: '73309298198f65d7ac1ecae0b351bd75',
  },
  {
    label: 'Example of beamo',
    type: 'Example Files',
    ador: 'a6c1e53047862f252ed7329db7485e15',
  },
  {
    label: 'Example of Beambox',
    type: 'Example Files',
    ador: 'bef90388836b530e7c2e12e63a0a47e5',
  },
  {
    label: 'Material Engraving Test',
    type: 'Material Test',
    ador: '72872bf0a1afe9cba8fca9001acfa345',
  },
  {
    label: 'Material Engraving Test - Classic',
    type: 'Material Test',
    ador: '61134b1c28afeb68aec0ae4d8132edda',
  },
  {
    label: 'Material Cutting Test',
    type: 'Material Test',
    ador: '1be9b48cf103533ecce3f3d51efe1a59',
  },
  {
    label: 'Material Cutting Test - Simple',
    type: 'Material Test',
    ador: '6fc5f7d08b19aa4959e1909f2c0511a7',
  },
  {
    label: 'Material Printing Test',
    type: 'Material Test',
    ador: 'b9a8cb12397f3202ba62cd0feab3c80c',
  },
  {
    label: 'Acrylic Focus Probe - 3mm',
    type: undefined,
    ador: 'efb8c8984cf8c487af478c1e8747d9db',
  },
];

const openExample = (name: string, type?: string) => {
  cy.getMenuItem(type ? ['File', 'Examples', type] : ['File', 'Examples'], name).click();
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
      validateExample(ador);
    });
  });
});
