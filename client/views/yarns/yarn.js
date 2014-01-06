///////////////////////////////////////////////////////////////////////////////
// Yarn

Template.yarn.rendered = function () {
  $('.yarns').sortable('reload');
};

Template.yarn.created = function () {
  var self = this;
  
  self._saveYarn = function () {
    var who = self.find('.who .text'),
        what = self.find('.what .text'),
        why = self.find('.why .text');

    Yarns.update({_id: self.data._id}, {
      $set: {
        who: who.innerText,
        what: what.innerText,
        why: why.innerText
      }
    }, {multi: false});
  };
},

Template.yarn.events({
  'focus .text': function (event, template) {
    $(template.find('.save')).show();
  },
  'focus .text': function (event, template) {
    $(template.find('.save')).show();
  },
  'keydown .text': function (event, template) {
    if(event.keyCode === 27 || event.keyCode === 13) {
      event.stopPropagation();
      event.preventDefault();

      $(event.target).blur();

      if (event.keyCode === 13) {
        template._saveYarn();
        $(template.find('.save')).hide();
      }

    }
  },
  'click .save': function (event, template) {
    event.stopPropagation();
    event.preventDefault();
    
    template._saveYarn();

    $(event.target).blur();
    $(template.find('.save')).hide();
  },
  'click .remove': function (event, template) {
    if (event.target.className.match(/ready/))
      Yarns.remove(template.data._id);
    else {
      var target = event.target;
      target.className = "remove ready";

      setTimeout(function (){
        target.className = "remove";
      }, 3000)
    }
  }
});