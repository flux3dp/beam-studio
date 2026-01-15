const configOperationsPrefix =
  '_-_-packages-core-src-web-app-views-beambox-Right-Panels-ConfigPanel-ConfigOperations-module__';
const configListPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-LaserManage-ConfigList-module__';
const ConfigPanelPrefix = '_-_-packages-core-src-web-app-views-beambox-Right-Panels-ConfigPanel-ConfigPanel-module__';
const presetManagementPrefix =
  '_-_-packages-core-src-web-app-components-dialogs-PresetsManagementPanel-PresetsManagementPanel-module__';
describe('manipulate laser panel', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  function checkValue(power, speed, repeat) {
    cy.get('#power-input').should('have.value', power);
    cy.get('#speed-input').should('have.value', speed);
    cy.get('#repeat').should('have.value', repeat);
  }

  it('should have correct presets length', () => {
    cy.get('button[title="Manage Parameters"]').click();
    cy.get(`div[class*="${presetManagementPrefix}list"]`).children().should('have.length', '15');
  });

  it('reset the parameter', () => {
    cy.get('button[title="Manage Parameters"]').click();
    cy.get(`div[class*="${presetManagementPrefix}eye"]`).eq(0).click();
    cy.get('button[class^="ant-btn"]').contains('Save and Exit').click();
    cy.get(`[class*="${ConfigPanelPrefix}preset-dropdown"] > .ant-select-selector`).click();
    cy.get('.ant-select-item').should('have.length', '15');
    cy.get('button[title="Manage Parameters"]').click();
    cy.get('button[class^="ant-btn"]').contains('Reset').click();
    cy.get('button[class^="ant-btn"]').contains('Confirm').click();
    cy.get(`[class*="${ConfigPanelPrefix}preset-dropdown"] > .ant-select-selector`).click();
    cy.get('.ant-select-item').should('have.length', '16');
  });

  it('add new parameter at laser panel', () => {
    cy.get('#power-input').clear().type('100').blur();
    cy.get('#speed-input').clear().type('70').blur();
    cy.get('#repeat').clear().type('3').blur();
    cy.get('button[class*="src-web-app-views-beambox-Right-Panels-ConfigPanel-SaveConfigButton-module"]').click();
    cy.get('.text-input').type('Hello Flux').blur();
    cy.get('button[class^="ant-btn"]').contains('OK').click();
    cy.get('button[title="Manage Parameters"]').click();
    cy.contains('Hello Flux').should('exist');
    cy.contains(`div[class*="${presetManagementPrefix}item"]`, 'Hello Flux').click();
    cy.get('input[data-testid="power"]').should('have.value', '100');
    cy.get('input[data-testid="speed"]').should('have.value', '70');
    cy.get('input[data-testid="repeat"]').should('have.value', '3');
    cy.get('input[data-testid="focusStep"]').should('have.value', '0');
  });

  it('add new parameter at presets management panel', () => {
    cy.get('button[title="Manage Parameters"]').click();
    cy.contains('Add New').click();
    cy.get('.text-input').type('aaa').blur();
    cy.get('button[class^="ant-btn"]').contains('OK').click();
    cy.contains('aaa').should('exist');
    cy.get('input[data-testid="power"]').clear().type('40').blur();
    cy.get('input[data-testid="speed"]').clear().type('20').blur();
    cy.get('input[data-testid="repeat"]').clear().type('10').blur();
    cy.get('input[data-testid="focusStep"]').clear().type('5').blur();
    cy.get('button[class^="ant-btn"]').contains('Save and Exit').click();
    cy.selectPreset('aaa');
    checkValue(40, 20, 10);
  });

  it('check all parameter value with beamo canvas', () => {
    cy.changeWorkarea('beamo');
    cy.selectPreset('Wood - 3mm Cutting');
    checkValue(45, 5, 1);
    cy.selectPreset('Wood - 5mm Cutting');
    checkValue(55, 4, 2);
    cy.selectPreset('Wood - Engraving');
    checkValue(25, 150, 1);

    cy.selectPreset('Acrylic - 3mm Cutting');
    checkValue(55, 4, 1);
    cy.selectPreset('Acrylic - 5mm Cutting');
    checkValue(55, 5, 2);
    cy.selectPreset('Acrylic - Engraving');
    checkValue(25, 150, 1);

    cy.selectPreset('Leather - 3mm Cutting');
    checkValue(60, 3, 1);
    cy.selectPreset('Leather - 5mm Cutting');
    checkValue(60, 3, 2);
    cy.selectPreset('Leather - Engraving');
    checkValue(30, 150, 1);

    cy.selectPreset('Fabric - 3mm Cutting');
    checkValue(50, 20, 1);
    cy.selectPreset('Fabric - 5mm Cutting');
    checkValue(50, 20, 1);
    cy.selectPreset('Fabric - Engraving');
    checkValue(20, 150, 1);

    cy.selectPreset('Rubber - Engraving');
    checkValue(50, 100, 1);
    cy.selectPreset('Glass - Engraving');
    checkValue(35, 150, 1);
    cy.selectPreset(/^Metal - Engraving$/);
    checkValue(50, 80, 1);
    cy.selectPreset('Metal - Engraving (Diode Laser)');
    checkValue(100, 10, 1);
  });

  it('check all parameter value with Beambox canvas', () => {
    cy.selectPreset('Wood - 3mm Cutting');
    checkValue(60, 6, 1);
    cy.selectPreset('Wood - 5mm Cutting');
    checkValue(60, 3, 1);
    cy.selectPreset('Wood - Engraving');
    checkValue(25, 150, 1);

    cy.selectPreset('Acrylic - 3mm Cutting');
    checkValue(60, 8, 1);
    cy.selectPreset('Acrylic - 5mm Cutting');
    checkValue(60, 4, 1);
    cy.selectPreset('Acrylic - Engraving');
    checkValue(25, 150, 1);

    cy.selectPreset('Leather - 3mm Cutting');
    checkValue(65, 3, 1);
    cy.selectPreset('Leather - 5mm Cutting');
    checkValue(65, 1, 1);
    cy.selectPreset('Leather - Engraving');
    checkValue(30, 150, 1);

    cy.selectPreset('Fabric - 3mm Cutting');
    checkValue(60, 20, 1);
    cy.selectPreset('Fabric - 5mm Cutting');
    checkValue(60, 20, 1);
    cy.selectPreset('Fabric - Engraving');
    checkValue(20, 150, 1);

    cy.selectPreset('Rubber - Engraving');
    checkValue(45, 130, 1);
    cy.selectPreset('Glass - Engraving');
    checkValue(30, 150, 1);
    cy.selectPreset('Metal - Engraving');
    checkValue(50, 120, 1);
  });

  it('check all parameter value with Beambox Pro canvas', () => {
    cy.changeWorkarea('Beambox Pro');

    cy.selectPreset('Wood - 3mm Cutting');
    checkValue(55, 7, 1);
    cy.selectPreset('Wood - 5mm Cutting');
    checkValue(55, 4, 1);
    cy.selectPreset('Wood - Engraving');
    checkValue(20, 150, 1);

    cy.selectPreset('Acrylic - 3mm Cutting');
    checkValue(55, 7, 1);
    cy.selectPreset('Acrylic - 5mm Cutting');
    checkValue(55, 4, 1);
    cy.selectPreset('Acrylic - Engraving');
    checkValue(15, 150, 1);

    cy.selectPreset('Leather - 3mm Cutting');
    checkValue(55, 4, 1);
    cy.selectPreset('Leather - 5mm Cutting');
    checkValue(55, 2, 1);
    cy.selectPreset('Leather - Engraving');
    checkValue(20, 150, 1);

    cy.selectPreset('Fabric - 3mm Cutting');
    checkValue(35, 20, 1);
    cy.selectPreset('Fabric - 5mm Cutting');
    checkValue(35, 20, 1);
    cy.selectPreset('Fabric - Engraving');
    checkValue(15, 150, 1);

    cy.selectPreset('Rubber - Engraving');
    checkValue(40, 150, 1);
    cy.selectPreset('Glass - Engraving');
    checkValue(25, 150, 1);
    cy.selectPreset('Metal - Engraving');
    checkValue(50, 140, 1);
  });

  it('check all parameter value with HEXA canvas', () => {
    cy.changeWorkarea('HEXA');

    cy.selectPreset('Wood - 3mm Cutting');
    checkValue(40, 6, 1);
    cy.selectPreset('Wood - 5mm Cutting');
    checkValue(65, 3, 1);
    cy.selectPreset('Wood - Engraving');
    checkValue(20, 300, 1);

    cy.selectPreset('Acrylic - 3mm Cutting');
    checkValue(40, 6, 1);
    cy.selectPreset('Acrylic - 5mm Cutting');
    checkValue(55, 3, 1);
    cy.selectPreset('Acrylic - Engraving');
    checkValue(15, 300, 1);

    cy.selectPreset('Leather - 3mm Cutting');
    checkValue(40, 6, 1);
    cy.selectPreset('Leather - 5mm Cutting');
    checkValue(55, 3, 1);
    cy.selectPreset('Leather - Engraving');
    checkValue(20, 300, 1);

    cy.selectPreset('Fabric - 3mm Cutting');
    checkValue(15, 25, 1);
    cy.selectPreset('Fabric - 5mm Cutting');
    checkValue(20, 20, 1);
    cy.selectPreset('Fabric - Engraving');
    checkValue(15, 250, 1);

    cy.selectPreset('Rubber - Engraving');
    checkValue(45, 300, 1);
    cy.selectPreset('Glass - Engraving');
    checkValue(35, 150, 1);
    cy.selectPreset('Metal - Engraving');
    checkValue(20, 150, 1);
  });

  it('export parameter file', () => {
    const cypressDownloadPath = Cypress.env('cypressDownloadPath');
    cy.get('#power-input').clear().type('100').blur();
    cy.get('#speed-input').clear().type('70').blur();
    cy.get('#repeat').clear().type('3').blur();
    cy.get('button[class*="src-web-app-views-beambox-Right-Panels-ConfigPanel-SaveConfigButton-module"]').click();
    cy.get('.text-input').type('Hi Flux').blur();
    cy.get('button[class^="ant-btn"]').contains('OK').click();
    cy.get('button[title="Manage Parameters"]').click();
    cy.get('[title="Export"]').click();
    // Wait for file to be downloaded by checking it exists
    cy.readFile(cypressDownloadPath, { timeout: 15000 })
      .its('presets')
      .should('have.length', 73)
      .its('72')
      .its('name')
      .should('eq', 'Hi Flux');
  });

  it('import old format parameter file', () => {
    cy.get('button[title="Manage Parameters"]').click();
    cy.get('button[title="Import"]').click();
    cy.get('#file-input').attachFile('testfile.json');
    cy.contains('Confirm').click();
    cy.get('button[class^="ant-btn"]').contains('Save and Exit').click();
    cy.selectPreset('testFile');
    checkValue(100, 50, 10);
  });
});
