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


});