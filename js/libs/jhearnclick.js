/**
 * Donut chart generator.
 * @param el, where to draw the chart
 * @param options, options
 */
var jHearNClick =  function(el, options) {
  /**
   * Default parameters.
   * @type {{mediaSelector: string, matchSelector: string, helpSelector: string, showActiveSoundOnly: boolean, answers: null, onBeforeInit: null, onAfterInit: null, onAfterClickMatchCorrect: null, onAfterClickMatchIncorrect: null, onErrorBehavior: string, onNextSound: null, onLoaded: null, onFinish: null, successClass: string, errorClass: string, activeClass: string, donut: {width: number, height: number, text_y: string, duration: number, transition: number, thickness: number}, feedbacks: {50: string, 80: string, 100: string}, contextualHelp: {afterInit: string, onMatchCorrect: string, onMatchIncorrect: string, onAfterPlay: string}}}
   */
  this.defaults = {
    mediaSelector : "div.sound",
    matchSelector : "div.match",
    helpSelector : ".help",
    showActiveSoundOnly : true,
    answers: null,
    onBeforeInit: null,
    onAfterInit: null,
    onAfterClickMatchCorrect: null,
    onAfterClickMatchIncorrect: null,
    onErrorBehavior: 'tryagain', // Can be 'tryagain', or 'continue'
    onNextSound: null,
    onLoaded: null,
    onFinish: null,
    successClass: "success",
    errorClass: "error",
    activeClass: "active",
    soundsPath: "sounds/",
    donut : {
      width : 80,
      height : 80,
      text_y : '.30em',
      duration : 500,
      transition : 200,
      thickness : 10
    },
    feedbacks : {
      50 : "Low score, please try again.",
      80 : "Good, but not perfect.",
      100 : "You nailed it. Bravo !"
    },
    contextualHelp : {
      afterInit : "Click on the blue element to hear a number, then select the corresponding digit in the options below.",
      onMatchCorrect : "Bravo ! It's correct.<br/>Continue and play next item.",
      onMatchIncorrect : "Wrong choice. Please try again.",
      onAfterPlay : "Select corresponding option in blue"
    }
  };

  this.settings = $.extend({}, this.defaults, options);

  /**
   * Last element played.
   * @type {object}
   */
  this.lastEltPlayed = null;
  this.nbErrors = 0;
  this.progress = 0;
  this.app = $(el);
  this.totalSounds = 0;
  this.roundPoint = 0;
  this.totalScore = 0;

  this.init();
};

/**
 * Initialize the application.
 */
jHearNClick.prototype.init = function() {
  var self = this;
  if (this.settings.onBeforeInit && jQuery.isFunction(this.settings.onBeforeInit)) {
    this.settings.onBeforeInit();
  }

  if (!this.app.hasClass('has-jmyloader')) {
    $(this.app).cofPlayer({
      mediaSelector : this.settings.mediaSelector,
      loader : {
        size : 200,
        container : this.app,
        onLoaded : this.settings.onLoaded
      },
      afterPlay : function(elt){
        self.onAfterPlay(elt);
      }
    });

    // Add success and error sounds.
    this.app.append('<div class="appsound success" id="123-456-789"><a href="' + this.settings.soundsPath + 'mp3/success.mp3"></a></div>');
    this.app.append('<div class="appsound error" id="123-456-789"><a href="' + this.settings.soundsPath + 'mp3/error.mp3"></a></div>');
    // Put cofPlayer on top of these elements.
    $(this.app).cofPlayer({
      mediaSelector : 'div.appsound',
      loader : {
        size : 200,
        container : this.app,
        onLoaded : this.settings.onLoaded
      }
    });

    // On match click event.
    $('.match a').click(function() {
      self.onClickMatch($(this));
      return false;
    });

    // init reset button.
    $('.actions .reset', this.app).click(function() {
      if ($(this).attr("disabled") == "disabled") {
        return false;
      }
      self.onReset();
    });
  }

  // Hide inactive sound.
  if (this.settings.showActiveSoundOnly) {
    $(this.settings.mediaSelector, this.app).hide();
    $(this.settings.mediaSelector + ':first', this.app).show();
    $(this.settings.mediaSelector + ':first', this.app).addClass(this.settings.activeClass);
  }

  // init progress bar.
  this.progress = 1;
  this.totalSounds = $(this.settings.mediaSelector, this.app).length;
  $('.progress .current', this.app).text(this.progress);
  $('.progress .total', this.app).text(this.totalSounds);

  // Disable reset button.
  $('.actions .reset').attr("disabled", "disabled");

  // init contextual help.
  this.contextualHelp(this.settings.contextualHelp.afterInit, null);

  if (this.settings.onAfterInit && jQuery.isFunction(this.settings.onAfterInit)) {
    this.settings.onAfterInit();
  }
};

/**
 * Event executed after playing a sound.
 * @param elt
 */
jHearNClick.prototype.onAfterPlay = function(elt) {
  this.lastEltPlayed = elt;
  $(elt).removeClass(this.settings.activeClass);
  $(this.settings.matchSelector).addClass(this.settings.activeClass);
  this.contextualHelp(this.settings.contextualHelp.onAfterPlay, null);
};

