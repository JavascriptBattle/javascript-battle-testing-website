var Board = Backbone.Collection.extend({
  model: BoardTile
});;var BoardTile = Backbone.Model.extend({
});;var BoardTileView = Backbone.View.extend({
  tagName: 'div',
  className: 'battle-tile',
  initialize: function() {
    if (this.model === undefined) {
      console.log(undefined);
    }
    this.render();
    this.model.on('change', this.render());
  },
  render: function() {
    var subType = this.model.get('subType');
    var type = this.model.get('type');
    var teamId = this.model.get('team');
    if (subType !== 'Unoccupied') {
      var assets = {
        Tree: '../img/tree.png',
        Adventurer: '../img/bkknight.png',
        BlackKnight: '../img/black-knight.png',
        DiamondMine: '../img/diamond.png',
        HealthWell: '../img/pot.png',
        Bones: '../img/grave.png'
      };
      var html = '<img src="' + assets[subType] + '" class="sprite">';
        var colors = {
          0: "team-yellow",
          1: "team-blue"
        };
      if (type === 'Hero') {
        var name = this.model.get('name');
        var heroId = this.model.get('battleId') || 'YOU';
        var HP = this.model.get('health');
        var gameTurn = this.model.get('gameTurn');
        var lastActiveTurn = this.model.get('lastActiveTurn');
        if(lastActiveTurn === (gameTurn - 1) && gameTurn !== 1){
          this.$('.sprite').addClass('current-turn');
        }
        html = '<img src="' + assets[subType] + '" id="H' + heroId +'" class="sprite">';
        
        html += '<span class="indicator ' + colors[this.model.get('team')] +'">' + heroId + '</span>';
        html += '<span class="lifebar"><span class="life-capacity" style="height:' + HP + '%"></span></span>';
        this.$el.addClass('current-user-' + name);
      } else if (type === 'DiamondMine') {
        var owner = this.model.get('owner');
        if (owner) {
          html += '<span class="indicator ' + colors[owner.team] +'">' + owner.id + '</span>';
        } 
      }
      this.$el.html(html);
    }
  }
});;var BoardView = Backbone.View.extend({
  tagName: 'section',
  className: 'battle-map',
  initialize: function() {
    this.render()
  },
  render: function() {
    this.$el.html('');
    this.createBoardView();
  },
  createBoardView: function() {
    var boardLength = this.collection.lengthOfSide;
    for(var i = 0; i < boardLength; i++){
      var $tr = $('<div class="tile-row">');
    	for(var j = 0; j < boardLength; j++){
        var tileView = new BoardTileView({
    			model: this.collection.at(i * boardLength + j)          
    		});
    	  $tr.append(tileView.$el);
    	}
    	this.$el.append($tr);
    }
  }
});
;
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
    for (var i=0; i<game.heroes.length; i++) {
      game.heroes[i].move = game.heroes[i].getMove().move;
      game.heroes[i].name = game.heroes[i].getMove().aiType;
    }

  },

  runGame: function() {
    if (this.get('heroCode') === undefined) {
      alert('Please upload your Hero.js file first.');
      return 'Error';
    } else {
      this.waiting = true;

      var gameData = owl.deepCopy(this.clientSideGame['setup']);

      var move = this.get('heroCode');
      var end = move.indexOf('module.exports = move;', move.length - 25);
      move = move.slice(0, end);
      move += "\n return move(arguments[0], arguments[1]);";
      move = new Function(move);

      var helpers = this.helpers;
      var usersHelpers = helpers;
      var usersHelpersCode = this.get('helpersCode');
      if (usersHelpersCode) {
        end = usersHelpersCode.indexOf('module.exports = helpers;', usersHelpersCode.length - 25);
        usersHelpersCode = usersHelpersCode.slice(0, end);
        usersHelpersCode += '\n return helpers;';
        usersHelpers = (new Function(usersHelpersCode))();
      }

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
          var usersMove = move(gameData, usersHelpers);
          handleHeroTurn.call(gameData, usersMove);
          this.clientSideGame[turnKeeper] = JSON.parse(JSON.stringify(gameData));
          console.log('----------');
          console.log('Turn number: ', (gameData.turn - 1));
          console.log('Your hero ' + gameData.moveMessage.slice(7));
          console.log('**********');
        } else {
          var botsFunction = gameData.activeHero.move;
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
;var GameView = Backbone.View.extend({
  tagName: 'div',
  className: 'outer',
  initialize: function(){
    this.$el.html('<br><div class="centered"><img class="start-screen" src="../../img/start-screen.png"></div>');
    console.log('Welcome to the hero tester!!!');
    this.model.on('finished', function() {
      console.log('Simulation finished.');
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
;var NavbarView = Backbone.View.extend({

  initialize: function(){
    this.render();
  },

  render: function(){
    var html;

    html = '' +
    '<div class="container">' +
      '<div class="navbar-header page-scroll">' +
        '<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">' + 
          '<span class="sr-only">Toggle navigation</span>' +
          '<span class="icon-bar"></span>' +
          '<span class="icon-bar"></span>' +
          '<span class="icon-bar"></span>' +
        '</button>' + 
        '<a class="navbar-brand" href="#page-top">JS Battle Code Tester</a>' +
      '</div>' +
    
      '<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">' +
        '<ul class="nav navbar-nav navbar-right">' +
          '<li class="hidden">' +
            '<a href="#page-top"></a>' +
          '</li>' +
          '<li class="page-scroll">' +
            '<a href="#rules">Instructions</a>' +
          '</li>' +
          '<li class="page-scroll">' +
            '<a href="#replay">Battle</a>' +
          '</li>' +
        '</ul>' +
      '</div>' +
    '</div>'
    
    this.$el.html(html);
  }
});;var RulesView = Backbone.View.extend({

  initialize: function(){
    this.waiting = false;
    this.render();
  },

  events: {
    'click .simulate': 'simulate',
    'change #hero': 'getHeroCode',
    'change #helpers': 'getHelpersCode'
  },

  simulate: function() {
    this.waiting = true;
    this.render();
    console.log('Starting simulation...');
    var that = this;
    window.setTimeout(function() {
      that.model.runGame();
      that.waiting = false;
      that.render();
    }, 300);
  },

  render: function(){
    var html = '' +
      '<div class="container">' +
        '<div class="row">' +
          '<div class="col-lg-12 text-center">' +
            '<h2>Instructions</h2>' +
            '<hr class="star-primary">' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="col-lg-8 col-lg-offset-2 text-center info-header">' +
            'Want to see how youre hero might perform in tomorrow\'s battle? Follow the instructions below to test your hero code right here, right now.' +
          '</div>' +
        '</div>' +
        '<div class="row nav-buttons">' +
          '<div class="col-lg-8 btn-group btn-group-justified">' +
            '<div class="active rules btn-group">' +
              '<button type="button" class="btn btn-secondary" disabled>Instructions</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="row">' +
          '<div class="col-lg-8 col-lg-offset-2">' +
            '<ul class="info-list">' +
              '<ul class="rules-list">' +
                '<li>Upload your hero.js and helpers.js files below.</li>' +
                '<li>Your hero\'s code will be run through a simulation game in your browser.*</li>' +
                '<li>Open up your console to see what move your hero made on his/her turn.</li>' +
                '<li>When the simulation is complete, you can watch the game below.</li>' +
                '<li>After viewing your simulated battle, feel free to make any changes you need and repeat these steps until you are satisfied with you hero\'s performance.</li>' +
                '<li>Good luck in tomorrow\'s battle!</li>' +
              '</ul>' +
            '</ul>' +
            '* Your code will be run in your browser and not on our server, so it would be easy to cheat here. Just know those tricks won\'t work in the real game!' +
            '<br>* Also note that the hero types in the simulation will be chosen randomly. The ability to choose enemy AI types in the simulation is coming soon!' +
          '</div>' +
        '</div>' +
        '<br>' +
        '<br>' +
        '<div class="centered">' +
          '<input type="file" id="hero" title="Upload hero.js here">' +
        '</div>' +
        '<br>' +
        '<div class="centered text-center small">' +
          '<small>(optional)</small>' +
          '<br>' +
          '<input type="file" id="helpers" title="Upload helpers.js here">' +
        '</div>' +
        '<br>' +
        '<br>' +
        '<div class="centered simulate">' +
        '</div>' +
        '<script>' +
          '$("input[type=file]").bootstrapFileInput();' +
        '</script>' +
      '</div>';

    var simulationHtml = '<button class="btn btn-success btn-lg">Simulate Game</button>';
    var waitingHtml = '<button class="btn btn-danger btn-lg">Waiting for Simulation to Finish</button>';

    this.$el.html(html);

    if (!this.waiting) {
      this.$el.find('.simulate').html(simulationHtml);
    }
    if (this.waiting) {
      this.$el.find('.simulate').html(waitingHtml);
    }
  },

  getHeroCode: function() {
    var reader = new FileReader();
    var heroCode = this.$el.find('#hero')[0].files[0];
    var that = this;
    reader.onload = function(e) {
      that.model.set('heroCode', reader.result);
      console.log('Hero code has been saved.\nNo need to re-upload, unless you have changed your file.');
    };
    reader.readAsText(heroCode);

  },

  getHelpersCode: function() {
    var reader = new FileReader();
    var helpersCode = this.$el.find('#helpers')[0].files[0];
    var that = this;
    reader.onload = function(e) {
      that.model.set('helpersCode', reader.result);
      console.log('Helpers code has been saved.\nNo need to re-upload, unless you have changed your file.');
    };
    reader.readAsText(helpersCode);

  }


});
;/**
 * cbpAnimatedHeader.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
var cbpAnimatedHeader = (function() {

	var docElem = document.documentElement;
	var header = document.querySelector( '.navbar-fixed-top' );
	var didScroll = false;
	var changeHeaderOn = 300;

	function init() {
		window.addEventListener( 'scroll', function( event ) {
			if( !didScroll ) {
				didScroll = true;
				setTimeout( scrollPage, 250 );
			}
		}, false );
	}

	function scrollPage() {
	  var options = document.querySelector('.user-options');
		var sy = scrollY();
		if ( sy >= changeHeaderOn ) {
			classie.add( header, 'navbar-shrink' );
			if(options){
        classie.add( options, 'user-options-shrink');
			}
		}
		else {
			classie.remove( header, 'navbar-shrink' );
			if(options){
        classie.remove( options, 'user-options-shrink');
			}
		}
		didScroll = false;
	}

	function scrollY() {
		return window.pageYOffset || docElem.scrollTop;
	}

	init();

})();
;/*!
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false */

( function( window ) {

'use strict';

// class helper functions from bonzo https://github.com/ded/bonzo

function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

// classList support for class management
// altho to be fair, the api sucks because it won't accept multiple classes at once
var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {
  // full names
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  // short names
  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( classie );
} else {
  // browser global
  window.classie = classie;
}

})( window );
;/*!
 * Start Bootstrap - Freelancer Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('.page-scroll a').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Floating label headings for the contact form
$(function() {
    $("body").on("input propertychange", ".floating-label-form-group", function(e) {
        $(this).toggleClass("floating-label-form-group-with-value", !! $(e.target).val());
    }).on("focus", ".floating-label-form-group", function() {
        $(this).addClass("floating-label-form-group-with-focus");
    }).on("blur", ".floating-label-form-group", function() {
        $(this).removeClass("floating-label-form-group-with-focus");
    });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top'
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});;var Hero = Backbone.Model.extend({
});;var HeroView = Backbone.View.extend({
  className: 'list-group-item list-group-item-info score-info',
  tagName: 'li',
  initialize: function() {
    this.render();
  },
  render: function() {
    var heroId = this.model.get('battleId');
    var health = this.model.get('health');
    var name = this.model.get('name');
    var turn = this.model.get('gameTurn');
    var currentTurn = this.model.get('lastActiveTurn');

    if(health < 1){
      this.$el.removeClass('list-group-item-info').addClass('list-group-item-danger');
      health = 'Dead';
    } else{
      health =  health + 'HP';
    }
    var heroName = '<div class="hero-header h-i' + heroId + '">(id:' + heroId + ') ' + 
        '<span>' + name + '</span>' + ' </div>'
    var health = '<div class="health-info h-i' + heroId + '">' + health + '</div>';
    this.$el.append(heroName + health);
  }
});;var Team = Backbone.Collection.extend({
  model: Hero
});;var TeamView = Backbone.View.extend({
  className: 'list-group',
  tagName: 'div',
  teamColor: undefined,
  initialize: function(){
    // this.render();
  },
  render: function() {
    this.$el.html('');
    if(this.teamColor){
      this.$el.append('<h5 class="team-name">' + this.teamColor + ' diamonds: ' + this.diamonds + '</h5>');
    }
    this.createTeamView();
  },
  createTeamView: function() {
    _.each(this.collection.models, function(hero){
      var heroView = new HeroView({
        model: hero
      });
      this.$el.append(heroView.$el);
    }.bind(this));
  }
});