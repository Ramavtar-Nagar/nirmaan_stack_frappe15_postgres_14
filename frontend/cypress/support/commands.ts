/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
declare namespace Cypress {
  interface Chainable {
    getByData(dataTestAttribute: string): Chainable<JQuery<HTMLElement>>
  }
}

Cypress.Commands.add("getByData", (selector) => {
  return cy.get(`[data-cy=${selector}]`)
})

// --- TypeScript Declarations for Custom Commands ---
// This part is crucial for TypeScript to recognize your new commands.
// If you're using JavaScript, you can skip this `declare` block.
declare global {
  namespace Cypress {
    interface Chainable {

      /**
       * Logs in programmatically by sending a POST request to the API.
       * @param email The user's email. Defaults to Cypress.env('login_Email').
       * @param password The user's password. Defaults to Cypress.env('login_Password').
       */
      adminLogin(email?: string, password?: string): Chainable<void>;
      procurementLogin(email?: string, password?: string): Chainable<void>;
      accountsLogin(email?: string, password?: string): Chainable<void>;

      /**
       * Fills out the form to add a single item to a "Normal" PR.
       * @param item An object containing item details.
       * @example cy.addNormalPrItem({ itemName: '...', make: '...', ... })
       */
      addNormalPrItem(item: { itemName: string; make: string; quantity: number; comment: string }): Chainable<void>;

      /**
       * Fills out the form to add a single item to a "Custom" PR.
       * @param item An object containing custom item details.
       * @example cy.addCustomPrItem({ procurementPackage: '...', ... })
       */
      addCustomPrItem(item: { procurementPackage: string; category: string; description: string; uom: string; quantity: number; tax: string; quote: string; }): Chainable<void>;

      /**
       * Waits for an intercepted API call and extracts the SR Number from the response body.
       * @param alias The alias of the cy.intercept() call (e.g., '@updateSR').
       * @returns The extracted SR Number as a string (e.g., "00156").
       */
      extractSrNumberFromApi(alias: string): Chainable<string>;

      /**
       * Intelligently selects an option from a react-select dropdown.
       * It can find the dropdown by its associated label text.
       *
       * @param labelText The visible text of the label for the dropdown (e.g., "Select Item").
       * @param optionToSelect The text of the option you want to select. Can be a string or a RegExp.
       */
      selectReactSelectOption(labelText: string, optionToSelect: string | RegExp): Chainable<void>;

      /**
      * Waits for an intercepted API call and extracts the PR Number from the response.
      * @param alias The alias of the cy.intercept() call (e.g., '@createNormalPr').
      * @returns The extracted PR Number as a string (e.g., "PR-2024-00123").
      */
      extractPrNumberFromApi(alias: string): Chainable<string>;

      /**
       * On the PO details page, finds and clicks either the 'Cancel' or 'Delete' button.
       * It handles the subsequent dialog and returns the outcome.
       * @param comment The comment to use if the PO is cancelled.
       * @returns A chainable object with the outcome: `{ action: 'cancelled' | 'deleted' | 'none', sentBackId: string | null }`
       */
      cancelOrDeletePo(comment: string): Chainable<{ action: string; sentBackId: string | null }>;

      /**
       * Creates a new Normal PR with items from a fixture and returns its display number.
       * @param prData The data for the PR from the fixture file.
       */
      createPr(prData: any): Chainable<string>;

      /**
       * Finds a PR by its display number on the list page and approves it.
       * @param prNumber The display number of the PR to approve.
       * @param missingProduct The data for a product to add during the approval step.
       */
      approvePr(prNumber: string, missingProduct: any): Chainable<void>;

      /**
       * Finds the approved PR, adds vendor quotes, and submits for PO approval.
       * @param prNumber The display number of the PR.
       * @param vendorData The vendor and quote data from the fixture.
       */
      addVendorQuotes(prNumber: string, vendorData: any): Chainable<void>;

      /**
       * Finds the PO by its PR number, approves it, and returns the final PO number.
       * @param prNumber The display number of the original PR.
       * @param approvalComment A final comment for the approval.
       */
      approvePo(prNumber: string, approvalComment: string): Chainable<string>;

      /**
       * Navigates to a specific tab within the Project Payments page.
       * @param tabName The visible text of the tab to click (e.g., "Approve Payments", "New Payments", "Payments Done").
       * @example cy.navigateToPaymentsTab('New Payments')
       */
      navigateToPaymentsTab(tabName: 'Approve Payments' | 'New Payments' | 'Payments Done'): Chainable<void>;
      /**
       * Finds a specific payment row in a table by its PO or SR number.
       * @param id The full PO or SR number to find.
       * @example cy.findPaymentRow('PO/099/00049/25-26')
       * @returns {Chainable<JQuery<HTMLElement>>} A chainable that yields the table row (tr) element.
       */
      findPaymentRow(id: string): Chainable<JQuery<HTMLElement>>;

      // /**
      //  * Rejects a payment from the "Approve Payments" list.
      //  * @param poNumber The full PO number to reject.
      //  * @param comment The reason for rejection.
      //  * @example cy.rejectPayment('PO/099/00049/25-26', 'Test rejection.')
      //  */
      // rejectPayment(poNumber: string, comment: string): Chainable<void>;

      /**
       * Dynamically finds the first available PO in the "Approve Payments" list,
       * rejects it, and confirms the action.
       * @param comment The reason for rejection.
       */
      rejectFirstAvailablePayment(comment: string): Chainable<void>;

      // /**
      //  * Approves a payment from the "Approve Payments" list.
      //  * @param poNumber The full PO number to approve.
      //  * @example cy.approvePayment('PO/089/00049/25-26')
      //  */
      // approvePayment(poNumber: string): Chainable<void>;

      /**
       * Dynamically finds the first available PO in the "Approve Payments" list,
       * approves it, and returns the PO number for the next step.
       * @returns {Chainable<string>} The PO number that was just approved.
       */
      approveFirstAvailablePayment(): Chainable<string>;

      // /**
      //  * Records a new payment from the "New Payments" list.
      //  * @param poNumber The full PO number to pay.
      //  * @param paymentDetails An object with amount, utr, and proofFile details.
      //  * @example cy.recordNewPayment('PO/089/00049/25-26', this.fixture.paymentDetails)
      //  */
      // recordNewPayment(poNumber: string, paymentDetails: { amount: string; utr: string; proofFile: string }): Chainable<void>;

      /**
       * Finds a specific approved payment in the "New Payments" list by its PO number,
       * records it as paid, and submits the form.
       * @param poNumber The exact PO number to find and pay.
       * @param paymentDetails An object containing payment info.
       */
      recordNewPayment(poNumber: string, paymentDetails: { amount: string; utr: string; proofFile: string }): Chainable<void>;


    }
  }
}

