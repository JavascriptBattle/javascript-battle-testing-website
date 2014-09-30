
var Game = Backbone.Model.extend({

  clientSideGame: {},

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
    } else {
      this.waiting = true;

      var move = this.get('heroCode');
      var start = move.indexOf('module.exports = move');
      move = move.slice(0, move.length - 26);
      move += "return move(arguments[0], arguments[1]);";

      var helpers = this.helpers;

      var gameData = this.clientSideGame[0];
      this.setupGame(gameData, gameData.board.lengthOfSide);
      var handleHeroTurn = gameData.handleHeroTurn;
      var turnKeeper = 0;
      console.log(gameData);
      while (gameData.turn < gameData.maxTurn) {
        if (gameData.heroTurnIndex === 0) {
          var usersFunction = new Function(move);
          var usersMove = usersFunction(gameData, helpers);
          console.log(usersMove);
          handleHeroTurn.call(gameData, usersMove);
          var newGameData = JSON.parse(JSON.stringify(gameData));
          this.clientSideGame[turnKeeper] = newGameData;
        } else {
          var choices = ['North', 'South', 'East', 'West'];
          handleHeroTurn.call(gameData, choices[Math.floor(Math.random()*4)]); 
          var newGameData = JSON.parse(JSON.stringify(gameData));
          this.clientSideGame[turnKeeper] = newGameData;
        }
        turnKeeper++;
      }
      this.gameSet(this.clientSideGame[0]);
      this.trigger('finished');
    }
  },

  initialize: function() {
    var userModel = new User();
    this.set('userModel', userModel);
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
      delete heroObject.id;

      if (gameData.turn === 0) {
        var hero = new Hero(heroObject);
        teamYellow.add(hero);
      }
    });
    //add team blue hero Models to team collection
    _.each(gameData.teams[1], function(heroObject){
      heroObject.gameTurn = gameData.turn;
      heroObject.battleId = heroObject.id;
      delete heroObject.id;

      if (gameData.turn === 0) {
        var hero = new Hero(heroObject);
        teamBlue.add(hero);
      }
    });

    

    _.each(_.flatten(gameData.board.tiles), function(tileObject, key, list) {
      //The id from our game model was overwriting 
      tileObject.battleId = tileObject.id;
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
    // this.set('board', gameModel);
  }
});