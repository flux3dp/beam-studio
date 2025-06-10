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
      default: -2069102237,
      githubWindows: -712814246,
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
      default: 998815871,
      githubWindows: 566946691,
      githubLinux: -901845600,
    });
  });

  it('export bvg file', () => {
    exportFile('BVG');
    checkMd5(Cypress.env('cypressDownloadBvgPath'), {
      default: 'a14ff761eec4ceec67347c971e3e4e5a',
      githubWindows: '96469ce160c77c0a66543468c84d3966',
      githubLinux: '6665836ae47675168573b48d43702405',
    });
  });

  it('export svg file', () => {
    exportFile('SVG');
    checkMd5(Cypress.env('cypressDownloadSvgPath'), {
      default: 'ead7adc8195b7b4597f70600bdc7bd31',
      githubWindows: '40bba081ce02b72eecbfd6c63e2055a0',
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
