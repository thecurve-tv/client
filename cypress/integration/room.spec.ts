import mongo from '../fixtures/mongo-test-data.json'

type Player = { _id: string, name: string, account: typeof mongo.accounts[0] }
const chatCoolDownInterval = 2000

describe('Game Room', () => {
  let gameId: string
  let player1AkaHost: Player
  let player2AkaMe: Player
  let player3: Player
  let player4: Player
  let chats: { [key: string]: { _id: string, name: string } }

  beforeEach(() => {
    // p2 has to use account[0] because the client app assumes you are account[0]
    // account overrides can only be done during execGraphql(), not when using the app as a black-box
    player1AkaHost = { _id: '', name: 'e2e-test-p1', account: mongo.accounts[1] }
    player2AkaMe = { _id: '', name: 'e2e-test-p2', account: mongo.accounts[0] }
    player3 = { _id: '', name: 'e2e-test-p3', account: mongo.accounts[2] }
    player4 = { _id: '', name: 'e2e-test-p4', account: mongo.accounts[3] }
    chats = {}

    cy.clearGames()
    // Start a new game
    cy.execGraphql({
      query: `mutation {
        gameStart(
          hostPlayerName: "${player1AkaHost.name}"
          maxPlayerCount: 4
          duration: 10800000
        ) {
          game {
            _id
          }
          hostPlayer {
            _id
          }
          chat {
            _id
            name
          }
        }
      }`,
      account: player1AkaHost.account
    }).then(({ body }) => {
      gameId = body.data.gameStart.game._id
      player1AkaHost._id = body.data.gameStart.hostPlayer._id
      chats.main = body.data.gameStart.chat

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
          account: player.account
        }).then(({ body }) => {
          player._id = body.data.gameJoin.player._id
        })
      }
      makePlayerJoinGame(player3)
        .then(() => makePlayerJoinGame(player4))
        .then(() => {
          // Join the game
          cy.visit(`/game/${gameId}/join`)
          cy.get('.accept').click()
          cy.get('[formControlName="name"]').type(player2AkaMe.name)
          cy.get('[type="submit"]').click()
          cy.wait(1000)
        })
    })
  })

  describe('Bio', () => {
    beforeEach(() => {
      cy.get('[e2e-id="btnSwitchToBioFrame"]').click()
    })

    it('shows player names', () => {
      // 3 players. (1 host,) 1 other, & me
      cy.get('.shortcut').should('have.length', 3)
    })

    it('shows a player\'s info', () => {
      cy.get('.shortcut').contains(player3.name).click()
      cy.get('.name-text').should('contain.text', player3.name)
      cy.get('[e2e-id="btnChangePhoto"]').should('not.exist')
    })

    it('allows edit bio', () => {
      cy.get('.shortcut').contains(player2AkaMe.name).click()
      cy.get('[e2e-id="btnChangePhoto"]').should('exist')
      // Name field
      cy.get('[formControlName="name"]').clear()
      cy.get('[e2e-id="lblNameInvalid"]').should('exist')
      cy.get('[formControlName="name"]').type('123456789012345678901') // > 20 chars
      cy.get('[e2e-id="lblNameInvalid"]').should('exist')
      cy.get('[formControlName="name"]').clear().type(player2AkaMe.name)
      cy.get('[e2e-id="lblNameInvalid"]').should('not.exist')
      // Age field
      cy.get('[formControlName="age"]').clear()
      cy.get('[e2e-id="lblAgeInvalid"]').should('exist')
      cy.get('[formControlName="age"]').type('12') // < 13
      cy.get('[e2e-id="lblAgeInvalid"]').should('exist')
      cy.get('[formControlName="age"]').clear().type('13')
      cy.get('[e2e-id="lblAgeInvalid"]').should('not.exist')
      // Job field
      cy.get('[formControlName="job"]').clear()
      cy.get('[e2e-id="lblJobInvalid"]').should('exist')
      cy.get('[formControlName="job"]').type('123456789012345678901') // > 20 chars
      cy.get('[e2e-id="lblJobInvalid"]').should('exist')
      cy.get('[formControlName="job"]').clear().type('12345678901234567890')
      cy.get('[e2e-id="lblJobInvalid"]').should('not.exist')
      // Bio field
      cy.get('[formControlName="bio"]').clear()
      cy.get('[e2e-id="lblBioInvalid"]').should('exist')
      let bio = ''
      for (let i = 1; i <= 1001; ++i) bio += '.'
      cy.get('[formControlName="bio"]').type(bio) // > 1000 chars
      cy.get('[e2e-id="lblBioInvalid"]').should('exist')
      cy.get('[formControlName="bio"]').clear().type(bio.substring(1))
      cy.get('[e2e-id="lblBioInvalid"]').should('not.exist')
    })

    it('allows start chat', () => {
      cy.window().then(win => {
        cy.stub(win, 'prompt').returns('chatWithP3')
      })
      cy.get('.shortcut').contains(player3.name).click()
      cy.get('[e2e-id="btnStartChat"]').click()
      cy.get('[e2e-id="btnPopupConfirm"]').click()
      cy.get('[e2e_chat_id]').then($e => {
        const chatId = $e.attr('e2e_chat_id')
        testSendingAndReceivingMessages(chatId)
      })
    })
  })

  describe('Chat', () => {
    beforeEach(() => {
      cy.get('[e2e-id="btnSwitchToChatFrame"]').click()
    })

    it('allows global chat', () => testSendingAndReceivingMessages(chats.main._id))
  })

  function testSendingAndReceivingMessages(chatId: string) {
    cy.wait(chatCoolDownInterval)
    cy.get('[formControlName="message"]').type('Hii\n')
    cy.get('.message').contains('Hii').should('exist')
    cy.wait(chatCoolDownInterval)
    cy.execGraphql({
      query: `mutation {
          chatSendMessage(
            chatId: "${chatId}"
            message: "Hello from p3!"
          ) {
            sentTime
          }
        }`,
      account: player3.account
    }).then(({ body }) => {
      if (body.errors) console.error(body.errors)
      expect(body.errors).to.be.undefined
      cy.get('.message').contains('Hello from p3!').should('exist')
    })
  }
})
