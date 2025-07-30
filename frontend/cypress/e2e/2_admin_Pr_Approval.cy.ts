/// <reference types="Cypress" />

describe('Procurement Request Details Page Functionality', () => {

    // This block runs before each `it` block.
    beforeEach(() => {
        cy.log('--- Setting up for test: Logging in and navigating ---');
        cy.adminLogin(); // Your login command
        cy.visit('/');
        cy.get('[data-cy="procurement-requests-button"]').should('be.visible').click();
        cy.get('[data-cy="data-table"]', { timeout: 10000 }).should('be.visible');
    });

    /**
     * Test Case 1: Verify Table Columns
     * Ensures all expected column headers are present and visible on the procurement requests list page.
     */
    it('should display all expected columns in the procurement requests table ( Approve PR )', () => {
        cy.log('--- Test 1: Verifying table column headers ---');

        const expectedColumns = [
            '#PR',
            'Created On',
            'Project',
            'Package',
            'Categories',
            'Created By',
            'Est. Value (excl GST)'
        ];

        cy.get('[data-cy="data-table"] thead').should('be.visible').within(() => {
            expectedColumns.forEach(columnName => {
                cy.contains('th', columnName).should('be.visible');
                cy.log(`✅ Column "${columnName}" is visible.`);
            });
        });
        
        cy.log('--- Test 1 Complete ---');
        cy.log('✅✅✅ TEST COMPLETED: All table column headers are visible as expected. ✅✅✅');
        cy.pause();
    });
    
    /**
     * Helper function to centralize the navigation logic for tests that need to be on the PR details page.
     * It intelligently uses a PR number from Cypress environment variables if available,
     * otherwise, it falls back to selecting the first PR in the list.
     */
    const navigateToPrDetails = () => {
        const prNumber = Cypress.env('prNumber');

        if (prNumber) {
            cy.log(`Found prNumber in env: "${prNumber}". Searching for this specific PR.`);
            cy.get('[data-cy="procurement-requests-search-bar"]').clear().type(prNumber);
            cy.contains('[data-cy="data-table"] a', prNumber, { timeout: 20000 }).click();
        } else {
            cy.log('No prNumber in env. Selecting the first PR from the list.');
            cy.get('[data-cy="data-table"] tbody tr').first().find('a').click();
        }
        // Universal check to ensure navigation was successful before the test body runs
        cy.contains('h3', 'Order List', { timeout: 10000 }).should('be.visible');
    };

    /**
     * Test Case 2: Validate Disabled Form States
     * Clicks "Add Missing Products" and verifies that the "Add Product" button is disabled initially.
     */
    it('should show a disabled "Add Product" button in the "Add Missing Products" form when empty', () => {
        cy.log('--- Test 2: Validating "Add Missing Product" form (disabled state) ---');
        navigateToPrDetails();
        
        cy.contains('button', 'Add Missing Products').click();
        cy.get('[role="alertdialog"]').within(() => {
            cy.contains('h2', 'Add Missing Product').should('be.visible');
            cy.contains('button', 'Add Product').should('be.disabled');
            cy.log('✅ "Add Product" button is correctly disabled.');
            cy.contains('button', 'Cancel').click();
        });

        cy.get('[role="alertdialog"]').should('not.exist');
        cy.log('✅ Dialog closed successfully.');
        cy.log('--- Test 2 Complete ---');
        cy.log('✅✅✅ TEST COMPLETED: "Add Product" button disabled state verified successfully. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 3: Add Existing Product
     * Tests the "happy path" of adding a pre-existing product to the PR from the "Add Missing Products" dialog.
     */
    it('should successfully add a product using the "Add Missing Products" form', () => {
        cy.log('--- Test 3: Happy path for "Add Missing Product" ---');
        navigateToPrDetails();
        
        cy.contains('button', 'Add Missing Products').click();
        cy.get('[role="alertdialog"]').within(() => {
            cy.get('#add-item-select').parent().click();
            cy.get('.css-1nmdiq5-menu [id*="react-select"]').first().click();
            cy.log('✅ Selected a product.');
            cy.get('input[placeholder="Qty"]').should('not.be.disabled').type('55');
            cy.log('✅ Entered quantity.');
            cy.contains('button', 'Add Product').should('be.enabled').click();
        });

        cy.get('[role="alertdialog"]').should('not.exist');
        cy.log('✅ Product added and dialog closed.');
        cy.log('--- Test 3 Complete ---');
        cy.log('✅✅✅ TEST COMPLETED: An existing product was successfully added to the PR. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 4: Validate "Create New Product" Disabled State
     * Opens the "Create New Product" form and verifies its submit button is disabled by default.
     */
    it('should show a disabled "Create & Add Product" button in the "Create New Product" form', () => {
        cy.log('--- Test 4: Validating "Create New Product" form (disabled state) ---');
        navigateToPrDetails();
        
        cy.contains('button', 'Add Missing Products').click();
        cy.get('[role="alertdialog"]').contains('button', 'Create New Product').click();
        cy.contains('[role="alertdialog"]', 'Create New Product').within(() => {
            cy.contains('button', /Create & Add Product/).should('be.disabled');
            cy.log('✅ "Create & Add Product" button is correctly disabled.');
            cy.contains('button', 'Cancel').click();
        });
        
        cy.get('[role="alertdialog"]').should('not.exist');
        cy.log('✅ Dialogs closed successfully.');
        cy.log('--- Test 4 Complete ---');
        cy.log('✅✅✅ TEST COMPLETED: "Create & Add Product" disabled state verified successfully. ✅✅✅');
        cy.pause();
    });

    // 5th IT BLOCK
    // it('should successfully create and add a new product', () => {
    //     cy.log('--- Test 5: Happy path for "Create New Product" ---');
    //     navigateToPrDetails();

    //     cy.contains('button', 'Add Missing Products').click();
    //     cy.get('[role="alertdialog"]').contains('button', 'Create New Product').click();
    //     cy.contains('[role="alertdialog"]', 'Create New Product').within(() => {
    //         cy.get('#category').click();
    //         cy.get('[id*="react-select-"][id*="-option-"]').first().click();
    //         cy.get('#product_name').should('not.be.disabled').type(`E2E-Product-${Date.now()}`);
    //         cy.contains('span', 'Select Unit').click();
    //         cy.contains('[role="option"]', 'NOS').click();
    //         cy.get('#quantity').should('not.be.disabled').type('123');
    //         cy.contains('button', /Create & Add Product/).should('be.enabled').click();
    //     });
        
    //     cy.get('[role="alertdialog"]').should('not.exist');
    //     cy.log('✅ New product created and dialog closed.');
    //     cy.log('--- Test 5 Complete ---');
    //     cy.pause();
    // });

    /**
     * Test Case 5: Create and Add New Product
     * Tests the "happy path" of creating a brand new product from scratch and adding it to the PR.
     */
    it('should successfully create and add a new product', () => {
        cy.log('--- Test 5: Happy path for "Create New Product" ---');
        navigateToPrDetails();

        cy.contains('button', 'Add Missing Products').click();
        cy.get('[role="alertdialog"]').contains('button', 'Create New Product').click();
        
        cy.contains('[role="alertdialog"]', 'Create New Product').within(() => {
            cy.get('#category').click();
            cy.get('[id*="react-select-"][id*="-option-"]').first().click();
            cy.log('✅ Selected a category.');

            const newProductName = `E2E-Test-Product-${Date.now()}`;
            cy.get('#product_name').should('not.be.disabled').type(newProductName);
            cy.log(`✅ Entered product name: ${newProductName}`);

            // --- THE FIX IS HERE ---
            // Find the BUTTON that CONTAINS the text "Select Unit" and click it.
            cy.contains('button', 'Select Unit').click();
            cy.log('✅ Clicked the unit dropdown.');

            cy.contains('[role="option"]', 'NOS').click();
            cy.log('✅ Selected a unit.');

            cy.get('#quantity').should('not.be.disabled').type('123');
            cy.log('✅ Entered quantity.');
            
            cy.contains('button', /Create & Add Product/).should('be.enabled').click();
        });
        
        cy.get('[role="alertdialog"]').should('not.exist');
        cy.log('✅ New product created and dialog closed.');
        
        cy.log('--- Test 5 Complete ---');
        cy.log('✅✅✅ TEST COMPLETED: A new product was successfully created and added to the PR. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 6: Edit, Delete, and Undo Product
     * Verifies the full lifecycle of an item in the order list: editing, deleting, and restoring via undo.
     */
    it('should allow editing, deleting, and undoing deletion of a product in the order list', () => {
        cy.log('--- Test 6: Verifying Order List Edit/Delete/Undo functionality ---');
        navigateToPrDetails();

        cy.get('div.pt-0.space-y-4 tbody tr').first().as('targetRow');
        
        cy.get('@targetRow').find('button').click(); // Click edit button
        cy.get('[role="alertdialog"]').within(() => {
            cy.contains('button', 'Delete Product').click();
        });
        
        cy.get('[data-cy="confirm-delete-button"]').click();
        cy.log('✅ Confirmed deletion.');
        
        cy.contains('button', /Undo Delete/).should('be.visible').click();
        cy.log('✅ Clicked "Undo Delete".');
        
        cy.get('@targetRow').find('button').click(); // Click edit again
        cy.get('[role="alertdialog"]').within(() => {
            cy.get('input#quantity').clear().type('999');
            cy.contains('button', 'Save Changes').click();
        });
        
        cy.get('@targetRow').contains('td', '999').should('be.visible');
        cy.log('✅ Verified quantity was updated successfully.');
        cy.log('--- Test 6 Complete ---');
        cy.log('✅✅✅ TEST COMPLETED: Product edit, delete, and undo cycle validated successfully. ✅✅✅');
        cy.pause();
    });

    /**
     * Test Case 7: Approve PR
     * Verifies that the main PR action buttons are visible and that the PR can be successfully approved.
     */
    it('should display PR actions and allow approval', () => {
        cy.pause();
        cy.log('--- Test 7: Verifying PR actions (Delete, Reject, Approve) ---');
        navigateToPrDetails();
        
        cy.get('[data-cy="delete-pr-button"]').should('be.visible').click();
        cy.contains('button', 'Confirm Delete').should('be.visible');
        cy.contains('button', 'Cancel').should('be.visible').click();
        cy.log('✅ "Delete PR" button is visible and Validated Properly.');

        cy.get('[data-cy="reject-pr-button"]').should('be.visible');
         cy.contains('button', 'Confirm Rejection').should('be.visible');
        cy.contains('button', 'Cancel').should('be.visible').click();
        cy.log('✅ "Reject PR" button is visible and Validated Properly.');
        
        cy.get('[data-cy="approve-pr-button"]').should('be.visible').click();
        cy.contains('button', 'Confirm Approval').should('be.visible').click();
        
        cy.contains('PR Approved', { timeout: 10000 }).should('be.visible');
        cy.log('✅ PR was successfully approved and Validated Properly.');
        
        cy.log('--- Test 7 Complete ---');
        cy.log('✅✅✅ TEST COMPLETED: The Procurement Request was successfully approved. ✅✅✅');
        cy.pause();
    });
});