// --- Custom Command Implementations ---

/**
 * Programmatic Login Command for Admins
 * This is much faster and more reliable than logging in through the UI.
 */
Cypress.Commands.add('adminLogin', (
  email = Cypress.env('admin_Login_Email'),
  password = Cypress.env('admin_Login_Password')
) => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: '/api/method/login',
      body: {
        usr: email,
        pwd: password,
      },
    }).then((response) => {
      // Basic check to ensure login was successful
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('message', 'Logged In');
    });
  }, {
    // This ensures cookies are properly set and cleared across tests
    cacheAcrossSpecs: true,
  });
});

/**
 * Programmatic Login Command for Procurement Teams
 * This is much faster and more reliable than logging in through the UI.
 */
Cypress.Commands.add('procurementLogin', (
  email = Cypress.env('procurement_Login_Email'),
  password = Cypress.env('procurement_Login_Password')
) => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: '/api/method/login',
      body: {
        usr: email,
        pwd: password,
      },
    }).then((response) => {
      // Basic check to ensure login was successful
      expect(response.status).to.eq(200);
    });
  }, {
    // This ensures cookies are properly set and cleared across tests
    cacheAcrossSpecs: true,
  });
});

/**
 * Programmatic Login Command for Accounts Teams
 * This is much faster and more reliable than logging in through the UI.
 */
Cypress.Commands.add('accountsLogin', (
  email = Cypress.env('accounts_Login_Email'),
  password = Cypress.env('accounts_Login_Password')
) => {
  cy.session([email, password], () => {
    cy.request({
      method: 'POST',
      url: '/api/method/login',
      body: {
        usr: email,
        pwd: password,
      },
    }).then((response) => {
      // Basic check to ensure login was successful
      expect(response.status).to.eq(200);
    });
  }, {
    // This ensures cookies are properly set and cleared across tests
    cacheAcrossSpecs: true,
  });
});


