var app = {};

app.game = new Game();

var initialGame = require('./game_classes/Game.js');
app.game.clientSideGame[0] = new initialGame(12);

app.game.helpers = require('./helpers.js');

app.gameView = new GameView({ model: app.game });
$('.gamegrid-content').append(app.gameView.$el);

app.navbarView = new NavbarView({ model: app.user });
$('.navbar').append(app.navbarView.$el);

app.rulesView = new RulesView({ model: app.game });
$('#rules').append(app.rulesView.$el);