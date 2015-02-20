/* global jQuery */
(function($, w, d) {
  'use strict';

  /**
   * COF Dynamic Activities.
   */
  var _cofda = $.cofda || {},
    defaults = {
      donut : {
        width : 80,
        height : 80,
        text_y : ".35em",
        duration : 500,
        transition : 200,
        thickness : 15
      },
      feedbacks : {
        50 : "Low score, please try again.",
        80 : "Not perfect, but good.",
        100 : "Bravo ! You nailed it."
      }
    };


  /**
   * Donut chart generator.
   * @param el, where to draw the chart
   * @param percent, percent data
   * @param options, options
   */
  _cofda.donut_chart = function(el, percent, options) {
    var $el = $(el),
      config = $.extend(true, defaults.donut, options),

    /* chart */
      draw = function () {
        var width = config.width,
          height = config.height,
          text_y = config.text_y;

        var dataset = {
            lower: calcPercent(0),
            upper: calcPercent(percent)
          },
          radius = Math.min(width, height) / 2,
          pie = d3.layout.pie().sort(null),
          format = d3.format(".0%");

        var arc = d3.svg.arc()
          .innerRadius(radius - config.thickness)
          .outerRadius(radius);

        var svg = d3.select(el).append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var path = svg.selectAll("path")
          .data(pie(dataset.lower))
          .enter().append("path")
          .attr("class", function(d, i) { return "color" + i })
          .attr("d", arc)
          .each(function(d) { this._current = d; }); // store the initial values

        var text = svg.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", text_y);

        if (typeof(percent) === "string") {
          text.text(percent);
        }
        else {
          var progress = 0;
          var timeout = setTimeout(function () {
            clearTimeout(timeout);
            path = path.data(pie(dataset.upper)); // update the data
            path.transition().duration(config.duration).attrTween("d", function (a) {
              // Store the displayed angles in _current.
              // Then, interpolate from _current to the new angles.
              // During the transition, _current is updated in-place by d3.interpolate.
              var i  = d3.interpolate(this._current, a);
              var i2 = d3.interpolate(progress, percent)
              this._current = i(0);
              return function(t) {
                text.text( format(i2(t) / 100) );
                return arc(i(t));
              };
            }); // redraw the arcs
          }, 200);
        }
      },
      calcPercent = function(percent) {
        return [percent, 100-percent];
      };

    draw();
  };

  _cofda.showScore = function(el, percent, options) {
    var $el = $(el),
      config = $.extend(true, defaults, options),

      getFeedbackElement = function() {
        var html = '<div class="feedback clearfix" style="display: none;">' +
          '<p></p>' +
          '<div class="score">' +
          '<div id="donut" class="donut"></div>' +
          '</div>' +
          '</div>';
        return html;
      },
      show = function() {
        // Get score element.
        var feedbackHtml = getFeedbackElement();
        var feedbackElt = $(feedbackHtml);
        $el.prepend(feedbackElt);
        feedbackElt.show();

        var feedbackText = null;
        for (var i in config.feedbacks) {
          if (percent <= i) {
            feedbackText = config.feedbacks[i];
            break;
          }
        }

        _cofda.donut_chart('#donut', percent, config.donut);
        $(".feedback p", $el).text(feedbackText);
      };

    // Display score.
    show();
  }

  $.cofda = _cofda;

}(jQuery, this, document));

/**
 * Global cofPlayer object.
 * @type {{totalMedias: number, loadedMedias: number, currentKey: number}}
 */
$.cofPlayer = {
  totalMedias : 0,
  loadedMedias : 0,
  currentKey : 1
}

/**
 * cofPlayer jQuery plugin.
 * @param options
 * @returns {*}
 */