/**
 * SR Number Extraction Command
 * This centralizes the logic for parsing the API response.
 */
Cypress.Commands.add('extractSrNumberFromApi', (alias) => {
  // Wait for the intercepted request with a generous timeout
  return cy.wait(alias, { timeout: 15000 }).then((interception) => {
    // Assert that the API call was successful
    expect(interception.response?.statusCode, `${alias} API call status code`).to.equal(200);

    // Safely access the SR number from the response
    const fullSrNumber = interception.response?.body?.data?.name;
    expect(fullSrNumber, `SR Number from ${alias} API response`).to.be.a('string').and.not.be.empty;

    // Split the string and parse the numeric part
    const parts = fullSrNumber.split('-');
    expect(parts.length, 'SR number format (e.g., SR-YYYY-XXXXX)').to.be.gte(2);
    
    const numericString = parts[parts.length - 1];
    const numericPart = parseInt(numericString, 10);
    expect(numericPart, 'Parsed numeric part of SR number').to.be.a('number').and.not.be.NaN;

    // Format it to a 5-digit string with leading zeros
    const extractedSrNumber = numericPart.toString().padStart(5, '0');
    
    cy.log(`Extracted SR Number from ${alias}: ${extractedSrNumber}`);
    
    // Return the value so it can be used in .then()
    return cy.wrap(extractedSrNumber);
  });
});



Cypress.Commands.add('selectReactSelectOption', (labelText, optionToSelect) => {
  cy.log(`Selecting '${optionToSelect}' from dropdown labeled '${labelText}'`);
  
  // 1. Find the label by its text. This is our stable anchor.
  cy.contains('label', labelText, { matchCase: false })
    // 2. Traverse to the parent element that contains both the label and the dropdown.
    .closest('.form-group') // NOTE: Adjust this selector based on your HTML structure
    // 3. Find the react-select container within that parent.
    .find('[class*="-container"]')
    .click(); // 4. Click to open the dropdown

  // 5. Find the menu that appears and select the desired option by its text.
  cy.get('[class*="-menu"]')
    .contains(optionToSelect)
    .click();
});

/**
 * Command to add an item to a "Normal" PR.
 * This abstracts away all the individual clicks and types for one item.
 */
Cypress.Commands.add('addNormalPrItem', (item) => {
  cy.log(`-- Adding Normal Item: ${item.itemName}`);

  // --- STABLE APPROACH FOR "ITEM" DROPDOWN ---
  // 1. Find the label with the text "Item".
  // 2. Go to its parent, then find the input field within that context.
  // 3. Type the item name and {enter} to select it. This is the most robust
  //    way to interact with react-select components.
  cy.contains('label', /^Item/i)
    .parent()
    .find('input[id^="item-select"]')
    .type(`${item.itemName}{enter}`, { force: true });

  // --- STABLE APPROACH FOR "MAKE" DROPDOWN ---
  // We use the same pattern for the "Make" field.
  cy.contains('label', /^Make/i)
    .parent()
    .find('input[id^="make-select"]')
    .type(`${item.make}{enter}`, { force: true });

  // --- STABLE APPROACH FOR QUANTITY AND COMMENTS INPUTS ---
  // Find the input by its associated label text.
  cy.contains('label', /^Qty/i)
    .parent()
    .find('input[type="number"]')
    // .clear()
    .type(item.quantity.toString());

  cy.contains('label', /Item Comments/i)
    .parent()
    .find('input[type="text"]')
    .clear()
    .type(item.comment);
  
  // The button is stable enough to be found by its text content.
  cy.contains('button', 'Add to Cart').click();
});



/**
 * Command to add an item to a "Custom" PR.
 * This handles the logic for adding a new item row and filling its fields.
 */
