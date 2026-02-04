import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const beamSeriesName = Cypress.env('beamSeriesName');
const layerListPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__';
const colorPickerPrefix = '_-_-packages-core-src-web-app-widgets-ColorPicker-module__';
const progressPrefix = '_-_-packages-core-src-web-app-components-dialogs-AlertAndProgress-module__';

function chooseImportOption(module?: string, layering?: string) {
  cy.get(`div[class*="${progressPrefix}nonstop--"`).should('exist');
  if (module) {
    cy.contains('.ant-modal-content', 'Select Module:').as('modal');
    cy.get('@modal').contains(module).click();
    cy.get('@modal').contains('OK').click();
  }
  if (layering) {
    cy.contains('.ant-modal-content', 'Select layering style:').as('modal');
    cy.get('@modal').contains(layering).click();
    cy.get('@modal').contains('OK').click();
  }
  cy.get(`div[class*="${progressPrefix}nonstop--"`, { timeout: 50000 }).should('not.exist');
}

describe('upload with machine', () => {
  if (isRunningAtGithub) {
    it('skip test on github', () => {
      cy.log('skip test on github');
    });
    return;
  }

  beforeEach(() => {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor();
  });

  it('upload svg > Laser > Layer', () => {
    cy.connectMachine(beamSeriesName);
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Laser', 'Layer');
    cy.get('#svg_2').should('exist');
    cy.getElementTitle().should('have.text', 'Layer 1 > SVG Object');
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', 'Layer 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Layer 1');
    cy.get('symbol#svg_1>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => expect(md5(html)).equal('00205b6848f32edfda5855c1f2fab5e3'));
    cy.get('symbol#svg_1_image>image').should('have.attr', 'filter', 'url(#filter#333333)');
  });

  it('upload svg > Laser > Color', () => {
    cy.connectMachine(beamSeriesName);
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Laser', 'Color');
    cy.get('#svg_2').should('exist');
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', '#3F51B5');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '#3F51B5');
    cy.get('#layerdoubleclick-1').should('have.text', '#3F51B5');
    cy.get('#svg_8').should('have.attr', 'data-xform', 'x=122.34765625 y=105.8125 width=200 height=200 ');
    cy.get('symbol#svg_6_image>image').should('have.attr', 'filter', 'url(#filter#3F51B5)');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '#333333');
    cy.get('#layerdoubleclick-0').should('have.text', '#333333');
    cy.get('#svg_7').should('have.attr', 'data-xform', 'x=221.6484375 y=105.8125 width=200 height=200 ');
    cy.get('symbol#svg_5_image>image').should('have.attr', 'filter', 'url(#filter#333333)');
  });

  it('upload svg > Laser > Single Layer', () => {
    cy.connectMachine(beamSeriesName);
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Laser', 'Single Layer');
    cy.get('#svg_2').should('exist');
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', 'Layer 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Layer 1');
    cy.get('symbol#svg_1>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => expect(md5(html)).equal('73e8ab96e362397e36ce9069864a03c0'));
    cy.get('symbol#svg_1_image>image').should('have.attr', 'filter', 'url(#filter#333333)');
  });

  it('upload svg > Printing > Layer and change color', () => {
    cy.connectMachine(beamSeriesName);
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Printing', 'Layer');
    cy.get('#svg_2').should('exist');
    cy.getElementTitle().contains('Printing > SVG Object');
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', 'Printing');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Printing');
    cy.get('symbol#svg_1>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => expect(md5(html)).equal('00205b6848f32edfda5855c1f2fab5e3'));
    cy.get(`div[class*="${colorPickerPrefix}color"]`)
      .eq(0)
      .should('have.attr', 'style', 'background: rgb(63, 81, 181);');
    cy.get(`div[class*="${colorPickerPrefix}color"]`)
      .eq(1)
      .should('have.attr', 'style', 'background: rgb(51, 51, 51);');
    cy.get(`div[class*="${colorPickerPrefix}color"]`).eq(0).click();
    cy.get(`div[class*="${colorPickerPrefix}preset-block"]`).eq(0).click();
    cy.get(`div[class*="${colorPickerPrefix}footer"]`).get('.ant-btn').contains('OK').click();
    cy.get('symbol#svg_1>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => expect(md5(html)).equal('57b2c7998a22f7c14d2617c844263aeb'));
  });

  it('upload svg > Printing > Single Layer', () => {
    cy.connectMachine(beamSeriesName);
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Printing', 'Single Layer');
    cy.get('#svg_2', { timeout: 50000 }).should('exist');
    cy.getElementTitle().contains('Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Printing');
    cy.get('symbol#svg_1>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => expect(md5(html)).equal('8c95a5b791bdaa229a11c834aeb0beb3'));
  });

  it('upload gradient svg', () => {
    cy.connectMachine(beamSeriesName);
    cy.uploadFile('gradient.svg', 'image/svg+xml');
    chooseImportOption(undefined, 'Layer');
    cy.get('#svg_1').should('exist');
    cy.getElementTitle().contains('Bitmap > Image');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Bitmap');
    cy.get('image#svg_1').should('have.attr', 'xlink:href');
    cy.get('image#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => expect(md5(href)).equal('b73f32e8725c86f654a8375e199e6a99'));
  });

  it('upload bitmap svg', () => {
    cy.connectMachine(beamSeriesName);
    cy.uploadFile('bitmap.svg', 'image/svg+xml');
    chooseImportOption(undefined, 'Layer');
    cy.get('#svg_1').should('exist');
    cy.getElementTitle().contains('Bitmap > Image');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Bitmap');
    cy.get('image#svg_1').should('have.attr', 'xlink:href');
    cy.get('image#svg_1')
      .invoke('attr', 'xlink:href')
      .then((href) => expect(md5(href)).equal('2338842539207490c618b487d23cd549'));
  });

  it('upload pdf > Color', () => {
    cy.uploadFile('PDF.pdf', 'application/pdf');
    chooseImportOption(undefined, 'Color');
    cy.get('#svg_3').should('exist');
    cy.getElementTitle().contains('Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '#FFFFFF');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '#000000');
    cy.get('#w_size').should('have.value', '20.00');
    cy.get('#h_size').should('have.value', '20.00');
  });

  it('upload pdf > Single Layer', () => {
    cy.uploadFile('PDF.pdf', 'application/pdf');
    chooseImportOption(undefined, 'Single Layer');
    cy.get('#svg_1').should('exist');
    cy.getElementTitle().contains('Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Layer 1');
    cy.get('#w_size').should('have.value', '20.00');
    cy.get('#h_size').should('have.value', '20.00');
  });

  it('upload ai > Color', () => {
    cy.uploadFile('ai.ai', 'application/postscript');
    chooseImportOption(undefined, 'Color');
    cy.get('#svg_4').should('exist');
    cy.getElementTitle().contains('Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '#020101');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '#000000');
    cy.get('#w_size').should('have.value', '20.00');
    cy.get('#h_size').should('have.value', '20.00');
  });

  it('upload ai > Single Layer', () => {
    cy.uploadFile('ai.ai', 'application/postscript');
    chooseImportOption(undefined, 'Single Layer');
    cy.get('#svg_4').should('exist');
    cy.getElementTitle().contains('Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Layer 1');
    cy.get('#w_size').should('have.value', '20.00');
    cy.get('#h_size').should('have.value', '20.00');
  });
});
