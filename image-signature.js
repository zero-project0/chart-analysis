(() => {
  'use strict';

  window.drawImageSignature = (ctx, {
    right = 52, bottom = 39, font = '400 16px Arial,"Yu Gothic UI",sans-serif', color = '#666'
  } = {}) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('@zero379198', ctx.canvas.width - right, ctx.canvas.height - bottom);
    ctx.restore();
  };
})();
