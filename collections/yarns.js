Yarns = new Meteor.Collection('yarns');
YarnCount = new Meteor.Collection("yarnCount");

Yarns.deny({
  update: function(userId, post, fieldNames) {
    // deny the update if it contains something other than the following fields
    return (_.without(fieldNames, 'who', 'what', 'why', 'spinId', 'order', 'created').length > 0);
  }
});

// Currently only need to know the yarnId to be able to update or remove it!
Yarns.allow({
  insert: function () {
    return false; // use yarn method
  },
  update: function (userId, group, fields, modifier) {
    return true;
  },
  remove: function (userId, groups) {
    return false; // use yarnRemove method
  }
});

Meteor.methods({
  reorder: function (yarnId, oldOrder, newOrder) {
    check(yarnId, String);
    check(oldOrder, Number);
    check(newOrder, Number);

    // We don't actually need the yarnId but include in query
    // as sanity check before making any changes
    var yarn = Yarns.findOne({_id: yarnId, order: oldOrder});
    
    if (!yarn || !yarn.spinId) {
      throw new Meteor.Error(400, "Could not find yarn to reorder");

      return false;
    }

    var id = yarn._id,
        moveUp = newOrder > oldOrder,
        shift = moveUp ? -1 : 1;    
        lowerIndex = Math.min(oldOrder, newOrder);
        lowerIndex += moveUp ? 1 : 0;
        upperIndex = Math.max(oldOrder, newOrder);
        upperIndex -= moveUp ? 0 : 1;

    var conds = {spinId: yarn.spinId, order: {$gte: lowerIndex, $lte: upperIndex}},
        modifier = {$inc: {order: shift}};

    // Update the other yarns 
    Yarns.update(conds, modifier, {multi:true});

    // Update the moved yarn
    Yarns.update(id, {$set: {order: newOrder}});

    return true;
  },
  yarn: function(yarn) {
    check(yarn, Object);
    check(yarn.spinId, String);

    var nonEmptyFields = ['who', 'what', 'why', 'spinId'];

    var failed = _.any(nonEmptyFields, function (field) {
      return _.isEmpty(yarn[field]);
    });

    if (failed)
      throw new Meteor.Error(400, "Please complete all fields");

    var date = new Date(),
        epoch = (date.getTime() / 1000);

    if (_.isEmpty(yarn.created)) {
      yarn.created = epoch;
    }

    // Increment 'order' for all current yarns
    Yarns.update({spinId: yarn.spinId}, {$inc: {order: 1}}, {multi: true})

    // Create the yarn with a null nextId => top of the list
    var yarnId = Yarns.insert({
      spinId: yarn.spinId,
      order: 1,
      who: yarn.who,
      what: yarn.what,
      why: yarn.why,
      created: yarn.created
    });

    return yarnId;
  },
  yarnRemove: function(yarnId) {
    check(yarnId, String);

    var yarn = Yarns.findOne(yarnId);

    if (!yarn)
      throw new Meteor.Error(404, "Could not find matching yarn");

    // Decrement 'order' for all yarns greater than the yarn to be removed
    Yarns.update({spinId: yarn.spinId, order: {$gte: yarn.order}}, {$inc: {order: -1}}, {multi: true});

    // Remove the yarn
    Yarns.remove(yarn._id);
  }
});