var GameView = Backbone.View.extend({
  tagName: 'div',
  className: 'outer',
  initialize: function(){
    this.$el.html('<br><div class="centered"><img class="start-screen" src="../../img/start-screen.png"></div>');
    console.log('Welcome to the hero tester!!!');
    this.model.on('finished', function() {
      console.log('Simulation finished.\nYour hero\'s move will be logged as the game plays.');
      this.paused = true;
      this.playInProgress = false;
      this.sliderInitialized = false; 
      this.$el.html('<div class="messages"></div>' + '<div class="row map"></div>');
      this.$el.append('<input class="row slider" />' +
                      '</div>');
      this.$el.append('<div class="row play-controls">' +
                        '<span class="play-pause-game glyphicon glyphicon-play">' +
                        '</span>' +
                        '<span class="restart-game glyphicon glyphicon-repeat">' +
                        '</span>' +
                      '</div>');
      this.$el.append('<span class="turn"></span>');
      this.render();
    }, this);
  },
  events: {
    'click .play-pause-game': 'togglePlayGame',
    'click .restart-game': 'restartGame'
  },
  render: function(){
    this.checkWinner();
    this.initializeSlider();
    var $gameHtml = this.$el.find('.map');
    $gameHtml.html('');
    //Show game update messages
    $('.messages').text('');
    $('.messages').append(this.model.get('killMessages'));
       //Add html for team info
    var yellowTeamView = new TeamView({
      collection: this.model.get('teamYellow'),
      className: 'team-info t-yellow',
    });
    yellowTeamView.teamColor = 'Team Yellow';
    yellowTeamView.diamonds = this.model.get('teamDiamonds')[0];
    yellowTeamView.render();
    var blueTeamView = new TeamView({
      collection: this.model.get('teamBlue'),
      className: 'team-info t-blue'
    });
    blueTeamView.teamColor = 'Team Blue';
    blueTeamView.diamonds = this.model.get('teamDiamonds')[1];
    blueTeamView.render();
    var boardView = new BoardView({collection: this.model.get('board')});
    //Add all board html
    $gameHtml.append(yellowTeamView.$el);
    $gameHtml.append(boardView.$el);
    $gameHtml.append(blueTeamView.$el);
    this.$el.find('#H0').after('<span class="arrow"></span>');
    this.$el.find('.turn').text('Turn: ' + this.model.get('turn'));
  },

  sendSliderToTurn: function(turn) {
    //The "track" the sword slides along
    var $rangeBar = this.$el.find('.range-bar');

    //The sword element
    var $rangeHandle = $rangeBar.find('.range-handle');

    //The "filled-in" left-hand side of the track
    var $rangeQuantity = $rangeBar.find('.range-quantity')

    //Calculate how far into the game we are
    var maxTurn = this.model.get('maxTurn');
    var percentageComplete = turn / maxTurn;


    var convertCssLengthToNumber = function(str) {
      return +(str.slice(0,-2));
    };

    //Calculate where to put the slider and slider quantity
    var totalWidth = convertCssLengthToNumber($rangeBar.css('width'));
    var handleWidth = convertCssLengthToNumber($rangeHandle.css('width'));
    var actualWidth = totalWidth - handleWidth;
    var newHandleLocation = percentageComplete * actualWidth;

    //Put the range handle and range quantity in the correct location
    $rangeHandle.css('left', newHandleLocation + 'px');
    $rangeQuantity.css('width', newHandleLocation + 'px');
  },
  initializeSlider: function() {
    //Only run this function once...this ensures that
    if (!this.sliderInitialized) {
      this.sliderInitialized = true;
    } else {
      return;
    }

    //Get slider
    var $slider = this.$el.find('.slider');
    var slider = $slider[0];

    var maxTurn = this.model.get('maxTurn');

    //Initialize new slider and set it to update
    //the turn on slide
    var init = new Powerange(slider, {
      min: 0,
      max: maxTurn,
      step: 1,
      callback: function() {
        //Pause the game
        this.pauseGame();

        //Slider value will range from the min to max
        this.model.updateTurn(slider.value);
        this.render();

      }.bind(this)
    });

    //Allows users to change the turn with arrow keys
    $(document).keydown(function(e) {
      //Updates the turn
      var turn = this.model.get('turn') - 1;
      var maxTurn = this.model.get('maxTurn');
      if (e.which === 39) {
        turn++;
      } else if (e.which === 37) {
        turn--;
      } else {
        //does nothing
        return;
      }

      //Will only get here if an arrow key is pressed
      //Pauses the game, then goes to the turn specified
      this.pauseGame();


      //Adjusts the turn, but doesn't go below 0 or above the max turn
      var newTurn = Math.max(Math.min(turn, maxTurn),1);

      //Updates the model
      this.model.updateTurn(newTurn);
      console.log(this.model.get('board'));

      //Send slider to new location
      this.sendSliderToTurn(newTurn);
      this.render();

    }.bind(this));
  },
  restartGame: function() {
    this.pauseGame();

    //Send slider and game to turn 0
    this.model.updateTurn(0);
    this.sendSliderToTurn(0);
    this.render();
  },
  pauseGame: function() {
    this.paused = true;

    //Change pause button to a play button
    var $playPause = this.$el.find('.play-pause-game');
    $playPause.removeClass('glyphicon-pause');
    $playPause.addClass('glyphicon-play');
  },
  togglePlayGame: function() {
    this.paused = !this.paused;
    var $playPause = this.$el.find('.play-pause-game');
    if (this.paused) {
      //Change pause button to a play button
      $playPause.removeClass('glyphicon-pause');
      $playPause.addClass('glyphicon-play');
    } else {
      //Change play button to a pause button
      $playPause.removeClass('glyphicon-play');
      $playPause.addClass('glyphicon-pause');

      //Start auto-playing the game
      this.autoPlayGame();
    }
  },
  autoPlayGame: function() {
    //Store the current turn and the turn at which
    //the game will end
    var currTurn = this.model.get('turn');

    var maxTurn = this.model.get('maxTurn');

    //If the game is not yet over, go to next turn
    if (currTurn < maxTurn && this.paused === false) {
      
      this.model.updateTurn(currTurn);
      this.sendSliderToTurn(currTurn);
      this.render();
      currTurn++;

      // Hacky solution to fix the rendering bug
      // Backbone could not keep up with rendering all these model changes  
      var that = this;
      window.setTimeout(function(){
        that.autoPlayGame();
      }, 100);

    }  
  },
  checkWinner: function() {
    var winner = this.model.get('winningTeam'); 
    var message = $('.winner-msg');
    if (winner === 0) {
      message.text('Yellow Team Wins!');
    } else if (winner === 1) {
      message.text('Blue Team Wins!');

    } else {
      message.text('Simulated Game');
    }
  }
});
