===Balloons jQuery Plugin

Balloons is a probably unuseful jQuery plugin (thanks Euler!), which basically plots circles (balloons) in polar coordinates.

The basic usage is as follows:

```javascript
$('#ex1').balloons({
  css: { /* balloon style */ },
  balloons: [ /* a set of polar coordinates plus the balloon radius */ ],
  timeout: 100,
  html: function(angle, i) {
    return (angle / 180).toFixed(2) + '&pi;';
  },
});
```

Each balloon is specified through an object which defines the radius (computed from the center of the container element) and the angle (computed from the x-axis counterclockwise) at which the balloon is plotted, and the balloon radius itself. For example, to plot a 30px-radius ballon at 100px from the container element's central point, located exactly in the vertical, use:

```javascript
var ballon = {
  angle: 90, // degrees
  radius: 100, // px
  balloonRadius: 30 // px
};
```

...