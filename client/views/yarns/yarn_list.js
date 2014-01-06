///////////////////////////////////////////////////////////////////////////////
// Yarn List

Template.yarnList.helpers({
  yarns: function () {
    return Yarns.find({spinId: this.spinId}, {sort: {order: 1}});
  }
});

Template.yarnList.rendered = function () {
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