/// <reference types="Cypress" />

describe('Purchase Order - Approval and Send Back Workflow', () => {

    /**
     * Test Case 1: Navigate to Purchase Orders and Validate Table Structure
     * This test ensures the user can navigate to the PO module and that the
     * "Approve PO" table displays all the expected columns correctly.
     */
    it('should navigate to Purchase Orders and validate table columns', () => {
        cy.log('--- Test 1: Navigating and validating PO table columns ---');
        cy.adminLogin(); // Assuming this command logs in and lands on the dashboard
        cy.visit('/');

        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.log('Navigated to Purchase Orders module.');
        
        // Let's ensure we are on the correct tab/view. This assumes 'Approve PO' is the default view.
        // If there are tabs, you would click the correct one first. e.g., cy.get('[data-cy="approve-po-tab"]').click();

        const expectedColumns = [
            '#PR',
            'Created On',
            'Project',
            'Package',
            'Categories',
            'Created By',
            'Est. Value'
        ];

        cy.get('[data-cy="data-table"] thead th').should('have.length', expectedColumns.length);
        cy.log('Correct number of columns found.');

        cy.get('[data-cy="data-table"] thead th').each(($th, index) => {
            cy.wrap($th).should('contain.text', expectedColumns[index]);
        });
        cy.log('✅ All expected columns are present and correctly named.');

        cy.log('✅✅✅ TEST COMPLETED: PO table column validation successful. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 2: Approve a PO and Capture the Generated PO Number
     * This test drills into the first PR, approves it, intercepts the API call
     * to capture the new PO number, and stores it for subsequent tests.
     */
    it('should approve a PR and capture the generated PO number via API intercept', () => {

        cy.log('--- Test 2: Approving PR and capturing PO number ---');
        cy.adminLogin();
        cy.visit('/');

        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.get('[data-cy="data-table"] tbody tr').first().find('a').click();
        cy.log('Navigated into the first PR details page.');

        // Set up the intercept BEFORE the action that triggers it
        cy.intercept('POST', '**/api/method/nirmaan_stack.api.approve_vendor_quotes.generate_pos_from_selection').as('generatePORequest');

        // CORRECTED SELECTOR: Find the first vendor accordion within its specific parent
        cy.get('div.space-y-3 > div[data-orientation="vertical"]').first().within(() => {
            // Find the master checkbox for this vendor and click it.
            // This is robust as it's the only checkbox button at this level.
            cy.get('button[role="checkbox"][id^="vendor-"]').click();
            cy.log('Selected the first vendor and all its items.');
        });
        
        cy.contains('button', 'Approve').click();
        cy.log('Clicked the main Approve button.');

        cy.get('[role="alertdialog"]').within(() => {
            cy.contains('button', 'Confirm Approval').click();
        });
        cy.log('Confirmed approval in the dialog.');

        cy.wait('@generatePORequest', { timeout: 20000 }).then((interception) => {
            expect(interception.response?.statusCode).to.equal(200, 'Expected PO generation to succeed');
            
            const poNumber = interception.response?.body?.message?.po;
            
            if (poNumber) {
                cy.log(`✅ Extracted Generated PO Number: ${poNumber}`);
                Cypress.env('generatedPoNumber', poNumber);
            } else {
                throw new Error('Failed to extract PO Number: "po" field not found in API response message.');
            }
        });

        cy.log('✅✅✅ TEST COMPLETED: PO approved and number captured successfully. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 3: Validate Columns in the "Approved POs" Tab as Procurement
     * This test logs in as procurement, navigates to the Approved POs tab,
     * and verifies the specific columns for that view are present.
     */
    it('should validate the table columns in the "Approved POs" tab', () => {
        cy.log('--- Test 3: Validating Approved POs table columns as procurement ---');
        cy.procurementLogin();
        cy.visit('/');

        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.log('Navigated to Purchase Orders module.');

        // Assuming there's a tab or button to click to view Approved POs.
        // If it's a tab, a selector like this would be used.
        // Replace 'Approved PO' with the actual text of the tab/button if different.
        cy.contains('div, button', 'Approved PO').click();
        cy.log('Navigated to the "Approved PO" tab/view.');

        const expectedColumns = [
            '#PO',
            'Created On',
            'Project',
            'Vendor',
            'Approved By',
            'PO Amt',
            'Amt Paid'
        ];

        cy.get('[data-cy="data-table"] thead th').should('have.length', expectedColumns.length);
        cy.log(`Correct number of columns found: ${expectedColumns.length}.`);

        cy.get('[data-cy="data-table"] thead th').each(($th, index) => {
            cy.wrap($th).should('contain.text', expectedColumns[index]);
        });
        cy.log('✅ All expected columns for Approved POs are present and correctly named.');

        cy.log('✅✅✅ TEST COMPLETED: Approved POs table structure verified successfully. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 4: Verify the Approved PO as a Procurement User
     * This test logs in as a procurement user, navigates to the Approved POs list,
     * and verifies that the PO created in the previous test is visible.
     */
    it('should log in as procurement and verify the approved PO exists in the list', () => {
        cy.log('--- Test 4: Verifying approved PO as procurement user ---');
        const poToVerify = Cypress.env('generatedPoNumber');
        expect(poToVerify, 'PO number must have been set in the previous test').to.not.be.undefined;

        cy.procurementLogin(); // Login as the procurement user
        cy.visit('/');

        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.log('Navigated to Purchase Orders module as procurement user.');

        cy.log(`Searching for PO: ${poToVerify} in the table.`);
        cy.get('[data-cy="data-table"]', { timeout: 15000 })
          .contains('a', poToVerify)
          .should('be.visible');
        
        cy.log(`✅ Successfully found PO ${poToVerify} in the table.`);

        cy.log('✅✅✅ TEST COMPLETED: Approved PO verified successfully by procurement user. ✅✅✅');
        cy.pause();
    });


    /**
     * Test Case 5: Partially Approve a PO (one item) and Capture the PO Number
     * This test drills into a PR, selects only the first item from the first
     * vendor, approves it, and captures the resulting PO number.
     */
    it('should partially approve a PR (one item) and capture the PO number', () => {
        cy.log('--- Test 5: Approving one item in a PR and capturing PO number ---');
        cy.adminLogin();
        cy.visit('/');

        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.get('[data-cy="data-table"] tbody tr').first().find('a').click();
        cy.log('Navigated into the first PR details page.');

        cy.intercept('POST', '**/api/method/nirmaan_stack.api.approve_vendor_quotes.generate_pos_from_selection').as('generatePartialPORequest');

        // --- THE FINAL CORRECTED LOGIC ---

        // Step 1: Find the first vendor's accordion container.
        const firstVendorAccordion = cy.get('div.space-y-3 > div[data-orientation="vertical"]').first();
        
        // Step 2: Click the button inside the header to expand the accordion.
        // This makes the table and its items visible.
        firstVendorAccordion.find('button[aria-expanded="false"]').first().click();
        cy.log('Expanded the first vendor accordion to show items.');

        // Step 3: Now that it's visible, find the first item's checkbox and click it.
        // We re-query the accordion to ensure we're working with the updated DOM.
        cy.get('div.space-y-3 > div[data-orientation="vertical"]').first()
          .find('tbody > tr').first()
          .find('button[role="checkbox"][id^="item-"]')
          .click();

        cy.log('Selected only the first item from the first vendor.');
        
        // The rest of the test remains the same...
        cy.contains('button', 'Approve').click();
        cy.log('Clicked the main Approve button.');

        cy.get('[role="alertdialog"]').within(() => {
            cy.contains('button', 'Confirm Approval').click();
        });
        cy.log('Confirmed approval in the dialog.');

        cy.wait('@generatePartialPORequest', { timeout: 20000 }).then((interception) => {
            expect(interception.response?.statusCode).to.equal(200, 'Expected PO generation to succeed');
            const poNumber = interception.response?.body?.message?.po;
            if (poNumber) {
                cy.log(`✅ Extracted Generated PO Number for partial approval: ${poNumber}`);
                Cypress.env('partialApprovalPoNumber', poNumber);
            } else {
                throw new Error('Failed to extract PO Number for partial approval.');
            }
        });

        cy.log('✅✅✅ TEST COMPLETED: PO (partial approval) and number captured successfully. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 6: Verify the Partially Approved PO as a Procurement User
     * This test logs in as a procurement user and verifies that the PO
     * created from the partial approval in the previous test is visible.
     */
    it('should log in as procurement and verify the partially approved PO exists', () => {
        cy.log('--- Test 6: Verifying partially approved PO as procurement user ---');
        const poToVerify = Cypress.env('partialApprovalPoNumber');
        expect(poToVerify, 'Partial approval PO number must have been set').to.not.be.undefined;

        cy.procurementLogin();
        cy.visit('/');

        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.log('Navigated to Purchase Orders module as procurement user.');

        cy.log(`Searching for PO: ${poToVerify} in the table.`);
        cy.get('[data-cy="data-table"]', { timeout: 15000 }).contains('a', poToVerify).should('be.visible');
        cy.log(`✅ Successfully found partially approved PO ${poToVerify} in the table.`);

        cy.log('✅✅✅ TEST COMPLETED: Partially approved PO verified successfully. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 7: Send Back a PO and Verify the Sent Back Request
     * Logs in as admin, sends back a PR, captures the SB ID, navigates to
     * Procurement Requests > Sent Back, and verifies the new SB ID exists.
     */
    it('should send back a PR and verify the SB ID in the Sent Back list', () => {

        cy.log('--- Test 7: Sending back PR and verifying SB ID ---');
        cy.adminLogin();
        cy.visit('/');

        cy.get('[data-cy="purchase-orders-button"]').click();
        cy.get('[data-cy="data-table"] tbody tr').first().find('a').click();
        cy.log('Navigated into the first PR details page.');

        cy.intercept('POST', '**/api/method/nirmaan_stack.api.approve_vendor_quotes.send_back_selection').as('sendBackRequest');

        cy.get('div.space-y-3 > div[data-orientation="vertical"]').first().within(() => {
            cy.get('button[role="checkbox"][id^="vendor-"]').click();
            cy.log('Selected the first vendor and its items.');
        });

        cy.get('[data-cy="reject-button"]').click();
        cy.log('Clicked the "Send Back / Reject" button.');

        cy.get('[role="alertdialog"]').within(() => {
            // This regex matches a button containing EITHER "Confirm Send Back" OR "Confirm Rejection"
            cy.contains('button', /Confirm Send Back|Confirm Rejection/).click();
        });
        cy.log('Confirmed action in dialog (Send Back or Rejection).');

        cy.wait('@sendBackRequest', { timeout: 20000 }).then((interception) => {
            expect(interception.response?.statusCode).to.equal(200);
            
            // Assuming the SB ID is in a field named 'sb_id' in the response
            const sbId = interception.response?.body?.message?.sb_id;

            if (sbId) {
                cy.log(`✅ Extracted Sent Back ID: ${sbId}`);
                Cypress.env('generatedSbId', sbId);
            } else {
                throw new Error('Failed to extract SB ID: "sb_id" field not found in API response.');
            }
        });

        cy.get('[data-cy="procurement-requests-button"]').click();
        cy.log('Navigated to Procurement Requests module.');

        cy.get('[data-cy="sent-back-navigation"]').click();
        cy.log('Clicked on the "Sent Back" tab.');
        
        const expectedSbColumns = ['SB ID', '#PR', 'Date Created', 'Project', 'Created By', 'Estd. Value', 'Actions'];
        cy.get('[data-cy="data-table"] thead th').each(($th, index) => {
            cy.wrap($th).should('contain.text', expectedSbColumns[index]);
        });
        cy.log('Validated columns of the Sent Back table.');

        const sbToVerify = Cypress.env('generatedSbId');
        cy.get('[data-cy="data-table"]').contains('a', sbToVerify).should('be.visible');
        cy.log(`✅ Successfully found SB ID ${sbToVerify} in the table.`);

        cy.log('✅✅✅ TEST COMPLETED: Send Back flow verified successfully. ✅✅✅');
        cy.pause();
    });
});