jQuery.fn.cofPlayer = function(options) {

  // Default settings.
  var defaults = {
    /**
     * Selector for a sentence
     * @type {string}
     */
    mediaSelector : 'div.sound',
    /**
     * Says if the soundManager is running using full html5 features
     * @type {boolean}
     */
    fullHtml5 : false,
    /**
     * Defines the speed rate of the player
     * @type {number}
     */
    playRate : 1,
    /**
     * Before play callback.
     */
    beforePlay : null,
    /**
     * After play callback.
     */
    afterPlay : null,

    keyPrefix : 'jPlayer-',

    loader : {
      container : 'body',
      size : 300,
      onLoaded : null
    }
  };

  // Settings.
  var settings = $.extend( {}, defaults, options );

  /**
   * list of medias present on the page
   * @type {*}
   */
  var medias = Array();
  /**
   *
   */
  var isPlayRateInitialized  = false;
  /**
   * Total duration of the sound files, in ms
   */
  var totalDuration = 0,

    totalMedias = 0,
    mediaLoaded = 0;

  /**
   * add cofPlay function to each element.
   * each element can be called directly using elt.cofPlay()
   */
  $.fn.cofPlay = function() {
    this.each(function() {
      if (!$(this).find('.jplayer').length) {
        return false;
      }
      $('.jplayer', $(this)).jPlayer("play");
      return $(this);
    });
  }

  function init(appContainer) {
    /**
     * Attaching all events to each sentence
     */
    totalMedias = $(settings.mediaSelector).length;


    if (!$(settings.loader.container).hasClass('has-jmyloader')) {
      $(settings.loader.container).jMyLoader(settings.loader);
    }
    $(settings.loader.container).jMyLoader('add-items', totalMedias);

    $(settings.mediaSelector).each(function() {
      var key = $.cofPlayer.currentKey;
      var hasWrapper = $(this).is('a') ? false : true;
      var wrapperElt = null;
      if(hasWrapper) {
        wrapperElt = $(this);
        wrapperElt.prepend('<div id="' + settings.keyPrefix + key + '" class="jplayer"></div>');
        wrapperElt.attr('rel', settings.keyPrefix + key);
        /**
         * hover effects
         */
        wrapperElt.hover(function(){
          $(this).addClass('hover');
        })
          .mouseleave(function(){
            $(this).removeClass('hover');
          });
      }
      else {
        $('body').prepend('<div id="jPlayer-' + key + '" class="jplayer"></div>');
      }

      var mediaLinkElt = null;
      if (hasWrapper) {
        mediaLinkElt = $('[href$="mp3"]', $(this));
      }
      else {
        mediaLinkElt = $(this);
      }
      var mediaLinkUri = mediaLinkElt.attr('href');
      var mp3Uri = mediaLinkUri;
      var oggUri = mp3Uri.replace(/mp3/g,"ogg"); // We get the ogg file uri (just replacing mp3)
      var playerElt = $('#jPlayer-' + key);


      medias[key] = playerElt.jPlayer({
        supplied: "mp3, oga",
        swfPath: "/cakephp/js/lib/jQuery.jPlayer.2.5.0",
        solution: "html,flash",
        preload: 'auto',
        ready: function (event) {
          if ( event.jPlayer.html.used == true ) {
            settings.fullHtml5 = true;
          }
          $(this).jPlayer("setMedia", {
            mp3: mp3Uri,
            oga: oggUri
          });

          if(hasWrapper) {
            wrapperElt.addClass("loading");
          }

          /**
           * Bind event progress
           * Triggers when a sound file is loaded.
           */
          // If player is working in html mode, we use the loadeddata event (compatible only for html)
          if(( event.jPlayer.html.used == true )) {
            playerElt.bind($.jPlayer.event.loadeddata, function (event, elt) {
              onLoaded(key, event.jPlayer.status.duration);
            });
          }
          // If no html5, we use the progress event (seems to work accurately only for flash fallback)
          else {
            playerElt.bind($.jPlayer.event.progress, function (event, elt) {
              //console.log("progress = " + event.jPlayer.status.seekPercent);
              if(event.jPlayer.status.seekPercent === 100) {
                onLoaded(key, event.jPlayer.status.duration);
              }
            });
          }
        }
      });

      /**
       * Bind event play.
       * Triggered when a sound starts playing.
       */
      medias[key].bind($.jPlayer.event.play, function (event, elt) {
        var eltId = $(event.currentTarget).attr('id');
        elt = $(settings.mediaSelector + '[rel=' + eltId + ']');
        if (settings.beforePlay && jQuery.isFunction(settings.beforePlay)) {
          settings.beforePlay(elt);
        }
        if(hasWrapper) {
          wrapperElt.addClass("playing");
        }
      });

      /**
       * Bind event ended.
       * Triggers when a sound ends.
       */
      playerElt.bind($.jPlayer.event.ended, function (event, elt) {
        var eltId = $(event.currentTarget).attr('id');
        elt = $(settings.mediaSelector + '[rel=' + eltId + ']');
        if (settings.afterPlay && jQuery.isFunction(settings.afterPlay)) {
          settings.afterPlay(elt);
        }
        if(hasWrapper) {
          wrapperElt.removeClass("playing");
        }
      });

      mediaLinkElt.click(function(){
        // Play associated media.
        playerElt.jPlayer("play");
        // Return false to avoid link redirection.
        return false;
      });

      $.cofPlayer.currentKey ++;
    });
  }


  /**
   * On sound loaded event.
   * @param key
   * @param duration
   */
  function onLoaded(key, duration) {
    var self = this;
    mediaLoaded ++;
    //var percentLoaded = Math.round(mediaLoaded / totalMedias * 100);
    $(settings.loader.container).jMyLoader('increment-loaded-item');
    var wrapperElt = $(settings.mediaSelector + '[rel=' + settings.keyPrefix + key + ']');
    wrapperElt.removeClass("loading");

    // Update total duration
    self.totalDuration += duration;
  }

  // Init application.
  return this.each(function() {
    var appContainer = $(this);
    init(appContainer);
  });
};

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
    $(this.settings.mediaSelector).hide();
    $(this.settings.mediaSelector + ':first').show();
    $(this.settings.mediaSelector + ':first').addClass(this.settings.activeClass);
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
    this.onFinish();
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