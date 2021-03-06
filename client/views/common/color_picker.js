///////////////////////////////////////////////////////////////////////////////
// Color Picker Events and Helpers

colorPickerEvents = {
  'click .color-picker > div': function (event, template) {
    var target = $(event.target),
        closed = target.parent().hasClass('close');

    if (!closed) {
      // TODO: shouldn't be editing the dom here but if we don't then
      //        the transition ends with the old color selected and then
      //        changes after the yarn color gets saved
      target.addClass('selected').siblings().removeClass('selected');

      // Save the new color when the transition ends so that it is smooootherrr
      var transitions = 'webkitTransitionEnd oTransitionEnd oTransitionEnd msTransitionEnd transitionend';
      target.siblings().one(transitions, function () {
        // cancel any events from siblings
        target.siblings().off(transitions);
        template._changeHandler(event, template);
      });
    }

    target.parent().toggleClass('close');
  },
};

colorPickerHelpers = {
  colors: function () {
    return [
      {number: 1, cls: (this.color === 1 ? 'selected' : '')},
      {number: 2, cls: (this.color === 2 ? 'selected' : '')},
      {number: 3, cls: (this.color === 3 ? 'selected' : '')},
      {number: 4, cls: (this.color === 4 ? 'selected' : '')}
    ]
  }
};

///////////////////////////////////////////////////////////////////////////////
// Color Picker for Yarn

Template.colorPicker.events(_.extend({}, colorPickerEvents));
Template.colorPicker.helpers(_.extend({}, colorPickerHelpers));

Template.colorPicker.created = function () {
  var self = this;

  self._changeHandler = function (event, template) {
    match = $(event.target).attr('class').match(/^.*(\d{1})/);
    if (match) {
      var color = parseInt(match[1]),
          success = true;

      // call update method - note: need to include spinId
      Meteor.call('yarnUpdate', template.data._id, {color: color, spinId: template.data.spinId}, function (error, yarnId) {
        if (error) {
          Session.set("displayError", [error.error, error.reason].join(": "));

          success = false;
        }
      });
    }

    return success;
  };
};

///////////////////////////////////////////////////////////////////////////////
// Color Picker for Filter

Template.colorFilter.events(_.extend({}, colorPickerEvents));
Template.colorFilter.helpers(_.extend({}, colorPickerHelpers));

Template.colorFilter.helpers({
  colors: function () {
    var colorFilter = Session.get('colorFilter');

    return [
      {number: 1, cls: (colorFilter === 1 ? 'selected' : '')},
      {number: 2, cls: (colorFilter === 2 ? 'selected' : '')},
      {number: 3, cls: (colorFilter === 3 ? 'selected' : '')},
      {number: 4, cls: (colorFilter === 4 ? 'selected' : '')}
    ]
  }
});

Template.colorFilter.created = function () {
  this._changeHandler = function (event, template) {
    match = $(event.target).attr('class').match(/^.*(\d{1})/);
    if (match) {
      var color = parseInt(match[1]);

      // color 0 means user reset the filter
      if (color < 1)
        color = null;
      else // reset the selected yarn as it might not be in the filtered list
        Session.set("currentYarnId", null);

      Session.set("colorFilter", color);
    }
  };
};