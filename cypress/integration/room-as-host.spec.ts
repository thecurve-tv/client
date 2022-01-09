import mongo from '../fixtures/mongo-test-data.json'

type Player = { _id: string, name: string, account: typeof mongo.accounts[0] }

describe("Game Room from Host's perspective", () => {
  let gameId: string
  let player1AkaMeAkaHost: Omit<Player, '_id'>
  let player2: Player
  let player3: Player
  let player4: Player

  beforeEach(() => {
    player1AkaMeAkaHost = { name: 'e2e-test-p1', account: mongo.accounts[0] }
    player2 = { _id: '', name: 'e2e-test-p2', account: mongo.accounts[1] }
    player3 = { _id: '', name: 'e2e-test-p3', account: mongo.accounts[2] }
    player4 = { _id: '', name: 'e2e-test-p4', account: mongo.accounts[3] }

    cy.clearGames()
    // Start a new game
    cy.visit('/dashboard')
    cy.get('.new-game').click()
    cy.get('[formControlName="numPlayers"]').clear().type('4')
    cy.get('[formControlName="hostName"]').type(player1AkaMeAkaHost.name)
    cy.get('[e2e-id="btnStartGame"]').click()
    cy.get('[e2e-id="btnSwitchToChatFrame"]') // wait for room to load

    cy.url().then(url => {
      const gameIdStart = url.indexOf('/game/') + 6
      const gameIdEnd = gameIdStart + url.substring(gameIdStart).indexOf('/')
      gameId = url.substring(gameIdStart, gameIdEnd)

      // Make other players join the game
      const makePlayerJoinGame = (player: Player) => {
        return cy.execGraphql({
          query: `mutation {
            gameJoin(
              _id: "${gameId}"
              playerName: "${player.name}"
            ) {
              player {
                _id
              }
            }
          }`,
          account: player.account,
        }).then(({ body: { data, errors } }) => {
          expect(errors, JSON.stringify(errors, null, 2)).equal(undefined)
          player._id = data.gameJoin.player._id
        })
      }
      makePlayerJoinGame(player2)
        .then(() => makePlayerJoinGame(player3))
        .then(() => makePlayerJoinGame(player4))
    })
  })

  describe('Ranking', () => {
    beforeEach(() => {
      cy.get('[e2e-id="btnSwitchToRankingFrame"]').click()
    })

    function putRatings(rankingId: string, rater: Player, ratedPlayer1: Player, ratedPlayer2: Player) {
      return cy.execGraphql({
        query: `mutation {
          rankingPutRatings(
            _id: "${rankingId}"
            ratings: [
              {
                player: "${ratedPlayer1._id}",
                position: 1
              },
              {
                player: "${ratedPlayer2._id}",
                position: 2
              }
            ]
          )
        }`,
        account: rater.account,
      }).then(({ body: { errors } }) => {
        expect(errors, JSON.stringify(errors, null, 2)).equal(undefined)
      })
    }

    it('allows start ranking', () => {
      cy.get('.ratings').should('not.exist')
      cy.get('[e2e-id="btnStartRanking"]').click()
      cy.get('.ratings').should('exist')
    })

    it('shows ratings as they come', () => {
      cy.get('[e2e-id="btnStartRanking"]').click()
      cy.get('.ratings').then($ratings => {
        const rankingId = $ratings[0]['e2e-data']
        putRatings(rankingId, player2, player3, player4)
        cy.get('.rating').should('have.length', 2)
        putRatings(rankingId, player3, player2, player4)
        cy.get('.rating').should('have.length', 3)
        putRatings(rankingId, player4, player2, player3)
        cy.get('.rating').should('have.length', 3)
      })
    })

    it('shows ties', () => {
      cy.get('[e2e-id="btnStartRanking"]').click()
      cy.get('.ratings').then($ratings => {
        const rankingId = $ratings[0]['e2e-data']
        putRatings(rankingId, player2, player3, player4)
        putRatings(rankingId, player3, player2, player4)
        // players 2 & 3 are tied in 1st place
        cy.get('.rating .position').should('have.length', 3)
        cy.get('.rating .position:contains(1)').should('have.length', 2)
        cy.get('.rating .position:contains(2)').should('have.length', 0)
        cy.get('.rating .position:contains(3)').should('have.length', 1)
      })
    })
  })
})