
describe('Dashboard', () => {
  beforeEach(() => {
    cy.clearGames().visit('/dashboard')
  })

  function startGame() {
    cy.get('.new-game').click()
    cy.get('[formControlName="numPlayers"]').clear().type('4')
    cy.get('[formControlName="hostName"]').type('e2e-test')
    cy.get('[e2e-id="btnStartGame"]').click()
    cy.wait(1000)
    cy.url().should('match', new RegExp('/game/\\w+/room$'))
  }

  it('allows start game', () => {
    startGame()
  })

})
