var NavbarView = Backbone.View.extend({

  initialize: function(){
    this.render();
  },

  render: function(){
    var html;

    html = new EJS({url: '../ejs_templates/navbarNotLoggedIn'}).render(this.model);
    
    this.$el.html(html);
  }
});