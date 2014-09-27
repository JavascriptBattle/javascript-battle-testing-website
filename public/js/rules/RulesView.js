var RulesView = Backbone.View.extend({
  
  initialize: function(){
    this.viewing = {};
    this.viewing = "rules";
    this.render();
  },

  events: {
    'click .rules': 'showRules'
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
  }


});