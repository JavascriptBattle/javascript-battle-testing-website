
var Game = Backbone.Model.extend({

  clientSideGame: {},

  helpers: {},

  setupGame: function(game, boardSize) {
    var randomNumber = function(max) {
      return Math.floor(Math.random()*max);
    };

    for (var i=0; i<12; i++) {
      while (!game.addHero(randomNumber(boardSize), randomNumber(boardSize), 'random', 0)) {
        //Loops until each hero is successfully added
      }
    }

    for (var i=0; i<12; i++) {
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

    var maxTurn = 2000;
    game.maxTurn = maxTurn;
  },

  runGame: function() {
    var move = this.get('heroCode');
    var start = move.indexOf('module.exports = move');
    move = move.slice(0, move.length - 23);

    var helpers = this.helpers;
    console.log(eval(move + 'move({}, helpers)'));
  },

  initialize: function() {
    var userModel = new User();
    this.set('userModel', userModel);
  },
  
  gameSet: function(turnNumber) {
    this.set('turn', this.clientSideGame[turnNumber].turn);
    this.set('maxTurn', this.clientSideGame[turnNumber].maxTurn);
    this.set('moveMessages', this.clientSideGame[turnNumber].moveMessage);
    this.set('winningTeam', this.clientSideGame[turnNumber].winningTeam);
    this.set('attackMessages', this.clientSideGame[turnNumber].attackMessage);
    this.set('killMessages', this.clientSideGame[turnNumber].killMessage);
    this.set('teamDiamonds', this.clientSideGame[turnNumber].totalTeamDiamonds);
    var teamYellow = new Team();
    var teamBlue = new Team();
    var board = new Board();

    board.lengthOfSide = this.clientSideGame[turnNumber].board.lengthOfSide;
    this.setupGame(this.clientSideGame[turnNumber], board.lengthOfSide);
    //add team yellow hero Models to team collection
    _.each(this.clientSideGame[turnNumber].teams[0], function(heroObject, key, col){
      heroObject.gameTurn = turnNumber;
      heroObject.battleId = heroObject.id;
      delete heroObject.id;

      var hero = new Hero(heroObject);
      teamYellow.add(hero);
    });
    //add team blue hero Models to team collection
    _.each(this.clientSideGame[turnNumber].teams[1], function(heroObject){
      heroObject.gameTurn = turnNumber;
      heroObject.battleId = heroObject.id;
      delete heroObject.id;

      var hero = new Hero(heroObject);
      teamBlue.add(hero);
    });

    

    _.each(_.flatten(this.clientSideGame[turnNumber].board.tiles), function(tileObject, key, list) {
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
  }
});