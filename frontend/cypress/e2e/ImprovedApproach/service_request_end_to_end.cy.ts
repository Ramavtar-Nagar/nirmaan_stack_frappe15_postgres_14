/// <reference types="cypress" />

describe('Service Request End-to-End Flow', () => {
  // Use a `before` hook to log in ONCE using our new custom command.
  // This will run before any of the `it` blocks in this file.
  beforeEach(() => {
    cy.login();
  });

  // Load the test data from the fixture before each test.
  // This makes `this.srData` available in all `it` blocks.
  beforeEach(() => {
    cy.fixture('service-request-data.json').as('srData');
    // Start each test from a known good state (the modules page).
    cy.visit('/');
  });

  // Test 1: Create the Service Request
  it('should create a new Service Request and send it for approval', function () {
    cy.log('--- Step 1: Create a new Service Request ---');

    cy.get('[data-cy="service-requests-button"]').should('be.visible').click();
    cy.url().should('include', 'service-requests');

    // cy.contains('Add New SR').should('be.visible').click();
    cy.contains('Add New SR').should('be.visible').click();
    
    // Use predictable data from the fixture
    cy.get('input[id*="react-select"]').type(`${this.srData.projectName}{enter}`);

    cy.get('button').contains('Add New SR').click();
        
    cy.contains('.rounded-xl.bg-card', this.srData.servicePackage).click();

    // Fill out the form with fixture data
    cy.get('#description').type(this.srData.description);
    cy.get('#uom').type(this.srData.uom);
    cy.get('#quantity').type(this.srData.quantity.toString()); // Ensure quantity is a string for .type()
    cy.contains('button', 'Add').click();
    cy.get('textarea[placeholder="Write comments here..."]').type(this.srData.comments);

    cy.contains('button', 'Submit').click();
    cy.contains('button', 'Confirm').click();

    // Select vendor and add quote
    cy.get('input[id*="react-select"]').last().type(`${this.srData.vendor}{enter}`);
    cy.get('.border-b > :nth-child(5) > .flex').last().type(this.srData.quote.toString());

    cy.contains('button', 'Next').click();

    // Intercept the API call and send for approval
    cy.intercept('PUT', '**/api/resource/Service%20Requests/SR-**').as('sendForApproval');
    cy.contains('button', 'Send for Approval').click();
    cy.get('button').contains('Confirm').click();

    // Use our custom command to extract the SR number and save it for the next test
    cy.extractSrNumberFromApi('@sendForApproval').then((srNumber) => {
      Cypress.env('srNumberForApproval', srNumber);
    });
  });

  // Test 2: Approve the Service Request
  it('should find the newly created SR and approve it', function () {
    const srNumber = Cypress.env('srNumberForApproval');
    // This is a guard clause to ensure the previous test set the value correctly.
    expect(srNumber, 'SR number must be passed from the creation test').to.exist;

    cy.log(`--- Step 2: Approve Service Request ${srNumber} ---`);

    cy.get('[data-cy="service-requests-button"]').click();
    
    // Find the SR in the list using the predictable number
    cy.get('[data-cy="procurement-requests-data-table"]').contains('a', srNumber).click();

    cy.intercept('PUT', '**/api/resource/Service%20Requests/SR-**').as('approveRequest');
    cy.get('[data-cy="approve-sr-button"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-cy="approve-sr-confirm-button"]').should('be.visible').click();
    
    // Use the same command to verify the approval was successful
    cy.extractSrNumberFromApi('@approveRequest').then((approvedSrNumber) => {
        // The number should be the same after approval
        expect(approvedSrNumber).to.equal(srNumber);
        // Save it for the final verification step
        Cypress.env('approvedSrNumber', approvedSrNumber);
    });
  });

  // Test 3: Verify the final state
  it('should verify the approved SR appears in the "Approved SR" tab', function () {
    const srNumber = Cypress.env('approvedSrNumber');
    expect(srNumber, 'Approved SR number must be passed from the approval test').to.exist;

    cy.log(`--- Step 3: Verify Approved SR ${srNumber} is in the correct list ---`);
    
    cy.get('[data-cy="service-requests-button"]').click();
    // Navigate to the correct tab to see approved requests
    cy.get('[data-cy="approved-sr-button"]').click();
    
    // Assert that the SR now exists in the "Approved" table
    cy.get('[data-cy="procurement-requests-data-table"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', srNumber);
  });
});