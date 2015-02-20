jQuery.fn.jMyLottery = function(options) {

  var defaults = {
      /**
       * Animate the sound object. (previous one exits the screen, new one enters the screen).
       * @param moveoutp
       * @param movein
       */
      onNextSound: function(moveout, movein) {
        moveout.animate({
          marginLeft: "-=100"
        }, 500, function() {
          $(this).hide();
        });

        movein.css('margin-left', app.width());
        movein.show();
        movein.animate({
          marginLeft: "0"
        }, 1000);
      }
    },
    settings = $.extend({}, defaults, options),

    app = null,

    init = function(appContainer) {
      app = appContainer;
      $(appContainer).jHearNClick(settings);
    };

  // Init application.
  return this.each(function() {
    var app = $(this);
    init(app);
    return $(this);
  });
}