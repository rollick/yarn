///////////////////////////////////////////////////////////////////////////////
// Yarn List

Template.yarnList.helpers({
  yarns: function () {
    return Yarns.find({spinId: this.spinId}, {sort: {order: 1}});
  }
});

Template.yarnList.rendered = function () {
  var self = template = this;

  // Ensure hotkeys aren't triggered when inside editable .text element
  key.filter = function(event) {
    // return false for editable text fields
    return $(event.target).attr('contentEditable') ? false : true;

    // Default tests
    var tagName = (event.target || event.srcElement).tagName;
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  };

  // add some hotkeys
  key('up, down', function() {
    event.stopPropagation();
    event.preventDefault();

    var selectedYarnId = Session.get('selectedYarnId'),
        newSelection;

    if (selectedYarnId) {
      var selectedYarn = Yarns.findOne(selectedYarnId),
          spinId = selectedYarn.spinId,
          conds = {spinId: spinId}, 
          sort;

      if (this.shortcut === "down") {
        conds['order'] = {$gt: selectedYarn.order};
        sort = {sort: {order: 1}};
      } else {
        conds['order'] = {$lt: selectedYarn.order};
        sort = {sort: {order: -1}};
      }

      newSelection = Yarns.findOne(conds, sort);

      // if no match then reached either top or bottom of list
      // TODO: work out how to create mongo query which will loop to start or end
      //       if there is no next/previous match.
      if (!newSelection) {
        var sort = this.shortcut === "down" ? {sort: {order: 1}} : {sort: {order: -1}};

        newSelection = Yarns.findOne({spinId: selectedYarn.spinId}, sort);
      }
    } else {
      var sort = this.shortcut === "down" ? {sort: {order: 1}} : {sort: {order: -1}};

      newSelection = Yarns.findOne({spinId: template.data.spinId}, sort);
    }

    // Set the session variable to trigger ui updates
    Session.set('selectedYarnId', newSelection._id);
  });

  // change order of yarn if selected
  key('⌘+up, ctrl+up, ⌘+down, ctrl+down', function() {
    event.stopPropagation();
    event.preventDefault();

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
    }
  });

  // If enter pressed and a yarn is selected then focus the first editable text field
  key('enter', function() {
    var selectedYarn = $(self.find('.yarn.selected'));

    if (selectedYarn) {
      event.stopPropagation();
      event.preventDefault();

      selectedYarn.find('.text:first').focus();
    }
  });

  // Init sortable library for list of yarns
  $('.yarns').sortable({
    handle: '.handle'
  }).bind('sortupdate', function(e, ui) {
    // Note: position is zero based according to sortable library but 
    //       one for the yarn position
    var id = ui.item.data("yarnId"),
        oldOrder = ui.oldindex + 1,
        newOrder = ui.item.index() + 1;

    if (oldOrder !== newOrder) {
      Meteor.call('reorder', id, oldOrder, newOrder, function (error, status) {
        if (error) {
          Session.set("displayError", [error.error, error.reason].join(": "));
        }
      });
    }
  });
};

Template.yarnForm.destroyed = function () {
  key.unbind('up, down, enter, ⌘+up, ctrl+up, ⌘+down, ctrl+down');
};