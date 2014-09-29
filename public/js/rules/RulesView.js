var RulesView = Backbone.View.extend({
  
  initialize: function(){
    this.viewing = "rules";
    this.waiting = false;
    this.render();
  },

  events: {
    'click .rules': 'showRules',
    'click .simulate': 'showWaiting',
    'change #hero': 'getHeroCode'
  },

  showRules: function(event) {
    event.preventDefault();
    this.viewing = "rules";
    this.render();
    $('.rules').tab('show');
  },

  showWaiting: function() {
    if (this.model.runGame() === 'Stop') {
      alert('Please upload your Hero.js file first.');
    } else {
      this.model.runGame();
      this.waiting = true;
      this.render();
    }
  },

  render: function(){
    var html;
    var simulationHtml = '<button class="btn btn-success btn-lg">Simulate Game</button>';
    var waitingHtml = '<button class="btn btn-danger btn-lg">Waiting for Simulation to Finish</button>';
    if(this.viewing === "rules") {
      html = new EJS({url: '/ejs_templates/rules'}).render(this.model);
    }
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


});