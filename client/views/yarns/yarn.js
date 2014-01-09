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

  self._saveYarn = function () {
    var who = self.find('.who .text'),
        what = self.find('.what .text'),
        why = self.find('.why .text'),
        note = self.find('.note .text');

    // ensure all fields have a value
    var fail = _.any([who, what, why], function (field) {
          return _.isEmpty(field.textContent);
        });

    if (fail)
      return false;
    
    Yarns.update({_id: self.data._id}, {
      $set: {
        who: who.textContent,
        what: what.textContent,
        why: why.textContent,
        note: note.textContent
      }
    }, {multi: false});

    return true;
  };
},

Template.yarn.events({
  'click .yarn': function (event, template) {
    Session.set('selectedYarnId', this._id);

    return true;
  },
  'click .note-toggle': function (event, template) {
    var note = $(template.find('.note'));

    if (note.hasClass('focus')) {
      note.removeClass('focus').find('.text').blur();
    } else {
      note.addClass('focus').find('.text').focus();
    }
  },
  'focus .text': function (event, template) {
    var $target = $(event.target);

    $(event.target).closest('.who, .what, .why').addClass('focus');

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
        var success = template._saveYarn();

        if (success) {
          $(template.find('.save')).hide();
        }
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
    
    $(event.target).blur();

    var success = template._saveYarn();
    if (success)
      $(template.find('.save')).hide();
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
  'selected': function () {
    return Session.equals('selectedYarnId', this._id);
  },
  'hasNote': function () {
    return !_.isEmpty(this.note);
  },
  'sortable': function () {
    return !Session.get('colorFilter');
  },
  'hide': function () {
    return Session.get('colorFilter') && Session.get('colorFilter') != this.color;
  }
});