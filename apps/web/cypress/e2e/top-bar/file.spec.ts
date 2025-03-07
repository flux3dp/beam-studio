import { buf as crc32Buf } from 'crc-32';

import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const isWindows = Cypress.platform === 'win32';

describe('manipulate file', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('open file ', () => {
    cy.get('div.menu-btn-container').click();
    cy.get('.rc-menu__submenu').contains('File').click();
    cy.get('.rc-menu').contains('Open').click();
    cy.get('input#file-input').then(($input) => {
      cy.fixture('flux.png', 'base64')
        .then(Cypress.Blob.base64StringToBlob)
        .then((blob) => {
          const el: any = $input[0];
          const testFile = new File([blob], 'flux.png', { type: 'image/png' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(testFile);
          el.files = dataTransfer.files;
          return cy.wrap($input).first().trigger('change', { force: true });
        });
    });
    cy.get('#svg_1').should('exist');
    cy.get('#w_size').should('have.value', '300');
    cy.get('#h_size').should('have.value', '210');
  });

  it('save file', () => {
    const cypressDownloadBeamPath = Cypress.env('cypressDownloadBeamPath');
    cy.get('div.menu-btn-container').click();
    cy.get('.rc-menu__submenu').contains('File').click();
    cy.get('.rc-menu').contains('Save').click();
    cy.wait(1000);

    cy.readFile(cypressDownloadBeamPath, null).then((buf) => {
      let expectedValue = -991491263;
      if (isRunningAtGithub) {
        expectedValue = isWindows ? -1538582088 : 1091338501;
      }
      expect(crc32Buf(buf)).to.equal(expectedValue);
    });
  });

  it('save as file', () => {
    const cypressDownloadNewBeamPath = Cypress.env('cypressDownloadNewBeamPath');
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 400, 400, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('#svg_1').should('exist').should('not.have.attr', 'opacity');
    cy.get('div.menu-btn-container').click();
    cy.get('.rc-menu__submenu').contains('File').click();
    cy.get('.rc-menu').contains('Save As...').click();
    cy.readFile(cypressDownloadNewBeamPath, null).then((buf) => {
      let expectedValue = -2058479582;
      if (isRunningAtGithub) {
        expectedValue = isWindows ? -449132061 : -901845600;
      }
      expect(crc32Buf(buf)).to.equal(expectedValue);
    });
  });

  it('export bvg file ', () => {
    const cypressDownloadBvgPath = Cypress.env('cypressDownloadBvgPath');
    cy.get('div.menu-btn-container').click();
    cy.contains('File').click();
    cy.contains('Export To...').click();
    cy.contains('BVG').click();
    cy.readFile(cypressDownloadBvgPath).then((info) => {
      let expectedValue = 'c187e37d4725c36d2891bae0529dd352';
      if (isRunningAtGithub) {
        expectedValue = isWindows ? 'a676245992fba54a4e787c33ba4aa461' : '6665836ae47675168573b48d43702405';
      }
      expect(md5(info)).equal(expectedValue);
    });
  });

  it('export svg file ', () => {
    const cypressDownloadSvgPath = Cypress.env('cypressDownloadSvgPath');
    cy.get('div.menu-btn-container').click();
    cy.contains('File').click();
    cy.contains('Export To...').click();
    cy.contains('SVG').click();
    cy.readFile(cypressDownloadSvgPath).then((info) => {
      let expectedValue = '327f6f7c18e0ea06b9c7eac6dea178bf';
      if (isRunningAtGithub) {
        expectedValue = isWindows ? '0f8913345093796bb80d07595ae3e778' : '7b2d301bee1027fdf5e3042821dded8d';
      }
      expect(md5(info)).equal(expectedValue);
    });
  });

  it('export png file ', () => {
    const cypressDownloadPngPath = Cypress.env('cypressDownloadPngPath');
    cy.get('div.menu-btn-container').click();
    cy.contains('File').click();
    cy.contains('Export To...').click();
    cy.contains('PNG').click();
    cy.readFile(cypressDownloadPngPath).then((info) => {
      expect(md5(info)).equal('b20a5f0d14f9b36425dca6e22ff2712c');
    });
  });

  it('export jpg file ', () => {
    const path = isWindows ? Cypress.env('cypressDownloadJpgPath') : Cypress.env('cypressDownloadJpegPath');
    cy.get('div.menu-btn-container').click();
    cy.contains('File').click();
    cy.contains('Export To...').click();
    cy.contains('JPG').click();
    cy.readFile(path, null).then((buf) => {
      expect(crc32Buf(buf)).to.equal(1826901805);
    });
  });

  it('upload file by drag and drop ', () => {
    cy.fixture('flux.png', 'base64')
      .then(Cypress.Blob.base64StringToBlob)
      .then((blob) => {
        const file = new File([blob], 'flux.png', {
          type: 'image/png',
        });
        const dropEvent: any = {
          dataTransfer: {
            files: [file],
            types: ['Files'],
          },
        };
        cy.get('#workarea').trigger('drop', dropEvent, { force: true });
      });
  });
});
