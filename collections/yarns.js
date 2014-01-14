Yarns = new Meteor.Collection('yarns');
YarnCount = new Meteor.Collection("yarnCount");

// Currently only need to know the yarnId to be able to update or remove it!
Yarns.allow({
  insert: function (userId, yarn) {
    return false; // use yarn method
  },
  update: function (userId, yarn, fields, modifier) {
    return false; // user yarnUpdate method
  },
  remove: function (userId, yarns) {
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
  yarnUpdate: function (yarnId, yarn) {
    check(yarnId, String);
    check(yarn, Object);
    check(yarn.spinId, String);

    defaultChecks(yarn, true);

    // Check that the yarn exists and matches spinId (we don't allow moving yarns, yet)
    var existingYarn = Yarns.findOne({_id: yarnId, spinId: yarn.spinId});
    if (!existingYarn)
      throw new Meteor.Error(400, "Could not find yarn to update");

    Yarns.update({_id: yarnId}, {
      $set: yarn
    });
  },
  yarn: function (yarn) {
    check(yarn, Object);
    check(yarn.spinId, String);

    defaultChecks(yarn);

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
      note: yarn.note,
      color: yarn.color,
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

var defaultChecks = function(yarn, update) {
  checkNonEmptyFields(yarn, update);
  checkAllowedFields(yarn);
};

var checkAllowedFields = function (yarn) {
  // Don't let people sneek in some extra fields
  if (_.without(Object.keys(yarn), 'who', 'what', 'why', 'spinId', 'order', 'created', 'color', 'note').length > 0)
    throw new Meteor.Error(400, "Trying to sneak in some extra fields, ey?");
};

// pass update to only check the non-empty fields if they have been provided
var checkNonEmptyFields = function (yarn, update) {
  if (_.isUndefined(update))
    update = false;

  var nonEmptyFields = ['who', 'what', 'why', 'spinId'];
  var failed = _.any(nonEmptyFields, function (field) {
    return !(update && _.isUndefined(yarn[field])) && _.isEmpty(yarn[field]);
  });

  if (failed)
    throw new Meteor.Error(400, "Please complete all fields");
};