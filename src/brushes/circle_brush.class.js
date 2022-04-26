/**
 * CircleBrush class
 * @class fabric.CircleBrush
 */
fabric.CircleBrush = fabric.util.createClass(fabric.BaseBrush, /** @lends fabric.CircleBrush.prototype */ {

  /**
   * Width of a brush
   * @type Number
   * @default
   */
  width: 10,

  /**
   * Constructor
   * @param {fabric.Canvas} canvas
   * @return {fabric.CircleBrush} Instance of a circle brush
   */
  initialize: function(canvas) {
    this.canvas = canvas;
    this.points = [];
  },

  /**
   * Invoked inside on mouse down and mouse move
   * @param {Object} pointer
   */
  drawDot: function(pointer) {
    var point = this.addPoint(pointer),
        ctx = this.canvas.contextTop;
    this._saveAndTransform(ctx);
    this.dot(ctx, point);
    this._drawClipPath(ctx, this.clipPath);
    ctx.restore();
  },

  dot: function(ctx, point) {
    ctx.fillStyle = point.fill;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
  },

  /**
   * Invoked on mouse down
   */
  onMouseDown: function(pointer) {
    this.points.length = 0;
    this.canvas.clearContext(this.canvas.contextTop);
    this._setShadow();
    this.drawDot(pointer);
  },

  /**
   * @private
   * @param {CanvasRenderingContext2D} ctx
   */
  _render: function (ctx) {
    var i, len, points = this.points;
    for (i = 0, len = points.length; i < len; i++) {
      this.dot(ctx, points[i]);
    }
  },

  /**
   * Invoked on mouse move
   * @param {Object} pointer
   */
  onMouseMove: function(pointer) {
    if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) {
      return;
    }
    if (this.needsFullRender()) {
      this.canvas.clearContext(this.canvas.contextTop);
      this.addPoint(pointer);
      this.render();
    }
    else {
      this.drawDot(pointer);
    }
  },

  /**
   * Invoked on mouse up
   */
  onMouseUp: function () {
    this._finalizeAndAddPath();
  },

  /**
   * @private
   */
  _finalizeAndAddPath: async function () {
    var originalRenderOnAddRemove = this.canvas.renderOnAddRemove, i, len;
    this.canvas.renderOnAddRemove = false;

    var circles = [];

    for (i = 0, len = this.points.length; i < len; i++) {
      var point = this.points[i],
          circle = new fabric.Circle({
            radius: point.radius,
            left: point.x,
            top: point.y,
            originX: 'center',
            originY: 'center',
            fill: point.fill
          });

      this.shadow && (circle.shadow = new fabric.Shadow(this.shadow));
      circles.push(circle);
    }
    var canvas = this.canvas, ctx = canvas.contextTop;
    var group = new fabric.Group(circles, { canvas: canvas });
    await this._addClipPathToResult(group);
    canvas.fire('before:path:created', { path: group });
    canvas.add(group);
    canvas.fire('path:created', { path: group });
    canvas.clearContext(ctx);
    this._resetShadow(ctx);
    canvas.renderOnAddRemove = originalRenderOnAddRemove;
    canvas.requestRenderAll();
  },

  /**
   * @param {Object} pointer
   * @return {fabric.Point} Just added pointer point
   */
  addPoint: function(pointer) {
    var pointerPoint = new fabric.Point(pointer.x, pointer.y),

        circleRadius = fabric.util.getRandomInt(
          Math.max(0, this.width - 20), this.width + 20) / 2,

        circleColor = new fabric.Color(this.color)
          .setAlpha(fabric.util.getRandomInt(0, 100) / 100)
          .toRgba();

    pointerPoint.radius = circleRadius;
    pointerPoint.fill = circleColor;

    this.points.push(pointerPoint);

    return pointerPoint;
  }
});