/**
 * Event executed when a click on a match is done.
 * @param elt
 * @returns {boolean}
 */
jHearNClick.prototype.onClickMatch = function(elt) {
  var match = elt.closest(this.settings.matchSelector);
  // Check if element is active.
  // If not, do nothing.
  if (!match.hasClass(this.settings.activeClass)) {
    return false;
  }
  var matchId = match.attr("id");
  var lastPlayedSoundId = this.lastEltPlayed.attr("id");
  if (this.settings.answers[lastPlayedSoundId] == matchId) {
    this.onClickMatchCorrect(elt);
  }
  else {
    this.onClickMatchIncorrect(elt);
  }
  return false;
};

/**
 * Event executed when a correct click on a match has happened.
 * @param elt
 */
jHearNClick.prototype.onClickMatchCorrect = function(elt) {
  this.roundPoint += 1;
  elt.closest(this.settings.matchSelector).addClass(this.settings.successClass);
  // Remove all possible error classes.
  $(this.settings.matchSelector).removeClass(this.settings.errorClass);
  this.goToNextSound();
  if (this.progress < this.totalSounds) {
    this.contextualHelp(this.settings.contextualHelp.onMatchCorrect, "green");
  }
  else {
    this.contextualHelp("", null);
  }
  // Play success sound.
  $('.appsound.success', this.app).cofPlay();

  // Callback.
  if (this.settings.onAfterClickMatchCorrect && jQuery.isFunction(this.settings.onAfterClickMatchCorrect)) {
    this.settings.onAfterClickMatchCorrect(elt);
  }
};

/**
 * Event executed when an incorrect click on a match has happened.
 * @param elt
 */
jHearNClick.prototype.onClickMatchIncorrect = function(elt) {
  this.roundPoint -= 1;
  elt.closest(this.settings.matchSelector).addClass(this.settings.errorClass);
  // Count number of incorrect choices.
  this.nbErrors ++;
  if (this.settings.onErrorBehavior == 'tryagain') {
    this.contextualHelp(this.settings.contextualHelp.onMatchIncorrect, "red");
  }
  // Play error sound.
  $('.appsound.error', this.app).cofPlay();

  // Callback.
  if (this.settings.onAfterClickMatchIncorrect && jQuery.isFunction(this.settings.onAfterClickMatchIncorrect)) {
    this.settings.onAfterClickMatchIncorrect(elt);
  }
};

/**
 * Event executed on reset.
 */
jHearNClick.prototype.onReset = function() {
  $(this.settings.mediaSelector, this.app)
    .show()
    .removeClass(this.settings.activeClass)
    .css('margin-left', '');

  $(this.settings.matchSelector, this.app)
    .removeClass(this.settings.successClass)
    .removeClass(this.settings.errorClass)
    .removeClass(this.settings.activeClass);

  $('.feedback', this.app).remove();
  this.contextualHelp(this.settings.contextualHelp.afterInit, null);

  this.lastEltPlayed = null;
  this.nbErrors = 0;
  this.progress = 0;
  this.totalSounds = 0;
  this.roundPoint = 0;
  this.totalScore = 0;

  this.init(this.app);
};

/**
 * Go to next sound.
 */
jHearNClick.prototype.goToNextSound = function() {
  if (this.roundPoint > 0) {
    this.totalScore += 1;
  }
  this.roundPoint = 0;
  $(this.settings.matchSelector).removeClass(this.settings.activeClass);
  $(this.settings.matchSelector).removeClass(this.settings.errorClass);
  var nextElement = this.lastEltPlayed.next();
  if (this.settings.onNextSound && jQuery.isFunction(this.settings.onNextSound)) {
    this.settings.onNextSound(this.lastEltPlayed, nextElement);
  }
  nextElement.addClass(this.settings.activeClass);
  this.progress++;
  if (this.progress <= this.totalSounds) {
    $('.progress .current', this.app).text(this.progress);
  }
  else {
    // Callback.
    if (this.settings.onFinish && jQuery.isFunction(this.settings.onFinish)) {
      this.settings.onFinish();
    }
  }
};

/**
 * Event on finish.
 */
jHearNClick.prototype.onFinish = function() {
  // Callback.
  if (this.settings.onFinish && jQuery.isFunction(this.settings.onFinish)) {
    this.settings.onFinish();
  }
  this.displayScore();
  $('.actions .reset').removeAttr("disabled");
};

/**
 * Display score.
 */
jHearNClick.prototype.displayScore = function() {
  // Calculate score.
  var score = this.totalScore;
  var percent = Math.round(score / this.totalSounds * 100);
  if (percent > 100) {
    percent = 100;
  }
  $.cofda.showScore(this.app, percent, this.settings);
};


/**
 * Display contextual help.
 * @param helpStr
 * @param className
 */
jHearNClick.prototype.contextualHelp = function(helpStr, className) {
  $(this.settings.helpSelector, this.app).html('<p' + (className != null ? ' class="' + className + '"' : '') + '>' + helpStr + '</p>');
};

jQuery.fn.jHearNClick = function(options) {
  var jhnc = null;
  // Init application.
  this.each(function() {
    var container = $(this);
    var _jhnc = new jHearNClick(container, options);
    jhnc = _jhnc;
    return _jhnc;
  });
  return jhnc;
};
