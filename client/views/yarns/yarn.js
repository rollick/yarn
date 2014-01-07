///////////////////////////////////////////////////////////////////////////////
// Yarn

Template.yarn.created = function () {
  var self = this;
  
  self._saveYarn = function () {
    var who = self.find('.who .text'),
        what = self.find('.what .text'),
        why = self.find('.why .text');

    // ensure all fields have a value
    var fail = _.any([who, what, why], function (field) {
          return _.isEmpty(field.innerText);
        });

    if (fail)
      return false;

    Yarns.update({_id: self.data._id}, {
      $set: {
        who: who.innerText,
        what: what.innerText,
        why: why.innerText
      }
    }, {multi: false});

    return true;
  };
},

Template.yarn.events({
  'focus .text': function (event, template) {
    $(event.target).closest('.who, .what, .why').
                    find('.label').addClass('focus').
                    closest('.yarn').addClass('selected');
  },  
  'blur .text': function (event, template) {
    $(event.target).closest('.who, .what, .why').
                    find('.label').removeClass('focus').
                    closest('.yarn').removeClass('selected');
  },
  'keydown .text': function (event, template) {
    if(event.keyCode === 27 || event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();

      $(event.target).blur();

      if (event.keyCode === 13) {
        var success = template._saveYarn();

        if (success)
          $(template.find('.save')).hide();
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
          yarn = Yarns.findOne(id, {who: 1, what: 1, why: 1}),
          save = $(template.find('.save')),
          changed = _.any(["who", "what", "why"], function (field) {
            return template.find("." + field + " .text").innerText != yarn[field];
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
      var target = event.target;
      target.className = "remove ready";

      setTimeout(function (){
        target.className = "remove";
      }, 2000)
    }
  }
});