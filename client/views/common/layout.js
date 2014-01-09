// scroll view to newly selected yarn
var scrollToYarn = function (yarnId) {
  var yarnElem = $('.yarn[data-yarn-id="' + yarnId + '"]');
  if (yarnElem.length) {
    var windowHeight = $(window).height(),
        yarnHeight = yarnElem.innerHeight(),
        yarnTop = yarnElem.position().top,
        newTop = yarnTop - windowHeight/2 + yarnHeight/2;

    $('body').scrollTop(newTop);
  }
}

///////////////////////////////////////////////////////////////////////////////
// Yarns Layout

Template.yarnsLayout.rendered = function () {
  self = template = this;

  // Ensure hotkeys aren't triggered when inside editable .text element
  key.filter = function(event) {
    // return false for editable text fields
    if ($(event.target).attr('contentEditable'))
      return false;

    // Default tests
    var tagName = (event.target || event.srcElement).tagName;
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  };

  ////
  // Add some hotkeys
  ////

  // add some hotkeys
  key('c', function() {
    Session.set('selectedYarnId', null);

    $(self.find('.yarn-form input:first')).focus();

    return false;
  });

  // enable up / down keys to change selected yarn
  key('up, down', function() {
    // get nonreactive selectedYarnId so this function
    // isn't rerun again when we set selectedYarnId at the end
    var selectedYarnId = template.data.yarnId,
        colorFilter = template.data.color,
        spinId = template.data.spinId,
        count = Yarns.find({spinId: spinId}).count(),
        conds = {spinId: spinId},
        newSelection, sort;

    if (colorFilter)
      conds['color'] = colorFilter;

    if (selectedYarnId) {
      var selectedYarn = Yarns.findOne(selectedYarnId);

      if (this.shortcut === "down") {
        conds['order'] = {$gt: selectedYarn.order};
        sort = {sort: {order: 1}};
      } else {
        conds['order'] = {$lt: selectedYarn.order};
        sort = {sort: {order: -1}};
      }

      newSelection = Yarns.findOne(conds, sort);
    }

    // If newSelection is not set then either the wasn't a previous yarn 
    // selected, or the selection needs to cycle around to top or bottom
    if (!newSelection) {
      // we want to query on a full list of yarns so remove any order conds
      delete conds['order'];

      if (this.shortcut === "down")
        newSelection = Yarns.findOne(conds, {sort: {order: 1}});
      else
        newSelection = Yarns.findOne(conds, {sort: {order: -1}});
    }

    // Set the session variable to trigger ui updates
    Session.set('selectedYarnId', newSelection._id);

    scrollToYarn(newSelection._id);

    return false;
  });

  // change order of yarn if selected
  key('⌘+up, ctrl+up, ⌘+down, ctrl+down', 'yarn', function() {
    // reordering is unsupported when list is filtered
    var colorFilter = Deps.nonreactive(function () {
      return Session.get('colorFilter');
    });

    if (colorFilter)
      return;

    var selectedYarn = $(self.find('.yarn.selected')),
        totalYarns = $(self.findAll('.yarn')).length;

    if (selectedYarn.length) {
      // using getAttribute below as jquery data() was returning a cached older
      // value after the list was reordered
      var oldOrder = parseInt(selectedYarn[0].getAttribute("data-yarn-order")),
          id = selectedYarn.data('yarnId');

      var newOrder;

      if (this.shortcut === "ctrl+down" || this.shortcut === "⌘+down")
        newOrder = oldOrder === totalYarns ? 1 : oldOrder+1;
      else
        newOrder = oldOrder === 1 ? totalYarns : oldOrder-1;

      if (oldOrder !== newOrder) {
        Meteor.call('reorder', id, oldOrder, newOrder, function (error, status) {
          if (error) {
            Session.set("displayError", [error.error, error.reason].join(": "));
          } else {
            $('.yarns').sortable('reload');
          }
        });
      }

      scrollToYarn(id);

      return false;
    }
  });

  // If enter pressed and a yarn is selected then focus the first editable text field
  key('enter', 'yarn', function() {
    var yarnId = template.data.yarnId;

    if (yarnId) {
      var yarnElem = $('.yarn[data-yarn-id="' + yarnId + '"]');
      yarnElem.find('.text:first').focus();
    }

    return false;
  });

  // Set the color on the selected yarn
  key('0,1,2,3,4', 'yarn', function() {
    var yarnId = template.data.yarnId;

    if (yarnId) {
      var color = this.shortcut === 0 ? null : parseInt(this.shortcut);

      Yarns.update({_id: yarnId}, {
        $set: {
          color: color
        }
      });
    }
  });

  // Set color filter
  key('0,1,2,3,4', 'spin', function() {
    var color = this.shortcut === 0 ? null : parseInt(this.shortcut);

    Session.set('colorFilter', color);
  });

  // toggle note 
  key('n', 'yarn', function() {
    var yarnId = template.data.yarnId;

    if (yarnId) {
      var yarnElem = $('.yarn[data-yarn-id="' + yarnId + '"]'),
          note = yarnElem.find('.note');

      if (note.hasClass('focus')) {
        note.removeClass('focus').find('.text').blur();
      } else {
        note.addClass('focus').find('.text').focus();
      }
    }
    
    return false;
  });
};

Template.yarnsLayout.destroyed = function () {
  key.unbind('c', 'n', '1', '2', '3', '4', 'up', 'down', 'enter', '⌘+up', 'ctrl+up', '⌘+down', 'ctrl+down');
};