Cypress.Commands.add('addCustomPrItem', (item) => {
  cy.log(`-- Adding Custom Item: ${item.description.substring(0, 30)}...`);
  
  cy.contains('button', 'New Item').click();

  // We use .last() to target the fields in the newly added item row.
  // This pattern is necessary for dynamically added form elements.
  cy.get('.border-b > :nth-child(1) > .flex').last().click();
  cy.get('[role="listbox"]').contains('[role="option"]', item.procurementPackage).click();

  cy.get('[data-cy="category-dropdown"]').last().click();
  cy.get('[role="listbox"]').contains('[role="option"]', item.category).click();
  
  cy.get('[data-cy="item-name-description"]').last().type(item.description);

  cy.get('.border-b > :nth-child(4) > .flex').last().click();
  cy.get('[role="listbox"]').contains('[role="option"]', item.uom).click();
  
  cy.get('[data-cy="quantity"]').last().type(item.quantity.toString());
  
  cy.get('[data-cy="tax"]').last().click();
  cy.get('[role="listbox"]').contains('div', item.tax).click();

  cy.get('[data-cy="quote"]').last().type(item.quote);
});



/**
 * PR Number Extraction Command
 * Centralizes the logic for parsing the API response to get the PR name/number.
 */
Cypress.Commands.add('extractPrNumberFromApi', (alias) => {
  return cy.wait(alias, { timeout: 15000 }).then((interception) => {
    expect(interception.response?.statusCode, `${alias} API call successful`).to.be.oneOf([200, 201]);

    const prName = interception.response?.body?.data?.name;
    expect(prName, `PR Number from ${alias} response`).to.be.a('string').and.not.be.empty;

    cy.log(`Extracted PR Number from ${alias}: ${prName}`);
    
    // Return the value so it can be used in a .then() block
    return cy.wrap(prName);
  });
});



/**
 * Custom command to intelligently handle PO cancellation or deletion.
 * This abstracts away the complex conditional logic from the test itself.
 */
Cypress.Commands.add('cancelOrDeletePo', (comment) => {
  const cancelButtonSelector = '[data-cy="cancel-po-button"]';
  const deleteButtonSelector = '[data-cy="delete-po-button"]';
  
  // Intercept the cancel API call BEFORE the action
  cy.intercept('POST', '**/api/method/nirmaan_stack.api.handle_cancel_po.handle_cancel_po').as('cancelPoApi');

  // We look for the buttons within the whole body
  return cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find(cancelButtonSelector).filter(':visible').length > 0) {
      // --- CANCEL PATH ---
      cy.log('ACTION: Found "Cancel PO" button.');
      cy.get(cancelButtonSelector).click();
      cy.get('[data-cy="cancel-po-comments-input"]').clear().type(comment);
      cy.get('[data-cy="cancel-po-dialog-confirm-button"]').click();

      return cy.wait('@cancelPoApi', { timeout: 15000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
        const successMessage = interception.response?.body?.message?.message;
        const match = successMessage.match(/SB-\d{5,}-\d{6,}-(\d{5,})/);
        const sentBackId = match ? match[1] : null;
        expect(sentBackId, 'Successfully extracted Sent Back ID from API response').to.not.be.null;

        return cy.wrap({ action: 'cancelled', sentBackId: sentBackId });
      });
    } else if ($body.find(deleteButtonSelector).filter(':visible').length > 0) {
      // --- DELETE PATH ---
      cy.log('ACTION: Found "Delete PO" button.');
      cy.get(deleteButtonSelector).click();
      cy.get('[data-cy="delete-po-dialog-confirm-button"]').click();
      return cy.wrap({ action: 'deleted', sentBackId: null });
    } else {
      // --- NO ACTION PATH ---
      cy.log('ACTION: Neither "Cancel" nor "Delete" button found.');
      return cy.wrap({ action: 'none', sentBackId: null });
    }
  });
});



/**
 * Creates a new Normal Procurement Request.
 * It navigates to the PR page, fills out the form with provided data,
 * adds multiple items, and submits it. It intercepts the creation API
 * call to extract and return the new PR's display number.
 */
Cypress.Commands.add('createPr', (prData) => {
  cy.log('--- COMMAND: createPr ---');
  cy.intercept('POST', '**/api/resource/Procurement%20Requests').as('prCreationApi');
  
  cy.get('[data-cy="procurement-requests-button"]').click();
  cy.contains('Add New PR').click();
  cy.get('input').type(`${prData.project}{enter}`);
  cy.get('[data-cy="add-new-pr-normal-custom-button"]').click();
  cy.get('[data-cy="add-new-pr-normal"]').click();
  cy.contains('.rounded-xl.bg-card', prData.workPackage, { timeout: 10000 }).click();

  // Use the existing addNormalPrItem command to add items
  prData.items.forEach(item => {
    cy.addNormalPrItem(item);
  });

  cy.contains('button', /Submit Request/i).click();
  cy.get('textarea[placeholder="Add final comments (optional)..."]').type('PR created by automated test.');
  cy.get('button:contains("Confirm")').click();

  return cy.wait('@prCreationApi').then(interception => {
    const fullName = interception.response?.body?.data?.name;
    const prNumber = parseInt(fullName.split('-').pop(), 10).toString();
    cy.log(`PR Created. Display Number: ${prNumber}`);
    return cy.wrap(prNumber);
  });
});



