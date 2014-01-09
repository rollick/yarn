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
        template._changeHandler(event);
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

  this._changeHandler = function (event, template) {
    match = $(event.target).attr('class').match(/^.*(\d{1})/);
    if (match) {
      var color = parseInt(match[1]);

      Yarns.update({_id: self.data._id}, {
        $set: {
          color: color
        }
      });
    }
  };
};

///////////////////////////////////////////////////////////////////////////////
// Color Picker for Filter

Template.colorFilter.events(_.extend({}, colorPickerEvents));
Template.colorFilter.helpers(_.extend({}, colorPickerHelpers));

Template.colorFilter.created = function () {
  this.color = Session.get("colorFilter");

  this._changeHandler = function (event, template) {
    match = $(event.target).attr('class').match(/^.*(\d{1})/);
    if (match) {
      var color = parseInt(match[1]);

      // color 0 means user reset the filter
      if (color < 1)
        color = null;
      else // reset the selected yarn has it might not be in the filtered list
        Session.set("currentYarnId", null);

      Session.set("colorFilter", color);

    }
  };
};