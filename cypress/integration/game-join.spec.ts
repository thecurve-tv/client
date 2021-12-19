import mongo from '../fixtures/mongo-test-data.json'

describe('Game Join', () => {
  beforeEach(() => cy.clearGames())

  it('allows join game', () => {
    cy.execGraphql({
      query: `mutation {
        gameStart(
          hostPlayerName: "e2e-test-p1-host"
          maxPlayerCount: 4
          duration: 10800000
        ) {
          game {
            _id
          }
        }
      }`,
      account: mongo.accounts[1]
    }).then(({ body }) => {
      const gameId = body.data.gameStart.game._id
      return cy.visit(`/game/${gameId}/join`)
    })
    cy.get('.accept').click()
    cy.get('[formControlName="name"]').type('e2e-test-p2')
    cy.get('[type="submit"]').click()
    cy.wait(1000)
    cy.url().should('match', new RegExp('/game/\\w+/room$'))
  })
})
