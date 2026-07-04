import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';
const beamSeriesName = Cypress.env('beamSeriesName');
const layerListPrefix = '_-_-packages-core-src-web-app-components-beambox-RightPanel-LayerPanel-LayerList-module__';
const colorPickerPrefix = '_-_-packages-core-src-web-app-widgets-ColorPicker-module__';
const progressPrefix = '_-_-packages-core-src-web-app-components-dialogs-AlertAndProgress-module__';

/**
 * Wire FLUXGhost and land on the editor for a single test.
 *
 * Local rig convention: when `ghostPort` is provided (a non-default FLUXGhost port), pin the
 * host to 127.0.0.1 (FLUXGhost rejects websocket upgrades whose Origin is localhost) and the
 * port to that value. They must be written inside `onBeforeLoad`: plain pre-visit localStorage
 * writes are cleared by the `cy.session` cache inside `landingEditor`, while passing custom
 * visit options makes `landingEditor` skip session caching and run the hook on every load.
 * Otherwise fall back to the gated-spec convention of `cy.setUpBackend(backendIP)`.
 */
const wireBackendAndLand = () => {
  const ghostPort = Cypress.env('ghostPort');

  if (ghostPort) {
    cy.landingEditor({
      onBeforeLoad: (win: Window) => {
        win.localStorage.setItem('host', '127.0.0.1');
        win.localStorage.setItem('port', `${ghostPort}`);
      },
    });
  } else {
    cy.setUpBackend(Cypress.env('backendIP'));
    cy.landingEditor();
  }
};

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
    wireBackendAndLand();
  });

  it('upload svg > Laser > Layer', () => {
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Laser', 'Layer');
    // By-layer import keeps the source SVG layer names, one laser layer each.
    cy.get('#svg_2').should('exist');
    cy.get('#svg_4').should('exist');
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}row"]`).eq(0).should('have.attr', 'data-layer', '圖層 1');
    cy.get(`div[class*="${layerListPrefix}row"]`).eq(1).should('have.attr', 'data-layer', '預設圖層');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '圖層 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '預設圖層');
    // New layers take palette colors in creation order; images are filtered per layer color.
    cy.get('symbol#svg_1_image>image').should('have.attr', 'filter', 'url(#filter#3F51B5)');
    cy.get('symbol#svg_3_image>image').should('have.attr', 'filter', 'url(#filter#F44336)');
  });

  it('upload svg > Laser > Color', () => {
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Laser', 'Color');
    cy.get('#svg_3').should('exist');
    cy.get(`div[class*="${layerListPrefix}row"]`).eq(0).should('have.attr', 'data-layer', '#3F51B5');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '#3F51B5');
    cy.get('#layerdoubleclick-1').should('have.text', '#3F51B5');
    cy.get('#svg_4').should('have.attr', 'data-xform', 'height=200 width=200 x=122.34765625 y=105.8125 ');
    cy.get('symbol#svg_2>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => expect(md5(html)).equal('80437a60954b7a954510afd6a243e8d2'));
    cy.get('symbol#svg_2_image>image').should('have.attr', 'filter', 'url(#filter#3F51B5)');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '#333333');
    cy.get('#layerdoubleclick-0').should('have.text', '#333333');
    cy.get('#svg_3').should('have.attr', 'data-xform', 'height=200 width=200 x=221.6484375 y=105.8125 ');
    cy.get('symbol#svg_1>g>g')
      .invoke('prop', 'innerHTML')
      .then((html) => expect(md5(html)).equal('79dbe03bc020af8527f6cfb0d80f8fef'));
    cy.get('symbol#svg_1_image>image').should('have.attr', 'filter', 'url(#filter#333333)');
  });

  it('upload svg > Laser > Single Layer', () => {
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Laser', 'Single Layer');
    // Single-layer import merges the whole SVG into one object on the current layer.
    cy.get('#svg_2').should('exist');
    cy.getElementTitle().should('have.text', 'Layer 1 > SVG Object');
    cy.get(`div[class*="${layerListPrefix}row"]`).should('have.attr', 'data-layer', 'Layer 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Layer 1');
    cy.get('#svg_2').should('have.attr', 'data-xform', 'height=200 width=299.30078125 x=122.34765625 y=105.8125 ');
    cy.get('symbol#svg_1_image>image').should('have.attr', 'filter', 'url(#filter#333333)');
  });

  it('upload svg > Printing > Layer and change color', () => {
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Printing', 'Layer');
    // By-layer import keeps the source SVG layer names, one full-color printing layer each.
    cy.get('use#svg_2').should('exist');
    cy.get('use#svg_4').should('exist');
    cy.getElementTitle().should('have.text', 'Multiple Objects');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(0).should('have.text', '圖層 1');
    cy.get(`div[class*="${layerListPrefix}name"]`).eq(1).should('have.text', '預設圖層');
    cy.get('g.layer[data-fullcolor="1"][data-module="5"]').should('have.length', 2);
    // Full-color layers show the full-color icon instead of a layer color picker.
    cy.get(`div[class*="${layerListPrefix}row"] div[class*="${colorPickerPrefix}color"]`).should('not.exist');
    // Select only the imported ellipse and change its color from the object options panel.
    cy.get('#svgcanvas').click(600, 500, { force: true });
    cy.getElementTitle().should('not.exist');
    cy.get('use#svg_4').click({ force: true });
    cy.getElementTitle().should('contain.text', 'SVG Object');
    cy.showPanel('objects');
    cy.get(`div[class*="${colorPickerPrefix}color"]`).should('have.attr', 'style', 'background: rgb(63, 81, 181);');
    cy.get(`div[class*="${colorPickerPrefix}color"]`).click();
    cy.get(`div[class*="${colorPickerPrefix}inner"][style="background-color: rgb(22, 119, 255);"]`).click();
    cy.get(`div[class*="${colorPickerPrefix}footer"]`).find('.ant-btn').contains('OK').click();
    // The new color is applied to both the swatch and the underlying symbol content.
    cy.get(`div[class*="${colorPickerPrefix}color"]`).should('have.attr', 'style', 'background: rgb(22, 119, 255);');
    cy.get('symbol#svg_3 path[fill="#1677FF"]').should('exist');
  });

  it('upload svg > Printing > Single Layer', () => {
    cy.changeWorkarea('Ador');
    cy.uploadFile('svg.svg', 'image/svg+xml');
    chooseImportOption('Printing', 'Single Layer');
    // Single-layer import merges the whole SVG into one object on a full-color "Printing" layer.
    cy.get('#svg_2', { timeout: 50000 }).should('exist');
    cy.getElementTitle().should('have.text', 'Printing > SVG Object');
    cy.get(`div[class*="${layerListPrefix}name"]`).should('have.text', 'Printing');
    cy.get('g.layer[data-fullcolor="1"][data-module="5"]').should('have.length', 1);
    cy.get('#svg_2').should('have.attr', 'data-xform', 'height=200 width=299.30078125 x=122.34765625 y=105.8125 ');
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
