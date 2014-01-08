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
    if ($(event.target).attr('contentEditable'))
      return false;

    // Default tests
    var tagName = (event.target || event.srcElement).tagName;
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  };

  // add some hotkeys
  key('up, down', function() {
    event.stopPropagation();
    event.preventDefault();

    // get nonreactive selectedYarnId so this function
    // isn't rerun again when we set selectedYarnId at the end
    var selectedYarnId = Deps.nonreactive(function () {
          return Session.get('selectedYarnId');
        }),
        spinId = template.data.spinId,
        count = Yarns.find({spinId: spinId}).count(),
        newSelection;

    if (selectedYarnId) {
      var conds = {spinId: spinId},
          selectedYarn = Yarns.findOne(selectedYarnId);

      if (this.shortcut === "down")
        conds['order'] = selectedYarn.order === count ? 1 : selectedYarn.order+1;
      else
        conds['order'] = selectedYarn.order === 1 ? count : selectedYarn.order-1;

      newSelection = Yarns.findOne(conds);
    } else {
      var order = (this.shortcut === "down") ? 1 : count;

      newSelection = Yarns.findOne({spinId: spinId, order: order});
    }

    // Set the session variable to trigger ui updates
    Session.set('selectedYarnId', newSelection._id);

    scrollToYarn(newSelection._id);
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

      scrollToYarn(id);
    }
  });

  // If enter pressed and a yarn is selected then focus the first editable text field
  key('enter', function() {
    var selectedYarn = $(self.find('.yarn.selected'));

    if (selectedYarn.length) {
      event.stopPropagation();
      event.preventDefault();

      selectedYarn.find('.text:first').focus();
    }
  });

  // Set the color on the selected yarn
  key('1,2,3,4', function() {
    var selectedYarnId = Deps.nonreactive(function () {
          return Session.get('selectedYarnId');
        });

    if (selectedYarnId) {
      event.stopPropagation();
      event.preventDefault();

      Yarns.update({_id: selectedYarnId}, {
        $set: {
          color: parseInt(this.shortcut)
        }
      });
    }
  });

  // toggle note 
  key('n', function() {
    var selectedYarn = $(self.find('.yarn.selected'));

    if (selectedYarn.length) {
      event.stopPropagation();
      event.preventDefault();

      var note = selectedYarn.find('.note');

      if (note.hasClass('hide')) {
        note.removeClass('hide').find('.text').focus();
      } else {
        note.addClass('hide').find('.text').blur();
      }
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
  key.unbind('n', '1', '2', '3', '4', 'up', 'down', 'enter', '⌘+up', 'ctrl+up', '⌘+down', 'ctrl+down');
};