var NavbarView = Backbone.View.extend({

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
        '<a class="navbar-brand" href="#page-top">Javascript Battle</a>' +
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
});