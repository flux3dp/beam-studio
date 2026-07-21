import { md5 } from '../../support/utils';

const isWindows = Cypress.platform === 'win32';

const exampleList = [
  {
    label: 'Example of Ador Laser',
    path: ['Example Files', 'Ador'],
    ador: 'abea345eb052c231e790c377c8c416a2',
  },
  {
    label: 'Example of Ador Printing - Single Color',
    path: ['Example Files', 'Ador'],
    ador: 'd16de4c9643bd7b2aaa6e574fc6d74a2',
  },
  {
    label: 'Example of Ador Printing - Full Color',
    path: ['Example Files', 'Ador'],
    ador: '3e1f16bde6c72b00b6e7ed8af6df98ac',
  },
  {
    label: 'Example of beamo',
    path: ['Example Files'],
    ador: '05ef6a0e37eaf8d63a639e8afc8b21cd',
  },
  {
    label: 'Example of Beambox',
    path: ['Example Files'],
    ador: 'c97773aacc57cf98ffdb6e75f373251e',
  },
  {
    label: 'Material Engraving Test',
    path: ['Material Test'],
    ador: '7aaf335780f03f593e4df133d0677a64',
  },
  {
    label: 'Material Engraving Test - Classic',
    path: ['Material Test'],
    ador: 'eac3e4578ed29b0527016d4b0c9b319d',
  },
  {
    label: 'Material Cutting Test',
    path: ['Material Test'],
    ador: '76fcfa9b72faac5ccdce667601d1c426',
  },
  {
    label: 'Material Cutting Test - Simple',
    path: ['Material Test'],
    ador: 'ad127a8e1bf9d5981861b0708efa5b6c',
  },
  {
    label: 'Material Printing Test',
    path: ['Material Test'],
    ador: '0765f261b4ef290b8b8bab6981112528',
  },
  {
    label: 'beamo & Beambox Focus Probe - 3mm',
    path: ['Accessories'],
    ador: '8309600357f531eaad1453167e91c1df',
  },
];

const openExample = (name: string, path: string[]) => {
  cy.getMenuItem(['File', 'Examples', ...path], name).click();
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

  exampleList.forEach(({ label, ador, path }) => {
    it(`Import ${label} in Ador`, () => {
      cy.changeWorkarea('Ador');
      openExample(label, path);
      validateExample(ador);
    });
  });
});
