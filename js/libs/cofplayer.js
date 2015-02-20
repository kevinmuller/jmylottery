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
