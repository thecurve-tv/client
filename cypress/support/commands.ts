// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
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
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
declare namespace Cypress {
  interface Chainable<Subject> {
    clearGames(): Chainable<Response<any>>
    execGraphql(options: { query: string, account?: {} }): Chainable<Response<any>>
  }
}

Cypress.Commands.add('clearGames', () => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('api_host')}/_test/clearGames`,
    body: { accountIds: ['61bcd4891ebdaeee02eb0288', '61bd51b3c418923bb7d87fce'] }
  })
})
Cypress.Commands.add('execGraphql', ({ query, account }) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('api_host')}/_test/execGraphql`,
    body: {
      request: {
        query
      },
      account
    }
  })
})
