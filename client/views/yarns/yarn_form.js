
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

    var spinId = this.spinId,
        who = template.find('.who input'),
        what = template.find('.what input'),
        why = template.find('.why input');

    if (spinId && event.keyCode === 13 &&
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
    } else if (who.value.length > 20) {
      showTip("too long", "As");
    }
  }
});