// Covers the release-test row:
//   深度模式選項 — 使用點陣圖，要選擇「漸層」時才可以選，
//   確認是否多了「最小功率」選擇 (JPG v PNG)
//
// "Depth Mode" (深度模式) is the object-panel PWM toggle. Enable-condition found in
// ImageOptions/index.tsx: the PwmBlock ("Depth Mode") is ONLY rendered when the
// bitmap image has gradient on (data-shading === 'true') and the workarea is not a
// Promark model; with gradient off a ThresholdBlock is rendered instead, so the
// Depth Mode option does not exist at all.
//
// Turning Depth Mode on sets data-pwm="1" on the <image> (PwmBlock.tsx). That makes
// checkPwmImages() true, which reveals the "Depth Mode Power Settings" icon in the
// config-panel strength block (PowerBlock.tsx, title = laser_panel.pwm_advanced_setting).
// Clicking it opens AdvancedPowerPanel, whose enabled InputNumber is the
// "最小功率 / Min Power" control (max is clamped to the layer power).
//
// Note: on desktop the Depth Mode / Gradient switches have no ids (ids exist only in
// the mobile ObjectPanelItem variant), so the option rows are selected by label text.

// en.ts -> beambox.right_panel.laser_panel.pwm_advanced_setting
const depthModePowerSettingsTitle = 'Depth Mode Power Settings';

const optionBlockSelector = 'div[class*="option-block"]';

// The Min Power input is the only enabled InputNumber in the modal (the second,
// Max, is disabled and bound to the layer power).
const minPowerInputSelector = '.ant-modal-content .ant-input-number:not(.ant-input-number-disabled) input';

function uploadAndSelect(fixture: string, type: string) {
  cy.uploadFile(fixture, type);
  cy.get('#svg_1', { timeout: 60000 }).click({ force: true });
  cy.showPanel('objects');
}

function assertGradientOnWithDepthModeOption() {
  // Bitmap imports default to data-shading="true" (readBitmapFile.ts), which is the
  // condition that makes the Depth Mode option row render.
  cy.get('#svg_1').should('have.attr', 'data-shading', 'true');
  cy.contains(optionBlockSelector, 'Gradient').find('button.ant-switch').should('have.attr', 'aria-checked', 'true');
  cy.contains(optionBlockSelector, 'Depth Mode').should('exist');
}

function enableDepthMode() {
  cy.contains(optionBlockSelector, 'Depth Mode').find('button.ant-switch').click();
  cy.get('#svg_1').should('have.attr', 'data-pwm', '1');
}

function openDepthModePowerSettings() {
  cy.showPanel('layers');
  // The advanced icon only appears once a selected layer holds a data-pwm="1" image.
  cy.get(`span[title="${depthModePowerSettingsTitle}"]`, { timeout: 15000 }).should('exist').click();
  cy.get('.ant-modal-content').contains(depthModePowerSettingsTitle).should('exist');
}

function setMinPowerAndAssertCommit(value: number) {
  openDepthModePowerSettings();

  // The Min Power input appears and accepts a value.
  cy.get(minPowerInputSelector).clear().type(`${value}`).blur();
  cy.get(minPowerInputSelector).should('have.value', `${value}`);

  // Save the modal, then reopen to prove the value committed to the layer.
  cy.get('.ant-modal-content').find('button').contains('Save').click();
  cy.get('.ant-modal-content').should('not.exist');

  openDepthModePowerSettings();
  cy.get(minPowerInputSelector).should('have.value', `${value}`);
  cy.get('.ant-modal-content').find('button').contains('Cancel').click();
  cy.get('.ant-modal-content').should('not.exist');
}

describe('depth mode (min power) option', () => {
  beforeEach(() => {
    cy.landingEditor();
  });

  it('shows Min Power for a JPG with gradient + Depth Mode on and commits the value', () => {
    uploadAndSelect('map.jpg', 'image/jpeg');
    assertGradientOnWithDepthModeOption();
    enableDepthMode();

    // Default layer power is 15 and Min Power max is clamped to the layer power,
    // so use a value below it.
    setMinPowerAndAssertCommit(10);
  });

  it('does not offer Depth Mode / Min Power when gradient is off (JPG)', () => {
    uploadAndSelect('map.jpg', 'image/jpeg');
    assertGradientOnWithDepthModeOption();

    // Turn gradient off: the image regenerates and the Depth Mode row is replaced by
    // the Threshold block (ImageOptions/index.tsx renders ThresholdBlock instead).
    cy.contains(optionBlockSelector, 'Gradient').find('button.ant-switch').click();
    cy.get('#svg_1', { timeout: 60000 }).should('have.attr', 'data-shading', 'false');
    cy.contains('Threshold brightness', { timeout: 60000 }).should('exist');
    cy.contains(optionBlockSelector, 'Depth Mode').should('not.exist');

    // With no data-pwm="1" image, the Depth Mode Power Settings entry point (and thus
    // the Min Power input) is absent from the config panel.
    cy.showPanel('layers');
    cy.get(`span[title="${depthModePowerSettingsTitle}"]`).should('not.exist');
  });

  it('offers Min Power identically for a PNG with gradient + Depth Mode on', () => {
    uploadAndSelect('flux.png', 'image/png');
    assertGradientOnWithDepthModeOption();
    enableDepthMode();

    // Same behaviour as the JPG case: the sheet's "(JPG v PNG)" means both bitmap
    // formats expose the identical Min Power option.
    setMinPowerAndAssertCommit(8);
  });
});
