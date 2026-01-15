import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';

// Organized test data by feature and environment
const EXPECTED_HASHES = {
  gradient: {
    tracePath: {
      github: 'de99510ff9f5ecf06d6743c5a802b835',
      local: '9325b37ca33aec740b5f87c18abcccde',
    },
    disabled: {
      github: '7a59512b45de002b41b3c4ebdcc3760a',
      local: '8b750c751e18b00bc72dea8377826d9b',
    },
    enabled: {
      github: '43975d85f0192f4a42c8b54a38645320',
      local: '1a1046ebad74514f0a1d94bc0482b83b',
    },
  },
  replaceImage: {
    github: '518b33620586dcc009c974956b3de591',
    local: '71a7455be1cef9715b53ee88ccd65016',
  },
  brightness: {
    github: 'be91b1388e6ad406bd6c250024a30be3',
    local: 'd19294402d68750bf658ac486a8ecf48',
  },
  crop: {
    github: '67cfcde3bcb99826faebee4b42526eed',
    local: '0eb78129890a453816fa574e5af92564',
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

  selectImage: () => {
    cy.get('#svg_1').click({ force: true });
  },

  waitForProgress: (timeout = 5000) => {
    cy.waitForProgress(timeout);
  },

  clickModalOk: () => {
    cy.get('button.ant-btn').contains('OK').click({ force: true });
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

  assertPathHash: (selector: string, expectedHashPath: string) => {
    cy.get(selector)
      .invoke('attr', 'd')
      .then((d) => {
        const expected = helpers.getExpectedHash(expectedHashPath);
        expect(md5(d)).equal(expected);
      });
  },

  assertElementAttribute: (selector: string, attribute: string, expectedValue: string) => {
    cy.get(selector).should('have.attr', attribute, expectedValue);
  },
};

describe('Mobile Image Tools', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
  });

  describe('Gradient Operations', () => {
    it('should enable trace function when gradient is removed', () => {
      cy.uploadImage('flux.png');

      // Remove gradient to enable trace
      cy.get('#gradient').should('exist').click({ force: true });
      cy.get('#threshold').should('exist');

      // Trace the image
      cy.get('#trace').should('exist').click({ force: true });
      cy.get('#svg_3', { timeout: 60000 }).click({ force: true });
      cy.getElementTitle().contains('Layer 1 > Path');

      // Verify traced path
      helpers.assertPathHash('#svg_3', 'gradient.tracePath');
    });

    it('should toggle gradient settings on image', () => {
      helpers.uploadTestImage();

      // Disable gradient
      cy.get('#gradient').click({ force: true });
      helpers.assertElementAttribute('#svg_1', 'data-threshold', '128');
      helpers.assertElementAttribute('#svg_1', 'data-shading', 'false');
      helpers.assertImageHash('#svg_1', 'gradient.disabled');

      // Re-enable gradient
      cy.get('#gradient').click({ force: true });
      helpers.assertElementAttribute('#svg_1', 'data-threshold', '254');
      helpers.assertElementAttribute('#svg_1', 'data-shading', 'true');
      helpers.assertImageHash('#svg_1', 'gradient.enabled');
    });
  });

  describe('Image Editing Operations', () => {
    it('should replace image with another file', () => {
      helpers.uploadTestImage();

      // Capture original href and nest all subsequent operations
      cy.get('#svg_1')
        .invoke('attr', 'origImage')
        .then((origImage) => {
          // Replace with new image
          cy.get('#replace_with').click({ force: true });
          cy.get('#file-input').attachFile('map.jpg');
          helpers.waitForProgress();

          // Wait until href actually changes (Cypress will retry this assertion)
          cy.get('#svg_1').invoke('attr', 'origImage').should('not.equal', origImage);

          // Verify replacement hash
          helpers.selectImage();
          helpers.assertImageHash('#svg_1', 'replaceImage');
        });
    });

    it('should adjust image brightness', () => {
      cy.disableImageDownSampling();
      helpers.uploadTestImage();

      // Open grading modal
      cy.get('#grading').click({ force: true });
      cy.get('.ant-modal-content').should('exist');
      cy.waitForImageProcessing();

      // Adjust brightness value
      cy.get('[class*="_-_-packages-core-src-web-app-components-dialogs-image-index-module__field--"]').should('exist');
      cy.get('.ant-modal-content .ant-input-number-input').eq(0).type('25{enter}');

      // Apply changes
      helpers.clickModalOk();
      helpers.waitForProgress();
      cy.get('.ant-modal-content').should('not.exist');

      // Verify result
      helpers.assertImageHash('#svg_1', 'brightness');
    });

    it('should crop image area', () => {
      cy.disableImageDownSampling();
      helpers.uploadTestImage();

      // Start crop operation
      cy.get('#crop').click({ force: true });
      // Wait for crop modal to fully render
      cy.get('.point-se').should('be.visible');

      // Adjust crop area
      cy.get('.point-se').move({ deltaX: 0, deltaY: -100 });

      // Apply crop
      helpers.clickModalOk();
      helpers.waitForProgress(10000);
      cy.get('div.ant-modal-body').should('not.exist');
      cy.waitForImageProcessing();

      // Verify result
      helpers.assertImageHash('#svg_1', 'crop');
    });

    it('should invert image colors', () => {
      cy.disableImageDownSampling();
      helpers.uploadTestImage();

      // Apply invert
      cy.get('#invert').click({ force: true });
      helpers.waitForProgress(10000);
      cy.waitForImageProcessing();

      // Verify result
      helpers.selectImage();
      helpers.assertImageHash('#svg_1', 'invert');
    });
  });
});
