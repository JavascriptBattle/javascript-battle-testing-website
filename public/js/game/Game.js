
var Game = Backbone.Model.extend({

  clientSideGame: {},

  runGame: function() {
    var result = $('#file-upload').val();
    console.log(open(result));
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
    //add team yellow hero Models to team collection
    _.each(this.clientSideGame[turnNumber].teams[0], function(heroObject){
      heroObject.gameTurn = this.clientSideGame[turnNumber].turn;
      heroObject.battleId = heroObject.id;
      delete heroObject.id;

      var hero = new Hero(heroObject);
      teamYellow.add(hero);
    });
    //add team blue hero Models to team collection
    _.each(this.clientSideGame[turnNumber].teams[1], function(heroObject){
      heroObject.gameTurn = this.clientSideGame[turnNumber].turn;
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
  },
  updateTurn: function(turn) {
    return this.clientSideGame[turn];
  }
});