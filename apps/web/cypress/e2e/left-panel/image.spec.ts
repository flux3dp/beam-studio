import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';

// TODO: expect image result with one specific md5 value
// ImageData generate different results on different browser currently
describe('manipulate image function', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('remove gradient see if trace function gets changed', () => {
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#svg_1').click({ force: true });
    cy.get('.tab.objects').click();
    cy.get('#trace').should('have.attr', 'disabled');
    cy.get('.ant-switch').eq(0).click();
    cy.wait(1500);
    cy.contains('Threshold brightness').should('exist');
    cy.get('#trace').click();
    cy.wait(1500);
    cy.get('#svg_3').click({ force: true });
    cy.getElementTitle().contains('Layer 1 > Path');
    cy.get('#svg_3')
      .invoke('attr', 'd')
      .then((d) => {
        expect(md5(d)).equal('de99510ff9f5ecf06d6743c5a802b835');
      });
  });

  it('test change gradient image', () => {
    cy.uploadFile('flux.png', 'image/png');
    cy.get('.tab.objects').click();
    cy.get('.ant-switch').eq(0).click();
    cy.get('#svg_1').should('have.attr', 'data-threshold', '128').should('have.attr', 'data-shading', 'false');
    cy.get('#svg_1').click({ force: true });
    cy.get('.tab.objects').click();
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('8794655cf390c5f867ed5eff13f3bce4');
        else expect(md5(href)).equal('0a52a26dec2bac9490b838b039756347');
      });
    cy.get('.ant-switch').eq(0).click();
    cy.get('#svg_1').click({ force: true });
    cy.get('#svg_1').should('have.attr', 'data-threshold', '254').should('have.attr', 'data-shading', 'true');
    cy.wait(5000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('8b1b3ac285d65fae820c86dc5b728efd');
        else expect(md5(href)).equal('36b111b8c08d250064c774b875de4b5e');
      });
  });

  it('check replace with image', () => {
    cy.uploadFile('flux.png', 'image/png');
    cy.get('.tab.objects').click();
    cy.get('#replace_with').click();
    cy.get('#file-input').attachFile('map.jpg');
    cy.get('.progress', { timeout: 3000 }).should('not.exist');
    cy.get('#svg_1').click({ force: true });
    cy.wait(10000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('8b79e9a445262e8412a863d5ec06d16b');
        else expect(md5(href)).equal('59107a6d4d71693c9b8ffe4948efe496');
      });
  });

  it('check change grading', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('flux.png', 'image/png');
    cy.get('#svg_1').click({ force: true });
    cy.wait(2000);
    cy.get('#svg_1').click({ force: true });
    cy.get('.tab.objects').click();
    cy.get('#grading').click();
    cy.get('div.ant-modal').should('exist');
    cy.wait(2000);
    cy.get('.progress', { timeout: 5000 }).should('not.exist');
    cy.get('rect#1').trigger('mousedown', { clientX: 900, clientY: 125, force: true });
    cy.get('rect#1').should('have.attr', 'fill-opacity', '1').should('have.attr', 'y', '-3');
    cy.get('svg.curve-control-svg').trigger('mousemove', { clientX: 900, clientY: 325, force: true });
    cy.get('svg.curve-control-svg').trigger('mouseup');
    cy.get('rect#1').should('have.attr', 'fill-opacity', '1').should('have.attr', 'y', '197');
    cy.get('button[class^="ant-btn"]').contains('Okay').click();
    cy.get('.progress', { timeout: 5000 }).should('not.exist');
    cy.wait(10000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('3c43c5b5ec5a8f24d2eb35a508d4b85d');
        else expect(md5(href)).equal('b6fd51e23ba0fff1ff6a7165d38c13d7');
      });
  });

  it('check crop image', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('flux.png', 'image/png');
    cy.get('.tab.objects').click();
    cy.get('#crop').click();
    cy.wait(3000);
    cy.get('.point-se').move({ deltaX: 0, deltaY: -200 });
    cy.get('button[class^="ant-btn"]').contains('Okay').click();
    cy.get('.progress', { timeout: 10000 }).should('not.exist');
    cy.get('.photo-edit-panel', { timeout: 5000 }).should('not.exist');
    cy.wait(10000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('a8ad6ba832e34e3cc6544668596fefff');
        else expect(md5(href)).equal('6b86150e9da77fc6891d6c577e02c9ad');
      });
  });

  it('check bevel image', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('preview.png', 'image/png');
    cy.get('.tab.objects').click();
    cy.get('#bevel').click();
    cy.get('.progress', { timeout: 120000 }).should('not.exist');
    cy.get('#svg_1').click({ force: true });
    cy.wait(10000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        expect(md5(href)).equal('d0a40f28082679713deda90d73e0e86b');
      });
  });

  it('check invert with image', () => {
    cy.disableImageDownSampling();
    cy.uploadFile('flux.png', 'image/png');
    cy.get('.tab.objects').click();
    cy.get('#invert').click();
    cy.get('.progress', { timeout: 20000 }).should('not.exist');
    cy.get('#svg_1').click({ force: true });
    cy.wait(10000);
    cy.get('#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => {
        if (isRunningAtGithub) expect(md5(href)).equal('de1073c40f0c095297d9d87af6b74dc3');
        else expect(md5(href)).equal('9d91e30cb427847e85fb3e69f38d48fd');
      });
  });
});
