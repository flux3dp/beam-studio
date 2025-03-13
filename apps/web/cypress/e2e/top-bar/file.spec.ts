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
    checkCrc32(Cypress.env('cypressDownloadBeamPath'), {
      default: 1658442270,
      githubWindows: 270013550,
      githubLinux: 1091338501,
    });
  });

  it('save as file', () => {
    cy.clickToolBtn('Rectangle');
    cy.get('svg#svgcontent')
      .trigger('mousedown', 100, 100, { force: true })
      .trigger('mousemove', 400, 400, { force: true })
      .trigger('mouseup', { force: true });

    cy.get('#svg_1').should('exist').should('not.have.attr', 'opacity');

    selectMenuOption('File', 'Save As...');
    checkCrc32(Cypress.env('cypressDownloadNewBeamPath'), {
      default: 1254555484,
      githubWindows: -1947139152,
      githubLinux: -901845600,
    });
  });

  it('export bvg file', () => {
    exportFile('BVG');
    checkMd5(Cypress.env('cypressDownloadBvgPath'), {
      default: '4bed5bfe84b7646b32399e6d8cc7ef7c',
      githubWindows: 'd15387d83b39178a1de4824302bf43e3',
      githubLinux: '6665836ae47675168573b48d43702405',
    });
  });

  it('export svg file', () => {
    exportFile('SVG');
    checkMd5(Cypress.env('cypressDownloadSvgPath'), {
      default: 'dbca6ca94f7463e08cd0a87507d93505',
      githubWindows: 'cd235b45d86c6f73bb17050d9079bdae',
      githubLinux: '7b2d301bee1027fdf5e3042821dded8d',
    });
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
