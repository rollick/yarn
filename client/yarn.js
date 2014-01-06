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

///////////////////////////////////////////////////////////////////////////////
// Common Helpers

Handlebars.registerHelper("spinReady", function() {
  return !!Session.get("spinId");
});

Handlebars.registerHelper("appVersion", function() {
  return App.version;
});

Handlebars.registerHelper("yarnCount", function() {
  return YarnCount.findOne();
});

///////////////////////////////////////////////////////////////////////////////
// Main

Template.home.events({
  'click .create .inner': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    var spinId = Meteor.uuid().match(/([a-z|0-9]{8})-/)[1];
    Session.set("spinId", spinId);

    Router.go("/" + spinId);
  }
});

///////////////////////////////////////////////////////////////////////////////
// Yarn Form

Template.yarnForm.helpers({
  tip: function () {
    return Session.get("tip");
  },
  hasTip: function () {
    return false;  //Session.get("tip") ? true : false;
  }
});

Template.yarnForm.events({
  'click .action.home': function () {
    event.stopPropagation();
    event.preventDefault();

    Router.go('/');
  },
  'keyup .yarn-form': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    Session.set("tip", null);

    var spinId = Session.get("spinId"),
        who = template.find('.who input'),
        what = template.find('.what input'),
        why = template.find('.why input');

    if (spinId && event.keyCode === 13 &&
        !!who.value && !!what.value && !!why.value) {
      
      var date = new Date(),
          epoch = date.getTime() / 1000;

      Yarns.insert({
        spinId: spinId,
        who: who.value,
        what: what.value,
        why: why.value,
        created: epoch
      });

      who.value = what.value = why.value = "";
      who.focus();
    } else if (who.value.length > 20) {
      showTip("too long", "As");
    }
  }
});

///////////////////////////////////////////////////////////////////////////////
// Yarn List

Template.yarnList.helpers({
  yarns: function () {
    return Yarns.find({spinId: this.spinId});
  }
})

Template.yarnList.rendered = function () {
  $('.yarns').sortable({
    handle: '.handle'
  });
};

///////////////////////////////////////////////////////////////////////////////
// Yarn

Template.yarn.created = function () {
  var self = this;
  
  self._saveYarn = function () {
    var who = self.find('.who .text'),
        what = self.find('.what .text'),
        why = self.find('.why .text');

    Yarns.update({_id: self.data._id}, {
      $set: {
        who: who.innerText,
        what: what.innerText,
        why: why.innerText
      }
    }, {multi: false});
  };
},

Template.yarn.events({
  'focus .text': function (event, template) {
    $(template.find('.save')).show();
  },
  'focus .text': function (event, template) {
    $(template.find('.save')).show();
  },
  'keydown .text': function (event, template) {
    if(event.keyCode === 27 || event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();

      $(event.target).blur();

      if (event.keyCode === 13) {
        template._saveYarn();
        $(template.find('.save')).hide();
      }

    }
  },
  'click .save': function (event, template) {
    event.stopPropagation();
    event.preventDefault();
    
    template._saveYarn();

    $(event.target).blur();
    $(template.find('.save')).hide();
  },
  'click .remove': function (event, template) {
    if (event.target.className.match(/ready/))
      Yarns.remove(template.data._id);
    else {
      var target = event.target;
      target.className = "remove ready";

      setTimeout(function (){
        target.className = "remove";
      }, 3000)
    }
  }
});