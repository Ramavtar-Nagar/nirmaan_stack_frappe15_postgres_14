import { defineConfig } from "cypress";

export default defineConfig({
  env: {

    // Admin Login Credentials
    admin_Login_Email: "Administrator",
    admin_Login_Password: "avisekkr",

    // Procurement Login Credentials
    procurement_Login_Email: "sowmya@nirmaan.app",
    procurement_Login_Password: "sowmyat.94",

    // Accounts Login Credentials
    accounts_Login_Email: "romi@nirmaan.app",
    accounts_Login_Password: "romisharma4",
   
  },

  e2e: {
    
    setupNodeEvents(on, config) {
      // CreatING a variable to hold our PR number in the Node process
      let prNumber: string | null = null;

      on('task', {
        // Task to set the PR number
        setPrNumber(value: string) {
          prNumber = value;
          return null;
        },
        // Task to get the PR number
        getPrNumber() {
          return prNumber;
        },
      });

      // It's important to return the config object
      return config;
    },
    
    baseUrl: 'http://localhost:8080',
    viewportHeight: 1080,
    viewportWidth: 1920,
  },
});
