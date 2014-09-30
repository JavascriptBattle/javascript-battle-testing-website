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
        var heroId = this.model.get('battleId');
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
      return 'Error';
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
      while (turnKeeper < 1300) {
        if (gameData.heroTurnIndex === 0) {
          var usersFunction = new Function(move);
          var usersMove = usersFunction(gameData, helpers);
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
      var copiedGame = JSON.parse(JSON.stringify(this.clientSideGame[0]));
      this.gameSet(copiedGame);
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
      if (heroObject.id === 0) {
        heroObject.name = 'YOUR HERO'
      }
      delete heroObject.id;

      var hero = new Hero(heroObject);
      teamYellow.add(hero);
    });
    //add team blue hero Models to team collection
    _.each(gameData.teams[1], function(heroObject){
      heroObject.gameTurn = gameData.turn;
      heroObject.battleId = heroObject.id;
      if (heroObject.id === 0) {
        heroObject.name = 'YOUR HERO'
      }
      delete heroObject.id;

      var hero = new Hero(heroObject);
      teamBlue.add(hero);
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
    var copiedGame = JSON.parse(JSON.stringify(this.clientSideGame[turn]));
    this.gameSet(copiedGame);
  }
});;var GameView = Backbone.View.extend({
  tagName: 'div',
  className: 'outer',
  initialize: function(){
    this.$el.html('<br><div class="centered"><img class="start-screen" src="../../img/start-screen.png"></div>');
    this.model.on('finished', function() {
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
      max: this.model.get('maxTurn'),
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
      //Keeps track of whether we are waiting for the promise
      //to resolve (used to prevent issues with users doubleclicking)
      //the play button
      this.model.updateTurn(currTurn);
      this.sendSliderToTurn(currTurn);
      this.render();
      currTurn++;

      // Hacky solution to fix the rendering bug
      // Backbone could not keep up with rendering all these model changes
      var that = this;
      window.setTimeout(function(){
        that.autoPlayGame();
      }, 300);

      //Updates the slider location to track with the current turn
      // this.sendSliderToTurn(currTurn + 1);

      //Runs this again (will run until no turns are left or
      //until paused)
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
    $.when(this.model.fetch()).then(function() {
      this.render();
    }.bind(this));
  },

  render: function(){
    var html;
    var githubHandle = this.model.get('githubHandle');

    // if logged in
    if(githubHandle) {
      html = new EJS({url: '../ejs_templates/navbar'}).render(this.model);
    } else {
      html = new EJS({url: '../ejs_templates/navbarNotLoggedIn'}).render(this.model);
    }
    
    this.$el.html(html);
  }
});;var RulesView = Backbone.View.extend({
  
  initialize: function(){
    this.waiting = false;
    this.render();
  },

  events: {
    'click .simulate': 'simulate',
    'change #hero': 'getHeroCode'
  },

  simulate: function() {
    this.waiting = true;
    this.render();
    var that = this;
    window.setTimeout(function() {
      that.model.runGame();
      that.waiting = false;
      that.render();
    }, 500);
  },

  render: function(){
    var html = new EJS({url: '/ejs_templates/rules'}).render(this.model);
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
    };
    reader.readAsText(heroCode);

  }


});;var SiteDownView = Backbone.View.extend({

  initialize: function(){
    this.render();
  },

  render: function(){
    var html = '<div class="site-down"><div class="row text-center"><h1 class="col-lg-12">Sorry, something went wrong</h1></div><div class="row"><img class="img-responsive" src="../../img/sad-knight.png"></div><div class="row text-center"><h3 class="col-lg-12">Please check back in a couple hours!</h4></div></div>';

    
    this.$el.html(html);
  }
});;/**
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
});;var User = Backbone.Model.extend({
  
  // give model url attribute for server to handle
  url: '/userInfo',

  // set id attribute so that we can do put requests
  // backbone looks for 'id' otherwise
  idAttribute: '_id'

});;var UserView = Backbone.View.extend({
  
  initialize: function() {
    this.viewing = {};
    this.viewing = "settings";
    this.render();
    // fetch will get object at model's url
    // can use 'parse' as middleware for object
    // jQuery promise
    $.when(this.model.fetch()).then(function() {
      this.render();
    }.bind(this));
  },

  events: {
    'submit': 'handleSubmit',
    'click .settings': 'showSettings',
    'click .recentStats': 'showRecent',
    'click .lifetimeStats': 'showLifetime',
    'click .averageStats': 'showAverage'
  },

  handleSubmit: function(event) {
    event.preventDefault();
    var val = this.$el.find('#inputRepo').val();
    var codeRepo = this.model.get('codeRepo');
    // do not process if an empty string or equal to current code repo
    if (val.length !== 0 && val !== codeRepo) {
      // update the model with the new form data
      // escape the form input for security
      this.model.set('codeRepo', _.escape(val));
      //Save the model
      this.model.save();
      this.render();
      // display form as updated with check mark and green highlight
      this.$el.find(".form-group").addClass("has-success");
      this.$el.find(".form-group").addClass("has-feedback");
    } else {
      // if empty string or equal to current code repo do not display as updated
      this.$el.find(".form-group").removeClass("has-success");
      this.$el.find(".form-group").removeClass("has-feedback");
      // render to get current code repo value displayed rather than empty string
      this.render();
    }
  },

  showSettings: function(event) {
    event.preventDefault();
    this.viewing = "settings";
    this.render();
    this.$el.find('.settings').tab('show');
  },
  
   showRecent: function(event) {
    event.preventDefault();
    this.viewing = "recent";
    this.render();
    this.$el.find('.recentStats').tab('show');
  },

   showLifetime: function(event) {
    event.preventDefault();
    this.viewing = "lifetime";
    this.render();
    this.$el.find('.lifetimeStats').tab('show');
  },

   showAverage: function(event) {
    event.preventDefault();
    this.viewing = "average";
    this.render();
    this.$el.find('.averageStats').tab('show');
  },

  render: function() {
    var githubHandle = this.model.get('githubHandle');
    var html;
    if (githubHandle && this.viewing === "settings") {
      html = new EJS({url: '/ejs_templates/settings'}).render(this.model);
    } else if (githubHandle && this.viewing === 'lifetime') {
      html = new EJS({url: '/ejs_templates/lifetime'}).render(this.model);
    } else if (githubHandle && this.viewing === 'recent') {
      html = new EJS({url: '/ejs_templates/recent'}).render(this.model);
    } else if (githubHandle && this.viewing === 'average') {
      var averageStats = this.model.average();
      averageStats['githubHandle'] = this.model.get('githubHandle');
      html = new EJS({url: '/ejs_templates/average'}).render(averageStats);
    } else if (!githubHandle) {
      html = new EJS({url: '/ejs_templates/notLoggedIn'}).render(this.model);
    }
    this.$el.html(html);
  }

});;var app = {};

app.game = new Game();

var initialGame = require('./game_classes/Game.js');
app.game.clientSideGame[0] = new initialGame(12);

app.game.helpers = require('./helpers.js');

app.gameView = new GameView({ model: app.game });
$('.gamegrid-content').append(app.gameView.$el);

app.user = new User();
app.userView = new UserView({ model: app.user });
$('#join').append(app.userView.$el);

app.navbarView = new NavbarView({ model: app.user });
$('.navbar').append(app.navbarView.$el);

app.rulesView = new RulesView({ model: app.game });
$('#rules').append(app.rulesView.$el);



;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = {};

app.game = new Game();

var initialGame = require('./game_classes/Game.js');
app.game.clientSideGame[0] = new initialGame(12);

app.game.helpers = require('./helpers.js');

app.gameView = new GameView({ model: app.game });
$('.gamegrid-content').append(app.gameView.$el);

app.user = new User();
app.userView = new UserView({ model: app.user });
$('#join').append(app.userView.$el);

app.navbarView = new NavbarView({ model: app.user });
$('.navbar').append(app.navbarView.$el);

app.rulesView = new RulesView({ model: app.game });
$('#rules').append(app.rulesView.$el);




},{"./game_classes/Game.js":4,"./helpers.js":9}],2:[function(require,module,exports){
var Unoccupied = require('./Unoccupied.js');

var Board = function(lengthOfSide) {
  this.tiles = [];
  this.lengthOfSide = lengthOfSide;
  this.initializeBoard();
};

Board.prototype.inspect = function() {
  var horizontalDivide = '|';
  for (var i=0; i<this.lengthOfSide; i++) {
    var line = '|';
    for (var j=0; j<this.lengthOfSide; j++) {
      line += this.tiles[i][j].getCode() + '|';
      if (i === 0) {
        horizontalDivide += '---|';
      }
    }
    if (i === 0) {
      console.log(horizontalDivide);
    }
    console.log(line);
    console.log(horizontalDivide);
  }
  console.log('********');
};

Board.prototype.initializeBoard = function() {
  for (var i=0; i<this.lengthOfSide; i++) {
    this.tiles.push([]);
    for (var j=0; j<this.lengthOfSide; j++) {
      this.tiles[i].push(new Unoccupied(i, j));
    }
  }
};

// Returns false if the given coordinates are out of range
Board.prototype.validCoordinates = function(distanceFromTop, distanceFromLeft) {
  return (!(distanceFromTop < 0 || distanceFromLeft < 0 || 
      distanceFromTop > this.lengthOfSide - 1 || distanceFromLeft > this.lengthOfSide - 1));
}

// Returns the tile [direction] (North, South, East, or West) of the given X/Y coordinate
Board.prototype.getTileNearby = function(distanceFromTop, distanceFromLeft, direction) {
  var fromTopNew = distanceFromTop;
  var fromLeftNew = distanceFromLeft;
  if (direction === 'North') {
    fromTopNew -= 1;
  } else if (direction === 'East') {
    fromLeftNew += 1;
  } else if (direction === 'South') {
    fromTopNew += 1;
  } else if (direction === 'West') {
    fromLeftNew -= 1;
  } else {
    return false;
  }

  if (this.validCoordinates(fromTopNew, fromLeftNew)) {
    return this.tiles[fromTopNew][fromLeftNew];
  } else {
    return false;
  }
};

module.exports = Board;
},{"./Unoccupied.js":8}],3:[function(require,module,exports){
var DiamondMine = function(distanceFromTop, distanceFromLeft) {
  this.id = undefined;

  this.distanceFromTop = distanceFromTop;
  this.distanceFromLeft = distanceFromLeft;

  this.type = 'DiamondMine';
  this.subType = 'DiamondMine';

  this.owner = undefined;
};

DiamondMine.prototype.getCode = function() {
  var idStr = this.id.toString();
  if (idStr.length === 1) {
    idStr = '0' + idStr;
  }
  return 'D' + idStr;
};

DiamondMine.prototype.updateOwner = function(hero) {
  if (this.owner !== undefined) {
    //Removes this mine from the previous owner's array
    this.owner.loseMine(this);
  }

  //Updates the owner to be the new hero
  this.owner = hero;
};

module.exports = DiamondMine;

},{}],4:[function(require,module,exports){
var Board = require('./Board.js');
var Hero = require('./Hero.js');
var DiamondMine = require('./DiamondMine.js');
var Unoccupied = require('./Unoccupied.js');
var Impassable = require('./Impassable.js');
var HealthWell = require('./HealthWell.js');

var DIAMOND_MINE_CAPTURE_DAMAGE = 20;
var HERO_ATTACK_DAMAGE = 20;
var HERO_FOCUSED_ATTACK_DAMAGE = 10;
var HEALTH_WELL_HEAL_AMOUNT = 30;
var HERO_HEAL_AMOUNT = 40;

var Game = function(n) {
  this.board = new Board(n);

  this.heroes = [];
  this.heroTurnIndex = 0;
  this.activeHero = undefined;

  //Defaults to two teams currently
  this.teams = [[],[]];
  this.totalTeamDiamonds = [0,0];

  //General game object info
  this.diamondMines = [];
  this.healthWells = [];
  this.impassables = [];
  this.ended = false;

  //Results
  this.winningTeam = undefined;

  //Messages
  this.diamondMessage = '';
  this.moveMessage = 'Game is about to start';
  this.attackMessage = '';
  this.killMessage = '';

  //Default is 300, can be overwritten
  this.maxTurn = 1300;
  this.turn = 0;

  //Prevents adding of new objects
  //after game has started
  this.hasStarted = false;

  //Used in database retrieval
  this.date;
  this.gameNumber;
};

// Adds a new hero to the board
// but ONLY if the game has not yet
// started
Game.prototype.addHero = function(distanceFromTop, distanceFromLeft, name, team) {
  if (this.hasStarted) {
    throw new Error('Cannot add heroes after the game has started!')
  }

  //Can only add a hero to unoccupied spaces
  if (this.board.tiles[distanceFromTop][distanceFromLeft].type === 'Unoccupied') {
    // Creates new hero object
    var hero = new Hero(distanceFromTop, distanceFromLeft, name, team);

    //First hero added is the active hero
    if (this.heroes.length === 0) {
      this.activeHero = hero;
    }

    // Saves hero id
    hero.id = this.heroes.length;

    // Puts hero on board
    this.board.tiles[distanceFromTop][distanceFromLeft] = hero;

    // Adds hero to game data structure
    this.heroes.push(hero);

    //Assign hero to appropriate team
    this.teams[hero.team].push(hero);

    //Makes it clear adding the hero was a success
    return true;
  } else {
    return false;
  }
};

// Adds a diamond mine to the board
Game.prototype.addDiamondMine = function(distanceFromTop, distanceFromLeft) {
  if (this.hasStarted) {
    throw new Error('Cannot add diamond mines after the game has started!')
  }

  //Can only add a diamond mine to unoccupied spaces
  if (this.board.tiles[distanceFromTop][distanceFromLeft].type === 'Unoccupied') {
    // Creates new diamond mine object
    var diamondMine = new DiamondMine(distanceFromTop, distanceFromLeft);

    // Saves diamondMines id
    diamondMine.id = this.diamondMines.length;

    // Puts diamondMine on board
    this.board.tiles[distanceFromTop][distanceFromLeft] = diamondMine;

    // Adds diamondMine to game data structure
    this.diamondMines.push(diamondMine);
  }
};

// Adds a health well to the board
Game.prototype.addHealthWell = function(distanceFromTop, distanceFromLeft) {
  if (this.hasStarted) {
    throw new Error('Cannot add health wells after the game has started!')
  }

  //Can only add a health well to unoccupied spaces
  if (this.board.tiles[distanceFromTop][distanceFromLeft].type === 'Unoccupied') {
    // Creates new health well object
    var healthWell = new HealthWell(distanceFromTop, distanceFromLeft);

    // Puts healthWell on board
    this.board.tiles[distanceFromTop][distanceFromLeft] = healthWell;

    // Adds healthWell to game data structure
    this.healthWells.push(healthWell);
  }
};

// Adds an impassable (rock, tree, etc) to the board
Game.prototype.addImpassable = function(distanceFromTop, distanceFromLeft) {
  if (this.hasStarted) {
    throw new Error('Cannot add impassables after the game has started!')
  }
  //Can only add an impassable to unoccupied spaces
  if (this.board.tiles[distanceFromTop][distanceFromLeft].type === 'Unoccupied') {
    // Creates new impassable object
    var impassable = new Impassable(distanceFromTop, distanceFromLeft);

    // Puts impassable on board
    this.board.tiles[distanceFromTop][distanceFromLeft] = impassable;

    // Adds impassable to game data structure
    this.impassables.push(impassable);
  }
};

// Resolves the hero's turn:
// 1) The active hero earns diamonds from each mine they own
//    at the start of their turn
// 2) Moves the active hero in the direction specified
Game.prototype.handleHeroTurn = function(direction) {
  if (this.ended) {
    return;
  }

  //Clear past messages
  this.diamondMessage = '';
  this.moveMessage = '';
  this.attackMessage = '';
  this.killMessage = '';

  this.hasStarted = true;

  var hero = this.activeHero;

  // Only resolves the turn if the hero is not dead
  if (!hero.dead) {
    //Used to determine which hero is "active" at each point in the game on the front-end
    hero.lastActiveTurn = this.turn;

    // Gives the hero diamonds for each owned mine
    this._handleHeroEarnings(hero);

    // Attempts to move the hero in the direction indicated
    this._handleHeroMove(hero, direction);

    // If hero died during this move phase...
    if (hero.dead) {
      // Remove hero from board
      this.heroDied(hero);

    // If hero is still alive after moving...
    } else {
      
      // Resolves all damage given and healing received at the
      // end of the hero's turn
      this._resolveHeroAttacks(hero);
    }
  } else {
    throw new Error('Dead heroes should never even have turns!');
  }

  //Increment the game turn and update the active hero
  this._incrementTurn();

  //Checks whether the game is over

  //Exceeded maximum turns
  if (this.turn >= this.maxTurn) {
    this.ended = true;
    var teamDiamonds0 = this._teamDiamonds(this.teams[0]);
    var teamDiamonds1 = this._teamDiamonds(this.teams[1]);
    if (teamDiamonds1 > teamDiamonds0) {
      this.winningTeam = 1;
    } else {
      this.winningTeam = 0;
    }
  //Team 0 are all dead
  } else if (this._teamIsDead(this.teams[0])) {
    this.winningTeam = 1;
    this.maxTurn = this.turn;
    this.ended = true;

  //Team 1 are all dead
  } else if (this._teamIsDead(this.teams[1])) {
    this.winningTeam = 0;
    this.maxTurn = this.turn;
    this.ended = true;
  }

  //Save the win or loss directly on the hero objects
  if (this.ended) {
    for (var i=0; i<this.heroes.length; i++) {
      var hero = this.heroes[i];
      if (hero.team === this.winningTeam) {
        hero.won = true;
      } else {
        hero.won = false;
      }
    }
  }
};


// Resolve diamond mine earnings
Game.prototype._handleHeroEarnings = function(hero) {
  if (hero.mineCount > 0) {
    this.diamondMessage = hero.name + ' got ' + hero.mineCount + ' diamonds from his mines';
  } else {
    this.diamondMessage = hero.name + ' owns no mines, and got no diamonds';
  }
  this.totalTeamDiamonds[hero.team] += hero.mineCount;
  hero.diamondsEarned += hero.mineCount;
};

// Attempt to move hero in the direction indicated
Game.prototype._handleHeroMove = function(hero, direction) {
  this.moveMessage = hero.name + ' walked ' + direction;

  // Gets the tile at the location that the hero wants to go to
  var tile = this.board.getTileNearby(hero.distanceFromTop, hero.distanceFromLeft, direction);

  // If tile is not on the board (invalid coordinates), don't move
  if (tile === false) {
    this.moveMessage += '...and realized that wasn\'t possible';
    return;

  // If tile is unoccupied, move into that tile
  } else if (tile.type === 'Unoccupied') {

    // Make the soon-to-be vacated tile "unoccupied"
    this.board.tiles[hero.distanceFromTop][hero.distanceFromLeft] =
        new Unoccupied(hero.distanceFromTop, hero.distanceFromLeft);

    //Check whether the hero robbed a grave, if so give credit
    if (tile.subType === 'Bones') {
      hero.gravesRobbed++;
    }

    // Update hero location (in hero)
    hero.distanceFromTop = tile.distanceFromTop;
    hero.distanceFromLeft = tile.distanceFromLeft;

    // Update hero location (on board)
    this.board.tiles[hero.distanceFromTop][hero.distanceFromLeft] = hero;

  // If tile is a diamond mine, the mine is captured, but the hero stays put
  } else if (tile.type === 'DiamondMine') {
    var diamondMine = tile;

    // Hero attempts to capture mine
    hero.captureMine(diamondMine, DIAMOND_MINE_CAPTURE_DAMAGE);

    // If capturing the mine takes the hero to 0 HP, he dies
    if (hero.dead) {
      this.heroDied(hero);
      this.moveMessage += ', tried to capture a diamond mine, but died';
      return;

    // If he survives, he is now the owner of the mine
    } else {
      this.moveMessage += ' and is now the proud owner of diamond mine #' + diamondMine.id;
      diamondMine.owner = hero;
    }
  // Running into a health well will heal a certain amount of damage
  } else if (tile.type === 'HealthWell') {
    this.moveMessage += ', drank from a health well, and now feels MUCH better';
    hero.healDamage(HEALTH_WELL_HEAL_AMOUNT);

  // Running into another hero will either heal them (same team) or hurt them (opposing team)
  } else if (tile.type === 'Hero') {
    var otherHero = tile;

    // Running directly into an enemy hero will deal extra damage
    if (otherHero.team !== hero.team) {
      this.moveMessage += ', and stabbed ' + otherHero.name + ' for extra damage';
      hero.damageDone += otherHero.takeDamage(HERO_FOCUSED_ATTACK_DAMAGE);

    // Running directly into a friendly hero will give the friendly hero health
    } else {
      this.moveMessage += ', and healed ' + otherHero.name;
      hero.healthGiven += otherHero.healDamage(HERO_HEAL_AMOUNT);
    }
  }
};

Game.prototype._resolveHeroAttacks = function(hero) {

  // Resolve Attacks and Healing (if any):
  var directions = [
    'North',
    'East',
    'South',
    'West',
  ];

  // Loop through all tiles around the hero
  for (var i=0; i<directions.length; i++) {
    var tile = this.board.getTileNearby(hero.distanceFromTop, hero.distanceFromLeft, directions[i]);
    if (tile === false) {

      // Does nothing if the tile in the given direction
      // Is not on the board
    } else if (tile.type === 'Hero') {

      // from the check above, we know 'tile' points to a hero object
      var otherHero = tile;

      // Only damage heroes that are not on your team

      if (otherHero.team !== hero.team) {

        // Update the attack message
        if (this.attackMessage === '') {
          this.attackMessage = hero.name + ' stabbed ' + otherHero.name;
        } else {
          this.attackMessage += ' and ' + otherHero.name;
        }

        // Our hero (whose turn it is) will auto-hit any heroes in range,
        // so this other hero that is one space away will take damage
        hero.damageDone += otherHero.takeDamage(HERO_ATTACK_DAMAGE);
        if (otherHero.dead) {

          // Remove dead hero from the board
          this.heroDied(otherHero);

          // Tell our hero he killed someone
          hero.killedHero(otherHero);

          this.killMessage = hero.name + ' killed ' + otherHero.name + '!';
        }
      }
    }
  }
};

Game.prototype._teamDiamonds = function(teamArray) {
  var diamonds = 0;
  for (var i=0; i<teamArray.length; i++) {
    diamonds += teamArray[i].diamondsEarned;
  }
  return diamonds;
};

Game.prototype._teamIsDead = function(teamArray) {
  for (var i=0; i<teamArray.length; i++) {
    if (!teamArray[i].dead) {
      return false;
    }
  }
  return true;
};

Game.prototype._incrementTurn = function() {

  //Used to determine whose turn it is
  var incrementHeroTurnIndex = function() {
    this.heroTurnIndex++;

    //If you reach the end of the hero list, start again
    if (this.heroTurnIndex >= this.heroes.length) {
      this.heroTurnIndex = 0;
    }
  }.bind(this);

  //Goes to next hero
  incrementHeroTurnIndex();

  //Make sure the next active hero is alive
  while (this.heroes[this.heroTurnIndex].dead) {
    incrementHeroTurnIndex();
  }

  //Set the active hero (the hero whose turn is next)
  this.activeHero = this.heroes[this.heroTurnIndex];

  //Increment the turn
  this.turn++;
};

// Removes a dead hero from the board
Game.prototype.heroDied = function(hero) {

  // Removes a dead hero from the board
  top = hero.distanceFromTop;
  left = hero.distanceFromLeft;
  var bones = new Unoccupied(top, left);
  bones.subType = 'Bones';
  // this.board.tiles[top][left] = bones;
};

module.exports = Game;

},{"./Board.js":2,"./DiamondMine.js":3,"./HealthWell.js":5,"./Hero.js":6,"./Impassable.js":7,"./Unoccupied.js":8}],5:[function(require,module,exports){
var HealthWell = function(distanceFromTop, distanceFromLeft) {
  this.distanceFromTop = distanceFromTop;
  this.distanceFromLeft = distanceFromLeft;

  this.type = 'HealthWell';
  this.subType = 'HealthWell';

};

HealthWell.prototype.getCode = function() {
  return 'WWW';
};

module.exports = HealthWell;
},{}],6:[function(require,module,exports){
var Hero = function(distanceFromTop, distanceFromLeft, name, team) {
  this.id = undefined;

  // Location
  this.distanceFromTop = distanceFromTop;
  this.distanceFromLeft = distanceFromLeft;

  // Mines
  this.minesOwned = {};
  this.mineCount = 0;
  this.minesCaptured = 0;

  // Health
  this.health = 100;
  this.dead = false;

  // Stats
  this.diamondsEarned = 0;
  this.damageDone = 0;
  this.heroesKilled = [];
  this.lastActiveTurn = 0;
  this.gravesRobbed = 0;
  this.healthRecovered = 0;
  this.healthGiven = 0;

  // Results
  this.won = false;

  // General
  this.type = 'Hero';
  if (team === 0) {
    this.subType = 'BlackKnight';
  } else {
    this.subType = 'Adventurer';
  }
  this.team = team;

  //Personal
  this.name = name;
};

Hero.prototype.killedHero = function(otherHero) {
  this.heroesKilled.push(otherHero.id);
};

// Handles any situation in which the hero takes damage
// Returns the actual amount of damage taken
Hero.prototype.takeDamage = function(amount) {
  this.health -= amount;
  if (this.health <= 0) {
    this.dead = true;
    
    // Only return the damage actually needed
    // to kill this hero
    return amount + this.health;
  }

  // Return all the damage taken
  return amount;
};

// Handles any situation in which the hero heals damage
Hero.prototype.healDamage = function(amount) {
  var startingHealth = this.health;

  this.health += amount;
  if (this.health > 100) {
    this.health = 100;
  }

  //Stores stats
  var healthReceived = this.health - startingHealth;
  this.healthRecovered += healthReceived;

  //Returns the amount healed
  return healthReceived;
};

// Take control of a diamond mine
Hero.prototype.captureMine = function(diamondMine, healthCost) {
  // Make sure mine is not already owned
  if (this.minesOwned.hasOwnProperty(diamondMine.id)) {
    // If so, do nothing
  } else {
    this.takeDamage(healthCost);

    if (!this.dead) {
      // Add this mine to mines owned
      //(only stores id to prevent circular logic when saving to Mongo)
      this.minesOwned[diamondMine.id] = diamondMine.id;
      this.mineCount++;
      this.minesCaptured++;

      //Switch the diamond mine's owner to be this hero
      diamondMine.updateOwner(this);
    }
  }
};

// Lose control of a diamond mine
Hero.prototype.loseMine = function(diamondMine) {
  // If this hero actually owns the given mine
  if (this.minesOwned.hasOwnProperty(diamondMine.id)) {
    // Lose control of the mine
    this.mineCount--;
    delete this.minesOwned[diamondMine.id];
  }
};


Hero.prototype.getCode = function() {
  var idStr = this.id.toString();
  if (idStr.length === 1) {
    idStr = '0' + idStr;
  }
  return 'H' + idStr;
};

module.exports = Hero;
},{}],7:[function(require,module,exports){
var Impassable = function(distanceFromTop, distanceFromLeft) {
  this.id = undefined;
  this.type = 'Impassable';
  this.subType = 'Tree';
  this.distanceFromTop = distanceFromTop;
  this.distanceFromLeft = distanceFromLeft;
};

Impassable.prototype.getCode = function() {
  return 'III';
};

module.exports = Impassable;

},{}],8:[function(require,module,exports){
var Unoccupied = function(distanceFromTop, distanceFromLeft) {
  this.type = "Unoccupied";
  this.subType = "Unoccupied";
  this.distanceFromTop = distanceFromTop;
  this.distanceFromLeft = distanceFromLeft;
};

Unoccupied.prototype.getCode = function() {
  return '   ';
};

module.exports = Unoccupied;
},{}],9:[function(require,module,exports){
var helpers = {};

// Returns false if the given coordinates are out of range
helpers.validCoordinates = function(board, distanceFromTop, distanceFromLeft) {
  return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
      distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
};

// Returns the tile [direction] (North, South, East, or West) of the given X/Y coordinate
helpers.getTileNearby = function(board, distanceFromTop, distanceFromLeft, direction) {

  // These are the X/Y coordinates
  var fromTopNew = distanceFromTop;
  var fromLeftNew = distanceFromLeft;

  // This associates the cardinal directions with an X or Y coordinate
  if (direction === 'North') {
    fromTopNew -= 1;
  } else if (direction === 'East') {
    fromLeftNew += 1;
  } else if (direction === 'South') {
    fromTopNew += 1;
  } else if (direction === 'West') {
    fromLeftNew -= 1;
  } else {
    return false;
  }

  // If the coordinates of the tile nearby are valid, return the tile object at those coordinates
  if (helpers.validCoordinates(board, fromTopNew, fromLeftNew)) {
    return board.tiles[fromTopNew][fromLeftNew];
  } else {
    return false;
  }
};

// Returns an object with certain properties of the nearest object we are looking for
helpers.findNearestObjectDirectionAndDistance = function(board, fromTile, tileCallback) {
  // Storage queue to keep track of places the fromTile has been
  var queue = [];

  //Keeps track of places the fromTile has been for constant time lookup later
  var visited = {};

  // Variable assignments for fromTile's coordinates
  var dft = fromTile.distanceFromTop;
  var dfl = fromTile.distanceFromLeft;

  // Stores the coordinates, the direction fromTile is coming from, and it's location
  var visitInfo = [dft, dfl, 'None', 'START'];

  //Just a unique way of storing each location we've visited
  visited[dft + '|' + dfl] = true;

  // Push the starting tile on to the queue
  queue.push(visitInfo);

  // While the queue has a length
  while (queue.length > 0) {

    // Shift off first item in queue
    var coords = queue.shift();

    // Reset the coordinates to the shifted object's coordinates
    var dft = coords[0];
    var dfl = coords[1];

    // Loop through cardinal directions
    var directions = ['North', 'East', 'South', 'West'];
    for (var i = 0; i < directions.length; i++) {

      // For each of the cardinal directions get the next tile...
      var direction = directions[i];

      // ...Use the getTileNearby helper method to do this
      var nextTile = helpers.getTileNearby(board, dft, dfl, direction);

      // If nextTile is a valid location to move...
      if (nextTile) {

        // Assign a key variable the nextTile's coordinates to put into our visited object later
        var key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;

        var isGoalTile = false;
        try {
          isGoalTile = tileCallback(nextTile);
        } catch(err) {
          isGoalTile = false;
        }

        // If we have visited this tile before
        if (visited.hasOwnProperty(key)) {

          //Do nothing--this tile has already been visited

        //Is this tile the one we want?
        } else if (isGoalTile) {

          // This variable will eventually hold the first direction we went on this path
          var correctDirection = direction;

          // This is the distance away from the final destination that will be incremented in a bit
          var distance = 1;

          // These are the coordinates of our target tileType
          var finalCoords = [nextTile.distanceFromTop, nextTile.distanceFromLeft];

          // Loop back through path until we get to the start
          while (coords[3] !== 'START') {

            // Haven't found the start yet, so go to previous location
            correctDirection = coords[2];

            // We also need to increment the distance
            distance++;

            // And update the coords of our current path
            coords = coords[3];
          }

          //Return object with the following pertinent info
          return {
            direction: correctDirection,
            distance: distance,
            coords: finalCoords
          };

          // If the tile is unoccupied, then we need to push it into our queue
        } else if (nextTile.type === 'Unoccupied') {

          queue.push([nextTile.distanceFromTop, nextTile.distanceFromLeft, direction, coords]);

          // Give the visited object another key with the value we stored earlier
          visited[key] = true;
        }
      }
    }
  }

  // If we are blocked and there is no way to get where we want to go, return false
  return false;
};

// Returns the direction of the nearest non-team diamond mine or false, if there are no diamond mines
helpers.findNearestNonTeamDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
    if (mineTile.type === 'DiamondMine') {
      if (mineTile.owner) {
        return mineTile.owner.team !== hero.team;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }, board);

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the nearest unowned diamond mine or false, if there are no diamond mines
helpers.findNearestUnownedDiamondMine = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile) {
    if (mineTile.type === 'DiamondMine') {
      if (mineTile.owner) {
        return mineTile.owner.id !== hero.id;
      } else {
        return true;
      }
    } else {
      return false;
    }
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the nearest health well or false, if there are no health wells
helpers.findNearestHealthWell = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(healthWellTile) {
    return healthWellTile.type === 'HealthWell';
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the direction of the nearest enemy with lower health
// (or returns false if there are no accessible enemies that fit this description)
helpers.findNearestWeakerEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team && enemyTile.health < hero.health;
  });

  //Return the direction that needs to be taken to achieve the goal
  //If no weaker enemy exists, will simply return undefined, which will
  //be interpreted as "Stay" by the game object
  return pathInfoObject.direction;
};

// Returns the direction of the nearest enemy
// (or returns false if there are no accessible enemies)
helpers.findNearestEnemy = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile) {
    return enemyTile.type === 'Hero' && enemyTile.team !== hero.team
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

// Returns the direction of the nearest friendly champion
// (or returns false if there are no accessible friendly champions)
helpers.findNearestTeamMember = function(gameData) {
  var hero = gameData.activeHero;
  var board = gameData.board;

  //Get the path info object
  var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(heroTile) {
    return heroTile.type === 'Hero' && heroTile.team === hero.team;
  });

  //Return the direction that needs to be taken to achieve the goal
  return pathInfoObject.direction;
};

module.exports = helpers;

},{}]},{},[1]);
