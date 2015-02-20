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
