(() => {
  'use strict';

  window.drawImageSignature = (ctx, {right = 52, bottom = 22, size = 20} = {}) => {
    ctx.save();
    ctx.fillStyle = '#64665f';
    ctx.font = `600 ${size}px Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('@zero379198', ctx.canvas.width - right, ctx.canvas.height - bottom);
    ctx.restore();
  };
})();
