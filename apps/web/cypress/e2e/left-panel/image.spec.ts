import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';

// Test data organized by environment
const EXPECTED_HASHES = {
  removeGradient: {
    tracePath: {
      github: 'de99510ff9f5ecf06d6743c5a802b835',
      local: '9325b37ca33aec740b5f87c18abcccde',
    },
  },
  changeGradient: {
    withoutGradient: {
      github: '8794655cf390c5f867ed5eff13f3bce4',
      local: '0a52a26dec2bac9490b838b039756347',
    },
    withGradient: {
      github: '8b1b3ac285d65fae820c86dc5b728efd',
      local: '9ea1a67dbee688d7dd3efce5b1666387',
    },
  },
  replaceImage: {
    github: '8b79e9a445262e8412a863d5ec06d16b',
    local: 'bbbec80aa9c17bf1efd66bb07a8eacb8',
  },
  grading: {
    github: '3c43c5b5ec5a8f24d2eb35a508d4b85d',
    local: '740e3d57e5139b6cc92bc93c366d2ebe',
  },
  crop: {
    github: 'a8ad6ba832e34e3cc6544668596fefff',
    local: 'e6b9815171e86ce98a04a0fcf0118367',
  },
  invert: {
    github: 'de1073c40f0c095297d9d87af6b74dc3',
    local: '58f46e5736c0b4d8244aa15f9a9dece3',
  },
};

// Helper functions for common operations
const helpers = {
  uploadTestImage: () => {
    cy.uploadFile('flux.png', 'image/png');
  },

  openObjectsTab: () => {
    cy.get('.tab.objects').click();
  },

  selectImage: () => {
    cy.get('#svg_1').click({ force: true });
  },

  waitForProgress: (timeout = 5000) => {
    cy.waitForProgress(timeout);
  },

  waitForImageProcessing: (timeout = 15000) => {
    cy.waitForImageProcessing(timeout);
  },

  toggleGradient: (switchIndex = 0) => {
    cy.get('.ant-switch').eq(switchIndex).click();
  },

  getExpectedHash: (path: string) => {
    const keys = path.split('.');
    let value: any = EXPECTED_HASHES;
    for (const key of keys) {
      value = value[key];
    }
    return isRunningAtGithub ? value.github : value.local;
  },

  assertImageHash: (selector: string, expectedHashPath: string) => {
    cy.get(selector)
      .invoke('attr', 'xlink:href')
      .then((href) => {
        const expected = helpers.getExpectedHash(expectedHashPath);
        expect(md5(href)).equal(expected);
      });
  },

  assertElementAttribute: (selector: string, attribute: string, expectedValue: string) => {
    cy.get(selector).should('have.attr', attribute, expectedValue);
  },

  clickModalOk: () => {
    cy.get('button[class^="ant-btn"]').contains('OK').click();
  },
};

describe('Image manipulation functions', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  describe('Gradient operations', () => {
    it('should enable trace function when gradient is removed', () => {
      helpers.uploadTestImage();
      helpers.selectImage();
      helpers.openObjectsTab();

      // Verify trace is initially disabled
      cy.get('#trace').should('have.attr', 'disabled');

      // Remove gradient
      helpers.toggleGradient();
      cy.contains('Threshold brightness', { timeout: 60000 }).should('exist');

      // Trace the image
      cy.get('#trace').click();
      cy.get('#svg_3', { timeout: 60000 }).click({ force: true });
      cy.getElementTitle().contains('Layer 1 > Path');

      // Verify traced path
      cy.get('#svg_3')
        .invoke('attr', 'd')
        .then((d) => {
          const expected = helpers.getExpectedHash('removeGradient.tracePath');
          expect(md5(d)).equal(expected);
        });
    });

    it('should change image when gradient is toggled', () => {
      helpers.uploadTestImage();
      helpers.openObjectsTab();
      helpers.toggleGradient();

      // Verify initial state (no gradient)
      helpers.assertElementAttribute('#svg_1', 'data-threshold', '128');
      helpers.assertElementAttribute('#svg_1', 'data-shading', 'false');

      helpers.selectImage();
      helpers.openObjectsTab();
      helpers.assertImageHash('#svg_1', 'changeGradient.withoutGradient');

      // Enable gradient
      helpers.toggleGradient();
      helpers.selectImage();
      helpers.assertElementAttribute('#svg_1', 'data-threshold', '254');
      helpers.assertElementAttribute('#svg_1', 'data-shading', 'true');

      helpers.waitForImageProcessing();
      helpers.assertImageHash('#svg_1', 'changeGradient.withGradient');
    });
  });

  describe('Image replacement and editing', () => {
    it('should replace image with another file', () => {
      helpers.uploadTestImage();
      helpers.openObjectsTab();

      // Replace with new image
      cy.get('#replace_with').click();
      cy.get('#file-input').attachFile('map.jpg');
      helpers.waitForProgress(3000);

      helpers.selectImage();
      helpers.waitForImageProcessing();
      helpers.assertImageHash('#svg_1', 'replaceImage');
    });

    it('should apply grading adjustments', () => {
      cy.disableImageDownSampling();
      helpers.uploadTestImage();
      helpers.waitForImageProcessing();
      helpers.selectImage();
      helpers.openObjectsTab();

      // Open grading modal
      cy.get('#grading').click();
      cy.get('div.ant-modal').should('exist');
      helpers.waitForProgress();

      // Adjust grading curve
      cy.get('rect#1').trigger('mousedown', { clientX: 900, clientY: 125, force: true });
      cy.get('rect#1').should('have.attr', 'fill-opacity', '1').should('have.attr', 'y', '-3');

      cy.get('svg.curve-control-svg').trigger('mousemove', { clientX: 900, clientY: 325, force: true });
      cy.get('svg.curve-control-svg').trigger('mouseup');
      cy.get('rect#1').should('have.attr', 'fill-opacity', '1').should('have.attr', 'y', '197');

      helpers.clickModalOk();
      helpers.waitForProgress();
      cy.get('div.ant-modal').should('not.exist');
      helpers.assertImageHash('#svg_1', 'grading');
    });

    it('should crop image', () => {
      cy.disableImageDownSampling();
      helpers.uploadTestImage();
      helpers.openObjectsTab();

      // Start crop operation
      cy.get('#crop').click();
      // Wait for crop modal to fully render
      cy.get('.point-se').should('be.visible');

      // Adjust crop area
      cy.get('.point-se').move({ deltaX: 0, deltaY: -200 });
      helpers.clickModalOk();

      helpers.waitForProgress(10000);
      cy.get('div.ant-modal-body').should('not.exist');
      helpers.waitForImageProcessing();
      helpers.assertImageHash('#svg_1', 'crop');
    });

    it('should invert image colors', () => {
      cy.disableImageDownSampling();
      helpers.uploadTestImage();
      helpers.openObjectsTab();

      // Apply invert
      cy.get('#invert').click();
      helpers.waitForProgress(20000);

      helpers.selectImage();
      helpers.waitForImageProcessing();
      helpers.assertImageHash('#svg_1', 'invert');
    });
  });
});
