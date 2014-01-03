Yarns = new Meteor.Collection('yarns');

if (Meteor.isClient) {
  Meteor.startup(function () {
    Deps.autorun(function (computation) {
      Meteor.subscribe("yarns", Session.get("spinId"));
    });
  });

  showTip = function (type, field) {
    var currentTip = Session.get("tip"),
        currentType = currentTip.type,
        currentField = currentTip.field,
        tip = "";

    if (type === "too long") {
      tip = "Stop! The '" + field + "' field is too long!";
    }

    Session.set("tip", {
      text: tip,
      type: type,
      field: field
    });
  }

  Handlebars.registerHelper("spinReady", function() {
    return !!Session.get("spinId");
  });

  ///////////////////////////////////////////////////////////////////////////////
  // Main

  Template.main.events({
    'click .create .inner': function (event, template) {
      event.stopPropagation();
      event.preventDefault();

      var spinId = Meteor.uuid().match(/([a-z|0-9]{8})-/)[1];
      Session.set("spinId", spinId);

      window.location.pathname = "/" + spinId;
    }
  });

  Template.main.created = function () {
    var spinId = window.location.pathname.match(/\/([a-z|0-9]{8})/);
    if (spinId) {
      Session.set("spinId", spinId[1]);
    } else {
      Session.set("spinId", null);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////
  // Yarns

  Template.yarns.yarns = function () {
    return Yarns.find({}, {sort: {created: -1}});
  };

  Template.yarns.helpers({
    tip: function () {
      return Session.get("tip");
    },
    hasTip: function () {
      return Session.get("tip") ? true : false;
    }
  })

  Template.yarns.events({
    'click .home': function () {
      event.stopPropagation();
      event.preventDefault();

      window.location.pathname = "/";
    },
    'keyup .yarn-form': function (event, template) {
      event.stopPropagation();
      event.preventDefault();

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
        Session.set("tip", "Stop! You are doing it wrong! Use a shorter 'As'.")
      }
    }
  });

  ///////////////////////////////////////////////////////////////////////////////
  // Yarn
  
  Template.yarn.events({
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
}

if (Meteor.isServer) {
  Meteor.publish("yarns", function (spinId) {
    check(spinId, String);

    return Yarns.find({spinId: spinId});
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
