import { buf as crc32Buf } from 'crc-32';
import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const isWindows = Cypress.platform === 'win32';

const selectMenuOption = (submenu, option) => {
  cy.get('div.menu-btn-container').click();
  cy.contains(submenu).click();
  cy.contains(option).click();
};

const uploadFile = (fileName, selector = 'input#file-input') => {
  cy.fixture(fileName, 'base64')
    .then(Cypress.Blob.base64StringToBlob)
    .then((blob) => {
      const file = new File([blob], fileName, { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      cy.get(selector).then(($input) => {
        ($input[0] as any).files = dataTransfer.files;
        cy.wrap($input).trigger('change', { force: true });
      });
    });
};

const checkCrc32 = (filePath, expectedValues) => {
  cy.readFile(filePath, null).then((buf) => {
    const expectedValue = isRunningAtGithub
      ? isWindows
        ? (expectedValues.githubWindows ?? expectedValues.default)
        : (expectedValues.githubLinux ?? expectedValues.default)
      : expectedValues.default;
    expect(crc32Buf(buf)).to.equal(expectedValue);
  });
};

const exportFile = (type) => {
  selectMenuOption('File', 'Export To...');
  cy.contains(type).click();
};

const checkMd5 = (path, expectedValues) => {
  cy.readFile(path).then((info) => {
    const expectedValue = (() => {
      if (isRunningAtGithub) {
        if (isWindows) return expectedValues.githubWindows ?? expectedValues.default;
        else return expectedValues.githubLinux ?? expectedValues.default;
      } else {
        return expectedValues.default;
      }
    })();

    expect(md5(info)).to.equal(expectedValue);
  });
};

describe('manipulate file', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('open file', () => {
    selectMenuOption('File', 'Open');
    uploadFile('flux.png');
    cy.get('#svg_1').should('exist');
    cy.get('#w_size').should('have.value', '300');
    cy.get('#h_size').should('have.value', '210');
  });

  it('save file', () => {
    selectMenuOption('File', 'Save');
    checkCrc32(Cypress.env('cypressDownloadBeamPath'), { default: 2068247971 });
  });

  it('save as file', () => {
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent')
      .trigger('mousedown', 100, 100, { force: true })
      .trigger('mousemove', 400, 400, { force: true })
      .trigger('mouseup', { force: true });

    cy.get('#svg_1').should('exist').should('not.have.attr', 'opacity');
    cy.get('.tab.objects').click();
    cy.get('#x_position').clear().type('100{enter}');
    cy.get('#y_position').clear().type('100{enter}');
    cy.get('#w_size').clear().type('100{enter}');
    cy.get('#h_size').clear().type('100{enter}');

    selectMenuOption('File', 'Save As...');
    checkCrc32(Cypress.env('cypressDownloadNewBeamPath'), { default: 162394220 });
  });

  it('export bvg file', () => {
    exportFile('BVG');
    checkMd5(Cypress.env('cypressDownloadBvgPath'), { default: '3671e4760a7d9a11d7d4de773f1ed34b' });
  });

  it('export svg file', () => {
    exportFile('SVG');
    checkMd5(Cypress.env('cypressDownloadSvgPath'), { default: '90cc8e86a62b73da81f19a7f127b457f' });
  });

  it('export png file', () => {
    exportFile('PNG');
    checkMd5(Cypress.env('cypressDownloadPngPath'), { default: 'b20a5f0d14f9b36425dca6e22ff2712c' });
  });

  it('export jpg file', () => {
    const path = isWindows ? Cypress.env('cypressDownloadJpgPath') : Cypress.env('cypressDownloadJpegPath');

    exportFile('JPG');
    checkCrc32(path, { default: 1826901805 });
  });

  it('upload file by drag and drop', () => {
    uploadFile('flux.png', '#workarea');
  });
});
