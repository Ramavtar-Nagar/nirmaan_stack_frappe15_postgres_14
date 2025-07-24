/// <reference types="Cypress" />

describe('Dynamic Project Payment Approval and Processing Flow', () => {
  beforeEach(function () {
    cy.login();
    // cy.fixture('project-payment-data.json').as('paymentData');
    cy.visit('/');
  });

  it('should dynamically reject one payment', function () {

    cy.log('--- Step 1: Navigating to Project Payments -> Approve Payments tab ---');
    cy.get('[data-cy="project-payments-button"]').should('exist').and('be.visible').click();
    cy.get('[data-cy="po-number-from-purchase-orders"]').should('exist').and('be.visible');

    cy.log('--- Step 2: Verify that the pending payments table contains at least two rows ---');
    cy.get('[data-cy="data-table"]', { timeout: 16000 })
        .should('be.visible')
        .within(() => {
            cy.get('tbody tr').should('have.length.gte', 2);
        });
    cy.log('SUCCESS: Prerequisite met. At least two pending payments are available.');

    cy.log('--- Step 3: Find the first pending payment and reject the payment request ---');
    cy.get('[data-cy="payments-reject-button"]', { timeout: 10000 })
            .first()
            .scrollIntoView()
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            .click({force: true});
    cy.contains('Are you sure you want to')
            .should('be.visible');

        cy.get('[data-cy="payment-action-dialog-cancel-button"]')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            // .click();

        cy.get('[data-cy="payment-action-dialog-confrim-button"]')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            // .click(); // TODO Uncomment to reject the payment
        });
        
    it('Approve another payment and verify the lifecycle', function () {

        cy.log('--- Step 1: Navigating to Project Payments -> Approve Payments tab ---');
        cy.log(' --- Navigating to Approve Payments Tab --- ');
        cy.get('[data-cy="project-payments-button"]').should('exist').and('be.visible').click();
        cy.get('[data-cy="po-number-from-purchase-orders"]').should('exist').and('be.visible');

        cy.log('--- Step 2: Verify that the pending payments table contains at least one row ---');
        cy.get('[data-cy="data-table"]', { timeout: 16000 })
            .should('be.visible')
            .within(() => {
                cy.get('tbody tr').should('have.length.gte', 1);
            });
        cy.log('SUCCESS: Prerequisite met. At least two pending payments are available.');

        // --- Step 3: Extract and Store the PO Number, then Approve the Payment ---
        cy.log('--- Step 3: Finding the first payment, storing its PO number, and approving it');
        cy.get('[data-cy="data-table"] tbody tr').first().then(($row) => {
        // 1. Find the PO number within the context of the first row ($row)
        cy.wrap($row)
            .find('td')
            .first()
            .find('span')
            .invoke('text')
            .then((poText) => {
                // poText is the actual string, e.g., "PO/106/00049/25-26"
                cy.log(`Extracted PO Number: ${poText}`);
                Cypress.env('approvedPoNumber', poText);
            });

        // 2. Now that we have the PO number, clicking the approve button within the same row
        cy.wrap($row)
            .find('[data-cy="payments-approve-button"]')
            .scrollIntoView()
            .click({ force: true });
        });

        cy.contains('Are you sure you want to')
            .should('be.visible')

        cy.get('[data-cy="payment-action-dialog-cancel-button"]')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            // .click();

        cy.get('[data-cy="payment-action-dialog-confrim-button"]')
            .should('exist')
            .and('be.visible')
            .and('not.be.disabled')
            .click();
    });

    it('Navigates to New Payments and Verify the newly approved payment presence in the payments table and Record the Payment as Paid', function() {

        // --- Navigating to Project Payments Module ---
        cy.log('--- Step 1: Navigating to Project Payments Tab -> New Payments Tab');
        cy.get('[data-cy="project-payments-button"]').should('be.visible').click();

        // It's good practice to wait for the initial page to stabilize
        cy.get('[data-cy="data-table"]', { timeout: 20000 }).should('be.visible');
        cy.get('[data-cy="po-number-from-purchase-orders"]').should('exist').and('be.visible');

        // --- Navigating to the New Payments Tab ---
        cy.log('--- Step 2: Navigating to the New Payments Tab ---');
        cy.get('[data-cy="new-payments"]').should('be.visible').and('not.be.disabled').click();

        cy.log('--- Step 3: Wait for the New Payments table to load ---');
        cy.get('[data-cy="data-table"]', { timeout: 20000 }).as('newPaymentsTable'); // Use an alias
        cy.get('@newPaymentsTable').should('be.visible');

        cy.log('--- Step 4: Find the correct row and click its "Pay" button ---');
    
        // Retrieving the value from the Cypress environment
        const approvedPoNumber = Cypress.env('approvedPoNumber');
        cy.log(`Searching for the approved PO number: ${approvedPoNumber}`);

        // Asserting that the table contains a cell with the PO number
        cy.get('[data-cy="data-table"]')
             .contains('td', approvedPoNumber)
             .should('be.visible');

        // // Accessing and clicking the Pay Button
        // cy.get('[data-cy="payments-pay-button"]').scrollIntoView().should('exist').and('be.visible').click();

        cy.get('@newPaymentsTable')
        .contains('td', approvedPoNumber)
        .should('be.visible')
        .parent('tr') // 2. Go up from that cell to its parent table row (<tr>).
        .within(() => { // 3. Now, all subsequent commands are confined WITHIN this specific row.
            cy.get('[data-cy="payments-pay-button"]') // 4. This will now find the ONE "Pay" button in this row.
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });
        });

        // Filling the Fulfill Payment Form
        cy.log('--- step 5: Filling the Form to Record the Payment ---');

        
        // --- 1. UTR (Unique Transaction Reference) Input ---

        // Find the UTR input field within its specific container
        cy.get('[data-cy="utr-input-box"]')
        .find('input')
        .as('utrInput'); // Using .as() to create an alias for easy reuse

        cy.get('@utrInput').should('be.visible').and('be.enabled');

        const newUtrValue = 'UTR1234567890';
        cy.get('@utrInput').clear().type(newUtrValue);
        cy.get('@utrInput').should('have.value', newUtrValue);
        Cypress.env('utrNumberOfPayment', newUtrValue);
        cy.log('Payment UTR number which is used for Payment is: ---> ', newUtrValue);


        // --- 2. TDS (Tax Deducted at Source) Input ---
        
        // Find the TDS input field
        cy.get('[data-cy="tds-input-box"]')
        .find('input[type="number"]')
        .as('tdsInput');

        cy.get('@tdsInput').should('be.visible');

        const newTdsValue = '500';
        cy.get('@tdsInput').clear().type(newTdsValue);
        cy.get('@tdsInput').should('have.value', newTdsValue);


        // --- 3. Payment Date Input ---

        // Find the date input field
        cy.get('[data-cy="payment-date-input"]')
        .find('input[type="date"]')
        .as('dateInput');

        // Type a new date in YYYY-MM-DD format, which is how date inputs work
        const newDateValue = '2025-07-15';
        cy.get('@dateInput').type(newDateValue);
        cy.get('@dateInput').should('have.value', newDateValue);

    
        // Validating Cancel button and Clicking Confirm Buttom
        cy.get('[data-cy="fulfill-payment-cancel-button"]').should('exist').and('be.visible')
        // .click();
        
        cy.get('[data-cy="fulfill-payment-confirm-button"]').should('exist').and('be.visible')
        .click();
        cy.log(`Payment Recorded Successfullyb for the PO Numberv as ${approvedPoNumber}`)

    });


    it('Veryfies the payment which is paid in the Payments Done tab', function() {
        
         // --- Navigating to Project Payments Module ---
         
        cy.log('--- Step 1: Navigating to Project Payments Tab -> Payments Done Tab ---');
        cy.get('[data-cy="project-payments-button"]').should('be.visible').click();

        cy.get('[data-cy="payments-done-button"]').should('exist').and('be.visible').click();

        cy.get('[data-cy="data-table"]', { timeout: 20000 }).should('be.visible');

        // Retrieving approvedPoNumber from the cypress environment
        // const approvedPoNumber = 'PO/051/00009/25-26';
        const approvedPoNumber = Cypress.env('approvedPoNumber');
        cy.log(`Searching for the approved PO number: ${approvedPoNumber}`);
            
        cy.get('[data-cy="data-table"]')
            .first()
            .contains('td', approvedPoNumber)
            .find('a')
            .click();

        // // Retrieving the value from the Cypress environment
        // const utrNumberOfPayment = 'vgvhghggvgyvgy';
        const utrNumberOfPayment = Cypress.env('utrNumberOfPayment');
        cy.log(`Veryfying the payment usingf the UTR Number as: ---> ${utrNumberOfPayment}`);

        cy.get('[data-cy="po-details-payment-details-button"]', { timeout: 20000 }).should('exist').and('be.visible').click();

        // --- Step 2: Locating the specific table and verify the UTR is present ---

        cy.get('[data-cy="transactions-details-table"]', { timeout: 10000 })
            .should('be.visible')
            .within(() => {
                cy.contains('td', utrNumberOfPayment)
                    .should('be.visible');
            });
    
        cy.get('[data-cy="transactions-details-table"]', { timeout: 10000 })
            .contains('td', utrNumberOfPayment)
            .parent('tr')
            .within(() => {
                // Check that the "Status" is correct as
                cy.get('td').eq(3).should('have.text', 'Paid');
            });

        cy.log(`UTR No. ${utrNumberOfPayment} is found successfully in the Transaction Details Table with status as "Paid"...`)

    });

});
