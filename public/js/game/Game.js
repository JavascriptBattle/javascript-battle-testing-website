
var Game = Backbone.Model.extend({

  clientSideGame: {
    played: false
  },

  helpers: {},

  setupGame: function(game, boardSize) {
    var randomNumber = function(max) {
      return Math.floor(Math.random()*max);
    };

    for (var i=0; i<8; i++) {
      while (!game.addHero(randomNumber(boardSize), randomNumber(boardSize), 'random', 0)) {
        //Loops until each hero is successfully added
      }
    }

    for (var i=0; i<8; i++) {
      while (!game.addHero(randomNumber(boardSize), randomNumber(boardSize), 'random', 1)) {
        //Loops until each hero is successfully added
      }
    }
    for (var i=0; i<6; i++) {
      game.addHealthWell(randomNumber(boardSize), randomNumber(boardSize));
    }
    for (var i=0; i<18; i++) {
      game.addImpassable(randomNumber(boardSize), randomNumber(boardSize));
    }
    for (var i=0; i<12; i++) {
      game.addDiamondMine(randomNumber(boardSize), randomNumber(boardSize));
    }

  },

  runGame: function() {
    if (this.get('heroCode') === undefined) {
      alert('Please upload your Hero.js file first.');
      return 'Error';
    } else {
      this.waiting = true;

      var move = this.get('heroCode');
      var end = move.indexOf('module.exports = move;', move.length - 25);
      move = move.slice(0, end);
      move += "\n return move(arguments[0], arguments[1]);";

      var helpers = this.helpers;
      var gameData = owl.deepCopy(this.clientSideGame['setup']);

      if (!this.clientSideGame.played) {
        this.setupGame(gameData, gameData.board.lengthOfSide);
      } else {
        console.clear();
        for (var key in this.clientSideGame) {
          if (key !== 'setup' && key !== 'played') {
            delete this.clientSideGame[key];
          }
        }
        this.setupGame(gameData, gameData.board.lengthOfSide);
      }

      var handleHeroTurn = gameData.handleHeroTurn;
      var turnKeeper = 0;

      while (gameData.ended === false || turnKeeper < 1010) {
        if (gameData.activeHero.id === 0) {
          var usersFunction = new Function(move);
          var usersMove = usersFunction(gameData, helpers);
          handleHeroTurn.call(gameData, usersMove);
          this.clientSideGame[turnKeeper] = JSON.parse(JSON.stringify(gameData));
          console.log('----------');
          console.log('Turn number: ', (gameData.turn - 1));
          console.log('Your hero ' + gameData.moveMessage.slice(7));
          console.log('**********');
        } else {
          var botsFunction = new Function(gameData.activeHero.move)
          var botsMove = botsFunction(gameData, helpers);
          handleHeroTurn.call(gameData, botsMove);
          this.clientSideGame[turnKeeper] = JSON.parse(JSON.stringify(gameData));
        }
        var max = turnKeeper;
        turnKeeper++;
      }
      this.clientSideGame.played = true;
      this.set('maxTurn', max);
      this.trigger('finished');
    }
  },

  initialize: function() {

  },

  gameSet: function(gameData) {
    this.set('turn', gameData.turn);
    this.set('maxTurn', gameData.maxTurn);
    this.set('moveMessages', gameData.moveMessage);
    this.set('winningTeam', gameData.winningTeam);
    this.set('attackMessages', gameData.attackMessage);
    this.set('killMessages', gameData.killMessage);
    this.set('teamDiamonds', gameData.totalTeamDiamonds);
    var teamYellow = new Team();
    var teamBlue = new Team();
    var board = new Board();

    board.lengthOfSide = gameData.board.lengthOfSide;

    //add team yellow hero Models to team collection
    _.each(gameData.teams[0], function(heroObject, key, col){
      heroObject.gameTurn = gameData.turn;
      heroObject.battleId = heroObject.id;
      if (heroObject.battleId === 0 || heroObject.battleId === 'YOU') {
        heroObject.name = 'YOUR HERO';
      }

      var hero = new Hero(heroObject);
      teamYellow.add(hero);
    });
    //add team blue hero Models to team collection
    _.each(gameData.teams[1], function(heroObject, key, col){
      heroObject.gameTurn = gameData.turn;
      heroObject.battleId = heroObject.id;
      if (heroObject.battleId === 0) {
        heroObject.name = 'YOUR HERO';
      }

      var hero = new Hero(heroObject);
      teamBlue.add(hero);
    });


    _.each(_.flatten(gameData.board.tiles), function(tileObject, key, list) {
      //The id from our game model was overwriting
      tileObject.battleId = tileObject.id || tileObject.battleId;
      delete tileObject.id;
      tileObject.gameTurn = this.get('turn');
      var tile = new BoardTile(tileObject);
      board.add(tile);

    }.bind(this));
    this.set('teamYellow', teamYellow);
    this.set('teamBlue', teamBlue);
    this.set('board', board);
  },

  updateTurn: function(turn) {
    this.gameSet(this.clientSideGame[turn]);
  }
});
