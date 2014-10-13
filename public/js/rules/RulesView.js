var RulesView = Backbone.View.extend({

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
                '<li>Upload your hero.js file below.</li>' +
                '<li>Your hero\'s code will be run through a simulation game in your browser.*</li>' +
                '<li>Open up your console to see what move your hero made on his/her turn.</li>' +
                '<li>When the simulation is complete, you can watch the game below.</li>' +
                '<li>After viewing your simulated battle, feel free to make any changes you need and repeat these steps until you are satisfied with you hero\'s performance.</li>' +
                '<li>Good luck in tomorrow\'s battle!</li>' +
              '</ul>' +
            '</ul>' +
            '* Your code will be run in your browser and not on our server, so it would be easy to cheat here. Just know those tricks won\'t work in the real game!' +
            '<br>* Also note that the heroes in the simulation will be choosing directions randomly, so they will not be as smart as your opponents in the real game. The ability to choose enemy AI types in the simulation is coming soon!' +
          '</div>' +
        '</div>' +
        '<br>' +
        '<br>' +
        '<div class="centered">' +
          '<input type="file" id="hero" title="Upload hero.js here">' +
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

  }


});