var RulesView = Backbone.View.extend({
  
  initialize: function(){
    this.viewing = {};
    this.viewing = "rules";
    console.log(this.model)
    this.render();
  },

  events: {
    'click .rules': 'showRules',
    'change #hero': 'getFiles',
    'click #helper': 'getOther'
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

  getFiles: function() {
    var reader = new FileReader();
    var file = this.$el.find('#hero')[0].files[0];
    var that = this;
    reader.onload = function(e) {
      that.model.set('heroCode', reader.result);
    };
    reader.readAsText(file);

  },

  getOther: function() {
    console.log(this.model.get('heroCode'));
  }


});