const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    specPattern: 'e2e/fanatics/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'support/e2e.js',
    fixturesFolder: '../fixtures',
    excludeSpecPattern: [
      'e2e/1-getting-started/**',
      'e2e/2-advanced-examples/**'
    ],
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})