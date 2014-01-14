///////////////////////////////////////////////////////////////////////////////
// Yarn

Template.yarn.created = function () {
  var self = this;
  
  self._selectYarn = function (yarnId) {
    $('.yarns .yarn').removeClass('selected').
                      find('[data-yarn-id="' + yarnId + '"]').
                      addClass('selected');

    return false;
  }

  self._saveYarn = function (template, callback) {
    var who = template.find('.who .text'),
        what = template.find('.what .text'),
        why = template.find('.why .text'),
        note = template.find('.note .text'),
        success = true;

    var yarn = {
      spinId: template.data.spinId,
      who: who.textContent,
      what: what.textContent,
      why: why.textContent,
      note: note.textContent
    };

    Meteor.call('yarnUpdate', template.data._id, yarn, function (error, yarnId) {
      if (error) {
        Session.set("displayError", [error.error, error.reason].join(": "));

        success = false;
      }

      if (_.isFunction(callback))
        callback.call(this, success);
    });
  };
};

Template.yarn.destroyed = function () {
  if (template._keyupTimer)
    clearInterval(this._keyupTimer);
}

Template.yarn.events({
  'click .yarn': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    Session.set('selectedYarnId', this._id);
  },
  'click .note-toggle': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    var note = $(template.find('.note'));

    if (note.hasClass('focus')) {
      note.removeClass('focus');
    } else {
      note.addClass('focus');
    }
  },
  'focus .text': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    var $target = $(event.target);

    $(event.target).closest('.who, .what, .why, .note').addClass('focus');

    Session.set('selectedYarnId', this._id);
  },  
  'blur .text': function (event, template) {
    $(event.target).closest('.who, .what, .why, .note').removeClass('focus');
  },
  'keydown .text': function (event, template) {
    if(event.keyCode === 27 || event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();

      $(event.target).blur();
      $(template.find('.note')).removeClass('focus');

      if (event.keyCode === 13) {
        if (template._keyupTimer)
          clearInterval(template._keyupTimer);

        var success = template._saveYarn(template, function (success) {
          if (success) {
            $(template.find('.save')).hide();
          } else {
            // refocus the field
            $(event.target).focus();
          }
        });
      }
    }
  },
  'keyup .text': function (event, template) {
    // Use a timer to ensure keyup code below isn't called excessively
    if (template._keyupTimer)
      clearInterval(template._keyupTimer);

    template._keyupTimer = setTimeout(function () {
      // If nothing has changed then disable save link
      var id = template.data._id,
          yarn = Yarns.findOne(id, {who: 1, what: 1, why: 1, note: 1}),
          save = $(template.find('.save')),
          changed = _.any(['who', 'what', 'why', 'note'], function (field) {
            var input = template.find('.' + field + ' .text');

            if (input)
              return input.textContent != yarn[field];
            else
              return false;
          });
      
      if (changed)
        save.show();
      else
        save.hide();      
    }, 500);
  },
  'click .save': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    if (template._keyupTimer)
      clearInterval(template._keyupTimer);
    
    $(event.target).blur();

    var success = template._saveYarn(template);
    if (success)
      $(template.find('.save')).hide();
    else {
      // refocus the field
      $(template.find('.text:empty')).focus();
    }
  },
  'click .remove': function (event, template) {
    if (event.target.className.match(/ready/)) {
      Meteor.call('yarnRemove', template.data._id, function (error, yarnId) {
        if (error)
          Session.set("displayError", [error.error, error.reason].join(": "));
      });
    } else {
      var target = $(event.target);
      target.addClass("ready");

      setTimeout(function (){
        target.removeClass("ready");
      }, 2000)
    }
  }
});

Template.yarn.helpers({
  'yarnCls': function () {
    var classes = [];
        colorFilter = Session.get('colorFilter');

    if (Session.equals('selectedYarnId', this._id))
      classes.push('selected');

    if (colorFilter) {
      classes.push('unsortable');
      if (colorFilter != this.color)
        classes.push('hide');
    }

    return classes.join(' ');
  },
  'hasNote': function () {
    return !_.isEmpty(this.note);
  }
});