/**
 * Handles the first level of PR approval.
 * It finds the specified PR, adds a "missing product" as part of the flow,
 * and then confirms the approval.
 */
Cypress.Commands.add('approvePr', (prNumber, missingProduct) => {
  cy.log(`--- COMMAND: approvePr (for PR #${prNumber}) ---`);
  cy.get('[data-cy="procurement-requests-button"]').click();
  cy.contains('[data-cy="procurement-requests-data-table"] a', prNumber).click();
  
  // Add a missing product
  cy.contains('button', 'Add Missing Products').click();
  cy.get('[role="alertdialog"]').within(() => {
    cy.get('input').first().type(`${missingProduct.name}{enter}`);
    cy.get('input').eq(1).type(`${missingProduct.make}{enter}`);
    cy.get('input[type="number"]').type(missingProduct.quantity.toString());
    cy.contains('button', 'Add Product').click();
  });
  cy.get('[role="alertdialog"]', {timeout: 10000}).should('not.exist');

  // Approve the PR
  cy.get('[data-cy="approve-pr-button"]', { timeout: 10000 }).click();
  cy.contains('button', 'Confirm Approval').click();
  cy.contains('PR Approved', { timeout: 10000 }).should('be.visible');
});



/**
 * Handles the vendor quotation stage.
 * This command navigates to the correct tab, finds the PR, adds specified
 * vendors, fills in a standard quote rate for all items, selects the best
 * rate, and submits for the next stage of approval.
 */
Cypress.Commands.add('addVendorQuotes', (prNumber, vendorData) => {
  cy.log(`--- COMMAND: addVendorQuotes (for PR #${prNumber}) ---`);
  cy.get('[data-cy="procurement-requests-button"]').click();
  cy.get('[data-cy="new-pr-request-navigation"]').click();
  cy.contains('[data-cy="procurement-requests-data-table"] a', prNumber, { timeout: 10000 }).click();

  cy.get('[data-cy="procurement-vendor-continue-button"]').click();
  cy.get('[data-cy="vendore-quote-vendor-selection-button"]').click();
  
  // Add vendors
  vendorData.vendors.forEach(vendor => {
    cy.get('[data-cy="vendor-addition-dropdown"]').click().type(vendor);
    cy.get('.css-1nmdiq5-menu').find('div').first().click();
  });
  cy.get('[data-cy="vendor-selection-confirm-button"]').click();
  
  // Fill rates
  cy.get('[data-cy="vendor-quote-rate"]').each($rateInput => {
    cy.wrap($rateInput).clear().type(vendorData.quoteRate.toString());
  });

  cy.get('[data-cy="vendor-quotes-view-button"]').click();
  
  // Select the minimum rate for each item (the first one in this case)
  cy.get('tbody tr').each($row => {
    cy.wrap($row).find('[role="radio"]').first().click();
  });

  cy.get('[data-cy="vendor-selection-continue-button"]').click();
  cy.get('[data-cy="vendor-selection-summary-send-for-approval-button"]').click();
  cy.get('textarea[placeholder="type here..."]').type('Quotes filled by automated test.');
  cy.get('[data-cy="send-for-approval-dialog-confirm-button"]').click();
  cy.contains('Success!', { timeout: 10000 }).should('be.visible');
});



/**
 * Handles the final Purchase Order approval.
 * It navigates to the PO section, finds the PO associated with the original PR,
 * approves it, and intercepts the final API call to extract and return the
 * official PO number.
 */
