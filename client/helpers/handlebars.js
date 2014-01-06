///////////////////////////////////////////////////////////////////////////////
// Common Helpers

Handlebars.registerHelper("appVersion", function() {
  return App.version;
});

Handlebars.registerHelper("yarnCount", function() {
  return YarnCount.findOne();
});