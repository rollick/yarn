///////////////////////////////////////////////////////////////////////////////
// Main

Template.home.events({
  'click .create .inner': function (event, template) {
    event.stopPropagation();
    event.preventDefault();

    var spinId = Meteor.uuid().match(/([a-z|0-9]{8})-/)[1];
    Session.set("spinId", spinId);

    Router.go("/" + spinId);
  }
});