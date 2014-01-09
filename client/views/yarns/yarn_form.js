
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
  'focus input': function (event, template) {
    $(event.target).closest('.who, .what, .why').addClass('focus');

    Session.set('selectedYarnId', null);
  },
  'blur input': function (event, template) {
    $(event.target).closest('.who, .what, .why').removeClass('focus');

    // clear autocomplete attribute
    $(template.findAll('[data-yarn-autocomplete]')).attr('data-yarn-autocomplete', '')
  },
  'click .action.home': function () {
    event.stopPropagation();
    event.preventDefault();

    Router.go('/');
  },
  'keyup input': function (event, template) {
    var target = $(event.target),
        value = target.val(),
        field = target.closest('.field'),
        currentData = field[0].getAttribute('data-yarn-autocomplete'),
        fieldData = '';

    if (event.keyCode === 39 && !_.isEmpty(currentData)) {
      target.val(currentData);
    } else {
      if (value.length > 2) {
        var term = new RegExp('^' + value + '.*', 'i'),
            type = target.closest('.who, .what, .why').
                          attr('class').match(/(who|what|why)/)[1];

        var conds = {};
        conds[type] = term;

        // get the most recent match
        var yarn = Yarns.findOne(conds, {sort: {created: -1}});
        if (yarn)
          fieldData = yarn[type];      
      }
    }

    field[0].setAttribute('data-yarn-autocomplete', fieldData);
  },
  'keyup .yarn-form': function (event, template) {
    Session.set("tip", null);

    var spinId = this.spinId,
        who = template.find('.who input'),
        what = template.find('.what input'),
        why = template.find('.why input');

    if (spinId && event.keyCode === 13 && // enter to save
        !!who.value && !!what.value && !!why.value) {
      
      event.stopPropagation();
      event.preventDefault();

      // set the color to current filtered value if one exists
      var color = null;
      if (template.data.color)
        color = template.data.color;

      var yarn = {
        spinId: spinId,
        who: who.value,
        what: what.value,
        why: why.value,
        color: color
      }

      Meteor.call('yarn', yarn, function (error, yarnId) {
        if (error) {
          Session.set("displayError", [error.error, error.reason].join(": "));
        } else {
          $('.yarns').sortable('reload');
        }
      });

      // clear input fields and autocomplete attributes
      who.value = what.value = why.value = "";
      $(template.findAll('[data-yarn-autocomplete]')).attr('data-yarn-autocomplete', '')
      
      // focus first input
      who.focus();
    } else if(event.keyCode === 27) { // esc to de-focus
      event.stopPropagation();
      event.preventDefault();

      $(event.target).blur();
    } else if (who.value.length > 20) {
      showTip("too long", "As");
    }
  }
});