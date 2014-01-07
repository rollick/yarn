var selectYarn = function (yarnId) {
  $('.yarns .yarn').removeClass('selected').
                    find('[data-yarn-id=' + yarnId + ']').
                    addClass('selected');
}

///////////////////////////////////////////////////////////////////////////////
// Yarn List

Template.yarnList.helpers({
  yarns: function () {
    return Yarns.find({spinId: this.spinId}, {sort: {order: 1}});
  }
});

Template.yarnList.rendered = function () {
  var self = this;

  // Ensure hotkeys aren't triggered when inside editable .text element
  key.filter = function(event){
    // Default tests
    var tagName = (event.target || event.srcElement).tagName;
    key.setScope(/^(INPUT|TEXTAREA|SELECT)$/.test(tagName) ? 'input' : 'other');

    // return false for editable text fields
    return $(event.target).attr('contentEditable') ? false : true;
  };

  // add some hotkeys
  key('up, down', function() {
    event.stopPropagation();
    event.preventDefault();

    var selectedYarn = $(self.find('.yarn.selected')),
        totalYarns = $(self.findAll('.yarn')).length;

    if (selectedYarn.length) {
      // using getAttribute below as jquery data() was returning a cached older
      // value after the list was reordered
      var order = parseInt(selectedYarn[0].getAttribute("data-yarn-order"));

      if (this.shortcut === "down")
        order = order === totalYarns ? 1 : order+1;
      else
        order = order === 1 ? totalYarns : order-1;

      selectedYarn.removeClass('selected').
                    siblings('[data-yarn-order=' + order + ']').
                    addClass('selected');
    } else {
      if (this.shortcut === "down")
        $(self.find('.yarn:first-of-type')).addClass('selected').focus();
      else
        $(self.find('.yarn:last-of-type')).addClass('selected').focus();
    }

    selectYarn = $(self.find('.yarn.selected'));
    $('body').scrollTop(selectYarn.position().top - 50);
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