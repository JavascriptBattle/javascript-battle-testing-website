var RulesView = Backbone.View.extend({
  
  initialize: function(){
    this.viewing = {};
    this.viewing = "rules";
    this.render();
  },

  events: {
    'click .rules': 'showRules',
    'change #hero': 'getHeroCode',
    'change #helper': 'getHelperCode'
  },

  showRules: function(event) {
    event.preventDefault();
    this.viewing = "rules";
    this.render();
    $('.rules').tab('show');
  },

  render: function(){
    var html;
    if(this.viewing === "rules") {
      html = new EJS({url: '/ejs_templates/rules'}).render(this.model);
    } 
    this.$el.html(html);
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