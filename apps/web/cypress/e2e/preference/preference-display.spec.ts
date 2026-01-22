import { md5 } from '../../support/utils';

const isRunningAtGithub = Cypress.env('envType') === 'github';

describe('update the preference (display)', () => {
  const { baseUrl } = Cypress.config();
  beforeEach(() => {
    cy.landingEditor();
  });

  it('check default value with preference page', () => {
    cy.go2Preference();

    // General category (default)
    cy.get('#select-lang').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'English');

    // Connection category
    cy.goToSettingsCategory('Connection');
    cy.get('#set-guessing-poke').should('have.attr', 'aria-checked', 'true');
    cy.get('#set-auto-connect').should('have.attr', 'aria-checked', 'true');

    // Camera category
    cy.goToSettingsCategory('Camera');
    cy.get('#set-camera-preview-speed-level')
      .closest('.ant-select')
      .find('.ant-select-selection-item')
      .should('have.text', 'Low');

    // Editor category
    cy.goToSettingsCategory('Editor');
    cy.get('#set-default-units').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'mm');

    if (window.navigator.language === 'zh-TW') {
      cy.get('#set-default-font-family')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Noto Sans TC');

      cy.get('#set-default-font-style')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Regular');
    } else {
      cy.get('#set-default-font-family')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Noto Sans');

      cy.get('#set-default-font-style')
        .closest('.ant-select')
        .find('.ant-select-selection-item')
        .should('have.text', 'Regular');
    }

    cy.get('#set-default-model')
      .closest('.ant-select')
      .find('.ant-select-selection-item')
      .should('have.text', 'Beambox');

    // Switch - show_guides defaults to Off (false)
    cy.get('#set-guide').should('have.attr', 'aria-checked', 'false');

    // Turn on show_guides to check default guide axis values
    cy.get('#set-guide').click();

    cy.get('#set-guide-axis-x').should('have.attr', 'value', '0');
    cy.get('#set-guide-axis-y').should('have.attr', 'value', '0');

    cy.get('#set-bitmap-quality').closest('.ant-select').find('.ant-select-selection-item').should('have.text', 'Low');

    // Switch - anti-aliasing defaults to On (true)
    cy.get('#set-anti-aliasing').should('have.attr', 'aria-checked', 'true');

    // Switch - continuous_drawing defaults to Off (false)
    cy.get('#set-continuous-drawing').should('have.attr', 'aria-checked', 'false');

    // Switch - simplify_clipper_path defaults to Off (false)
    cy.get('#set-simplify-clipper-path').should('have.attr', 'aria-checked', 'false');

    // Switch - font-substitute defaults to On (true)
    cy.get('#font-substitue').should('have.attr', 'aria-checked', 'true');

    cy.get('#font-convert').closest('.ant-select').find('.ant-select-selection-item').should('have.text', '2.0');

    // Engraving category
    cy.goToSettingsCategory('Rastering');
    // Switch - fast_gradient defaults to On (true)
    cy.get('#set-fast-gradient').should('have.attr', 'aria-checked', 'true');

    // Path category
    cy.goToSettingsCategory('Vector');
    // Switch - vector_speed_constraint defaults to On (true)
    cy.get('#set-vector-speed-constraint').should('have.attr', 'aria-checked', 'true');
    cy.get('#loop-input').should('have.attr', 'value', '0');

    // Module (Add-on) category
    cy.goToSettingsCategory('Add-on');
    // Switch - default-open-bottom defaults to Off (false)
    cy.get('#default-open-bottom').should('have.attr', 'aria-checked', 'false');

    // Switch - default-autofocus defaults to Off (false)
    cy.get('#default-autofocus').should('have.attr', 'aria-checked', 'false');

    // Switch - default-diode defaults to Off (false)
    cy.get('#default-diode').should('have.attr', 'aria-checked', 'false');

    cy.get('#set_diode_offset-x').should('have.attr', 'value', '70');
    cy.get('#set_diode_offset-y').should('have.attr', 'value', '7');

    // Privacy category
    cy.goToSettingsCategory('Privacy');
    // Switch - enable-sentry defaults to Off (false)
    cy.get('#set-sentry').should('have.attr', 'aria-checked', 'false');
  });

  it('change units and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');

    cy.get('#set-default-units').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Inches').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'Inches');

    cy.contains('in').should('exist');
    cy.applySettings();
    cy.get('#speed-input').should('have.attr', 'value', '0.79');
    cy.contains('in/s').should('exist');
  });

  it('change font and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');

    cy.get('#set-default-font-family').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();

    // Wait for the dropdown to be visible
    cy.get('.ant-select-dropdown').should('be.visible');
    // Scroll to the top of the dropdown options
    cy.get('.ant-select-dropdown .rc-virtual-list-holder').then(($el) => {
      $el[0].scrollTo(0, 0); // Scroll to the top
    });
    // Optionally, assert that the scroll position is at the top
    cy.get('.ant-select-dropdown .rc-virtual-list-holder').invoke('scrollTop').should('eq', 0);

    cy.get('.ant-select-item-option-content').contains('AirstreamNF').click({ force: true });
    cy.get('@select').find('.ant-select-selection-item').should('have.text', 'AirstreamNF');

    cy.applySettings();

    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 }).inputText('Bring Any Design to Life');
    cy.get('.ant-select-selection-item[title="Font"]').should('have.text', 'AirstreamNF');
  });

  it('change font style and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');

    cy.get('#set-default-font-style').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Bold').click({ force: true });

    cy.applySettings();

    cy.clickToolBtn('Text');
    cy.get('svg#svgcontent').realClick({ x: 100, y: 200 }).inputText('Bring Any Design to Life');
    cy.get('.ant-select-selection-item[title="Style"]').should('have.text', 'Bold');
  });

  it('change document setting and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.goToSettingsCategory('Editor');

    cy.get('#set-default-model').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('beamo').click({ force: true });
    cy.applySettings();
    // reload to apply the viewBox change
    cy.reload();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 3000 2100');

    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    cy.get('#set-default-model').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Beambox').click({ force: true });
    cy.applySettings();
    cy.reload();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 4000 3750');

    cy.go2Preference();
    cy.goToSettingsCategory('Editor');
    cy.get('#set-default-model').closest('.ant-select').as('select');
    cy.get('@select').find('.ant-select-selection-item').click();
    cy.get('.ant-select-item-option-content').contains('Beambox Pro').click({ force: true });
    cy.applySettings();
    cy.reload();
    cy.get('#svgcontent').should('have.attr', 'viewBox', '0 0 6000 3750');
  });

  it('click reset button and see if home page gets changed ', () => {
    cy.go2Preference();
    cy.get('.ant-modal-footer button').contains('Reset Beam Studio').click();
    cy.url().should('contain', `${baseUrl}/#/`);
    cy.get('h1.headline').should('exist');
  });
});
