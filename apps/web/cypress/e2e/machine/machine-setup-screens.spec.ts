// Release-test sheet (機器設定 分類):
// 從「機器」選單 >「新增或設定機器」去測試 BB2 機器設定畫面、Ador 機器設定畫面是否正確
//
// These setup screens render entirely client-side (no FLUXGhost / machine needed),
// so this spec is CI-safe and must NOT self-skip. It asserts screen CONTENT only:
// titles, connection-type options, instruction imagery (src/alt exists, not pixels),
// and back/exit navigation. It never proceeds into steps that need a real device.

const MODEL_SELECT_URL = '#/initialize/connect/select-machine-model';
const CONNECTION_TYPE_URL = '#/initialize/connect/select-connection-type';

const openMachineSetup = () => {
  cy.getMenuItem(['Machines'], 'Machine Setup').click();
  cy.location('hash', { timeout: 15000 }).should('include', MODEL_SELECT_URL);
  // Model-selection screen landed with its heading.
  cy.contains('h1', 'Select Your Machine Type').should('be.visible');
};

describe('machine setup screens (BB2 / Ador)', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('opens the machine-model selection screen with BB2 and Ador present', () => {
    openMachineSetup();

    // Ador is a top-level option.
    cy.contains('Ador').should('be.visible');
    // Beambox Series groups Beambox II (BB2) behind it.
    cy.contains('Beambox Series').should('be.visible');
    cy.contains('HEXA').should('be.visible');

    // Drill into Beambox Series to reveal Beambox II.
    cy.contains('Beambox Series').click();
    cy.contains('h1', 'Select Your Beambox').should('be.visible');
    cy.contains('Beambox II').should('be.visible');
    cy.contains('Beambox (Pro)').should('be.visible');
  });

  it('BB2: walks the setup screens and verifies model-specific content', () => {
    openMachineSetup();

    // Beambox Series -> Beambox II -> connection type (model=fbb2).
    cy.contains('Beambox Series').click();
    cy.contains('Beambox II').click();

    cy.location('hash', { timeout: 15000 }).should('include', CONNECTION_TYPE_URL);
    cy.location('hash').should('include', 'model=fbb2');

    // Connection-type screen: title + the options offered for BB2.
    cy.contains('h1', 'How do you wish to connect?').should('be.visible');
    cy.get('#connect-wifi').should('be.visible').and('contain.text', 'Wi-Fi');
    cy.get('#connect-wired').should('be.visible').and('contain.text', 'Wired Network');
    cy.get('#connect-ether2ether').should('be.visible').and('contain.text', 'Direct Connection');
    // fbb2 is a USB-capable model, so the USB option must be present.
    cy.get('#connect-usb').should('be.visible').and('contain.text', 'USB Connection');

    // Enter the Wi-Fi screen: assert instruction imagery is the BB2 (nxModel) panel image.
    cy.get('#connect-wifi').click();
    cy.location('hash', { timeout: 15000 }).should('include', '#/initialize/connect/connect-wi-fi');
    cy.contains('Connecting to Wi-Fi').should('be.visible');
    cy.get('img[src*="beambox-2-panel"]').should('exist').and('have.attr', 'src');

    // Back navigation returns to the connection-type screen without residue.
    cy.contains('Back').click();
    cy.location('hash', { timeout: 15000 }).should('include', CONNECTION_TYPE_URL);
    cy.get('#connect-wifi').should('be.visible');
  });

  it('Ador: walks the setup screens and verifies content differs from BB2', () => {
    openMachineSetup();

    // Ador is a direct model: clicking it jumps straight to the connection-type screen.
    cy.contains('Ador').click();

    cy.location('hash', { timeout: 15000 }).should('include', CONNECTION_TYPE_URL);
    cy.location('hash').should('include', 'model=ado1');

    // Connection-type screen for Ador.
    cy.contains('h1', 'How do you wish to connect?').should('be.visible');
    cy.get('#connect-wifi').should('be.visible').and('contain.text', 'Wi-Fi');
    cy.get('#connect-wired').should('be.visible').and('contain.text', 'Wired Network');
    cy.get('#connect-ether2ether').should('be.visible').and('contain.text', 'Direct Connection');
    // ado1 is a USB-capable model too.
    cy.get('#connect-usb').should('be.visible').and('contain.text', 'USB Connection');

    // Enter the Wi-Fi screen: Ador uses a DIFFERENT panel image than BB2.
    cy.get('#connect-wifi').click();
    cy.location('hash', { timeout: 15000 }).should('include', '#/initialize/connect/connect-wi-fi');
    cy.contains('Connecting to Wi-Fi').should('be.visible');
    cy.get('img[src*="ador-network"]').should('exist').and('have.attr', 'src');
    // Guard the model-specific difference: BB2's image must NOT be on the Ador screen.
    cy.get('img[src*="beambox-2-panel"]').should('not.exist');

    // Back navigation returns to the connection-type screen.
    cy.contains('Back').click();
    cy.location('hash', { timeout: 15000 }).should('include', CONNECTION_TYPE_URL);
    cy.get('#connect-wifi').should('be.visible');
  });

  it('returns to the editor from the wizard without residue', () => {
    openMachineSetup();

    // From the model-selection screen, Back/Skip returns to the editor.
    cy.contains(/^(Skip|Back)$/).click();

    // Canvas is back and functional.
    cy.location('hash', { timeout: 30000 }).should('include', '#/studio/beambox');
    cy.get('#svgcontent', { timeout: 30000 }).should('exist');
    cy.window().its('svgCanvas').should('exist');
  });
});
