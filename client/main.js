///////////////////////////////////////////////////////////////////////////////
// Router

Router.configure({
  layoutTemplate: 'layout',
  // loadingTemplate: 'loading'
});

Router.map(function () {
  this.route('home', {
    path: '/',
    before: function () {
      Session.set("spinId", null);
    }
  });

  this.route('yarns', {
    path: '/:spinId',
    layoutTemplate: 'yarnsLayout',
    // yieldTemplates: {
    //   'yarnForm': {to: 'header'},
    //   'yarnList': {to: 'list'}
    // },
    waitOn: function () {
      var spinId = this.params.spinId;
      return Meteor.subscribe('yarns', spinId);
    },
    action: function () {
      this.render('yarnForm', {to: 'header'}); 
      
      if (this.ready()) {
        this.render('yarnList', {to: 'list'});
      } else {
        this.render('yarnListLoading', {to: 'list'});
      }
    },
    data: function () {
      return {
        spinId: this.params.spinId
      }
    }
  });
});

///////////////////////////////////////////////////////////////////////////////
// Meteor Startup

Meteor.subscribe("yarnCount");

Meteor.startup(function () {
  console.log("++ Starting Yarn");
});

///////////////////////////////////////////////////////////////////////////////
// Common Functions

showTip = function (type, field) {
  var currentTip = Session.get("tip"),
      currentType = currentTip ? currentTip.type : null,
      currentField = currentTip ? currentTip.field : null,
      tip = "";

  if (type === "too long") {
    tip = "Stop! The '" + field + "' field is too long!";
  }

  Session.set("tip", {
    text: tip,
    type: type,
    field: field
  });
};
