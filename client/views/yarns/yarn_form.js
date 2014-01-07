
///////////////////////////////////////////////////////////////////////////////
// Yarn Form

Template.yarnForm.rendered = function () {
  var self = this;

  // add some hotkeys
  key('n', function() {
    event.stopPropagation();
    event.preventDefault();

    $(self.find('.who input')).focus();
  });
};

Template.yarnForm.destroyed = function () {
  key.unbind('n');
};

Template.yarnForm.helpers({
  tip: function () {
    return Session.get("tip");
  },
  hasTip: function () {
    return false;  //Session.get("tip") ? true : false;
  }
});

Template.yarnForm.events({
  'focus input': function (event, template) {
    $(event.target).closest('.who, .what, .why').find('.label').addClass('focus');

    Session.set('selectedYarnId', null);
  },
  'blur input': function (event, template) {
    $(event.target).closest('.who, .what, .why').find('.label').removeClass('focus');
  },
  'click .action.home': function () {
    event.stopPropagation();
    event.preventDefault();

    Router.go('/');
  },
  'keyup .yarn-form': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    Session.set("tip", null);

    var spinId = this.spinId,
        who = template.find('.who input'),
        what = template.find('.what input'),
        why = template.find('.why input');

    if (spinId && event.keyCode === 13 && // enter to save
        !!who.value && !!what.value && !!why.value) {
      
      var yarn = {
        spinId: spinId,
        who: who.value,
        what: what.value,
        why: why.value
      }

      Meteor.call('yarn', yarn, function (error, yarnId) {
        if (error) {
          Session.set("displayError", [error.error, error.reason].join(": "));
        } else {
          $('.yarns').sortable('reload');
        }
      });

      who.value = what.value = why.value = "";
      who.focus();
    } else if(event.keyCode === 27) { // esc to de-focus
      $(event.target).blur();
    } else if (who.value.length > 20) {
      showTip("too long", "As");
    }
  }
});