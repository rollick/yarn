wait = function (msecs) {
  var start = new Date().getTime();
  var cur = start
  while(cur - start < msecs) {
    cur = new Date().getTime();
  } 
};


Meteor.publish("yarns", function (spinId) {
  check(spinId, String);

  // wait(6000);

  return Yarns.find({spinId: spinId});
});

Meteor.publish("yarnCount", function () {
  var self = this,
      count = 0, 
      initializing = true,
      countId = Meteor.uuid();

  var handle = Yarns.find().observe({
    added: function (newActivity) { 
      count++;

      if (!initializing) {
        self.changed("yarnCount", countId, {count: count});
      }
    },
    removed: function (oldActivity) {
      count--;

      self.changed("yarnCount", countId, {count: count});
    }
  });

  initializing = false;
  self.added("yarnCount", countId, {count: count});
  self.ready();

  self.onStop(function () {
    handle.stop();
  });
});


Meteor.startup(function () {
  // code to run on server at startup
});