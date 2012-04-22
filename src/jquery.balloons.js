/*
    This file is part of balloons.js.

    balloons.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Foobar is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */
(function($) {

/**
 * jQuery balloons plugin.
 */
$.fn.balloons = function(options) {
  
  var o = $.extend(true, {

    /**
     * Whether to automatically show the ballons after creation. If this
     * is disabled, you must show the balloons by yourself
     * 
     * @type {Boolean}
     */
    autoshow: false,

    /**
     * A list of ballons to render. Each ballon can specify its own radius,
     * balloonRadius, angle (in degrees), and CSSm or can use the global 
     * settings (see radius, ballonRadius, balloonCss options)
     * 
     * @example
     * var balloons = [{
     *   // a yellow balloon
     *   angle: 35,
     *   radius: 150,
     *   ballonRadius: 50,
     *   css: {
     *     backgroundColor: 'yellow'
     *   }
     * }, {
     *   // a blue balloon which uses global radius, balloonRadius and CSS
     *   // settings
     *   angle: 135
     * }]
     * 
     * @type {Object}
     */
    balloons: [],
    
    /**
     * The default balloon radius in px, used if a balloon does not specify 
     * its own balloonRadius. This may be overriden in individual balloons.
     * 
     * @type {Number}
     */
    balloonRadius: 10,
    
    /**
     * Whether to draw a balloon with the default radius, centered on the
     * origin.
     * 
     * @type {Boolean}
     */
    center: false,
    
    /**
     * The default balloon style, applied to all balloons. This may be 
     * overriden in individual balloons.
     * 
     * @type {Object}
     */
    balloonCss: {}, // global css applied to all balloons
    
    /**
     * The style applied to the origin-centered ballon. Only applies if
     * center option is true.
     * 
     * @type {Object}
     */
    centerCss: { // CSS applied to the centered balloon
      background:'transparent',
      border: '1px dashed #e8e8e8',
      margin: -1,
      opacity: 0.5,
    },
    
    /**
     * Global CSS applied to all ballons. Individual ballons may overwrite
     * this setting.
     * 
     * @param {Object}
     */
    balloonCss: {
      background: '#3089C0',
      boxShadow: '0 1px 5px rgba(0,0,0,0.25)',
      color: 'white',
      cursor: 'pointer',
      fontFamily: "'Droid Sans',sans-serif",
      fontWeight: "bold",
      fontSize: '11px',
      opacity: 0.8,
      position: 'relative',
      textAlign: 'center'
    },
    
    /**
     * The callback used to render the ballon inner element's content.
     * 
     * @type {Function}
     * @param {Number} angle The balloon angle
     * @param {Number} index The balloon index
     */
    html: false,
    
    /**
     * The CSS prefix applied to all plugin generated elements.
     * 
     * @param {String}
     */
    prefix: 'balloon',
    
    /**
     * The default radius. Individual ballons may overwrite
     * this setting.
     * 
     * @param {Number}
     */
    radius: 100,
    
    /**
     * Whether to rotate the balloons content, so they point to the
     * origin point. This may not work in IE7/8
     * 
     * @param {Boolean}
     */
    rotateContent: true,
    
    /**
     * The timeout used to show the balloons.
     * 
     * @param {Number}
     */
    timeout: 500,
    
    /**
     * The number of px which ballons should be expanded/contracted on
     * hover/blur. This can be disabled setting this option to false, 
     * null or undefined.
     * 
     * @param {Number | Boolean}
     */
    expansible: 20
    
  }, options);
  
  /**
   * Balloons class.
   * 
   * @param {jQuery} parent
   */
  Balloons = function(parent) {
    var
      self = this,
      initialized = false,
      enabled = false,
      list = [],
      parent = $(parent),
      container,
      wrapper,
      root,
      center;
    
    // private functions
    var
    
      /**
       * Converts an angle in degrees to radians.
       * 
       * @param {Number} degrees
       * @return {Number} radians
       */
      toRadians = function(degrees) {
        return degrees * (Math.PI / 180);
      },
      
      /**
       * Converts an angle in radians to degrees.
       * 
       * @param {Number} radians
       * @return {Number} degrees
       */
      toDegrees = function(radians) {
        return degrees * (180 / Math.PI);
      },
      
      /**
       * Initializes the balloons plugin.
       * 
       * @return {Balloons}
       */
      init = function() {
        var w, h;
      
        if(initialized) {
          return self;
        }
        
        // create a relative container for all the balloons
        /*parent.css({
          border: '1px solid #e8e8e8',
          margin: -1
        });*/
        
        w = parent.width();
        h = parent.height();
        
        if(w > 0 && h > 0 && w === h) {
          o.radius = w;
        };

        // create a container inside parent to center the root
        // element
        container = $('<div/>')
          .attr('class', o.prefix + '-container')
          .css({
            display: 'block',
            position: 'relative',
            width: 0,
            height: 0
          })
          .appendTo(parent);

        // create an absolutely positioned wrapper
        wrapper = $('<div/>')
          .attr('class', o.prefix + '-wrapper')
          .css({
            display: 'block',
            position: 'absolute',
            left: w/2,
            top: h/2,
            width: 0,
            height: 0
          })
          .appendTo(parent);
        
        // create a relative container for all the balloons
        root = $('<div/>')
          .attr('class', o.prefix + '-container')
          .css({ 
            position: 'relative',
            width: 0,
            height: 0
          })
          .appendTo(wrapper);
        
        initialized = true;
        enable();
        
        if(o.center) {
          center = $('<div/>')
            .attr('class', o.prefix + '-center')
            .css($.extend({}, o.centerCss, {
              position: 'absolute',
              borderRadius: o.radius/2,
              left: -o.radius / 2,
              top: -o.radius / 2,
              width: o.radius,
              height: o.radius
            }))
            .appendTo(root);
        }
        
        // create ballons
        $.each(o.balloons, function(i, b) {
          createBalloon(
            b.angle, 
            b.radius !== undefined ? b.radius : o.radius, 
            b.balloonRadius !== undefined ? b.balloonRadius : o.balloonRadius,
            b.css !== undefined ? b.css : {},
            i
          );
        });
        
        if(o.autoshow) {
          show();
        }
        
        return self
      },
      
      /**
       * Enables the balloons plugin.
       * 
       * @return {Balloons}
       */
      enable = function() {
        if(!initialized || enabled) {
          return self;
        }
        enabled = true;
        
        return self;
      },
      
      /**
       * Creates a new balloon.
       * 
       * @param {Number} angle The angle in degrees
       * @param {Number} radius The radius between the root center and the balloon
       * @param {Number} balloonRadius The balloon radius in pixel
       * @return {Balloons}
       */
      createBalloon = function(angle, radius, balloonRadius, css, index) {
        var radians, x, y, balloon, inner, theta, m11, m12, m21, m22;
        
        if(!initialized || !enabled || 
          typeof angle !== 'number' || 
          typeof radius !== 'number'|| 
          typeof balloonRadius !== 'number') {
          
          console.log('skip');
          
          return this;
        }
        
        // ensure angle is in the [0, 360) range
        if(angle > 360) { // allow angles argument > 360º)
          angle = angle % 360;
        }
        angle = Math.max(0, Math.min(360, angle));
        if(angle === 360) {
          angle = 0;
        }
        
        // convert angle to radians
        radians = toRadians(angle);
        
        // compute balloon position
        x = Math.round(radius * Math.cos(radians));
        y = Math.round(radius * Math.sin(radians) * -1);
        
        //console.log('-- angle = ' + angle + ' (' + radians + ' rads), x = ' + x + ', y = ' + y + ' -- radius = ' + radius + ', balloonRadius = ' + balloonRadius);
        
        // create container
        balloon = $('<div/>')
          .attr('class', o.prefix)
          .css({
            display: 'block',
            position: 'absolute',
            left: x, 
            top: y,
            width: 0,
            height: 0
          })
          .appendTo(root);
        
        inner = $('<div/>')
          .attr('class', o.prefix + '-inner')
          .attr('data-x', x)
          .attr('data-y', y)
          .attr('data-radius', radius)
          .attr('data-angle-degrees', angle)
          .attr('data-angle-radians', radians)
          .attr('data-rotation', 0)
          .attr('data-index', index)
          .css($.extend({}, o.balloonCss, css, {
            display: 'none',
            lineHeight: balloonRadius + 'px',
            borderRadius: balloonRadius/2,
            marginTop: -balloonRadius/2,
            marginLeft: -balloonRadius/2,
            width: balloonRadius,
            height: balloonRadius
          }))
          .html(typeof o.html === 'function' ? o.html(angle, list.length) : Math.round(angle) + 'º' /*html*/)
          .appendTo(balloon);
        
        if(o.border) {
          inner.css({
            border: o.border,
            margin: ((-balloonRadius/2) - 1)
          });
        }
        
        if(o.rotateContent) {
          /* for firefox, safari, chrome, etc. */
          inner.css('-webkit-transform', 'rotate(' + (90 - angle) + 'deg)');
          inner.css('-moz-transform', 'rotate(' + (90 - angle) + 'deg)');
          inner.css('-o-transform', 'rotate(' + (90 - angle) + 'deg)');
          inner.css('transform', 'rotate(' + (90 - angle) + 'deg)');
          /* for ie */
          //inner.css('filter','progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (90 - angle) + ')');
          
          // IE6-9 compatibility ???
          theta = toRadians(90 - angle);
          m11 = Math.cos(theta);
          m12 = -1 * Math.sin(theta); 
          m21 = -m12; 
          m22 = m11;
          
          inner.css('filter', 'progid:DXImageTransform.Microsoft.Matrix(M11=' + m11 + ', M12=' + m12 + ', M21=' + m21 + 'M22=' + m22 + ', SizingMethod="original")');
          inner.css('zoom', 1);
        }
        
        inner.bind('mouseenter', function() {
          if(o.opacity || css.opacity) {
            $(this).css('opacity', 1);
          }
          if(o.expansible) {
            expand(this, balloonRadius);
          }
        }).bind('mouseleave', function() {
          if(o.opacity || css.opacity) {
            $(this).css('opacity', o.opacity);
          }
          if(o.expansible) {
            contract(this, balloonRadius);
          }
        });
        
        list.push(inner);
      },
      
      /**
       * Rotates all ballons the amount specified by offset.
       * 
       * FIXME
       * 
       * @private
       * @param {Number} offset
       * @returns {Balloons}
       */
      rotate = function(offset) {
        if(offset > 360) {
          offset = offset % 360;
        }
        offset = Math.max(0, Math.min(360, offset));
        $.each(list, function(i, b) {
          var
            angle = b.attr('data-angle-degrees') + offset,
            radius = b.attr('data-radius');
          
          // convert angle to radians
          radians = toRadians(angle);
          
          // compute balloon position
          x = Math.round(radius * Math.cos(radians));
          y = Math.round(radius * Math.sin(radians) * -1);
          console.log(x,y);
          // rotate
          b.parent().animate({
            left: x,
            top: y
          }, o.timeout);
          
          /* for firefox, safari, chrome, etc. */
          b.css('-webkit-transform', 'rotate(' + (90 - angle) + 'deg)');
          b.css('-moz-transform', 'rotate(' + (90 - angle) + 'deg)');
          /* for ie */
          b.css('filter','progid:DXImageTransform.Microsoft.BasicImage(rotation=3)');
          
        });
        
        return self;
      },
      
      /**
       * Shows the balloons.
       * 
       * You can chain anything you want to the animation by
       * using the done(), fail() and always() callbacks!
       * 
       * @return {$.Deferred.promise}
       */
      show = function() {
        var dfd = $.Deferred(), p = dfd;

        $.each(list, function(i, b) {
          p = p.pipe(function() {
            var d = $.Deferred();
            
            b.fadeIn('slow');
            
            setTimeout(function() {
              d.resolve()
            }, o.timeout);
            
            return d;
          });
        });
        
        dfd.resolve();
        
        return p;
      },
      
      /**
       * Hides the balloons.
       * 
       * You can chain anything you want to the animation by
       * using the done(), fail() and always() callbacks!
       * 
       * @return {$.Deferred.promise}
       */
      hide = function() {
        
        var dfd = $.Deferred(), p = dfd;

        $.each(list, function(i, b) {
          p = p.pipe(function() {
            var d = $.Deferred();
            
            b.fadeOut('slow');
            
            setTimeout(function() {
              d.resolve();
            }, o.timeout);
            
            return d;
          });
        });
        
        dfd.resolve();
        
        return p;
      },
      
      /**
       * Shows the balloons inmediately.
       * 
       * @return {Balloons}
       */
      showNow = function() {
        $.each(list, function(i, b) {
          b.fadeIn('slow');
        });
        return self;
      },
      
      /**
       * Hides the balloons inmediately.
       * 
       * @return {Balloons}
       */
      hideNow = function() {
        $.each(list, function(i, b) {
          b.fadeOut('slow');
        });
        return self;
      },
      
      /**
       * Expands the balloon.
       * 
       * @private
       * @param {HTMLElement} b
       * @param {Number} r
       * @returns {undefined}
       */
      expand = function(b, r) {
        $(b).stop().animate({
          borderTopLeftRadius: (r + o.expansible)/2,
          borderTopRightRadius: (r + o.expansible)/2,
          borderBottomLeftRadius: (r + o.expansible)/2,
          borderBottomRightRadius: (r + o.expansible)/2,
          marginLeft: -1*(r + o.expansible)/2,
          marginTop: -1*(r + o.expansible)/2,
          width: (r + o.expansible),
          height: (r + o.expansible)/*,
          lineHeight: '+=' + o.expansible/2*/
        }, o.timeout);
      },
      
      /**
       * Contracts the balloon.
       * 
       * @private
       * @param {HTMLElement} b
       * @param {Number} r
       * @returns {undefined}
       */
      contract = function(b, r) {
        $(b).stop().animate({
          borderTopLeftRadius: r/2,
          borderTopRightRadius: r/2,
          borderBottomLeftRadius: r/2,
          borderBottomRightRadius: r/2,
          marginLeft: -r/2,
          marginTop: -r/2,
          width: r,
          height: r/*,
          lineHeight: '-=' + o.expansible/2*/
        }, o.timeout);
      };
      
    // public API
    return {
      init: init,
      show: show,
      hide: hide,
      showNow: showNow,
      hideNow: hideNow,
      rotate: rotate,
      toRadians: toRadians,
      toDegrees: toDegrees
    };
  };
    
  // jQuery plugin implementation
  this.each(function() {
    var api = $(this).data("balloons");
    if(api) {
      console.log("Call to balloons() jQuery plugin on '" + this.id + "' (object already constructed) -> return API.");
      return api;
    }
    
    api = new Balloons(this);
    
    $(this).data("balloons", api);
    
    api.init();
    
    return this;
  });
  
};

}(jQuery));