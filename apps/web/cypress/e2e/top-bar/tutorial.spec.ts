describe('show tutorial', () => {
  const openTutorial = (text: string) => {
    cy.get('div[data-testid="top-bar-menu"]').click();
    cy.contains('Help').click();
    cy.contains(text).click();
  };

  const checkInterfaceStep = (text: string) => {
    cy.get('.tutorial-dialog').should('have.text', text);
    cy.get('.next-button').click();
  };

  const checkGestureStep = (media: string, description: string, step: string, text: string) => {
    cy.get(media).should('exist');
    cy.get('.description').should('have.text', description);
    cy.get('.step').should('have.text', step);
    cy.get('button.ant-btn').contains(text).click();
  };

  const checkCanvas = () => {
    cy.clickToolBtn('Rectangle');
    cy.get('g#selectorParentGroup').should('have.css', 'cursor', 'crosshair');
    cy.get('svg#svgcontent').trigger('mousedown', 100, 100, { force: true });
    cy.get('svg#svgcontent').trigger('mousemove', 300, 200, { force: true });
    cy.get('svg#svgcontent').trigger('mouseup', { force: true });
    cy.get('g.layer>rect').should('exist');
    cy.get('g.layer>rect')
      .should('have.attr', 'stroke', '#333333')
      .should('have.attr', 'fill', 'none')
      .should('have.attr', 'fill-opacity', '0');
    cy.get('g.layer>rect').invoke('attr', 'x').then(parseInt).should('be.gt', 600);
    cy.get('g.layer>rect').invoke('attr', 'y').then(parseInt).should('be.gt', 600);
    cy.get('g.layer>rect').invoke('attr', 'width').then(parseInt).should('be.gt', 1200);
    cy.get('g.layer>rect').invoke('attr', 'height').then(parseInt).should('be.gt', 600);
  };

  beforeEach(() => {
    cy.landingEditor();
  });

  it('close and reopen interface introduction', () => {
    openTutorial('Show Interface Introduction');
    cy.get('.close-btn.left').should('be.visible');
    cy.get('.close-btn.left').click();
    cy.contains('Are you sure to end new UI introduction?').should('be.visible');
    cy.get('.ant-btn').contains('No').click();
    cy.get('.dialog-box-arrow.left')
      .should('have.css', 'border-width', '10px 17px 10px 0px')
      .should('have.css', 'top', '15px');
    cy.contains('Camera Preview').should('be.visible');
    cy.get('.next-button').should('have.text', 'NEXT');
    cy.get('.close-btn.left').click();
    cy.get('.ant-btn').contains('Yes').should('exist');
    cy.get('.ant-btn').contains('No').should('exist');
    cy.get('.ant-btn').contains('Yes').click();
    cy.contains('Camera Preview').should('not.exist');

    openTutorial('Show Interface Introduction');
    cy.contains('Camera Preview').should('be.visible');
  });

  it('show interface introduction', () => {
    openTutorial('Show Interface Introduction');
    checkInterfaceStep('1/17\nCamera PreviewNEXT');
    checkInterfaceStep('2/17\nSelect a machineNEXT');
    checkInterfaceStep('3/17\nRunning FrameNEXT');
    checkInterfaceStep('4/17\nStart WorkNEXT');
    checkInterfaceStep('5/17\nSelect / Image / TextNEXT');
    checkInterfaceStep('6/17\nBasic ShapesNEXT');
    checkInterfaceStep('7/17\nPen ToolNEXT');
    checkInterfaceStep('8/17\nAdd New LayerNEXT');
    checkInterfaceStep('9/17\nRename by double clickNEXT');
    checkInterfaceStep('10/17\nDrag to sortNEXT');
    checkInterfaceStep('11/17\nRight Click to select Layer Controls:\nDuplicate / Merge / Lock / Delete LayersNEXT');
    checkInterfaceStep('12/17\nSwitch between Layer Panel and Object PanelNEXT');
    checkInterfaceStep('13/17\nAlign ControlsNEXT');
    checkInterfaceStep('14/17\nGroup ControlsNEXT');
    checkInterfaceStep('15/17\nShape OperationNEXT');
    checkInterfaceStep('16/17\nFlipNEXT');
    checkInterfaceStep('17/17\nObject ActionsNEXT');
    cy.get('.tutorial-dialog').should('not.exist');
    checkCanvas();
  });

  it('close and reopen gesture introduction', () => {
    openTutorial('Hand Gesture Introduction');
    cy.contains('Scroll the canvas with two fingers.').should('exist');
    cy.get('.ant-modal-close-icon').should('be.visible');
    cy.get('.ant-modal-close-icon').click();
    cy.contains('Scroll the canvas with two fingers.').should('not.exist');

    openTutorial('Hand Gesture Introduction');
    cy.contains('Scroll the canvas with two fingers.').should('exist');
  });

  it('show gesture introduction', () => {
    openTutorial('Hand Gesture Introduction');
    checkGestureStep('.media-container > img', 'Scroll the canvas with two fingers.', '1/5', 'Next');
    checkGestureStep('.media-container > img', 'Pinch with two fingers to zoom in/out the canvas.', '2/5', 'Next');
    checkGestureStep('video', 'Tap to select the object.', '3/5', 'Next');
    checkGestureStep('video', 'Drag to select the multiple objects.', '4/5', 'Next');
    checkGestureStep('video', 'Press and hold to open the context menu.', '5/5', 'Done');
    cy.get('.media-tutorial').should('not.exist');
    checkCanvas();
  });
});
