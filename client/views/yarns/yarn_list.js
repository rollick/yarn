///////////////////////////////////////////////////////////////////////////////
// Yarn List

Template.yarnList.helpers({
  yarns: function () {
    var conds = {spinId: this.spinId};

    return Yarns.find(conds, {sort: {order: 1}});
  }
});

Template.yarnList.rendered = function () {
  var self = template = this;

  // Init sortable library for list of yarns
  $('.yarns').sortable({
    handle: '.order',
    items: ':not(.unsortable)'
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