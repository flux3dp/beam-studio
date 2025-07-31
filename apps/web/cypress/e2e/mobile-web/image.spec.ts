import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';

describe('mobile image tools', () => {
  beforeEach(() => {
    cy.viewport('iphone-xr');
    cy.landingEditor();
  });

  it('remove gradient see if trace function gets changed', () => {
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#gradient').should('exist').click({ force: true });
    cy.get('#threshold').should('exist');
    cy.get('#trace').should('exist').click({ force: true });
    cy.get('#svg_3', { timeout: 30000 }).click({ force: true });
    cy.getElementTitle().contains('Layer 1 > Path');
    cy.get('#svg_3')
      .invoke('attr', 'd')
      .then((d) => {
        if (isRunningAtGithub) expect(md5(d)).equal('de99510ff9f5ecf06d6743c5a802b835');
        else expect(md5(d)).equal('9325b37ca33aec740b5f87c18abcccde');
      });
  });

  it('change image gradient', () => {
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#gradient').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'data-threshold', '128').should('have.attr', 'data-shading', 'false');
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('7a59512b45de002b41b3c4ebdcc3760a');
        else expect(md5(href)).equal('599a88f5b1b4ccb5adff20fb6d16a132');
      });
    cy.get('#gradient').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'data-threshold', '254').should('have.attr', 'data-shading', 'true');
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('43975d85f0192f4a42c8b54a38645320');
        else expect(md5(href)).equal('52e72107b978bef0e2b0a71fb0bd5038');
      });
  });

  it('check replace with image', () => {
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#replace_with').click({ force: true });
    cy.get('#file-input').attachFile('map.jpg');
    cy.get('.progress').should('not.exist');
    cy.wait(8000);
    cy.get('#svg_1').click({ force: true });
    cy.get('#svg_1')
      .click()
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('518b33620586dcc009c974956b3de591');
        else expect(md5(href)).equal('8e8786f5f2a58a1877c0c07ca0c95db9');
      });
  });

  it('test change brightness', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#grading').click();
    cy.get('.ant-modal-content').should('exist');
    cy.wait(1000);
    cy.get('[class*="_-_-packages-core-src-web-app-components-dialogs-image-index-module__field--"]').should('exist');
    cy.get('.ant-modal-content .ant-input-number-input').eq(0).type('25{enter}');
    cy.get('button.ant-btn').contains('OK').click();
    cy.get('.progress').should('not.exist');
    cy.wait(5000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('be91b1388e6ad406bd6c250024a30be3');
        else expect(md5(href)).equal('0b18e568940b9ace458aae11a4ac84b0');
      });
  });

  it('check crop image', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#crop').click();
    cy.wait(3000);
    cy.get('.point-se').move({ deltaX: 0, deltaY: -100 });
    cy.get('button.ant-btn').contains('OK').click();
    cy.get('.progress', { timeout: 10000 }).should('not.exist');
    cy.get('div.ant-modal-body').should('not.exist');
    cy.wait(3000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('67cfcde3bcb99826faebee4b42526eed');
        else expect(md5(href)).equal('f136501fcd70553484b2a7e3414164d9');
      });
  });

  it('check bevel image', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('preview.png', 'image/png');
    cy.get('#bevel').click();
    cy.get('.progress', { timeout: 12000 }).should('not.exist');
    cy.wait(3000);
    cy.get('#svg_1').click({ force: true });
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        expect(md5(href)).equal('d0a40f28082679713deda90d73e0e86b');
      });
  });

  it('check invert image', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#invert').click();
    cy.get('.progress', { timeout: 3000 }).should('not.exist');
    cy.wait(3000);
    cy.get('#svg_1').click({ force: true });
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('de1073c40f0c095297d9d87af6b74dc3');
        else expect(md5(href)).equal('fb300cdf807ff1d603cfda97957820af');
      });
  });
});
