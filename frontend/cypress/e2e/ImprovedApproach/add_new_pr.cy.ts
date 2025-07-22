/// <reference types="Cypress" />

describe('Procurement Request (PR) End-to-End Flow', () => {
  // Before each test, we log in and load our test data.
  beforeEach(function () {
    // Use our fast, programmatic login command.
    cy.login();

    // Load the test data from the fixture file.
    // The `function ()` syntax is needed to use `this.prData`.
    cy.fixture('pr_data.json').as('prData');

    // Start each test from a consistent state (the dashboard).
    cy.visit('/');
  });

  it('should create a new Normal PR with multiple items from fixture data', function () {
    cy.log('--- Step 1: Navigate and select project for Normal PR ---');
    cy.get('[data-cy="procurement-requests-button"]').should('be.visible').click();
    cy.contains('Add New PR').should('be.visible').click();

    // Use predictable data from our fixture
    cy.get('.css-art2ul-ValueContainer2').click();
    // cy.contains('.css-1nmdiq5-menu [role="option"]', this.prData.normalPR.projectName).click();
    cy.get('input').type(this.prData.normalPR.projectName)
        .click()
        // .type('{enter}')
    cy.get('[data-cy="add-new-pr-normal-custom-button"]').click();
    cy.get('[data-cy="add-new-pr-normal"]').click();
    cy.contains('.rounded-xl.bg-card', this.prData.normalPR.workPackage, { timeout: 10000 }).click();

    cy.log('--- Step 2: Add all items from the fixture data ---');
    // Loop through the items and use our custom command to add each one
    this.prData.normalPR.items.forEach((item) => {
      cy.addNormalPrItem(item);
    });

    cy.log('--- Step 3: Submit the PR and verify the API response ---');
    cy.intercept('POST', '**/api/resource/Procurement%20Requests').as('createNormalPr');

    cy.contains('button', /Submit Request/i).click();
    // The final comment in the dialog is optional, so we'll skip it if not in fixtures.
    cy.get('button svg.lucide-check-check').parent('button').click();

    // Use our custom command to wait for the API and get the new PR number
    cy.extractPrNumberFromApi('@createNormalPr').then((fullPrName) => {
        // ... (code to extract finalDisplayNumber is fine) ...
        const parts = fullPrName.split('-');
        const finalDisplayNumber = parseInt(parts[parts.length - 1], 10).toString();

        cy.log(`Full PR Name from API: ${fullPrName}`);
        cy.log(`Extracted Display Number for UI check: ${finalDisplayNumber}`);

        // --- PAUSE THE TEST HERE ---
        // This will stop the test runner and let you inspect the browser.
        cy.pause(); 

        // Now, let's re-add the assertions.
        cy.url().should('include', '/procurement-requests');
        cy.contains('h2', /Created By Administrator/i, { timeout: 10000 })
            .next('table')
            .should('be.visible')
            .and('contain', finalDisplayNumber);
    });
  });

  it('should create a new Custom PR with multiple items from fixture data', function () {
    cy.log('--- Step 1: Navigate and select project for Custom PR ---');
    cy.get('[data-cy="procurement-requests-button"]').should('be.visible').click();
    cy.contains('Add New PR').should('be.visible').click();

    // Use predictable data from our fixture
    cy.get('.css-art2ul-ValueContainer2').click();
    cy.contains('.css-1nmdiq5-menu [role="option"]', this.prData.customPR.projectName).click();
    cy.get('[data-cy="add-new-pr-normal-custom-button"]').click();
    cy.get('[data-cy="add-new-pr-custom"]').click();
    cy.get('.css-w9q2zk-Input2 input').type(`${this.prData.customPR.vendor}{enter}`, { force: true });

    cy.log('--- Step 2: Add all custom items from the fixture data ---');
    // Loop through the custom items and use our custom command for each
    this.prData.customPR.items.forEach((item) => {
      cy.addCustomPrItem(item);
    });

    cy.log('--- Step 3: Submit the PR and verify the API response ---');
    cy.get('[data-cy="custom-pr-next-button"]').click();

    // Intercept the final API call to make the test robust
    cy.intercept('PUT', '**/api/resource/Procurement%20Requests/PR-**').as('sendCustomPrForApproval');

    cy.get('[data-cy="custom-pr-send-for-approval-button"]').click();
    cy.get('[data-cy="custom-pr-confirmation-comment"]').type(this.prData.customPR.finalComment);
    cy.get('[data-cy="custom-pr-confirmation-confirm"]').click();

    // Verify the API call was successful
    cy.extractPrNumberFromApi('@sendCustomPrForApproval').then((prNumber) => {
      expect(prNumber).to.match(/^PR-/);
      cy.contains('PR submitted for approval', { timeout: 10000 }).should('be.visible');
    });
  });
});