var app = {};

app.game = new Game();
app.gameView = new GameView({ model: app.game });
$('.gamegrid-content').append(app.gameView.$el);

app.user = new User();
app.userView = new UserView({ model: app.user });
$('#join').append(app.userView.$el);

app.navbarView = new NavbarView({ model: app.user });
$('.navbar').append(app.navbarView.$el);

app.rulesView = new RulesView({ model: app.user });
$('#rules').append(app.rulesView.$el);

var testGame = require('./game_classes/Game.js');
var testing = new testGame(12);
console.log(testing)