Cypress.Commands.add('approvePo', (prNumber, approvalComment) => {
  cy.log(`--- COMMAND: approvePo (for PR #${prNumber}) ---`);
  cy.intercept('POST', '**/api/method/nirmaan_stack.api.approve_vendor_quotes.generate_pos_from_selection').as('generatePoApi');
  
  cy.get('[data-cy="purchase-orders-button"]').click();
  cy.url().should('include', '/purchase-orders');
  cy.contains('[data-cy="procurement-requests-data-table"] a', prNumber, { timeout: 20000 }).click();
  
  cy.get('[data-cy="approve-button"]', { timeout: 10000 }).click();
  cy.contains('button', 'Confirm Approval').click();
  
  return cy.wait('@generatePoApi').then(interception => {
    const poNumber = interception.response?.body?.message?.po;
    cy.log(`PO Generated. Number: ${poNumber}`);
    return cy.wrap(poNumber);
  });
});


/**
 * A helper command to navigate to the correct tab on the Project Payments page.
 */
Cypress.Commands.add('navigateToPaymentsTab', (tabName) => {
  cy.log(`--- Navigating to Payments Tab: ${tabName} ---`);
  cy.get('[data-cy="project-payments-button"]').click();
  
  // Uses data-cy for New Payments, and text for others, which is stable.
  if (tabName === 'New Payments') {
    cy.get('[data-cy="new-payments"]').click();
  } else {
    cy.contains('div.ant-radio-group label', tabName).click();
  }
});



/**
 * A robust helper command to locate a table row based on the unique PO/SR number.
 */
Cypress.Commands.add('findPaymentRow', (id) => {
  cy.log(`--- Finding payment row for ID: ${id} ---`);
  // This finds the span with the exact title, then traverses up to the parent row.
  // It's highly specific and stable.
  return cy.get(`[data-cy="data-table"] span[title="${id}"]`).parents('tr');
});



Cypress.Commands.add('rejectFirstAvailablePayment', (comment) => {
  cy.log(`--- COMMAND: rejectFirstAvailablePayment ---`);
  cy.navigateToPaymentsTab('Approve Payments');

  // Find the first row in the table
  cy.get('[data-cy="data-table"] tbody tr').first().within(() => {
    // Within that row, find and click the reject button
    cy.get('[data-cy="payments-reject-button"]').click();
  });

  // Handle the confirmation dialog
  cy.get('body').find('textarea').clear().type(comment);
  cy.get('body').find('button:contains("Confirm")').click();
  cy.contains(/Payment.*rejected/i, { timeout: 10000 }).should('be.visible');
});



Cypress.Commands.add('approveFirstAvailablePayment', () => {
  cy.log(`--- COMMAND: approveFirstAvailablePayment ---`);
  cy.navigateToPaymentsTab('Approve Payments');

  // Create an alias to store the PO number we find
  let approvedPoNumber: string;

  // Find the first row in the table
  cy.get('[data-cy="data-table"] tbody tr').first().within(() => {
    // 1. Find the span with the title, get its text, and store it.
    cy.get('span[title*="PO/"]').invoke('text').then(poNumber => {
      approvedPoNumber = poNumber.trim();
      cy.log(`Found PO to approve: ${approvedPoNumber}`);
    });

    // 2. Click the approve button in the same row
    cy.get('[data-cy="payments-approve-button"]').click();
  })
  .then(() => {
    // 3. Handle the confirmation dialog and verify success
    cy.get('body').find('button:contains("Confirm")').click();
    cy.contains(/Payment.*approved/i, { timeout: 10000 }).should('be.visible');

    // 4. Return the PO number we captured
    return cy.wrap(approvedPoNumber);
  });
});


Cypress.Commands.add('recordNewPayment', (poNumber, paymentDetails) => {
  cy.log(`--- COMMAND: recordNewPayment for PO: ${poNumber} ---`);
  cy.navigateToPaymentsTab('New Payments');

  // Use the robust findPaymentRow helper to locate the correct row
  cy.findPaymentRow(poNumber).within(() => {
    cy.contains('button', 'Pay').click();
  });

  // Handle the payment form modal
  cy.get('body').within(() => {
    cy.contains('label', /Amount/i).next('input').clear().type(paymentDetails.amount);
    cy.contains('label', /UTR/i).next('input').clear().type(paymentDetails.utr);
    cy.get('input[type="file"]').selectFile(`cypress/fixtures/${paymentDetails.proofFile}`, { force: true });
    cy.contains('button', /Submit|Record Payment/i).click();
  });
  cy.contains(/Payment.*recorded/i, { timeout: 10000 }).should('be.visible');
});