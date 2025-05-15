/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 685:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   create: () => (/* binding */ create),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// canvas-confetti v1.9.3 built on 2024-04-30T22:19:17.794Z
var module = {};

// source content
/* globals Map */

(function main(global, module, isWorker, workerSize) {
  var canUseWorker = !!(
    global.Worker &&
    global.Blob &&
    global.Promise &&
    global.OffscreenCanvas &&
    global.OffscreenCanvasRenderingContext2D &&
    global.HTMLCanvasElement &&
    global.HTMLCanvasElement.prototype.transferControlToOffscreen &&
    global.URL &&
    global.URL.createObjectURL);

  var canUsePaths = typeof Path2D === 'function' && typeof DOMMatrix === 'function';
  var canDrawBitmap = (function () {
    // this mostly supports ssr
    if (!global.OffscreenCanvas) {
      return false;
    }

    var canvas = new OffscreenCanvas(1, 1);
    var ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 1, 1);
    var bitmap = canvas.transferToImageBitmap();

    try {
      ctx.createPattern(bitmap, 'no-repeat');
    } catch (e) {
      return false;
    }

    return true;
  })();

  function noop() {}

  // create a promise if it exists, otherwise, just
  // call the function directly
  function promise(func) {
    var ModulePromise = module.exports.Promise;
    var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;

    if (typeof Prom === 'function') {
      return new Prom(func);
    }

    func(noop, noop);

    return null;
  }

  var bitmapMapper = (function (skipTransform, map) {
    // see https://github.com/catdad/canvas-confetti/issues/209
    // creating canvases is actually pretty expensive, so we should create a
    // 1:1 map for bitmap:canvas, so that we can animate the confetti in
    // a performant manner, but also not store them forever so that we don't
    // have a memory leak
    return {
      transform: function(bitmap) {
        if (skipTransform) {
          return bitmap;
        }

        if (map.has(bitmap)) {
          return map.get(bitmap);
        }

        var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);

        map.set(bitmap, canvas);

        return canvas;
      },
      clear: function () {
        map.clear();
      }
    };
  })(canDrawBitmap, new Map());

  var raf = (function () {
    var TIME = Math.floor(1000 / 60);
    var frame, cancel;
    var frames = {};
    var lastFrameTime = 0;

    if (typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function') {
      frame = function (cb) {
        var id = Math.random();

        frames[id] = requestAnimationFrame(function onFrame(time) {
          if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
            lastFrameTime = time;
            delete frames[id];

            cb();
          } else {
            frames[id] = requestAnimationFrame(onFrame);
          }
        });

        return id;
      };
      cancel = function (id) {
        if (frames[id]) {
          cancelAnimationFrame(frames[id]);
        }
      };
    } else {
      frame = function (cb) {
        return setTimeout(cb, TIME);
      };
      cancel = function (timer) {
        return clearTimeout(timer);
      };
    }

    return { frame: frame, cancel: cancel };
  }());

  var getWorker = (function () {
    var worker;
    var prom;
    var resolves = {};

    function decorate(worker) {
      function execute(options, callback) {
        worker.postMessage({ options: options || {}, callback: callback });
      }
      worker.init = function initWorker(canvas) {
        var offscreen = canvas.transferControlToOffscreen();
        worker.postMessage({ canvas: offscreen }, [offscreen]);
      };

      worker.fire = function fireWorker(options, size, done) {
        if (prom) {
          execute(options, null);
          return prom;
        }

        var id = Math.random().toString(36).slice(2);

        prom = promise(function (resolve) {
          function workerDone(msg) {
            if (msg.data.callback !== id) {
              return;
            }

            delete resolves[id];
            worker.removeEventListener('message', workerDone);

            prom = null;

            bitmapMapper.clear();

            done();
            resolve();
          }

          worker.addEventListener('message', workerDone);
          execute(options, id);

          resolves[id] = workerDone.bind(null, { data: { callback: id }});
        });

        return prom;
      };

      worker.reset = function resetWorker() {
        worker.postMessage({ reset: true });

        for (var id in resolves) {
          resolves[id]();
          delete resolves[id];
        }
      };
    }

    return function () {
      if (worker) {
        return worker;
      }

      if (!isWorker && canUseWorker) {
        var code = [
          'var CONFETTI, SIZE = {}, module = {};',
          '(' + main.toString() + ')(this, module, true, SIZE);',
          'onmessage = function(msg) {',
          '  if (msg.data.options) {',
          '    CONFETTI(msg.data.options).then(function () {',
          '      if (msg.data.callback) {',
          '        postMessage({ callback: msg.data.callback });',
          '      }',
          '    });',
          '  } else if (msg.data.reset) {',
          '    CONFETTI && CONFETTI.reset();',
          '  } else if (msg.data.resize) {',
          '    SIZE.width = msg.data.resize.width;',
          '    SIZE.height = msg.data.resize.height;',
          '  } else if (msg.data.canvas) {',
          '    SIZE.width = msg.data.canvas.width;',
          '    SIZE.height = msg.data.canvas.height;',
          '    CONFETTI = module.exports.create(msg.data.canvas);',
          '  }',
          '}',
        ].join('\n');
        try {
          worker = new Worker(URL.createObjectURL(new Blob([code])));
        } catch (e) {
          // eslint-disable-next-line no-console
          typeof console !== undefined && typeof console.warn === 'function' ? console.warn('🎊 Could not load worker', e) : null;

          return null;
        }

        decorate(worker);
      }

      return worker;
    };
  })();

  var defaults = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ['square', 'circle'],
    zIndex: 100,
    colors: [
      '#26ccff',
      '#a25afd',
      '#ff5e7e',
      '#88ff5a',
      '#fcff42',
      '#ffa62d',
      '#ff36ff'
    ],
    // probably should be true, but back-compat
    disableForReducedMotion: false,
    scalar: 1
  };

  function convert(val, transform) {
    return transform ? transform(val) : val;
  }

  function isOk(val) {
    return !(val === null || val === undefined);
  }

  function prop(options, name, transform) {
    return convert(
      options && isOk(options[name]) ? options[name] : defaults[name],
      transform
    );
  }

  function onlyPositiveInt(number){
    return number < 0 ? 0 : Math.floor(number);
  }

  function randomInt(min, max) {
    // [min, max)
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function toDecimal(str) {
    return parseInt(str, 16);
  }

  function colorsToRgb(colors) {
    return colors.map(hexToRgb);
  }

  function hexToRgb(str) {
    var val = String(str).replace(/[^0-9a-f]/gi, '');

    if (val.length < 6) {
        val = val[0]+val[0]+val[1]+val[1]+val[2]+val[2];
    }

    return {
      r: toDecimal(val.substring(0,2)),
      g: toDecimal(val.substring(2,4)),
      b: toDecimal(val.substring(4,6))
    };
  }

  function getOrigin(options) {
    var origin = prop(options, 'origin', Object);
    origin.x = prop(origin, 'x', Number);
    origin.y = prop(origin, 'y', Number);

    return origin;
  }

  function setCanvasWindowSize(canvas) {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
  }

  function setCanvasRectSize(canvas) {
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  function getCanvas(zIndex) {
    var canvas = document.createElement('canvas');

    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = zIndex;

    return canvas;
  }

  function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(radiusX, radiusY);
    context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
    context.restore();
  }

  function randomPhysics(opts) {
    var radAngle = opts.angle * (Math.PI / 180);
    var radSpread = opts.spread * (Math.PI / 180);

    return {
      x: opts.x,
      y: opts.y,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
      velocity: (opts.startVelocity * 0.5) + (Math.random() * opts.startVelocity),
      angle2D: -radAngle + ((0.5 * radSpread) - (Math.random() * radSpread)),
      tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
      color: opts.color,
      shape: opts.shape,
      tick: 0,
      totalTicks: opts.ticks,
      decay: opts.decay,
      drift: opts.drift,
      random: Math.random() + 2,
      tiltSin: 0,
      tiltCos: 0,
      wobbleX: 0,
      wobbleY: 0,
      gravity: opts.gravity * 3,
      ovalScalar: 0.6,
      scalar: opts.scalar,
      flat: opts.flat
    };
  }

  function updateFetti(context, fetti) {
    fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
    fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
    fetti.velocity *= fetti.decay;

    if (fetti.flat) {
      fetti.wobble = 0;
      fetti.wobbleX = fetti.x + (10 * fetti.scalar);
      fetti.wobbleY = fetti.y + (10 * fetti.scalar);

      fetti.tiltSin = 0;
      fetti.tiltCos = 0;
      fetti.random = 1;
    } else {
      fetti.wobble += fetti.wobbleSpeed;
      fetti.wobbleX = fetti.x + ((10 * fetti.scalar) * Math.cos(fetti.wobble));
      fetti.wobbleY = fetti.y + ((10 * fetti.scalar) * Math.sin(fetti.wobble));

      fetti.tiltAngle += 0.1;
      fetti.tiltSin = Math.sin(fetti.tiltAngle);
      fetti.tiltCos = Math.cos(fetti.tiltAngle);
      fetti.random = Math.random() + 2;
    }

    var progress = (fetti.tick++) / fetti.totalTicks;

    var x1 = fetti.x + (fetti.random * fetti.tiltCos);
    var y1 = fetti.y + (fetti.random * fetti.tiltSin);
    var x2 = fetti.wobbleX + (fetti.random * fetti.tiltCos);
    var y2 = fetti.wobbleY + (fetti.random * fetti.tiltSin);

    context.fillStyle = 'rgba(' + fetti.color.r + ', ' + fetti.color.g + ', ' + fetti.color.b + ', ' + (1 - progress) + ')';

    context.beginPath();

    if (canUsePaths && fetti.shape.type === 'path' && typeof fetti.shape.path === 'string' && Array.isArray(fetti.shape.matrix)) {
      context.fill(transformPath2D(
        fetti.shape.path,
        fetti.shape.matrix,
        fetti.x,
        fetti.y,
        Math.abs(x2 - x1) * 0.1,
        Math.abs(y2 - y1) * 0.1,
        Math.PI / 10 * fetti.wobble
      ));
    } else if (fetti.shape.type === 'bitmap') {
      var rotation = Math.PI / 10 * fetti.wobble;
      var scaleX = Math.abs(x2 - x1) * 0.1;
      var scaleY = Math.abs(y2 - y1) * 0.1;
      var width = fetti.shape.bitmap.width * fetti.scalar;
      var height = fetti.shape.bitmap.height * fetti.scalar;

      var matrix = new DOMMatrix([
        Math.cos(rotation) * scaleX,
        Math.sin(rotation) * scaleX,
        -Math.sin(rotation) * scaleY,
        Math.cos(rotation) * scaleY,
        fetti.x,
        fetti.y
      ]);

      // apply the transform matrix from the confetti shape
      matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));

      var pattern = context.createPattern(bitmapMapper.transform(fetti.shape.bitmap), 'no-repeat');
      pattern.setTransform(matrix);

      context.globalAlpha = (1 - progress);
      context.fillStyle = pattern;
      context.fillRect(
        fetti.x - (width / 2),
        fetti.y - (height / 2),
        width,
        height
      );
      context.globalAlpha = 1;
    } else if (fetti.shape === 'circle') {
      context.ellipse ?
        context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) :
        ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
    } else if (fetti.shape === 'star') {
      var rot = Math.PI / 2 * 3;
      var innerRadius = 4 * fetti.scalar;
      var outerRadius = 8 * fetti.scalar;
      var x = fetti.x;
      var y = fetti.y;
      var spikes = 5;
      var step = Math.PI / spikes;

      while (spikes--) {
        x = fetti.x + Math.cos(rot) * outerRadius;
        y = fetti.y + Math.sin(rot) * outerRadius;
        context.lineTo(x, y);
        rot += step;

        x = fetti.x + Math.cos(rot) * innerRadius;
        y = fetti.y + Math.sin(rot) * innerRadius;
        context.lineTo(x, y);
        rot += step;
      }
    } else {
      context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
      context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
      context.lineTo(Math.floor(x2), Math.floor(y2));
      context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
    }

    context.closePath();
    context.fill();

    return fetti.tick < fetti.totalTicks;
  }

  function animate(canvas, fettis, resizer, size, done) {
    var animatingFettis = fettis.slice();
    var context = canvas.getContext('2d');
    var animationFrame;
    var destroy;

    var prom = promise(function (resolve) {
      function onDone() {
        animationFrame = destroy = null;

        context.clearRect(0, 0, size.width, size.height);
        bitmapMapper.clear();

        done();
        resolve();
      }

      function update() {
        if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
          size.width = canvas.width = workerSize.width;
          size.height = canvas.height = workerSize.height;
        }

        if (!size.width && !size.height) {
          resizer(canvas);
          size.width = canvas.width;
          size.height = canvas.height;
        }

        context.clearRect(0, 0, size.width, size.height);

        animatingFettis = animatingFettis.filter(function (fetti) {
          return updateFetti(context, fetti);
        });

        if (animatingFettis.length) {
          animationFrame = raf.frame(update);
        } else {
          onDone();
        }
      }

      animationFrame = raf.frame(update);
      destroy = onDone;
    });

    return {
      addFettis: function (fettis) {
        animatingFettis = animatingFettis.concat(fettis);

        return prom;
      },
      canvas: canvas,
      promise: prom,
      reset: function () {
        if (animationFrame) {
          raf.cancel(animationFrame);
        }

        if (destroy) {
          destroy();
        }
      }
    };
  }

  function confettiCannon(canvas, globalOpts) {
    var isLibCanvas = !canvas;
    var allowResize = !!prop(globalOpts || {}, 'resize');
    var hasResizeEventRegistered = false;
    var globalDisableForReducedMotion = prop(globalOpts, 'disableForReducedMotion', Boolean);
    var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, 'useWorker');
    var worker = shouldUseWorker ? getWorker() : null;
    var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
    var initialized = (canvas && worker) ? !!canvas.__confetti_initialized : false;
    var preferLessMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion)').matches;
    var animationObj;

    function fireLocal(options, size, done) {
      var particleCount = prop(options, 'particleCount', onlyPositiveInt);
      var angle = prop(options, 'angle', Number);
      var spread = prop(options, 'spread', Number);
      var startVelocity = prop(options, 'startVelocity', Number);
      var decay = prop(options, 'decay', Number);
      var gravity = prop(options, 'gravity', Number);
      var drift = prop(options, 'drift', Number);
      var colors = prop(options, 'colors', colorsToRgb);
      var ticks = prop(options, 'ticks', Number);
      var shapes = prop(options, 'shapes');
      var scalar = prop(options, 'scalar');
      var flat = !!prop(options, 'flat');
      var origin = getOrigin(options);

      var temp = particleCount;
      var fettis = [];

      var startX = canvas.width * origin.x;
      var startY = canvas.height * origin.y;

      while (temp--) {
        fettis.push(
          randomPhysics({
            x: startX,
            y: startY,
            angle: angle,
            spread: spread,
            startVelocity: startVelocity,
            color: colors[temp % colors.length],
            shape: shapes[randomInt(0, shapes.length)],
            ticks: ticks,
            decay: decay,
            gravity: gravity,
            drift: drift,
            scalar: scalar,
            flat: flat
          })
        );
      }

      // if we have a previous canvas already animating,
      // add to it
      if (animationObj) {
        return animationObj.addFettis(fettis);
      }

      animationObj = animate(canvas, fettis, resizer, size , done);

      return animationObj.promise;
    }

    function fire(options) {
      var disableForReducedMotion = globalDisableForReducedMotion || prop(options, 'disableForReducedMotion', Boolean);
      var zIndex = prop(options, 'zIndex', Number);

      if (disableForReducedMotion && preferLessMotion) {
        return promise(function (resolve) {
          resolve();
        });
      }

      if (isLibCanvas && animationObj) {
        // use existing canvas from in-progress animation
        canvas = animationObj.canvas;
      } else if (isLibCanvas && !canvas) {
        // create and initialize a new canvas
        canvas = getCanvas(zIndex);
        document.body.appendChild(canvas);
      }

      if (allowResize && !initialized) {
        // initialize the size of a user-supplied canvas
        resizer(canvas);
      }

      var size = {
        width: canvas.width,
        height: canvas.height
      };

      if (worker && !initialized) {
        worker.init(canvas);
      }

      initialized = true;

      if (worker) {
        canvas.__confetti_initialized = true;
      }

      function onResize() {
        if (worker) {
          // TODO this really shouldn't be immediate, because it is expensive
          var obj = {
            getBoundingClientRect: function () {
              if (!isLibCanvas) {
                return canvas.getBoundingClientRect();
              }
            }
          };

          resizer(obj);

          worker.postMessage({
            resize: {
              width: obj.width,
              height: obj.height
            }
          });
          return;
        }

        // don't actually query the size here, since this
        // can execute frequently and rapidly
        size.width = size.height = null;
      }

      function done() {
        animationObj = null;

        if (allowResize) {
          hasResizeEventRegistered = false;
          global.removeEventListener('resize', onResize);
        }

        if (isLibCanvas && canvas) {
          if (document.body.contains(canvas)) {
            document.body.removeChild(canvas); 
          }
          canvas = null;
          initialized = false;
        }
      }

      if (allowResize && !hasResizeEventRegistered) {
        hasResizeEventRegistered = true;
        global.addEventListener('resize', onResize, false);
      }

      if (worker) {
        return worker.fire(options, size, done);
      }

      return fireLocal(options, size, done);
    }

    fire.reset = function () {
      if (worker) {
        worker.reset();
      }

      if (animationObj) {
        animationObj.reset();
      }
    };

    return fire;
  }

  // Make default export lazy to defer worker creation until called.
  var defaultFire;
  function getDefaultFire() {
    if (!defaultFire) {
      defaultFire = confettiCannon(null, { useWorker: true, resize: true });
    }
    return defaultFire;
  }

  function transformPath2D(pathString, pathMatrix, x, y, scaleX, scaleY, rotation) {
    var path2d = new Path2D(pathString);

    var t1 = new Path2D();
    t1.addPath(path2d, new DOMMatrix(pathMatrix));

    var t2 = new Path2D();
    // see https://developer.mozilla.org/en-US/docs/Web/API/DOMMatrix/DOMMatrix
    t2.addPath(t1, new DOMMatrix([
      Math.cos(rotation) * scaleX,
      Math.sin(rotation) * scaleX,
      -Math.sin(rotation) * scaleY,
      Math.cos(rotation) * scaleY,
      x,
      y
    ]));

    return t2;
  }

  function shapeFromPath(pathData) {
    if (!canUsePaths) {
      throw new Error('path confetti are not supported in this browser');
    }

    var path, matrix;

    if (typeof pathData === 'string') {
      path = pathData;
    } else {
      path = pathData.path;
      matrix = pathData.matrix;
    }

    var path2d = new Path2D(path);
    var tempCanvas = document.createElement('canvas');
    var tempCtx = tempCanvas.getContext('2d');

    if (!matrix) {
      // attempt to figure out the width of the path, up to 1000x1000
      var maxSize = 1000;
      var minX = maxSize;
      var minY = maxSize;
      var maxX = 0;
      var maxY = 0;
      var width, height;

      // do some line skipping... this is faster than checking
      // every pixel and will be mostly still correct
      for (var x = 0; x < maxSize; x += 2) {
        for (var y = 0; y < maxSize; y += 2) {
          if (tempCtx.isPointInPath(path2d, x, y, 'nonzero')) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      width = maxX - minX;
      height = maxY - minY;

      var maxDesiredSize = 10;
      var scale = Math.min(maxDesiredSize/width, maxDesiredSize/height);

      matrix = [
        scale, 0, 0, scale,
        -Math.round((width/2) + minX) * scale,
        -Math.round((height/2) + minY) * scale
      ];
    }

    return {
      type: 'path',
      path: path,
      matrix: matrix
    };
  }

  function shapeFromText(textData) {
    var text,
        scalar = 1,
        color = '#000000',
        // see https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/
        fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';

    if (typeof textData === 'string') {
      text = textData;
    } else {
      text = textData.text;
      scalar = 'scalar' in textData ? textData.scalar : scalar;
      fontFamily = 'fontFamily' in textData ? textData.fontFamily : fontFamily;
      color = 'color' in textData ? textData.color : color;
    }

    // all other confetti are 10 pixels,
    // so this pixel size is the de-facto 100% scale confetti
    var fontSize = 10 * scalar;
    var font = '' + fontSize + 'px ' + fontFamily;

    var canvas = new OffscreenCanvas(fontSize, fontSize);
    var ctx = canvas.getContext('2d');

    ctx.font = font;
    var size = ctx.measureText(text);
    var width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
    var height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);

    var padding = 2;
    var x = size.actualBoundingBoxLeft + padding;
    var y = size.actualBoundingBoxAscent + padding;
    width += padding + padding;
    height += padding + padding;

    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.fillStyle = color;

    ctx.fillText(text, x, y);

    var scale = 1 / scalar;

    return {
      type: 'bitmap',
      // TODO these probably need to be transfered for workers
      bitmap: canvas.transferToImageBitmap(),
      matrix: [scale, 0, 0, scale, -width * scale / 2, -height * scale / 2]
    };
  }

  module.exports = function() {
    return getDefaultFire().apply(this, arguments);
  };
  module.exports.reset = function() {
    getDefaultFire().reset();
  };
  module.exports.create = confettiCannon;
  module.exports.shapeFromPath = shapeFromPath;
  module.exports.shapeFromText = shapeFromText;
}((function () {
  if (typeof window !== 'undefined') {
    return window;
  }

  if (typeof self !== 'undefined') {
    return self;
  }

  return this || {};
})(), module, false));

// end source content

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (module.exports);
var create = module.exports.create;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// NAMESPACE OBJECT: ./js/features/cardassignments.js
var cardassignments_namespaceObject = {};
__webpack_require__.r(cardassignments_namespaceObject);
__webpack_require__.d(cardassignments_namespaceObject, {
  s8: () => (createCardAssignment),
  zy: () => (loadCardAssignments),
  an: () => (setupCardAssignments)
});

;// ./js/api.js
const domain = window.location.origin;
const api_current_page = window.location.pathname;
let assignments = null;
let api_grades = null;
let announcements = (/* unused pure expression or super */ null && ([]));
let api_options = {};
let timeCheck = null;
let api_cardAssignments;


;// ./js/features/cardassignments.js




function createCardAssignment(assignment) {
    let assignmentContainer = document.createElement("div");
    assignmentContainer.className = "bettercanvas-assignment-container";
    let assignmentName = util_makeElement("a", assignmentContainer, { "className": "bettercanvas-assignment-link", "textContent": assignment.plannable.title, "href": assignment.html_url });
    let assignmentDueAt = util_makeElement("span", assignmentContainer, { "className": "bettercanvas-assignment-dueat", "textContent": formatCardDue(new Date(assignment.plannable_date)) });
    if (assignment.overdue === true) assignmentDueAt.classList.add("bettercanvas-assignment-overdue");
    if (assignment?.submissions?.submitted === true) {
        assignmentContainer.classList.add("bettercanvas-completed");
    } else {
        if (api_options.assignment_states[assignment.plannable_id]?.["crs"] === true) {
            assignmentContainer.classList.add("bettercanvas-completed");
        }
    }
    assignmentDueAt.addEventListener('mouseup', function () {
        assignmentContainer.classList.toggle("bettercanvas-completed");
        const status = assignmentContainer.classList.contains("bettercanvas-completed");
        setAssignmentState(assignment.plannable_id, { "crs": status, "expire": assignment.plannable_date });
    });
    return assignmentContainer;
}

function loadCardAssignments() {
    if (api_options.assignments_due !== true) {
        document.querySelectorAll(".bettercanvas-card-assignment").forEach(card => {
            card.style.display = "none";
        });
        return;
    }
    api_cardAssignments.then(els => {
        try {
            let cards = document.querySelectorAll('.ic-DashboardCard');
            if (cards.length === 0) return;
            const now = new Date();

            cards.forEach(card => {
                let count = 0;
                let link = card.querySelector(".ic-DashboardCard__link");
                if (!link) return;
                let course_id = link.href.split("courses/")[1];
                let cardContainer = card.querySelector('.bettercanvas-card-container');
                cardContainer.textContent = "";
                cardContainer.parentElement.style.display = "block";

                if (els[course_id]) {
                    els[course_id].forEach(assignment => {
                        if (count >= api_options.num_assignments) return;
                        if (api_options.hide_completed_cards === true && assignment.submitted === true) return;
                        if ((api_options.card_overdues !== true && now >= assignment.due) || (api_options.card_overdues === true && assignment.submitted === true)) return;
                        if (assignment.type !== "assignment" && assignment.type !== "quiz" && assignment.type !== "discussion_topic") return;
                        if (assignment.override === true) return;
                        //assignment.el.querySelector(".bettercanvas-assignment-dueat").textContent = formatCardDue(assignment.due);
                        cardContainer.appendChild(assignment.el);
                        count++;
                    });
                }

                if (count === 0) {
                    let assignmentContainer = util_makeElement("div", cardContainer, { "className": "bettercanvas-assignment-container" });
                    let assignmentDivLink = util_makeElement("a", assignmentContainer, { "className": "bettercanvas-assignment-link", "textContent": "None" });
                }
            });
        } catch (e) {
            util_logError(e);
        }
    });
}

/*
export function loadCardAssignments2(c = null) {
    if (options.assignments_due === true) {
        try {
            assignments.then(data => {
                //assignmentData = assignmentData === null ? data : assignmentData; ????
                let items = combineAssignments(data);
                let cards = c ? c : document.querySelectorAll('.ic-DashboardCard');
                const now = new Date();

                cards.forEach(card => {
                    let count = 0;
                    let course_id = parseInt(card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1]);
                    let cardContainer = card.querySelector('.bettercanvas-card-container');
                    cardContainer.textContent = "";
                    cardContainer.parentElement.style.display = "block";

                    items.forEach(assignment => {
                        let due = new Date(assignment.plannable_date);
                        // lots of checks to make
                        // 1. item belongs to card
                        // 2. haven't exceeded item limit
                        // 3. assignment hasn't been submitted (if hide completed option is on)
                        // 4. disallow overdue and item not past due/allow overdue and item hasn't been submitted
                        // 5. correct item type
                        // 6. no planner override marking item complete
                        if (course_id !== assignment.course_id) return;
                        if (count >= options.num_assignments) return;
                        if (options.hide_completed === true && assignment.submissions.submitted === true) return;
                        if ((options.card_overdues !== true && now >= due) || (options.card_overdues === true && assignment.submissions.submitted === true)) return;
                        if ((assignment.plannable_type !== "assignment" && assignment.plannable_type !== "quiz" && assignment.plannable_type !== "discussion_topic")) return;
                        if (assignment.planner_override && assignment.planner_override.marked_complete === true) return;

                        createCardAssignment(cardContainer, assignment, now >= due);
                        count++;
                    });

                    if (count === 0) {
                        let assignmentContainer = makeElement("div", "bettercanvas-assignment-container", cardContainer);
                        let assignmentDivLink = makeElement("a", "bettercanvas-assignment-link", assignmentContainer, "None");
                    }
                });
            });
        } catch (e) {
            logError(e);
        }
    } else {
        document.querySelectorAll(".bettercanvas-card-assignment").forEach(card => {
            card.style.display = "none";
        });
    }
}
*/

function setupCardAssignments() {
    if (api_options.assignments_due !== true) return;
    try {
        if (document.querySelectorAll('.ic-DashboardCard').length > 0 && document.querySelectorAll('.bettercanvas-card-container').length > 0) return;
        let cards = document.querySelectorAll('.ic-DashboardCard');
        cards.forEach(card => {
            let assignmentContainer = card.querySelector(".bettercanvas-card-assignment") || util_makeElement("div", card, { "className": "bettercanvas-card-assignment" });
            let assignmentsDueHeader = card.querySelector(".bettercanvas-card-header-container") || util_makeElement("div", assignmentContainer, { "className": "bettercanvas-card-header-container" });
            let assignmentsDueLabel = card.querySelector(".bettercanvas-card-header") || util_makeElement("h3", assignmentsDueHeader, { "className": "bettercanvas-card-header", "textContent": chrome.i18n.getMessage("due") });
            let cardContainer = card.querySelector(".bettercanvas-card-container") || util_makeElement("div", assignmentContainer, { "className": "bettercanvas-card-container" });
            let skeletonText = card.querySelector(".bettercanvas-skeleton-text") || util_makeElement("div", cardContainer, { "className": "bettercanvas-skeleton-text" });
        });
    } catch (e) {
        util_logError(e);
    }
}


;// ./js/util.js





//const apiurl = "http://localhost:3000";
const apiurl = "https://bettercanvas.diditupe.dev";

function hexToRgb(hex) {
    let match = (/#(.{2})(.{2})(.{2})/).exec(hex);
    if (match) {
        return { "r": parseInt(match[1], 16), "g": parseInt(match[2], 16), "b": parseInt(match[3], 16) };
    }
}

function getGrades() {
    if (api_options.gpa_calc === true || api_options.dashboard_grades === true) {
        api_grades = getData(`${domain}/api/v1/courses?${/*enrollment_state=active&*/""}include[]=concluded&include[]=total_scores&include[]=computed_current_score&include[]=current_grading_period_scores&per_page=100`);
    }
}

function getColors() {
    if (api_options.tab_icons || api_options.todo_colors) {
        let colors = getData(`${domain}/api/v1/users/self/colors`);
        colors.then(data => {
            let cards = api_options.custom_cards_3;
            Object.keys(cards).forEach(key => {
                cards[key] = { ...cards[key], "color": data["custom_colors"]["course_" + key] ? data["custom_colors"]["course_" + key] : null };
            });
            chrome.storage.sync.set({ "custom_cards_3": cards });
        });
    }
}

function changeFavicon() {
    if (api_options.tab_icons !== true) return;
    let match = api_current_page.match(/courses\/(?<id>\d*)/);
    if (match && match.groups.id && api_options.custom_cards_3[match.groups.id]?.color) {
        document.querySelector('link[rel="icon"').href = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="white" width="128px" height="128px" viewBox="-192 -192 2304.00 2304.00" stroke="white"><g stroke-width="0"><rect x="-192" y="-192" width="2304.00" height="2304.00" rx="0" fill="${api_options.custom_cards_3[match.groups.id].color.replace("#", "%23")}" strokewidth="0"/></g><g stroke-linecap="round" stroke-linejoin="round"/><g> <path d="M958.568 277.97C1100.42 277.97 1216.48 171.94 1233.67 34.3881 1146.27 12.8955 1054.57 0 958.568 0 864.001 0 770.867 12.8955 683.464 34.3881 700.658 171.94 816.718 277.97 958.568 277.97ZM35.8207 682.031C173.373 699.225 279.403 815.285 279.403 957.136 279.403 1098.99 173.373 1215.05 35.8207 1232.24 12.8953 1144.84 1.43262 1051.7 1.43262 957.136 1.43262 862.569 12.8953 769.434 35.8207 682.031ZM528.713 957.142C528.713 1005.41 489.581 1044.55 441.31 1044.55 393.038 1044.55 353.907 1005.41 353.907 957.142 353.907 908.871 393.038 869.74 441.31 869.74 489.581 869.74 528.713 908.871 528.713 957.142ZM1642.03 957.136C1642.03 1098.99 1748.06 1215.05 1885.61 1232.24 1908.54 1144.84 1920 1051.7 1920 957.136 1920 862.569 1908.54 769.434 1885.61 682.031 1748.06 699.225 1642.03 815.285 1642.03 957.136ZM1567.51 957.142C1567.51 1005.41 1528.38 1044.55 1480.11 1044.55 1431.84 1044.55 1392.71 1005.41 1392.71 957.142 1392.71 908.871 1431.84 869.74 1480.11 869.74 1528.38 869.74 1567.51 908.871 1567.51 957.142ZM958.568 1640.6C816.718 1640.6 700.658 1746.63 683.464 1884.18 770.867 1907.11 864.001 1918.57 958.568 1918.57 1053.14 1918.57 1146.27 1907.11 1233.67 1884.18 1216.48 1746.63 1100.42 1640.6 958.568 1640.6ZM1045.98 1480.11C1045.98 1528.38 1006.85 1567.51 958.575 1567.51 910.304 1567.51 871.172 1528.38 871.172 1480.11 871.172 1431.84 910.304 1392.71 958.575 1392.71 1006.85 1392.71 1045.98 1431.84 1045.98 1480.11ZM1045.98 439.877C1045.98 488.148 1006.85 527.28 958.575 527.28 910.304 527.28 871.172 488.148 871.172 439.877 871.172 391.606 910.304 352.474 958.575 352.474 1006.85 352.474 1045.98 391.606 1045.98 439.877ZM1441.44 1439.99C1341.15 1540.29 1333.98 1697.91 1418.52 1806.8 1579 1712.23 1713.68 1577.55 1806.82 1418.5 1699.35 1332.53 1541.74 1339.7 1441.44 1439.99ZM1414.21 1325.37C1414.21 1373.64 1375.08 1412.77 1326.8 1412.77 1278.53 1412.77 1239.4 1373.64 1239.4 1325.37 1239.4 1277.1 1278.53 1237.97 1326.8 1237.97 1375.08 1237.97 1414.21 1277.1 1414.21 1325.37ZM478.577 477.145C578.875 376.846 586.039 219.234 501.502 110.339 341.024 204.906 206.338 339.592 113.203 498.637 220.666 584.607 378.278 576.01 478.577 477.145ZM679.155 590.32C679.155 638.591 640.024 677.723 591.752 677.723 543.481 677.723 504.349 638.591 504.349 590.32 504.349 542.048 543.481 502.917 591.752 502.917 640.024 502.917 679.155 542.048 679.155 590.32ZM1440 475.712C1540.3 576.01 1697.91 583.174 1806.8 498.637 1712.24 338.159 1577.55 203.473 1418.51 110.339 1332.54 217.801 1341.13 375.413 1440 475.712ZM1414.21 590.32C1414.21 638.591 1375.08 677.723 1326.8 677.723 1278.53 677.723 1239.4 638.591 1239.4 590.32 1239.4 542.048 1278.53 502.917 1326.8 502.917 1375.08 502.917 1414.21 542.048 1414.21 590.32ZM477.145 1438.58C376.846 1338.28 219.234 1331.12 110.339 1415.65 204.906 1576.13 339.593 1710.82 498.637 1805.39 584.607 1696.49 577.443 1538.88 477.145 1438.58ZM679.155 1325.37C679.155 1373.64 640.024 1412.77 591.752 1412.77 543.481 1412.77 504.349 1373.64 504.349 1325.37 504.349 1277.1 543.481 1237.97 591.752 1237.97 640.024 1237.97 679.155 1277.1 679.155 1325.37Z"/></g></svg>`;
    }
}

async function addAssignmentsToRecap(data) {
    /*
    if (data === null) return;
    const items = await data;
    const storage = await chrome.storage.sync.get(["recap_assignments", "recap_announcements"]);
    const assignments = [...new Set(items.filter(item => item.plannable_type !== "announcement").map(item => item.plannable_id).concat(storage["recap_assignments"] || []))];
    const announcements = [...new Set(items.filter(item => item.plannable_type === "announcement").map(item => item.plannable_id).concat(storage["recap_announcements"] || []))];
    console.log(assignments, announcements);
    console.log(items);

    if (storage["recap_assignments"].length === assignments.length && storage["recap_announcements"].length === announcements.length) return;

    await chrome.storage.sync.set({ "recap_assignments": assignments, "recap_announcements": announcements });
    */
}


function getAssignments() {
    if (api_options.assignments_due === true || api_options.better_todo === true) {
        let weekAgo = new Date(new Date() - 604800000);
        //let weekAgo = new Date(new Date() - (604800000 * 10));
        assignments = getData(`${domain}/api/v1/planner/items?start_date=${weekAgo.toISOString()}&per_page=75`);
        api_cardAssignments = preloadAssignmentEls();
        addAssignmentsToRecap(assignments);
    }
}

function getApiData() {
    if (api_current_page === "/" || api_current_page === "") {
        getAssignments();
        getGrades();
        getColors();
    }
}


function util_makeElement(element, location, options) {
    let creation = document.createElement(element);
    Object.keys(options).forEach(key => {
        creation[key] = options[key];
    });
    location.appendChild(creation);
    return creation
}

function initElement(element, location, options, initFn) {
    let creation = document.createElement(element);
    Object.keys(options).forEach(key => {
        creation[key] = options[key];
    });
    location.appendChild(creation);
    initFn(creation);
    return creation
}


function makeElement2(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}

async function getData(url) {
    let response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    let data = await response.json();
    return data
}

function hexToHsl(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return rgbToHsl(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16));
}

function rgbToHex(rgb) {
    try {
        let pat = /^rgb\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/;
        let exec = pat.exec(rgb);
        return "#" + parseInt(exec[1]).toString(16).padStart(2, "0") + parseInt(exec[2]).toString(16).padStart(2, "0") + parseInt(exec[3]).toString(16).padStart(2, "0");
    } catch (e) {
        console.warn(e);
    }
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max == min) {
        h = s = 0;
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0); break;
            case g:
                h = (b - r) / d + 2; break;
            case b:
                h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function getRelativeDate(date, short = false) {

    let now = new Date();

    let timeSince = (now.getTime() - date.getTime()) / 60000;
    let time = "min";
    timeSince = Math.abs(timeSince);
    if (timeSince >= 60) {
        timeSince /= 60;
        time = short ? "h" : "hour";
        if (timeSince >= 24) {
            timeSince /= 24;
            time = short ? "d" : "day";
            if (timeSince >= 7) {
                timeSince /= 7;
                time = short ? "w" : "week";
            }
        }
    }
    timeSince = Math.round(timeSince);
    let relative = timeSince + (short ? "" : " ") + time + (timeSince > 1 && !short ? "s" : "");
    return { time: relative, ms: now.getTime() - date.getTime() };
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatTodoDate(date, submissions, hr24) {
    let { time, ms } = getRelativeDate(date);
    let fromNow = ms < 0 ? "in " + time : time + " ago";
    let dueSoon = false;
    if (submissions && submissions.submitted === false && ms >= -21600000) {
        dueSoon = true;
    }
    return { "dueSoon": dueSoon, "date": months[date.getMonth()] + " " + date.getDate() + " at " + (date.getHours() - (hr24 ? "" : date.getHours() > 12 ? 12 : 0)) + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + (hr24 ? "" : date.getHours() >= 12 ? "pm" : "am"), "fromnow": " (" + fromNow + ")" };
}

function formatCardDue(date) {
    let due = new Date(date);
    if (api_options.relative_dues === true) {
        let relative = getRelativeDate(due, true);
        return relative.ms > 0 ? relative.time + " ago" : "in " + relative.time;
    }
    return api_options.assignment_date_format ? (due.getDate()) + "/" + (due.getMonth() + 1) : (due.getMonth() + 1) + "/" + (due.getDate());
}

function util_logError(e) {
    chrome.storage.local.get("errors", storage => {
        if (storage.errors.length > 20) {
            storage["errors"] = [];
        }
        chrome.storage.local.set({ "errors": storage["errors"].concat(e.stack) });

        console.log(e.stack);
        console.log(storage["errors"].concat(e.stack));
    })

}

const CSRFtoken = function () {
    return decodeURIComponent((document.cookie.match('(^|;) *_csrf_token=([^;]*)') || '')[2])
}

function combineAssignments(data) {
    let combined = data;
    try {
        api_options["custom_assignments_overflow"].forEach(overflow => {
            combined = combined.concat(api_options[overflow]);
        });
    } catch (e) {
        util_logError(e);
    }
    return combined.sort((a, b) => new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime());
}

function cleanCustomAssignments() {
    chrome.storage.sync.get("custom_assignments_overflow", overflows => {
        chrome.storage.sync.get(overflows["custom_assignments_overflow"], storage => {
            const now = new Date();

            overflows["custom_assignments_overflow"].forEach(overflow => {
                let changed = false;
                for (let i = 0; i < storage[overflow].length; i++) {
                    let assignmentDate = new Date(storage[overflow][i].plannable_date);
                    if (!assignmentDate.getTime() || assignmentDate < now) {
                        storage[overflow].splice(i, 1);
                        changed = true;
                    }
                }
                if (changed) chrome.storage.sync.set({ [overflow]: storage[overflow] });
            });

        });
    });
}

function preloadAssignmentEls() {
    return new Promise((resolve, reject) => {
        let assignmentEls = {};
        const now = new Date();
        assignments.then((data) => {
            data = combineAssignments(data);
            data.forEach(item => {
                let due = new Date(item.plannable_date);
                item.overdue = now >= due;
                let o = {
                    "submitted": item.submissions && item.submissions.submitted === true,
                    "override": item.planner_override && item.planner_override.marked_complete,
                    "type": item.plannable_type,
                    "due": due,
                    "el": createCardAssignment(item)
                }
                if (assignmentEls[item.course_id]) {
                    assignmentEls[item.course_id].push(o);
                } else {
                    assignmentEls[item.course_id] = [o];
                }
            });
            resolve(assignmentEls);
        });
    });
}


function setAssignmentState(id, updates) {
    let states = api_options.assignment_states;
    let length = JSON.stringify(states).length;
    // remove the oldest states if the size is approaching the storage limit
    if (length > 7400) {
        let keys = Object.keys(states).sort((a, b) => states[b].expire - states[a].expire);
        keys.splice(-5);
        let newStates = {};
        keys.forEach(key => {
            newStates[key] = states[key];
        });
        states = newStates;
    }
    states[id] = states[id] ? { ...states[id], ...updates } : updates;
    chrome.storage.sync.set({ assignment_states: states }).then(() => { api_cardAssignments = preloadAssignmentEls(); loadBetterTodo(); loadCardAssignments(); });
}

async function checkAssignmentSubmission() {
    try {
        console.log("submitting...");
        const storage = await chrome.storage.sync.get("recap_closestAssignment");
        const closest = storage["recap_closestAssignment"] || { "id": null, "remaining": Infinity };
        const now = Date.now();
        const due = new Date(document.querySelector("time")?.getAttribute("datetime")).getTime();
        console.log(due - now);
        if (now !== due && due - now < closest["remaining"]) {
            const re = /\/assignments\/(\d*)[^\d]*/;
            const match = window.location.pathname.match(re);
            const id = match ? parseInt(match[1]) : null;
            console.log(match, id);
            await chrome.storage.sync.set({ "recap_closestAssignment": { "id": id, "remaining": due - now } });
        }
    } catch (e) {
        console.log(e);
    }
}

async function setupCheckAssignmentSubmission(retries) {
    if (!window.location.pathname.includes("/assignments/") || retries > 10) return;
    const button = document.getElementById("submit-button");
    if (!button) {
        setTimeout(() => {
            setupCheckAssignmentSubmission(retries + 1);
        }, 1000);
        return;
    }

    button.addEventListener("click", checkAssignmentSubmission);
}

let tooltipTimeout;

function showTooltip(text, e) {
    const tooltip = document.getElementById("bettercanvas-tooltip") || util_makeElement("div", document.body, { "id": "bettercanvas-tooltip" });
    tooltip.textContent = text;
    tooltip.style.display = "block";
    moveTooltip(e);
}

function moveTooltip(e) {
    const tooltip = document.getElementById("bettercanvas-tooltip");
    if (!tooltip) return;

    tooltip.style = `display:block;left: ${e.clientX}px;top:${e.clientY}px;transform:translate(${window.innerWidth / 2 > e.clientX ? "0" : "-80%"},30px)`;
    //tooltip.style.left = e.clientX + "px";
    //tooltip.style.top = e.clientY + "px";
}

function closeTooltip() {
    const tooltip = document.getElementById("bettercanvas-tooltip");
    if (!tooltip) return;
    tooltip.style.display = "none";
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
}

function setupTooltip(el, text) {
    el.onmouseenter = (e) => showTooltip(text, e);
    el.onmousemove = (e) => moveTooltip(e);
    el.onmouseleave = closeTooltip;
}




;// ./js/features/cardgrades.js



function insertGrades() {
    if (api_options.dashboard_grades === true) {
        api_grades.then(data => {
            try {
                let cards = document.querySelectorAll('.ic-DashboardCard');
                if (cards.length === 0 || cards[0].querySelectorAll(".ic-DashboardCard__link").length === 0) return;
                for (let i = 0; i < cards.length; i++) {
                    let course_id = parseInt(cards[i].querySelector(".ic-DashboardCard__link").href.split("courses/")[1]);
                    data.forEach(grade => {
                        if (course_id === grade.id) {
                            let gradepercent = grade.enrollments[0].has_grading_periods === true ? grade.enrollments[0].current_period_computed_current_score : grade.enrollments[0].computed_current_score;
                            //let gradepercent = grade.enrollments[0].computed_current_score;
                            let percent = (gradepercent || "--") + "%";
                            let gradeContainer = cards[i].querySelector(".bettercanvas-card-grade") || util_makeElement("a", cards[i].querySelector(".ic-DashboardCard__header"), { "className": "bettercanvas-card-grade", "textContent": percent });
                            if (api_options.grade_hover === true) {
                                gradeContainer.classList.add("bettercanvas-hover-only");
                            } else {
                                gradeContainer.classList.remove("bettercanvas-hover-only");
                            }
                            gradeContainer.setAttribute("href", `${domain}/courses/${course_id}/grades`);
                            gradeContainer.style.display = "block";
                        }
                    });

                }
            } catch (e) {
                util_logError(e);
            }
        });
    } else {
        document.querySelectorAll('.bettercanvas-card-grade').forEach(grade => {
            grade.style.display = "none";
        });
    }
}


;// ./js/features/reminders.js



const canvas_svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="#ff4545" width="25px" height="25px" viewBox="-192 -192 2304.00 2304.00" stroke="white"><g stroke-width="0"><rect x="-192" y="-192" width="2304.00" height="2304.00" rx="0" fill="none" strokewidth="0"/></g><g stroke-linecap="round" stroke-linejoin="round"/><g> <path d="M958.568 277.97C1100.42 277.97 1216.48 171.94 1233.67 34.3881 1146.27 12.8955 1054.57 0 958.568 0 864.001 0 770.867 12.8955 683.464 34.3881 700.658 171.94 816.718 277.97 958.568 277.97ZM35.8207 682.031C173.373 699.225 279.403 815.285 279.403 957.136 279.403 1098.99 173.373 1215.05 35.8207 1232.24 12.8953 1144.84 1.43262 1051.7 1.43262 957.136 1.43262 862.569 12.8953 769.434 35.8207 682.031ZM528.713 957.142C528.713 1005.41 489.581 1044.55 441.31 1044.55 393.038 1044.55 353.907 1005.41 353.907 957.142 353.907 908.871 393.038 869.74 441.31 869.74 489.581 869.74 528.713 908.871 528.713 957.142ZM1642.03 957.136C1642.03 1098.99 1748.06 1215.05 1885.61 1232.24 1908.54 1144.84 1920 1051.7 1920 957.136 1920 862.569 1908.54 769.434 1885.61 682.031 1748.06 699.225 1642.03 815.285 1642.03 957.136ZM1567.51 957.142C1567.51 1005.41 1528.38 1044.55 1480.11 1044.55 1431.84 1044.55 1392.71 1005.41 1392.71 957.142 1392.71 908.871 1431.84 869.74 1480.11 869.74 1528.38 869.74 1567.51 908.871 1567.51 957.142ZM958.568 1640.6C816.718 1640.6 700.658 1746.63 683.464 1884.18 770.867 1907.11 864.001 1918.57 958.568 1918.57 1053.14 1918.57 1146.27 1907.11 1233.67 1884.18 1216.48 1746.63 1100.42 1640.6 958.568 1640.6ZM1045.98 1480.11C1045.98 1528.38 1006.85 1567.51 958.575 1567.51 910.304 1567.51 871.172 1528.38 871.172 1480.11 871.172 1431.84 910.304 1392.71 958.575 1392.71 1006.85 1392.71 1045.98 1431.84 1045.98 1480.11ZM1045.98 439.877C1045.98 488.148 1006.85 527.28 958.575 527.28 910.304 527.28 871.172 488.148 871.172 439.877 871.172 391.606 910.304 352.474 958.575 352.474 1006.85 352.474 1045.98 391.606 1045.98 439.877ZM1441.44 1439.99C1341.15 1540.29 1333.98 1697.91 1418.52 1806.8 1579 1712.23 1713.68 1577.55 1806.82 1418.5 1699.35 1332.53 1541.74 1339.7 1441.44 1439.99ZM1414.21 1325.37C1414.21 1373.64 1375.08 1412.77 1326.8 1412.77 1278.53 1412.77 1239.4 1373.64 1239.4 1325.37 1239.4 1277.1 1278.53 1237.97 1326.8 1237.97 1375.08 1237.97 1414.21 1277.1 1414.21 1325.37ZM478.577 477.145C578.875 376.846 586.039 219.234 501.502 110.339 341.024 204.906 206.338 339.592 113.203 498.637 220.666 584.607 378.278 576.01 478.577 477.145ZM679.155 590.32C679.155 638.591 640.024 677.723 591.752 677.723 543.481 677.723 504.349 638.591 504.349 590.32 504.349 542.048 543.481 502.917 591.752 502.917 640.024 502.917 679.155 542.048 679.155 590.32ZM1440 475.712C1540.3 576.01 1697.91 583.174 1806.8 498.637 1712.24 338.159 1577.55 203.473 1418.51 110.339 1332.54 217.801 1341.13 375.413 1440 475.712ZM1414.21 590.32C1414.21 638.591 1375.08 677.723 1326.8 677.723 1278.53 677.723 1239.4 638.591 1239.4 590.32 1239.4 542.048 1278.53 502.917 1326.8 502.917 1375.08 502.917 1414.21 542.048 1414.21 590.32ZM477.145 1438.58C376.846 1338.28 219.234 1331.12 110.339 1415.65 204.906 1576.13 339.593 1710.82 498.637 1805.39 584.607 1696.49 577.443 1538.88 477.145 1438.58ZM679.155 1325.37C679.155 1373.64 640.024 1412.77 591.752 1412.77 543.481 1412.77 504.349 1373.64 504.349 1325.37 504.349 1277.1 543.481 1237.97 591.752 1237.97 640.024 1237.97 679.155 1277.1 679.155 1325.37Z"/></g></svg>`;

async function insertReminders(reminders) {
    const toAdd = [];
    const storage = await chrome.storage.sync.get("reminders");
    // overrides = if theres a item that needs to update, but already exists
    let overrides = false;
    for (const insert of reminders) {
        let found = false;
        for (let i = 0; i < storage["reminders"].length; i++) {
            // check if item was recently submitted
            if (insert.c === -1 && insert.h === storage["reminders"][i].h) {
                overrides = true;
                storage["reminders"][i] = insert;
            } else if (insert.h === storage["reminders"][i].h) {
                found = true;
            }
        }
        if (found === false) toAdd.push(insert);
    }
    if (toAdd.length > 0 || overrides === true) chrome.storage.sync.set({ "reminders": [...storage["reminders"], ...toAdd] });
}

async function hideReminder(href) {
    const storage = await chrome.storage.sync.get("reminders");

    for (let i = 0; i < storage["reminders"].length; i++) {
        if (storage["reminders"][i]["h"] === href) {
            storage["reminders"][i]["c"]++;
            chrome.storage.sync.set({ "reminders": storage["reminders"] });
            break;
        }
    }
}

function createReminder(reminder, location) {
    const remaining = getRelativeDate(new Date(reminder.d));
    const wrapper = util_makeElement("div", location, { "className": "bettercanvas-reminder-wrapper" });
    const container = util_makeElement("div", wrapper, { "className": "bettercanvas-reminder-container" });
    const svg = util_makeElement("div", container, { "innerHTML": canvas_svg });
    const content = util_makeElement("a", container, { "className": "bettercanvas-reminder-content", "href": reminder.h, "target": "_blank" });
    const title = util_makeElement("h2", content, { "className": "bettercanvas-reminder-title", "textContent": reminder.t });
    const due = util_makeElement("p", content, { "className": "bettercanvas-reminder-due", "textContent": `Assignment due in ${remaining.time}` });
    const hidebtn = util_makeElement("btn", wrapper, { "className": "bettercanvas-reminder-hide", "textContent": "x" });
    hidebtn.addEventListener("click", () => {
        hideReminder(reminder.h);
        wrapper.remove();
    });
    return container;
}

async function reminderWatch() {
    const sync = await chrome.storage.sync.get("remind");
    if (sync["remind"] !== true) {
        if (document.getElementById("bettercanvas-reminders")) document.getElementById("bettercanvas-reminders").style.display = "none";
        return;
    }
    const container = document.getElementById("bettercanvas-reminders") || util_makeElement("div", document.body, { "id": "bettercanvas-reminders" });
    container.style.display = "flex";
    container.textContent = "";
    const alertPeriod = 1000 * 60 * 60 * 6; // 6 hours
    const alertPeriod2 = 1000 * 60 * 60 * 2; // 2 hours
    const storage = await chrome.storage.sync.get(["reminders", "reminder_count"]);
    const now = (new Date()).getTime();
    storage["reminders"].forEach((reminder, index) => {
        if (reminder.d < now) {
            storage["reminders"].splice(index, 1);
        } else if ((reminder.c == 0 && reminder.d < now + alertPeriod) || (reminder.c == 1 && reminder.d < now + alertPeriod2)) {
            createReminder(reminder, container);
        }
    });
    chrome.storage.sync.set({ "reminders": storage["reminders"] });
}

function updateReminders() {
    const fiveDays = 1000 * 60 * 60 * 24 * 5;
    const now = (new Date()).getTime();
    const list = [];
    if (assignments === null) return;
    assignments.then(data => {
        data.forEach(item => {
            const due = (new Date(item.plannable_date)).getTime();
            if (item.plannable_type === "announcement") return;
            if (due < now) return;
            if (due > now + fiveDays * 4) return;
            // { due, title, href, hide count }
            // hide count of -1 indicates the item has a submission
            list.push({ "d": due, "t": item.plannable.title, "h": domain + item.html_url, "c": item?.submissions?.submitted || false ? -1 : 0 });
        });
        insertReminders(list);
    });
}

function showExampleReminder() {
    const location = document.getElementById("bettercanvas-reminders") || util_makeElement("div", document.body, { "id": "bettercanvas-reminders" });
    if (api_options.remind !== true) {
        location.remove();
        return;
    }
    location.textContent = "";
    const example = createReminder({ "d": new Date(), "t": "This is an example reminder", }, location);
    example.querySelector(".bettercanvas-reminder-due").textContent = "This notification will pop up in other pages to remind you of incomplete assignments that are due in less than 6 hours." /*It will notify again at 2 hours if the 'Remind 2x' option is on."*/;
}
;// ./js/features/aesthetics.js



function applyAestheticChanges() {
    let style = document.querySelector("#bettercanvas-aesthetics") || document.createElement('style');
    style.id = "bettercanvas-aesthetics";
    style.textContent = ":root {--bcsidebarwidth:220px;}";
    if (api_options.condensed_cards === true) style.textContent += ".ic-DashboardCard__header_hero {height:60px!important}.ic-DashboardCard__header-subtitle, .ic-DashboardCard__header-term{display:none}";
    if (api_options.remlogo === true) style.textContent += ".ic-app-header__logomark{display:none}";
    if (api_options.disable_color_overlay === true) style.textContent += ".ic-DashboardCard__header_hero{opacity: 0!important} .ic-DashboardCard__header-button-bg{opacity: .6!important}";
    if (api_options.hide_feedback === true) style.textContent += ".recent_feedback {display: none}";
    if (api_options.full_width === true) style.textContent += ".ic-Layout-wrapper{max-width:100%!important}";
    if (api_options.custom_styles !== "") style.textContent += api_options.custom_styles;
    if (api_options.rounder_cards !== false) style.textContent += ".ic-DashboardCard {border-radius:10px}";
    //if (options.screen_border === true) style.textContent += "#wrapper{padding:10px 10px 10px 0!important;background:var(--bcsidebar, --ic-brand-global-nav-bgd)!important;}#main{border-radius:12px!important;background:var(--bcbackground-0, #fff)!important;max-height:calc(100vh - 20px)!important;overflow:scroll;}";
    document.documentElement.appendChild(style);
    console.log(style);
}

function applyBorderMask() {
    const mask = document.getElementById("bettercanvas-border-mask") || makeElement("div", document.body, { "id": "bettercanvas-border-mask" });
    console.log(mask);
}

/*
export function changeFullWidth() {
    if (options.full_width == null) return;
    if (options.full_width === true) {
        document.body.classList.add("full-width");
    } else {
        document.body.classList.remove("full-width");
    }
}
*/

function aesthetics_changeGradientCards() {
    if (api_options.gradient_cards === true) {
        let cardheads = document.querySelectorAll('.ic-DashboardCard__header_hero');
        let cardcss = document.querySelector("#gradientcss") || document.createElement('style');
        cardcss.id = "gradientcss";
        cardcss.textContent = "";
        document.documentElement.appendChild(cardcss);

        for (let i = 0; i < cardheads.length; i++) {
            let colorone = cardheads[i].style.backgroundColor.split(',');
            let [r, g, b] = [parseInt(colorone[0].split('(')[1]), parseInt(colorone[1]), parseInt(colorone[2])];
            let [h, s, l] = [rgbToHsl(r, g, b)[0], rgbToHsl(r, g, b)[1], rgbToHsl(r, g, b)[2]];
            let degree = ((h % 60) / 60) >= .66 ? 30 : ((h % 60) / 60) <= .33 ? -30 : 15;
            let newh = h > 300 ? (360 - (h + 65)) + (65 + degree) : h + 65 + degree;
            cardcss.textContent += ".ic-DashboardCard:nth-of-type(" + (i + 1) + ") .ic-DashboardCard__header_hero{background: linear-gradient(115deg, hsl(" + h + "deg," + s + "%," + l + "%) 5%, hsl(" + newh + "deg," + s + "%," + l + "%) 100%)!important}";
        }

    } else {
        let cardcss = document.querySelector("#gradientcss");
        if (cardcss) cardcss.textContent = "";
    }
}

function showUpdateMsg() {
    // dont run if not on dashboard
    const el = document.getElementById("announcementWrapper");
    if (!el) return;

    // option off or div already created
    let div = document.getElementById("bettercanvas-update-msg");
    if (api_options.show_updates !== true || api_options.update_msg === "") {
        if (div) div.style.display = "none";
        return;
    } else if (div) {
        div.style.display = "flex";
        return;
    }

    // first creation 
    div = util_makeElement("div", el, { "id": "bettercanvas-update-msg" });
    util_makeElement("p", div, { "textContent": api_options.update_msg });
    const close = util_makeElement("button", div, { "id": "bettercanvas-update-close", "textContent": "Close" });
    close.addEventListener("click", () => {
        readUpdate();
        div.remove();
    });
}

function readUpdate() {
    chrome.storage.sync.set({ "update_msg": "" });
}
;// ./js/features/cardcolors.js




let changeColorInterval = null;
let colorChanges = [];
let previous = [];
async function changeColorPreset(colors) {

    if (colors.length === 0) return;

    // reset everything
    //let res = await getData(`${domain}/api/v1/users/self/colors`);
    clearInterval(changeColorInterval);
    const csrfToken = CSRFtoken();
    const delay = 250;
    previous = []
    colorChanges = [];

    // sort cards
    let cards = document.querySelectorAll(".ic-DashboardCard__header");
    let sortedCards = [];
    cards.forEach(card => {
        sortedCards.push({ "href": card.querySelector(".ic-DashboardCard__link").href, "el": card });
    });
    sortedCards.sort((a, b) => a.href > b.href ? 1 : -1);

    // push each color change into a queue
    try {
        sortedCards.forEach((card, i) => {
            let previousColor = rgbToHex(card.el.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor);
            previous.push(previousColor);

            // Object.keys(res.custom_colors).forEach(item => {
            //let item_id = item.split("_")[1];
            let course_id = card.href.split("courses/")[1];

            //if (card.href.includes(item_id)) {
            let cnum = i % colors.length;

            let changeCardColor = () => {
                fetch(domain + "/api/v1/users/self/colors/courses_" + course_id,
                    {
                        method: "PUT",
                        headers: {
                            "content-type": "application/json",
                            'accept': 'application/json',
                            'X-CSRF-Token': csrfToken,
                        },
                        body: JSON.stringify({ "hexcode": colors[cnum] })
                    }).then(() => {
                        card.el.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor = colors[cnum];
                        card.el.querySelector(".ic-DashboardCard__header-title span").style.color = colors[cnum];
                        card.el.querySelector(".ic-DashboardCard__header-button-bg").style.backgroundColor = colors[cnum];
                    });
            }

            colorChanges.push(changeCardColor);

            card.el.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor = colors[cnum];
            card.el.querySelector(".ic-DashboardCard__header-title span").style.color = colors[cnum];
            card.el.querySelector(".ic-DashboardCard__header-button-bg").style.backgroundColor = colors[cnum];
            //}
            // });
        });
    } catch (e) {
        util_logError(e);
        colorChanges = [];
    }

    changeGradientCards();

    // go through the queue until empty
    changeColorInterval = setInterval(() => {
        if (colorChanges.length > 0) {
            let current = colorChanges.shift();
            current();
        } else {
            clearInterval(changeColorInterval);
        }
    }, delay);

    // set colors to revert back to
    chrome.storage.local.get("previous_colors", local => {
        const now = Date.now();
        if (local["previous_colors"] === null || now >= local["previous_colors"].expire) {
            chrome.storage.local.set({ "previous_colors": { "colors": previous, "expire": now + 86400000 } });
        }
    });
}

;// ./js/features/cards.js




function getCardColors() {
    let cards = document.querySelectorAll(".ic-DashboardCard__header");
    let colors = [];
    cards.forEach(card => {
        let rgbColor = card.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor;
        colors.push({ "href": card.querySelector(".ic-DashboardCard__link").href, "color": rgbToHex(rgbColor) });
    });
    colors.sort((a, b) => a.href > b.href ? 1 : -1);
    colors = colors.map(x => x.color);
    return colors;
}

async function getCards() {
    return new Promise(async (resolve, reject) => {
        const dashboard_cards = document.querySelectorAll(".ic-DashboardCard");
        if (dashboard_cards.length === 0) return reject("No cards on this page");

        const new_cards = {};
        const dashboard_ids = [];

        // get the current dashboard ids
        dashboard_cards.forEach(card => {
            try {
                const link = card.querySelector(".ic-DashboardCard__link");
                if (!link) return reject("Not loaded yet");
                const match = card.querySelector(".ic-DashboardCard__link").href.match(/https:\/\/[^\/]+\/[^\/]+\/(.+)/);
                const id = match[1];
                dashboard_ids.push({ "id": id, "card_id": "card_" + id, "el": card });
            } catch (e) {
                util_logError(e);
            }
        });

        // get the current storage for every dashboard card
        const ids = dashboard_ids.map(x => x.id);
        const storage = await chrome.storage.sync.get(["card_ids", ...(dashboard_ids.map(x => x["card_id"]))]);

        dashboard_ids.forEach((card, index) => {
            try {
                // ignore if it exists already
                if (storage[card["card_id"]]) return;

                new_cards[card["card_id"]] = {
                    "default": card["el"].querySelector(".ic-DashboardCard__header-subtitle").textContent.substring(0, 20),
                    "name": "",
                    "code": "",
                    "img": "",
                    "hidden": false,
                    "weight": "regular",
                    "credits": 1,
                    "eid": 100000 - index,
                    "gr": null,
                    "links": [
                        { "path": "default", "is_default": true },
                        { "path": "default", "is_default": true },
                        { "path": "default", "is_default": true },
                        { "path": "default", "is_default": true }
                    ],
                    "url": domain,
                    "color": card["el"].querySelector(".ic-DashboardCard__header-title span").style.color
                };
            } catch (e) {
                util_logError(e);
            }
        });

        // only override the storage if something actually changed
        if (Object.keys(new_cards).length === 0 && JSON.stringify(ids) === JSON.stringify(storage["card_ids"])) return;
        console.log("new cards found");
        // setting new card ids and each "card_<id>" ie { "card_ids": ["card_1"], "card_1": {} }
        await chrome.storage.sync.set({ "card_ids": ids, ...new_cards });

        resolve();

    });
    //const storage = await chrome.storage.sync.get(null);
    //const storage_ids = (storage["card_ids"] || []).map(id => "card_" + id);
    //const cards = await chrome.storage.sync.get(storage_ids);

    /*
    if (dashboard_cards.length === 0) {
        displayAlert(true, "No cards were found on this page. Are you on the dashboard?");
    } else if (dashboard_cards.length >= 20) {
        displayAlert(true, "You have more than 20 cards on your dashboard! You may want to hide some of them.");
    }
    */

}

/*
export function getCardsFromDashboard2() {
    console.log("getting cards from dashboard")
    const dashboard_cards = document.querySelectorAll(".ic-DashboardCard");
    chrome.storage.sync.get(["custom_cards", "custom_cards_2", "custom_cards_3"], storage => {
        let cards = storage["custom_cards"] || {};
        let cards_2 = storage["custom_cards_2"] || {};
        let cards_3 = storage["custom_cards_3"] || {};
        let newCards = false;
        let count = 0;
        try {
            dashboard_cards.forEach(card => {
                try {
                    const id = card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1];
                    if (count >= (options["card_limit"] || 25)) return;
    
                    if (!cards[id]) {
                        newCards = true;
                        cards[id] = { "default": card.querySelector(".ic-DashboardCard__header-subtitle").textContent.substring(0, 20), "name": "", "code": "", "img": "", "hidden": false, "weight": "regular", "credits": 1, "eid": 100000 - count, "gr": null };
    
                        let links = [];
                        for (let i = 0; i < 4; i++) {
                            links.push({ "path": "default", "is_default": true });
                        }
                        cards_2[id] = { "links": links };
    
                        cards_3[id] = { "url": domain };
                    }
                    count++;
                } catch (e) {
                    logError(e);
                }
            });

            // there shouldn't be 0 cards
            if (count === 0) return;

            //delete cards that aren't on the dashboard anymore
            Object.keys(cards).forEach(key => {
                let found = false;
                // ignore cards that are not for the current url
                if (cards_3[key] && cards_3[key].url !== domain) {
                    found = true;
                } else {
                    dashboard_cards.forEach(card => {
                        const id = card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1];
                        if (parseInt(key) === parseInt(id)) found = true;
                    });
                }

                if (found === false) {
                    console.log("Deleting " + key);
                    cards[key] && delete cards[key];
                    cards_2[key] && delete cards_2[key];
                    cards_3[key] && delete cards_3[key];
                    newCards = true;
                }

            });

        } catch (e) {
            console.log("Error getting dashboard cards\n", e);
            logError(e);
        } finally {
            if (newCards !== true) return;
            console.log(newCards ? "new cards found" : "");
            chrome.storage.sync.set({ "custom_cards": cards, "custom_cards_2": cards_2, "custom_cards_3": cards_3 });
        }
    });
}
    */

/*
export async function getCards(api = null) {
    let dashboard_cards = api ? api : await getData(`${domain}/api/v1/courses?${/*enrollment_state=active&""}per_page=100`);
    chrome.storage.sync.get(["custom_cards", "custom_cards_2", "custom_cards_3"], storage => {
        let cards = storage["custom_cards"] || {};
        let cards_2 = storage["custom_cards_2"] || {};
        let cards_3 = storage["custom_cards_3"] || {};
        let newCards = false;
        let count = 0;
        // sort cards by enrollment id (i think the higher the id, the more recent it is)
        if (options["card_method_date"] === true) {
            dashboard_cards.sort((a, b) => (b?.created_at) > (a?.created_at) ? 1 : -1);
        } else {
            dashboard_cards.sort((a, b) => (b?.enrollment_term_id || 0) - (a?.enrollment_term_id || 0));
        }
        try {
            dashboard_cards.forEach(card => {
                if (!card.course_code || count >= (options["card_limit"] || 25)) return;
                let id = card.id;
                if (!cards || !cards[id]) {
                    newCards = true;
                    cards[id] = { "default": card.course_code.substring(0, 20), "name": "", "code": "", "img": "", "hidden": false, "weight": "regular", "credits": 1, "eid": card.enrollment_term_id || 0, "gr": null };
                } else if (cards && cards[id]) {
                    newCards = true;
                    cards[id].default = card.course_code.substring(0, 20);
                    cards[id].eid = card.enrollment_term_id || 0;
                    if (!cards[id].code) cards[id].code = "";
                }
                if (!cards_2 || !cards_2[id]) {
                    newCards = true;
                    let links = [];

                    for (let i = 0; i < 4; i++) {
                        links.push({ "path": "default", "is_default": true });
                    }

                    cards_2[id] = { "links": links };
                }

                if (!cards_3 || !cards_3[id]) {
                    newCards = true;
                    cards_3[id] = { "url": domain };
                }
                count++;

            });

            //delete cards that aren't on the dashboard anymore
            Object.keys(cards).forEach(key => {
                let found = false;
                // ignore cards that are not for the current url
                if (cards_3[key] && cards_3[key].url !== domain) {
                    found = true;
                } else {
                    dashboard_cards.forEach(card => {
                        if (parseInt(key) === card.id) found = true;
                    });
                }

                if (found === false) {
                    console.log("Deleting " + key + " from custom_cards...", cards[key]);
                    cards[key] && delete cards[key];
                    cards_2[key] && delete cards_2[key];
                    cards_3[key] && delete cards_3[key];
                    newCards = true;
                }

            });

        } catch (e) {
            console.log(e);
        } finally {
            return chrome.storage.sync.set(newCards ? { "custom_cards": cards, "custom_cards_2": cards_2, "custom_cards_3": cards_3 } : {});
        }
    });
}
    */

function getCardId(card) {
    const bcid = card.getAttribute("data-bcid");
    if (bcid) return bcid;

    let output = -1;

    let id = card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1];

    // no ~
    if (!id.includes("~")) output = id;

    // has ~ but dashboard card method is used
    if (api_options["custom_cards"][id]) output = id;

    // weird case, some canvases replace consecutive 0s with a ~ in the id
    // but the number of 0s isn't consistent between schools
    id = id.split("~");
    let re = new RegExp(`${id[0]}0+${id[1]}`);
    for (const c of Object.keys(api_options["custom_cards"])) {
        if (c.match(re)) {
            output = c;
            break;
        }
    }

    card.setAttribute("data-bcid", output);
    return output;
}

function applyCardLinks(card, settings) {

    let links = card.querySelectorAll(".ic-DashboardCard__action");
    for (let i = links.length; i < 4; i++) {
        util_makeElement("a", card.querySelector(".ic-DashboardCard__action-container"), { "className": "ic-DashboardCard__action" });
    }
    links = card.querySelectorAll(".ic-DashboardCard__action");

    for (let i = 0; i < 4; i++) {
        const img = links[i].querySelector(".bettercanvas-link-image") || util_makeElement("img", links[i], { "className": "bettercanvas-link-image" });
        links[i].style.display = "inherit";
        if (settings[i].path === "none") {
            links[i].style.display = "none";
        } else if (settings[i].is_default === false) {
            links[i].href = settings[i].path;
            img.src = getCustomLinkImage(settings[i].path);
            if (links[i].querySelector(".ic-DashboardCard__action-layout")) links[i].querySelector(".ic-DashboardCard__action-layout").style.display = "none";
            img.style.display = "block";
        } else {
            if (links[i].querySelector(".ic-DashboardCard__action-layout")) links[i].querySelector(".ic-DashboardCard__action-layout").style.display = "inherit";
            img.style.display = "none";
        }
        img.addEventListener("error", () => {
            img.src = "https://www.instructure.com/favicon.ico";
        })
    }
}

function applyCardImage(card, img) {
    if (img === "none") {
        const currentImg = card.querySelector(".ic-DashboardCard__header_image");
        if (currentImg) {
            card.querySelector(".ic-DashboardCard__header_hero").style.opacity = 1;
        }
    } else if (img !== "") {
        const topColor = card.querySelector(".ic-DashboardCard__header_hero");
        const container = card.querySelector(".ic-DashboardCard__header_image") || util_makeElement("div", card, { "className": "ic-DashboardCard__header_image" });
        card.querySelector(".ic-DashboardCard__header").prepend(container);
        container.appendChild(topColor);
        container.style.backgroundImage = `url("${img}")`;
        topColor.style.opacity = .5;
    }
}

async function customizeCards(c = null) {
    let cards = document.querySelectorAll('.ic-DashboardCard');
    if (cards.length && cards.length > 0 && cards[0].querySelectorAll(".ic-DashboardCard__link").length === 0) return;

    const card_ids = [];
    cards.forEach(card => {
        card_ids.push("card_" + getCardId(card));
    });

    const storage = await chrome.storage.sync.get(card_ids);


    cards.forEach(card => {
        const id = getCardId(card);
        const cardOptions = storage["card_" + id];
        if (!cardOptions) return;

        // apply options
        card.style.display = cardOptions.hidden === true ? "none" : "inline-block";

        applyCardImage(card, cardOptions.img);

        // new card colors 
        card.querySelector(".ic-DashboardCard__header-title span").style.color = cardOptions["color"];
        card.querySelector(".ic-DashboardCard__header-button-bg").style.backgroundColor = cardOptions["color"];
        card.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor = cardOptions["color"];

        // card name
        if (cardOptions.name !== "") {
            card.querySelector(".ic-DashboardCard__header-title > span").textContent = cardOptions.name;
        }

        // card code
        if (cardOptions.code !== "") {
            card.querySelector(".ic-DashboardCard__header-subtitle").textContent = cardOptions.code;
        }

        applyCardLinks(card, cardOptions.links);
    });

}

function customizeCards2(c = null) {
    if (!options.custom_cards) return;
    try {
        let cards = c ? c : document.querySelectorAll('.ic-DashboardCard');
        if (cards.length && cards.length > 0 && cards[0].querySelectorAll(".ic-DashboardCard__link").length === 0) return;

        cards.forEach(card => {
            const id = getCardId(card);
            let cardOptions = options["custom_cards"][id] || null;
            let cardOptions_2 = options["custom_cards_2"][id] || null;
            if (!cardOptions) return;
            // hide card
            card.style.display = cardOptions.hidden === true ? "none" : "inline-block";

            // card image
            if (cardOptions.img === "none") {
                let currentImg = card.querySelector(".ic-DashboardCard__header_image");
                if (currentImg) {
                    card.querySelector(".ic-DashboardCard__header_hero").style.opacity = 1;
                }
            } else if (cardOptions.img !== "") {
                let topColor = card.querySelector(".ic-DashboardCard__header_hero");
                let container = card.querySelector(".ic-DashboardCard__header_image") || makeElement("div", card, { "className": "ic-DashboardCard__header_image" });
                card.querySelector(".ic-DashboardCard__header").prepend(container);
                container.appendChild(topColor);
                container.style.backgroundImage = "url(\"" + cardOptions.img + "\")";
                topColor.style.opacity = .5;
            }

            // card name
            if (cardOptions.name !== "") {
                card.querySelector(".ic-DashboardCard__header-title > span").textContent = cardOptions.name;
            }

            // card code
            if (cardOptions.code !== "") {
                card.querySelector(".ic-DashboardCard__header-subtitle").textContent = cardOptions.code;
            }

            // card links
            let links = card.querySelectorAll(".ic-DashboardCard__action");
            for (let i = links.length; i < 4; i++) {
                makeElement("a", card.querySelector(".ic-DashboardCard__action-container"), { "className": "ic-DashboardCard__action" });
            }
            links = card.querySelectorAll(".ic-DashboardCard__action");
            for (let i = 0; i < 4; i++) {
                let img = links[i].querySelector(".bettercanvas-link-image") || makeElement("img", links[i], { "className": "bettercanvas-link-image" });
                links[i].style.display = "inherit";
                if (cardOptions_2.links[i].path === "none") {
                    links[i].style.display = "none";
                } else if (cardOptions_2.links[i].is_default === false) {
                    links[i].href = cardOptions_2.links[i].path;
                    img.src = getCustomLinkImage(cardOptions_2.links[i].path);
                    if (links[i].querySelector(".ic-DashboardCard__action-layout")) links[i].querySelector(".ic-DashboardCard__action-layout").style.display = "none";
                    img.style.display = "block";
                } else {
                    if (links[i].querySelector(".ic-DashboardCard__action-layout")) links[i].querySelector(".ic-DashboardCard__action-layout").style.display = "inherit";
                    img.style.display = "none";
                }
                img.addEventListener("error", () => {
                    img.src = "https://www.instructure.com/favicon.ico";
                })
            }

        });

    } catch (e) {
        logError(e);
    }
}

function getCustomLinkImage(path) {
    if (path.includes("webassign.net")) {
        return "https://www.cengage.com/favicon.ico";
    } else if (path.includes("docs.google")) {
        return "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico";
    } else {
        let url = { "hostname": "instructure.com/" };
        try {
            url = new URL(path);
        } catch (e) {
            util_logError(e);
        }
        return "https://" + url.hostname + "/favicon.ico";;
    }
}

;// ./js/features/darkmode.js




function inspectDarkMode(withOutput = false) {
    let output = "";
    let bgcount = 0, textcount = 0, time = performance.now();
    let bg0 = hexToRgb(api_options.dark_preset["background-0"]);
    let bg1 = hexToRgb(api_options.dark_preset["background-1"]);
    let txt = hexToRgb(api_options.dark_preset["text-0"]);
    let bdr = hexToRgb(api_options.dark_preset["borders"]);
    let lnk = hexToRgb(api_options.dark_preset["links"]);
    document.querySelectorAll("*").forEach(el => {
        let style = getComputedStyle(el);
        let bgcolor = style.getPropertyValue("background").match(/rgb\((?<r>\d*)\, ?(?<g>\d*)\, ?(?<b>\d*)\) none/);
        let selector = "class=." + el.className + ",id=#" + el.id;

        if (bgcolor) {
            const r = parseInt(bgcolor.groups["r"]);
            const g = parseInt(bgcolor.groups["g"]);
            const b = parseInt(bgcolor.groups["b"]);
            /*
            if (el.classList.contains("no-touch")) {
                console.log({ "r": r, "g": g, "b": b }, { "r": r === bg0.r, "g": g === bg0.g, "b": b === bg0.b });
            }
            */
            if (r > 245 && g > 245 && b > 245 && !(r === bg0.r && g === bg0.g && b === bg0.b) && !(r === lnk.r && g === lnk.g && b === lnk.b)) {
                el.style.cssText = (";background:" + api_options.dark_preset["background-0"] + "!important;color" + api_options.dark_preset["text-0"] + "!important;") + el.style.cssText;
                if (withOutput === true) output += selector + "{background: background-0, color: text-0}\n";
                bgcount++;
            } else if (r > 225 && r < 245 && g > 225 && g < 245 && b > 225 && b < 245 && !(r === bg1.r && g === bg1.g && b === bg1.b) && !(r === lnk.r && g === lnk.g && b === lnk.b)) {
                el.style.cssText = (";background:" + api_options.dark_preset["background-1"] + "!important;color" + api_options.dark_preset["text-0"] + "!important;") + el.style.cssText;
                if (withOutput === true) output += selector + "{background: background-1, color: text-0}";
                bgcount++;
            }
        }


        let bordercolor = style.getPropertyValue("border-color").match(/rgb\((?<r>\d*)\, ?(?<g>\d*)\, ?(?<b>\d*)/);
        if (bordercolor) {
            const r = parseInt(bordercolor.groups["r"]);
            const g = parseInt(bordercolor.groups["g"]);
            const b = parseInt(bordercolor.groups["b"]);
            if (r > 195 && g > 195 && b > 195 && !(r === bdr.r && g === bdr.g && b === bdr.b) && !(r === lnk.r && g === lnk.g && b === lnk.b)) {
                el.style.cssText = "border-color:" + api_options.dark_preset["borders"] + "!important;" + el.style.cssText;
                if (withOutput === true) output += selector + "{border: borders}";
            }
        }

        let text = style.getPropertyValue("color").match(/rgb\((?<r>\d*)\, ?(?<g>\d*)\, ?(?<b>\d*)/);
        if (text) {
            const r = parseInt(text.groups["r"]);
            const g = parseInt(text.groups["g"]);
            const b = parseInt(text.groups["b"]);
            if (r <= 70 && g <= 70 && b <= 70 && !(r === txt.r && g === txt.g && b === txt.b)) {
                el.style.cssText = "color:" + api_options.dark_preset["text-0"] + "!important;" + el.style.cssText;
                if (withOutput === true) output += selector + "{text: text-0}";
                textcount++;
            }
        }

    });
    console.log("done fixing dark mode - time:", performance.now() - time, "total backgrounds changed: ", bgcount, ", total colors changed: ", textcount);
    return { "selectors": output === "" ? "no gaps determined" : output, "time": performance.now() - time };
}

function generateDarkModeCSS() {
    const darkmode_css = "#announcementWrapper>div>div,#breadcrumbs,#calendar-app .fc-agendaWeek-view .fc-body,#calendar-app .fc-event,#calendar-app .fc-month-view .fc-body,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-body,#calendar-drag-and-drop-container .fc-event,#calendar-drag-and-drop-container .fc-month-view .fc-body,#content-wrapper .user_content.not_design_tools h3,#context-list-holder,.bettercanvas-course-credit,#kl_banner,#kl_banner_left,#kl_banner_right,#kl_content_block_0,#kl_custom_block_0,#kl_custom_block_1,#kl_custom_block_2,#kl_readings p,#kl_wrapper_3,#kl_wrapper_3 .ic-Table,#kl_wrapper_3 .table,#kl_wrapper_3.kl_colored_headings #kl_banner #kl_banner_left,#kl_wrapper_3.kl_colored_headings #kl_banner .kl_subtitle,#kl_wrapper_3.kl_colored_headings>div,#kl_wrapper_3.kl_colored_headings_box_left>div,#media_comment_maybe,#minical,#nav-tray-portal>span>span,#questions .group_top,#questions.assessing,#syllabus tr.date.date_passed td,#syllabus tr.date.date_passed th,#undated-events,#undated-events .event,.Day-styles__root,.EmptyDays-styles__root,.Grouping-styles__title,.Grouping-styles__title::after,.PlannerHeader-styles__root,.ac-result-container,.agenda-wrapper,.al-options,.bettercanvas-assignment-container,.bjXfh_daKB,.bjXfh_daKB span,.bottom-reply-with-box,.canvas-rce__skins--root,.ccWIh_bGBk,.closed-for-comments-discussions-v2__wrapper,.conversations .panel,.dCppM_ddES,.discussion-section h4,.discussion-section p,.discussion-section ul,.discussion_entry,.discussions-v2__container-image,.discussions-v2__placeholder,.dpCPB_caGd,.dropdown-menu,.dropdown-menu .divider,.even .slick-cell,.event-details,.fLzZc_bGBk,.form,.form-dialog .form-controls,.header-bar,.ic-Dashboard-header__layout,.ic-Dashboard-header__title,.ic-DashboardCard,.ic-DashboardCard__header_content,.ic-discussion-row,.ic-notification__content,.ig-list .ig-row.ig-row-empty,.instructure_file_link,.item-group-condensed .ig-header,.item-group-condensed .ig-row,.item-group-condensed .item-group-expandable,.item-group-container,.item-group-expandable .emptyMessage,.kl_image_round_white_border,.kl_image_white_border,.kl_mod_text,.message-list .messages>li,.module-sequence-footer .module-sequence-footer-content,.nav-icon,.outcomes-browser .outcomes-content,.outcomes-browser .outcomes-main,.outcomes-browser .outcomes-sidebar,.pages.show .page-title,.pagination ul>li>a,.pagination ul>li>span,.pinned-discussions-v2__wrapper,.popover,.question,.question_editing,.quiz-submission,.rubric_container .rubric_title,.submission-details-comments .comments,.submission-late-pill span,.submission-missing-pill span,.toolbarView .headerBar,.tox .tox-menubar,.tox .tox-split-button .tox-tbtn.tox-split-button__chevron,.tox .tox-toolbar,.tox .tox-toolbar__overflow,.tox .tox-toolbar__primary,.tox:not(.tox-tinymce-inline) .tox-editor-header,.ui-datepicker .ui-datepicker-time,.ui-datepicker .ui-dialog .ui-datepicker-time,.ui-datepicker .ui-dialog .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-datepicker .ui-datepicker-time,.ui-dialog .ui-datepicker .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-dialog-buttonpane,.ui-dialog .ui-dialog-titlebar.ui-widget-header,.ui-kyle-menu,.ui-tabs .ui-tabs-nav .kl_panel_heading.ui-state-default:not(.ui-tabs-active),.ui-tabs .ui-tabs-nav li.ui-state-hover,.ui-tabs .ui-tabs-nav li.ui-tabs-active,.ui-tabs .ui-tabs-nav li:hover,.ui-tabs .ui-tabs-panel,.ui-widget-content,.unpinned-discussions-v2__wrapper,.unpublished_courses_redesign .ic-DashboardCard__box__header,body,code,img.kl_image_round_white_border,img.kl_image_white_border,.bettercanvas-course-percent,pre,table.summary tbody th,table.summary td,.erWSf_bGBk,.fdyuz_bGBk,.eHzxc_bGBk,.dNoYT_bGBk,.fOyUs_fZwI, .fOyUs_kXoP,.tox .tox-edit-area__iframe,.dLyYq_bGBk,.quiz_comment,.discussion-entries .entry,.file-upload-submission,.ftPBL_bGBk:not(.ftPBL_bGiS),.ColorPicker__Container,#right_side .content_box,.jumbotron,.card,.ac-token,.error_box .error_text,table.seas-homepage-table,.with-left-side #left-side, .assignment-student-header,#calendar-list-holder, #other-calendars-list-holder, #undated-events,#left-side,.ic-app-course-menu.with-left-side #left-side.XOwIb_eLeB:not([aria-selected]):not([aria-disabled]):hover, .XOwIb_eLeB[aria-selected],span.fOyUs_bGBk.fOyUs_desw.bDzpk_bGBk.bDzpk_busO.bDzpk_cQFX.bDzpk_bZNM,.bettercanvas-todo-complete-btn,.bettercanvas-card-grade,div[style*='background-color: #fff'],div[style*='background: #fff'],div[style*='background-color: #ffffff'],div[style*='background: #ffffff'],span[style*='background-color: #fff'],span[style*='background: #fff'],#right_side div.comment,.fOyUs_dUgE, .fOyUs_bvKN,.css-1fwux0x-view--block,.css-1v8v5q1-optionItem,#comments-tray,.css-vxe90h-view--inlineBlock,.bettercanvas-todo-actions,.css-sg1rn7-view,#bettercanvas-todo-new-btn,.bettercanvas-sidebar-dropdown-open .bettercanvas-sidebar-item,#bettercanvas-search-input,.bettercanvas-sidebar-dropdown-open .bettercanvas-sidebar-item:hover,#bettercanvas-todosidebar-time,#bettercanvas-todo-controls,.bettercanvas-todo-time-arrow,#bettercanvas-todo-course-filter-options,#bettercanvas-todo-creator-container,#bettercanvas-todo-creator-optional-header span,#bettercanvas-updatev1,#bettercanvas-search-results-container,#bettercanvas-search-popup-container::after,#bettercanvas-todo-creator::before{background:var(--bcbackground-0)!important}#minical .fc-widget-content{border:1px solid var(--bcbackground-0)!important}#kl_wrapper_3.kl_colored_headings #kl_banner .kl_subtitle{border-top:3px solid var(--bcbackground-0)!important;border-bottom:3px solid var(--bcbackground-0)!important}#submit_file_button,span[style*='background-color: #fbeeb8'],.bettercanvas-todo-label{color:var(--bcbackground-0)!important}.eHQDY_dTxv{stroke:var(--bcbackground-0)!important}#calendar-app .fc-agendaWeek-view .fc-event,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-event,#context-list .context_list_context:hover,#google_docs_tree li.file:hover,#planner-today-btn,#questions.assessment_results .question .header,#syllabus tr.date.related td,#syllabus tr.date.related th,#syllabus tr.date.selected td,#syllabus tr.date.selected th,.Button,.ac-input-box,.agenda-day.agenda-today,.bettercanvas-assignment-container:hover,.btn,.discussion-reply-box,.discussions-v2__wrapper>span>span>span>span>button>span,.dropdown-menu li>a:focus,.dropdown-menu li>a:hover,.dropdown-submenu:hover>a,.ef-item-row:hover,.extension-linkpreview,.fOyUs_bGBk.fOyUs_desw.bDzpk_bGBk.bDzpk_busO.bDzpk_fZWR.bDzpk_qOas,.fc-event .fc-bg,.hypodivcalc,.ic-Table.ic-Table--striped tbody tr:nth-child(odd),.mini_calendar .day.has_event,.odd .slick-cell,.outcomes-browser .outcomes-toolbar,.question .header,.slick-header-column,.stream-details tr:hover,.stream_header:hover,.submission_attachment button>span,.tox .tox-menu,.tray-with-space-for-global-nav>div>span>form>button>span,.ui-button,.ui-tabs .ui-tabs-nav li.ui-tabs-active,.uneditable-input,.yyQPt_cSXm,div.checkbox,input[type=color],input[type=date],input[type=datetime-local],input[type=datetime],input[type=email],input[type=month],input[type=number],input[type=password],input[type=search],input[type=tel],input[type=text],input[type=time],input[type=url],input[type=week],select,textarea,thead th,ul.outcome-level li.selected a,.eMdva_bgqc,.fQfxa_dqAF.fQfxa_buuG,div.form-column-right label:hover, div.overrides-column-right label:hover,.ic-tokeninput-input,.ic-tokens,.ic-tokeninput-list,.DyQTK_ddES,#gradebook_header,table.seas-homepage-table tr:nth-child(odd),#assignments-student-footer,.muted-notice,.kl_panels_wrapper .ui-accordion-header, .kl_wrapper .ui-accordion-header,.list-view a.active,#calendars-context-list .context_list_context:hover, #other-calendars-context-list .context_list_context:hover,.bettercanvas-todo-complete-btn:hover,.bettercanvas-custom-btn,.bettercanvas-skeleton-text,.bettercanvas-hover-preview,.bettercanvas-gpa-edit-btn,div[style*='background-color: rgb(229, 242, 248)'],div[style*='background-color: rgb(245, 245, 245)'],.css-7naoe-textInp,.css-7naoe-textInput__facade,#assignment_sort_order_select_menu,#course_select_menu,.css-1dn3ise-textInput__facade,.css-1veueey-textInput__facade,.bettercanvas-todo-action:hover,.bettercanvas-todosidebar-time-item.active,.bettercanvas-todo-actions-btn:hover,#bettercanvas-updatev1 button,#bettercanvas-todo-new-btn:hover,.bettercanvas-todoitem-options:hover{background:var(--bcbackground-1)!important}.ic-DashboardCard__placeholder-svg .ic-DashboardCard__placeholder-animates>*{fill:var(--bcbackground-1)!important}.bettercanvas-hover-preview::after{background:linear-gradient(0deg, var(--bcbackground-1) 50%, transparent)}#calendar-app .fc-month-view .fc-today,#calendar-drag-and-drop-container .fc-month-view .fc-today,#content-wrapper .user_content.not_design_tools table tbody tr:nth-child(even) td,#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1) i,.ajas-search-widget__btn--search,.alert-info,.discussion-section.alert .discussion-points,.discussion-section.alert .discussion-title,.extension-linkpreview:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-alert:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-danger:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-neutral:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-success:hover,.ic-Table.ic-Table--hover-row tbody tr:hover,.ic-flash-error,.ic-flash-info,.ic-flash-success,.ic-flash-warning,.ig-list .ig-row:hover,.context_module_item.context_module_item_hover,.tox .tox-mbtn--active,.tox .tox-mbtn:hover:not(:disabled):not(.tox-mbtn--active),.tox .tox-split-button .tox-tbtn.tox-split-button__chevron:hover,.tox .tox-split-button:hover,.tox .tox-tbtn.tox-tbtn--enabled:hover,.tox .tox-tbtn:hover,.ui-menu .ui-menu-item .ui-progressbar a.ui-widget-header,.ui-menu .ui-menu-item a.ui-state-active,.ui-menu .ui-menu-item a.ui-state-focus,.ui-menu .ui-menu-item a.ui-state-hover,.ui-progressbar .ui-menu .ui-menu-item a.ui-widget-header,::-webkit-scrollbar-track,div.checkbox:hover,.gradebook-cell.grayed-out,.baylor-table tr:nth-of-type(2n + 1){background:var(--bcbuttons)!important}#kl_content_block_0 h3:nth-child(1),#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1),#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1),#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1),#kl_custom_block_2 h3:nth-child(1) i,#kl_wrapper_3.kl_colored_headings #kl_modules h3,#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_emta h3:not(.ui-state-default),.ic-app-header__menu-list-link:focus,.kl_flex_column h4,.tox .tox-collection--list .tox-collection__item--enabled,ul.outcome-level li:focus,ul.outcome-level li:hover{background-color:var(--bcbuttons)!important}.eHQDY_dTxv{stroke:var(--bcbuttons)}.no-touch .ic-DashboardCard:hover{box-shadow:0 4px 10px rgb(0 0 0)!important}#calendar-drag-and-drop-container .fc-row .fc-content-skeleton td,#calendar-drag-and-drop-container .fc-row .fc-helper-skeleton td,.bettercanvas-course-credit,#kl_content_block_0,#kl_custom_block_0,#kl_custom_block_1,#kl_custom_block_2,#kl_wrapper_3.kl_colored_headings>div,#kl_wrapper_3.kl_colored_headings_box_left>div,#minical,#questions .group_bottom,#questions .group_top,#quiz_edit_wrapper #quiz_tabs #quiz_options_form .option-group,#quiz_show .description.teacher-version,.Button,.Container__DueDateRow,.CourseImageSelector,.ac-input-box,.ac-result-container,.ajas-search-widget__form input,.btn,.calendar .fc-row .fc-content-skeleton td,.calendar .fc-row .fc-helper-skeleton td,.closed-for-comments-discussions-v2__wrapper,.discussion-entries .entry,.discussion-reply-box,.discussion_entry>.discussion-entry-reply-area,.discussions-v2__wrapper>span>span>span>span>button>span,.form-actions,.ic-flash-error,.ic-flash-info,.ic-flash-success,.ic-flash-warning,.ig-list .ig-row,.item-group-condensed .ig-header,.item-group-condensed .item-group-expandable,.mini-cal-header,.mini_calendar,.outcomes-browser .outcomes-main,.outcomes-browser .outcomes-toolbar,.panel-border,.pinned-discussions-v2__wrapper,.question,.question .header,.question_editing,.quiz-submission,.rubric_container td,.rubric_container th,.submission-details-container,.submission_attachment button>span,.table-bordered,.toolbarView .headerBar,.tray-with-space-for-global-nav>div>span>form>button>span,.ui-button,.uneditable-input,.unpinned-discussions-v2__wrapper,form.question_form .form_answers .answer,.bettercanvas-course-percent,input[type=color],input[type=date],input[type=datetime-local],input[type=datetime],input[type=email],input[type=month],input[type=number],input[type=password],input[type=search],input[type=tel],input[type=text],input[type=time],input[type=url],input[type=week],select,textarea,.fdyuz_bGBk,.tox .tox-edit-area,.quiz_comment,.ic-tokens,.ic-tokeninput-list,.DyQTK_ddES,.ac-token,.muted-notice,.ui-state-default, .ui-widget-header .ui-state-default,.ui-widget-content,.bettercanvas-custom-btn,.bettercanvas-gpa-edit-btn,.css-26xxi8-view--block,.css-9fqfm7-view--block,.bettercanvas-todo-actions,.bettercanvas-todo-list-container,#bettercanvas-todosidebar-time,#bettercanvas-todo-controls,.bettercanvas-todo-time-arrow,#bettercanvas-todo-new-section,#bettercanvas-todo-new-btn,#bettercanvas-searchbar-container,#bettercanvas-todo-course-filter-options,#bettercanvas-todo-creator-container,#bettercanvas-updatev1 button{border:1px solid var(--bcborders)!important}#content-wrapper .user_content.not_design_tools table td,#content-wrapper .user_content.not_design_tools table th,table.seas-homepage-table,.avatar,.css-7naoe-textInput__facade,.css-1dn3ise-textInput__facade{border:2px solid var(--bcborders)!important}#course_select_menu,#assignment_sort_order_select_menu,#TextInput_0{border:none!important}#assignment_show .student-assignment-overview,#grades_summary th.title,#kl_wrapper_3.kl_colored_headings h4,#kl_wrapper_3.kl_colored_headings_box_left h4,#minical .fc-toolbar,#quiz_show ul#quiz_student_details,#right-side .h2,#right-side h2,.CompletedItemsFacade-styles__root,.Container__DueDateRow-item,.EmptyDays-styles__root,.PlannerItem-styles__root,.agenda-day,.blnAQ_kWwi,.container_0 .slick-cell,.container_1 .slick-cell,.conversations .panel,.course_details td,.dropdown-menu .divider,.ef-directory-header,.ef-header,.event-details-content,.event-details-footer,.event-details-header,.header-bar,.hr,.ic-Action-header.ic-Action-header--before-item-groups,.ic-Dashboard-header__layout,.ic-Table td,.ic-Table th,.ic-app-nav-toggle-and-crumbs,.item-group-condensed .ig-row,.message-detail.conversations__message-detail .message-content>li,.message-detail.conversations__message-detail .message-header,.message-detail.span8 .message-content>li,.message-detail.span8 .message-header,.message-list .messages>li,.nav_list li.disabled,.page-action-list a,.page-header,.quiz-header,.recent-activity-header,.recent_activity>li,.slick-header-column.ui-state-default,.submission-details-header__heading-and-grades,.ui-datepicker .ui-dialog .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-datepicker .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-dialog-titlebar.ui-widget-header,.unpublished_courses_redesign .ic-DashboardCard__box__header,legend,table.summary caption,table.summary tbody th,table.summary td,table.summary thead th,.communication_message,.file-upload-submission,.submission-details-header__heading-and-grades,#right_side .content_box,.assignment-student-header,.bettercanvas-gpa-course,#bettercanvas-search-results h3,#bettercanvas-todo-course-filter{border-bottom:1px solid var(--bcborders)!important}#planner-today-btn,.al-options,.border,.dpCPB_caGd,.fc-unthemed .fc-divider,.fc-unthemed .fc-popover,.fc-unthemed .fc-row,.fc-unthemed tbody,.fc-unthemed td,.fc-unthemed th,.fc-unthemed thead,.qBMHb_cSXm,.tox .tox-collection--list .tox-collection__group,.tox .tox-menu,.ui-tabs .ui-tabs-nav li.ui-tabs-active,.ui-tabs .ui-tabs-nav li.ui-tabs-active.ui-state-hover,.ui-tabs .ui-tabs-nav li.ui-tabs-active:hover,.ui-tabs .ui-tabs-nav li:hover,.ui-tabs .ui-tabs-panel,.fOyUs_dsNY, .fOyUs_tIxX,.fQfxa_dqAF.fQfxa_buuG,.question .question_comment.question_neutral_comment,#assignments-student-footer,.MyTable,#inbox-conversation-holder *,.css-1vqfmz1-view{border-color:var(--bcborders)!important}.discussion-section.message_wrapper table{border:4px solid var(--bcborders)!important}.nav_list li.navitem{border:solid var(--bcborders)!important;border-width:0 1px 1px!important}#questions .assessment_question_bank,#questions .insufficient_count_warning,#questions .question_holder.group,.container_0 .slick-cell,.container_1 .slick-cell,.ef-main .ef-folder-content,.rubric_container .rubric_title,.slick-header-column.ui-state-default,.topic .entry-content,body.responsive_awareness .message-list-scroller,ul.outcome-level{border-right:1px solid var(--bcborders)!important}#questions .assessment_question_bank,#questions .insufficient_count_warning,#questions .question_holder.group,.container_0 .slick-cell:first-child,.container_0 .slick-header-column:first-child,.outcomes-browser .outcomes-content,.rubric_container .rubric_title,.table-bordered td,.table-bordered th,.topic .entry-content,.submission-details-comments .comments{border-left:1px solid var(--bcborders)!important}#assignment_show .student-assignment-overview,#grades_summary tr.final_grade,#quiz_show ul#quiz_student_details,.discussion-entries .entry .entry,.ef-footer,.entry>.bottom-reply-with-box .discussion-entry-reply-area,.form-dialog .form-controls,.ic-app-footer,.module-sequence-footer .module-sequence-footer-content,.question.matching_question .answer,.question.multiple_answers_question .answer,.question.multiple_choice_question .answer,.question.true_false_question .answer,.rubric_container .rubric_title,.slick-header-column.ui-state-default,.table td,.table th,.dNoYT_bGBk{border-top:1px solid var(--bcborders)!important}.discussions-v2__container-image{border:.125rem dashed var(--bcborders)!important}.Button--active.ui-button,.Button.Button--active,.Button.active,.active.ui-button,.btn.Button--active,.btn.active,.btn.ui-button.ui-state-active,.message-list .message-count,.mini_calendar .day.today,.ui-button.ui-state-active,.ui-button.ui-state-active.ui-state-hover,.ui-button.ui-state-active:hover,.ui-progressbar .btn.ui-button.ui-widget-header,.ui-progressbar .ui-button.ui-widget-header,::-webkit-scrollbar-thumb,.ic-unread-badge__total-count,#calendar-app .fc-month-view .fc-today{background:var(--bcbackground-2)!important}.discussion-entries .entry .entry,.kl_image_white_border{border:0!important}.ac-result-wrapper:before{border-bottom:10px solid var(--bcborders)}.eIQkd_bGBk,.ui-tabs .ui-tabs-nav,.eHzxc_bGBk,.quiz_comment:after,.quiz_comment:before{border-bottom-color:var(--bcborders)!important}.ic-item-row{box-shadow:0 -1px var(--bcborders),inset 0 -1px var(--bcborders)!important}#GradeSummarySelectMenuGroup span,#kl_content_block_0 h3:nth-child(1),#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1),#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1),#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1),#kl_custom_block_2 h3:nth-child(1) i,#kl_wrapper_3.kl_colored_headings #kl_modules h3,#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_emta h3:not(.ui-state-default),.bettercanvas-card-grade,.bettercanvas-card-header,.discussion-fyi,.ic-DashboardCard__action-badge,.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active .menu-item__text,.ig-list .ig-row,.kl_flex_column h4,.menu-item__badge,.mini_calendar .day.other_month,.ui-tabs .ui-tabs-nav li.ui-tabs-active a,.bettercanvas-course-percent,.bettercanvas-todo-container,.bettercanvas-todo-container:hover,.MlJlv_ebWM,.bettercanvas-todo-item,.bettercanvas-todo-item:hover,.bettercanvas-hover-preview,.baylorMainContainer,.baylor-table td,.fOyUs_dUgE, .fOyUs_bvKN,.muted,h1 small,h2 small,h3 small,h4 small,h5 small,h6 small,blockquote small,.css-1v8v5q1-optionItem,.Button,button,.btn,h1,h2,h3,h4,h5,h6,#tinymce,.PlannerItem-styles__type > span,.bettercanvas-todo-actions,.bettercanvas-todoitem-title,.bettercanvas-todo-control-btn svg,#bettercanvas-todosidebar-progress-text,.bettercanvas-sidebar-dropdown-open .bettercanvas-sidebar-item a,#bettercanvas-updatev1,#bettercanvas-updatev1 button,#bettercanvas-search-input,.bettercanvas-sidebar-dropdown-open svg{color:var(--bctext-0)!important}.ToDoSidebarItem__Icon,{fill:var(--bctext-0)!important}.ic-avatar{border:2px solid var(--bctext-0)!important}#breadcrumbs>ul>li+li:last-of-type a,#calendar-app .fc-agendaWeek-view .fc-axis,#calendar-app .fc-agendaWeek-view .fc-widget-header,#calendar-app .fc-month-view .fc-widget-header,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-axis,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-widget-header,#calendar-drag-and-drop-container .fc-month-view .fc-widget-header,#content-wrapper .user_content.not_design_tools h3,.bettercanvas-course-credit,#kl_banner,#kl_banner h2,#kl_banner_left,#kl_banner_right,#kl_custom_block_0,#kl_readings p,#kl_wrapper_3.kl_colored_headings #kl_banner #kl_banner_left,#kl_wrapper_3.kl_colored_headings #kl_banner .kl_subtitle,#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings h4,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left h4,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i,#kl_wrapper_3.kl_emta,#minical .fc-toolbar .h2,#minical .fc-toolbar h2,#minical .fc-widget-content,#nav-tray-portal>span>span>div>div>.navigation-tray-container.courses-tray>.tray-with-space-for-global-nav>div>ul>li>div,#right-side .details .header,#right-side .right-side-list li em,#right-side .right-side-list li p,.Day-styles__root h2,.EmptyDays-styles__root,.HwBsD_blJt,.HwBsD_fqzO,.MlJlv_dnnz,.PlannerItem-styles__due,.PlannerItem-styles__score,.ToDoSidebarItem__Info,.ToDoSidebarItem__Info li,.ac-input-box,.accessible-toggler,.bettercanvas-assignment-container,.bettercanvas-assignment-container:hover,.bjXfh_daKB,.bjXfh_daKB span,.cWmNi_bGBk,.ccWIh_bGBk,.close,.comment_list .comment,.discussion-points,.discussion-pubdate,.discussion-rate-action,.discussion-reply-action,.discussion-section h4,.discussion-section p,.discussion-section ul,.discussion-tododate,.discussions-v2__container-image>span>div,.dropdown-menu li>a,.ef-plain-link,.ef-plain-link:hover,.enRcg_bGBk.enRcg_qFsi,.entry-content span,.esvoZ_drOs,.event-details-timestring,.extension-ac a:hover,.extension-linkpreview,.fCrpb_egrg,.fCrpb_egrg.fCrpb_fVUh,.fNHEA_blJt,.fQfxa_bCUx.fQfxa_buuG,.fc-agendaWeek-view .fc-event-container a[class*=group_] .fc-content .fc-time,.fc-event,.fc-event:hover,.fwfoD_fsuY,.header-row a.sort-field-active i,.hypodivcalc,.ic-Dashboard-header__title,.ic-DashboardCard__header-subtitle,.ic-DashboardCard__header-term,.ic-discussion-content-container,.ig-header .name,.ig-list .ig-row a.ig-title,.ig-type-icon,.item-group-condensed .ig-header,.item-group-expandable .emptyMessage,.jpyTq_bGBk,.kl_mod_text,.kl_readings span,.list-view a.active,.message-detail.conversations__message-detail .no-messages,.message-detail.span8 .no-messages,.message-list .author,.message-list .subject,.message.user_content div,.mini-cal-header,.mini_calendar .day,.nav-icon,.nav_list li.navitem,.ofhgV_ddES,.pages.show .page-title,.planner-day,.standalone-icon:before,.submission_attachment button>span,.tox .tox-collection__item,.tox .tox-insert-table-picker__label,.tray-with-space-for-global-nav>div>span>form>button>span,.tree i[class*=icon-],.tree i[class^=icon-],.ui-button,.ui-state-default,.ui-tabs .ui-tabs-nav li a,.ui-widget .fc-event,.ui-widget-content,.ui-widget-header .ui-state-default,.uneditable-input,.user_content.enhanced,.user_content,.user_content.enhanced p,body,code,input.enRcg_bGBk[type].enRcg_qFsi,input[type=color],input[type=date],input[type=datetime-local],input[type=datetime],input[type=email],input[type=month],input[type=number],input[type=password],input[type=search],input[type=tel],input[type=text],input[type=time],input[type=url],input[type=week],label.fCrpb_egrg,legend,pre,select,textarea,ul#question_list li i, .enRcg_bGBk.enRcg_bLsb, input.enRcg_bGBk[type].enRcg_bLsb,.erWSf_bGBk,.faJyW_blJt,.eMdva_bgqc,#right-side p.email_channel,.dpCPB_caGd,.XOwIb_ddES,.fdyuz_bGBk,.fOyUs_fZwI, .fOyUs_kXoP,.fQfxa_dqAF.fQfxa_buuG,.communication_message .header .header_title .title,.communication_message .header .header_title .sub_title,.ic-tokens,ic-tokeninput-input,.ftPBL_cuDj,.dUOHu_eCSh,.blnAQ_eCSh,#gradebook_header,.bettercanvas-assignment-link,.bettercanvas-assignment-link:hover,.jumbotron,.card,.ac-token,span[style='color: #000000;'],.bettercanvas-gpa-edit-btn,#bettercanvas-todo-creator input::placeholder{color:var(--bctext-1)!important}.list-view a.active{border-left:2px solid var(--bclinks)!important}.ToDoSidebarItem svg,.discussions-v2__wrapper>span>span>span>span>button>span>span>svg,.ic-DashboardCard__action-layout svg,.tox .tox-split-button__chevron svg,.tox .tox-tbtn svg,.tox .tox-tbtn svg g,.tox .tox-tbtn svg path{fill:var(--bctext-1)!important}.caret{border-top:4px solid var(--bctext-1)!important}#last_saved_indicator,#minical .fc-other-month,#nav_disabled_list li.navitem,.ToDoSidebarItem__Info>span,.extension-aldue,.ic-item-row__meta-content-timestamp p,.ig-list .icon-drag-handle,.ig-list .ig-row .ig-empty-msg,.message-detail.conversations__message-detail .date,.message-detail.conversations__message-detail .user-info .context,.message-detail.span8 .date,.message-detail.span8 .user-info .context,.message-list .summary,.profile_table .data_description,.question .header .question_points_holder,.student_assignment .context,.tox .tox-collection__item-accessory,.yyQPt_blJt,ul#question_list.read_only li.seen,ul#question_list li.current_question,.css-1sr6v3o-text{color:var(--bctext-2)!important}#content-wrapper .user_content.not_design_tools a,#media_comment_maybe,#nav-tray-portal a,.ToDoSidebarItem__Title a,.message-list .date,a,a:focus,a:hover,.fQfxa_bCUx.fQfxa_eCSh,.fake-link,.no-touch .ic-DashboardCard__action:hover,.enRcg_bGBk.enRcg_fpfC, input.enRcg_bGBk[type].enRcg_fpfC,.bettercanvas-todo-actions-btn,.bettercanvas-todoitem-title-minimal{color:var(--bclinks)!important}#minical .fc-bg .fc-state-highlight,#submit_file_button,.StickyButton-styles__root,.ic-DashboardCard__action-badge,.menu-item__badge,ul.outcome-level li.selected a::before,.eMdva_pypk .eMdva_dnnz,.ic-notification__icon,.fQfxa_dqAF.fQfxa_eCSh,.recent_activity>li .unread-count,.recent_activity>li .unread.message-list .read-state:before,.eMdva_pypk .eMdva_dnnz,.tox .tox-collection--list .tox-collection__item--active:not(.tox-collection__item--state-disabled),.nav-badge,.message-list .read-state:before,.ic-unread-badge,.cECYn_bXiG,.unread-grade,.bettercanvas-todo-label,.bettercanvas-todo-item-border{background:var(--bclinks)!important}.eHQDY_ddES .eHQDY_eWAY{stroke:var(--bclinks)!important}.message-list .messages>li:hover{box-shadow:inset -4px 0 0 var(--bclinks)!important}.agenda-event__item-container:focus,.agenda-event__item-container:hover{box-shadow:inset 3px 0 0 var(--bclinks)}#calendar-app .fc-agendaWeek-view .fc-day-grid .fc-today,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-day-grid .fc-today{box-shadow:.5px -6px 0 0 var(--bclinks)}.message-list .read-state.read:before{box-shadow:0 0 0 1px var(--bclinks)}#minical .event::after{border:1px solid var(--bclinks)}.ic-notification{border:2px solid var(--bclinks)!important}.eMdva_pypk,.tox .tox-edit-area.active, .tox .tox-edit-area.active iframe,.emSEn_QUBp:hover{border-color:var(--bclinks)!important}.eHQDY_ddES .eHQDY_eWAY{stroke:var(--bclinks)}.ui-dialog .ui-dialog-titlebar-close.ui-state-hover, .ui-dialog .ui-dialog-titlebar-close.ui-state-focus{box-shadow:0 0 0 2px var(--bclinks)}select.ic-Input:focus, textarea.ic-Input:focus, input[type=text].ic-Input:focus, input[type=password].ic-Input:focus, input[type=datetime].ic-Input:focus, input[type=datetime-local].ic-Input:focus, input[type=date].ic-Input:focus, input[type=month].ic-Input:focus, input[type=time].ic-Input:focus, input[type=week].ic-Input:focus, input[type=number].ic-Input:focus, input[type=email].ic-Input:focus, input[type=url].ic-Input:focus, input[type=search].ic-Input:focus, input[type=tel].ic-Input:focus, input[type=color].ic-Input:focus, .uneditable-input.ic-Input:focus{outline-color:var(--bclinks)}.discussion-section.message_wrapper table{border:4px solid red!important}.extension-linkpreview,.hypodivcalc,.kl_shadow_2,.kl_shadow_b2,.tox .tox-split-button:hover{box-shadow:none!important}#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i{border:none!important}.extension-aldue:hover,.ic-DashboardCard,.navigation-tray-container,.bettercanvas-gpa-card{box-shadow:0 2px 5px #00000080!important}.ui-datepicker .ui-datepicker-time,.ui-datepicker .ui-dialog .ui-datepicker-time,.ui-dialog .ui-datepicker .ui-datepicker-time,.ui-dialog .ui-dialog-buttonpane,hr{border-top:none!important}#right-side .shared-space h2{border-bottom-style:none!important}#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1) i{border:0!important}.ig-header .name{text-shadow:none!important}#right-side .events_list .event-details:after,#right-side .events_list .todo-details:after,#right-side .to-do-list .event-details:after,#right-side .to-do-list .todo-details:after{display:none!important},.muted-notice{background-image:none!important}.message-list .read-state.read:before{background:none!important}.ic-DashboardCard__header-button,.ic-app-header__secondary-navigation{background:none!important;border:none!important}.published-status.published .icon-publish::before{color:#0b874b!important}.ic-app-header{background:var(--bcsidebar)!important}.ic-app-header__logomark-container{background:none!important}.ic-app-header__menu-list-link .ic-icon-svg,.bettercanvas-certified svg{fill:var(--bcsidebar-text)!important}.menu-item-icon-container,.ic-app-header__menu-list-link .menu-item__text,.bettercanvas-sidebar-item-link,.bettercanvas-sidebar-item-dropdown-link,.bettercanvas-sidebar-item-dropdown-link:hover,.bettercanvas-sidebar-category,#bettercanvas-sidebar-support-btn,.bettercanvas-sidebar-grid-item,.bettercanvas-sidebar-grid-item svg,.bettercanvas-sidebar-dropdown-btn svg,.bettercanvas-certified svg{color:var(--bcsidebar-text)!important} .ic-DashboardCard,.ic-DashboardCard__header_content,.bettercanvas-assignment-container,.recent_feedback .event-details{background:none!important}#bettercanvas-search-filters button.active,.bettercanvas-search-item-icon,#bettercanvas-tooltip,#bettercanvas-todo-creator-submit,.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active .ic-app-header__menu-list-link{background:var(--bctext-0)!important}.bettercanvas-highlight-hover::after{background:var(--bctext-2)}#bettercanvas-search-filters button.active,.bettercanvas-search-item-icon,#bettercanvas-tooltip,#bettercanvas-todo-creator-submit,.bettercanvas-todo-control-btn.active svg,.bettercanvas-todosidebar-time-item.active .bettercanvas-todosidebar-time-item-text,.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active .menu-item__text,.ic-app-header__menu-list-item--active svg,.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active .ic-app-header__menu-list-link{color:var(--bcbackground-0)!important;}#bettercanvas-todo-creator-optional-header::before,{background:var(--bcborders)}.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active svg {fill:var(--bcbackground-0)!important";
    let css = (api_options.device_dark === true ? "@media (prefers-color-scheme: dark) {" : "") + ":root{";
    Object.keys(api_options.dark_preset).forEach(key => {
        css += "--bc" + key + ":" + api_options.dark_preset[key] + ";";
    });
    css += "}" + darkmode_css + (api_options.device_dark === true ? "}" : "");
    return css;
}

let darkStyleInserted = false;
function toggleDarkMode() {
    const css = generateDarkModeCSS();
    if ((api_options.dark_mode === true || api_options.device_dark === true) && !darkStyleInserted) {
        let style = document.createElement('style');
        style.textContent = css;
        document.documentElement.append(style);
        style.id = 'darkcss';
        style.className = "bettercanvas-darkmode-enabled";
        darkStyleInserted = true;
    } else if (darkStyleInserted) {
        let style = document.querySelector("#darkcss");
        style.textContent = api_options.dark_mode === true || api_options.device_dark ? css : "";
        style.className = api_options.dark_mode === true || api_options.device_dark ? "bettercanvas-darkmode-enabled" : "";
    }
    /*
    if (options.dark_mode === true || options.device_dark) {
        document.body.classList.add("bettercanvas--darkmode--enabled");
    } else {
        document.body.classList.remove("bettercanvas--darkmode--enabled");
    }
    */
    runiframeChecker();
}

function runDarkModeFixer(override = false) {
    if (api_options.dark_mode !== true) return { "path": "bettercanvas-darkmode_off", "time": "" };
    if (override === false && !api_options["dark_mode_fix"].includes(window.location.pathname)) return { "path": "bettercanvas-none", "time": "" };
    let output = inspectDarkMode();
    return { "path": window.location.pathname, "time": output.time };
}

function autoDarkModeCheck() {
    let date = new Date();
    let currentHour = date.getHours();
    let currentMinute = date.getMinutes();
    let status = false;
    if (api_options.auto_dark === false) return;
    let startHour = parseInt(api_options.auto_dark_start["hour"]);
    let startMinute = parseInt(api_options.auto_dark_start["minute"]);
    let endHour = parseInt(api_options.auto_dark_end["hour"]);
    let endMinute = parseInt(api_options.auto_dark_end["minute"]);
    if (currentHour === startHour) {
        status = currentMinute >= startMinute;
    } else if (currentHour === endHour) {
        status = currentMinute <= endMinute;
    } else if (startHour > endHour) {
        status = currentHour > startHour || currentHour < endHour;
    } else if (startHour < endHour) {
        status = currentHour > startHour && currentHour < endHour;
    }
    if (api_options.auto_dark === true) {
        api_options.dark_mode = status;
        chrome.storage.sync.set({ "dark_mode": status }, toggleDarkMode);
    }
}

function toggleAutoDarkMode() {
    clearInterval(timeCheck);
    if (api_options.auto_dark && api_options.auto_dark === false) return;
    autoDarkModeCheck();
    timeCheck = setInterval(autoDarkModeCheck, 60000);
}

let iframeObserver;
function runiframeChecker() {
    //if (current_page === "/" || current_page === "") return;

    if (api_options.dark_mode !== true) {
        if (iframeObserver) iframeObserver.disconnect();
        document.querySelectorAll('iframe').forEach((frame) => {
            if (frame.contentDocument && frame.contentDocument.documentElement && frame.contentDocument.documentElement.querySelector('#darkcss')) {
                frame.contentDocument.documentElement.querySelector('#darkcss').textContent = '';
                frame.contentDocument.body.classList.remove("bettercanvas--darkmode--enabled");
            }
        });
        return;
    }

    const callback = (mutationList) => {
        for (const mutation of mutationList) {
            //if(mutation.target.id.includes("bettercanvas-assignments")) console.log(mutation, mutation.type === 'childList', mutation.addedNodes.length > 0, mutation.addedNodes[0].nodeName == "IFRAME");
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName == "IFRAME") {
                const frame = mutation.addedNodes[0];
                const new_style_element = document.createElement("style");
                new_style_element.textContent = generateDarkModeCSS();
                new_style_element.id = "darkcss";
                frame.contentDocument.body.classList.add("bettercanvas--darkmode--enabled");
                frame.contentDocument.documentElement.prepend(new_style_element);


            }
        }
    };

    iframeObserver = new MutationObserver(callback);
    iframeObserver.observe(document.querySelector('html'), { childList: true, subtree: true });
}
;// ./js/features/fonts.js




function loadCustomFont() {
    let link = document.querySelector("#custom_font_link");
    let style = document.querySelector("#custom_font");

    let load = () => {
        if (api_options.custom_font.link !== "") {
            document.head.appendChild(style);
            link.href = `https://fonts.googleapis.com/css2?family=${api_options.custom_font.link}&display=swap`;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }

        style.textContent = api_options.custom_font.link === "" ? "" : `*, input, a, button, h1, h2, h3, h4, h5, h6, p, span {font-family: ${api_options.custom_font.family}!important}`;
    }

    let createEls = () => {
        link = document.createElement("link");
        link.id = "custom_font_link";
        style = document.createElement("style");
        style.id = "custom_font";
        load();
    }

    if (link && style) {
        load();
    } else if (api_options.custom_font.link !== "") {
        if (document.readyState !== 'loading') {
            createEls();
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                createEls();
            });
        }
    }
}

;// ./js/features/gpa.js




async function calculateGPA3() {
    let qualityPoints = 0, numCredits = 0, weightedQualityPoints = 0, cumulativePoints = 0, cumulativeCredits = 0;

    const courses = await grades;
    courses.forEach(course => {
        const storage = options["card_" + course.id];
        if (!storage) return;

        const weight = storage["weight"];
        const credits = parseFloat(storage["credits"]);
        let grade;
        if (storage["gr"] && !storage["gr"].includes("tmp")) {
            grade =  parseFloat(storage["gr"]);
        } else {
            grade = course["enrollments"][0]["current_period_computed_current_score"] || course["enrollments"][0]["computed_current_score"];
        }

        if (weight === "dnc" || !credits || !grade) return;
        let letter = "--";
        let gpa;
        if (grade >= options.gpa_calc_bounds["A+"].cutoff) {
            gpa = options.gpa_calc_bounds["A+"].gpa;
            letter = "A+";
        } else if (grade >= options.gpa_calc_bounds["A"].cutoff) {
            gpa = options.gpa_calc_bounds["A"].gpa;
            letter = "A";
        } else if (grade >= options.gpa_calc_bounds["A-"].cutoff) {
            gpa = options.gpa_calc_bounds["A-"].gpa;
            letter = "A-";
        } else if (grade >= options.gpa_calc_bounds["B+"].cutoff) {
            gpa = options.gpa_calc_bounds["B+"].gpa;
            letter = "B+";
        } else if (grade >= options.gpa_calc_bounds["B"].cutoff) {
            gpa = options.gpa_calc_bounds["B"].gpa;
            letter = "B";
        } else if (grade >= options.gpa_calc_bounds["B-"].cutoff) {
            gpa = options.gpa_calc_bounds["B-"].gpa;
            letter = "B-"
        } else if (grade >= options.gpa_calc_bounds["C+"].cutoff) {
            gpa = options.gpa_calc_bounds["C+"].gpa;
            letter = "C+";
        } else if (grade >= options.gpa_calc_bounds["C"].cutoff) {
            gpa = options.gpa_calc_bounds["C"].gpa;
            letter = "C";
        } else if (grade >= options.gpa_calc_bounds["C-"].cutoff) {
            gpa = options.gpa_calc_bounds["C-"].gpa;
            letter = "C-";
        } else if (grade >= options.gpa_calc_bounds["D+"].cutoff) {
            gpa = options.gpa_calc_bounds["D+"].gpa;
            letter = "D+";
        } else if (grade >= options.gpa_calc_bounds["D"].cutoff) {
            gpa = options.gpa_calc_bounds["D"].gpa;
            letter = "D";
        } else if (grade >= options.gpa_calc_bounds["D-"].cutoff) {
            gpa = options.gpa_calc_bounds["D-"].gpa;
            letter = "D-";
        } else {
            letter = "F";
            gpa = options.gpa_calc_bounds["F"].gpa;
        }
        /*
        if (course.id === "cumulative-gpa") {
            //gpa = parseFloat(options["cumulative_gpa"]["gr"]);
            gpa = 0;
            cumulativePoints += parseFloat(options["cumulative_gpa"]["gr"]) * credits;
            cumulativeCredits = credits;
        } else {
            */
        //course.querySelector(".bettercanvas-gpa-letter-grade").textContent = letter;

        let weightMultiplier = 0;
        if (weight === "ap") {
            weightMultiplier = 1;
        } else if (weight === "honors") {
            weightMultiplier = .5;
        }

        qualityPoints += gpa * credits;
        weightedQualityPoints += (gpa + weightMultiplier) * credits;
        numCredits += credits;
        //}

    })


    const gpaCumulative = parseFloat(options["cumulative_gpa"]["gr"]);
    const creditsCumulative = parseFloat(options["cumulative_gpa"]["credits"]);
    console.log((options.gpa_calc_weighted === true ? weightedQualityPoints : qualityPoints), (gpaCumulative * creditsCumulative), (numCredits + creditsCumulative))
    document.querySelector("#bettercanvas-gpa-cumulative").textContent = (((options.gpa_calc_weighted === true ? weightedQualityPoints : qualityPoints) + (gpaCumulative * creditsCumulative)) / (numCredits + creditsCumulative)).toFixed(2);
    document.querySelector("#bettercanvas-gpa-unweighted").textContent = (qualityPoints / numCredits).toFixed(2);
    document.querySelector("#bettercanvas-gpa-weighted").textContent = (weightedQualityPoints / numCredits).toFixed(2);

}

function calculateGPA2() {
    let qualityPoints = 0, numCredits = 0, weightedQualityPoints = 0, cumulativePoints = 0, cumulativeCredits = 0;
    document.querySelectorAll('.bettercanvas-gpa-course').forEach(course => {
        const weight = course.querySelector('.bettercanvas-course-weight').value;
        const credits = parseFloat(course.querySelector('.bettercanvas-course-credit').value);
        const grade = parseFloat(course.querySelector('.bettercanvas-course-percent').value);
        if (weight === "dnc" || !credits || !grade) return;
        let letter = "--";
        let gpa;
        if (grade >= api_options.gpa_calc_bounds["A+"].cutoff) {
            gpa = api_options.gpa_calc_bounds["A+"].gpa;
            letter = "A+";
        } else if (grade >= api_options.gpa_calc_bounds["A"].cutoff) {
            gpa = api_options.gpa_calc_bounds["A"].gpa;
            letter = "A";
        } else if (grade >= api_options.gpa_calc_bounds["A-"].cutoff) {
            gpa = api_options.gpa_calc_bounds["A-"].gpa;
            letter = "A-";
        } else if (grade >= api_options.gpa_calc_bounds["B+"].cutoff) {
            gpa = api_options.gpa_calc_bounds["B+"].gpa;
            letter = "B+";
        } else if (grade >= api_options.gpa_calc_bounds["B"].cutoff) {
            gpa = api_options.gpa_calc_bounds["B"].gpa;
            letter = "B";
        } else if (grade >= api_options.gpa_calc_bounds["B-"].cutoff) {
            gpa = api_options.gpa_calc_bounds["B-"].gpa;
            letter = "B-"
        } else if (grade >= api_options.gpa_calc_bounds["C+"].cutoff) {
            gpa = api_options.gpa_calc_bounds["C+"].gpa;
            letter = "C+";
        } else if (grade >= api_options.gpa_calc_bounds["C"].cutoff) {
            gpa = api_options.gpa_calc_bounds["C"].gpa;
            letter = "C";
        } else if (grade >= api_options.gpa_calc_bounds["C-"].cutoff) {
            gpa = api_options.gpa_calc_bounds["C-"].gpa;
            letter = "C-";
        } else if (grade >= api_options.gpa_calc_bounds["D+"].cutoff) {
            gpa = api_options.gpa_calc_bounds["D+"].gpa;
            letter = "D+";
        } else if (grade >= api_options.gpa_calc_bounds["D"].cutoff) {
            gpa = api_options.gpa_calc_bounds["D"].gpa;
            letter = "D";
        } else if (grade >= api_options.gpa_calc_bounds["D-"].cutoff) {
            gpa = api_options.gpa_calc_bounds["D-"].gpa;
            letter = "D-";
        } else {
            letter = "F";
            gpa = api_options.gpa_calc_bounds["F"].gpa;
        }
        /*
        if (course.id === "cumulative-gpa") {
            //gpa = parseFloat(options["cumulative_gpa"]["gr"]);
            gpa = 0;
            cumulativePoints += parseFloat(options["cumulative_gpa"]["gr"]) * credits;
            cumulativeCredits = credits;
        } else {
            */
        course.querySelector(".bettercanvas-gpa-letter-grade").textContent = letter;

        let weightMultiplier = 0;
        if (weight === "ap") {
            weightMultiplier = 1;
        } else if (weight === "honors") {
            weightMultiplier = .5;
        }

        qualityPoints += gpa * credits;
        weightedQualityPoints += (gpa + weightMultiplier) * credits;
        numCredits += credits;
        //}



    });
    document.querySelector("#bettercanvas-gpa-unweighted").textContent = (qualityPoints / numCredits).toFixed(2);
    document.querySelector("#bettercanvas-gpa-weighted").textContent = (weightedQualityPoints / numCredits).toFixed(2);
    const cGPA = document.querySelector("#bettercanvas-cumulative-gpa");
    const g = parseFloat(cGPA.querySelector(".bettercanvas-course-percent").value);
    const c = parseInt(cGPA.querySelector(".bettercanvas-course-credit").value);
    document.querySelector("#bettercanvas-gpa-cumulative").textContent = (((api_options.gpa_calc_weighted === true ? weightedQualityPoints : qualityPoints) + (g * c)) / (numCredits + c)).toFixed(2);
}

function changeGPASettings(course_id, update) {
    calculateGPA2();
    chrome.storage.sync.get(["card_" + course_id, "cumulative_gpa"], storage => {
        if (course_id === "cumulative") {
            chrome.storage.sync.set({ "cumulative_gpa": { ...storage["cumulative_gpa"], ...update } });
        } else if (storage["card_" + course_id]) {
            chrome.storage.sync.set({ ["card_" + course_id]: { ...storage["card_" + course_id], ...update } });
        }
    });
}

function createGPACalcCourse(location, course) {

    let customs;
    if (course.access_restricted_by_date === true) {
        return null;
    } if (course.id === "cumulative") {
        customs = api_options["cumulative_gpa"];
    } else if (api_options["card_" + course.id]) {
        customs = api_options["card_" + course.id];
    } else {
        return;
        customs = { "name": course.name, "hidden": false, "weight": "regular", "credits": 1, "gr": null };
    }
    if (customs.hidden === true) return;

    let courseContainer = util_makeElement("div", location, { "className": course.id === "cumulative" ? "bettercanvas-gpa-cumulative" : "bettercanvas-gpa-course", "innerHTML": '<div class="bettercanvas-gpa-letter-grade"></div>' });
    let courseName = util_makeElement("p", courseContainer, { "className": "bettercanvas-gpa-name", "textContent": customs.name === "" ? course.course_code : customs.name });
    let changerContainer = util_makeElement("div", courseContainer, { "className": "bettercanvas-gpa-percent-container" });

    let credits = util_makeElement("div", courseContainer, { "className": "bettercanvas-course-credits", "innerHTML": '<input class="bettercanvas-course-credit" value="1"></input><span class="bettercanvas-course-percent-sign">cr</span>' });
    let creditsChanger = credits.querySelector(".bettercanvas-course-credit");
    creditsChanger.value = customs.credits;
    let changer = util_makeElement("input", changerContainer, { "className": "bettercanvas-course-percent" });
    let percent = util_makeElement("span", changerContainer, { "className": "bettercanvas-course-percent-sign", "textContent": course.id === "cumulative" ? "/4" : "%" });
    let courseGrade = course?.enrollments[0].has_grading_periods === true ? course.enrollments[0].current_period_computed_current_score : course.enrollments[0].computed_current_score;

    if (customs["gr"] !== null) {
        changer.value = customs["gr"];
    } else if (courseGrade) {
        changer.value = courseGrade;
    } else {
        changer.value = "--";
    }

    if (course.id !== "cumulative") {
        let weightSelections = util_makeElement("form", courseContainer, { "className": "bettercanvas-course-weights" });
        weightSelections.innerHTML = '<select name="weight-selection" class="bettercanvas-course-weight"><option value="dnc">Do not count</option><option value="regular">Regular/College</option><option value="honors">Honors</option><option value="ap">AP/IB</option></select>';
        let weightChanger = weightSelections.querySelector(".bettercanvas-course-weight");
        weightChanger.value = changer.value === "--" ? "dnc" : customs.weight;
        weightChanger.addEventListener('change', () => changeGPASettings(course.id, { "weight": weightSelections.querySelector(".bettercanvas-course-weight").value }));

        let useCustomGr = util_makeElement("input", courseContainer, { "className": "bettercanvas-course-customgr", "type": "checkbox", "checked": customs.gr !== null ? true : false });
        let useCustomGrLabel = util_makeElement("span", courseContainer, { "className": "bettercanvas-course-customgr-label", "textContent": "Save custom grade" });
        useCustomGr.addEventListener("input", () => {
            if (api_options["card_" + course.id]) {
                const card = api_options["card_" + course.id];
                if (card["gr"] !== undefined && card["gr"] !== null) {
                    changer.value = courseGrade;
                    changeGPASettings(course.id, { "gr": null });
                } else {
                    changeGPASettings(course.id, { "gr": changer.value });
                }
            }
        });
    }

    changer.addEventListener('input', (e) => {
        if (course.id === "cumulative" || (api_options["card_" + course.id] && api_options["card_" + course.id]["gr"] !== undefined && api_options["card_" + course.id]["gr"] !== null)) {
            changeGPASettings(course.id, { "gr": e.target.value });
        } else {
            calculateGPA2();
        }
    });

    credits.querySelector(".bettercanvas-course-credit").addEventListener('input', () => changeGPASettings(course.id, { "credits": credits.querySelector(".bettercanvas-course-credit").value }));
    return courseContainer;
}

const gear_svg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>`));


function setupGPACalc() {
    if (api_current_page !== "/" && api_current_page !== "") return;
    try {
        api_grades?.then(result => {

            if (!document.querySelector(".ic-DashboardCard__box__container")) return;

            let container2 = document.querySelector(".bettercanvas-gpa-card") || document.createElement("div");
            container2.className = "bettercanvas-gpa-card";
            container2.style.display = api_options.gpa_calc === true ? "inline-block" : "none";

            container2.innerHTML = `<h3 class="bettercanvas-gpa-header">GPA</h3><div><div><p id="bettercanvas-gpa-unweighted"></p><p>Current</p></div><div style="display:${api_options["gpa_calc_weighted"] ? "block" : "none"}"><p id="bettercanvas-gpa-weighted"></p><p>Weighted</p></div><div style="display:${api_options["gpa_calc_cumulative"] ? "block" : "none"}"><p id="bettercanvas-gpa-cumulative"></p><p>Cumulative</p></div></div>`;
            let editBtn = util_makeElement("button", container2, { "className": "bettercanvas-gpa-edit-btn", "textContent": "Edit Calculator" });

            let container = document.querySelector(".bettercanvas-gpa") || document.createElement("div");
            container.className = "bettercanvas-gpa";
            container.innerHTML = '<h3 class="bettercanvas-gpa-header">GPA Calculator</h3><div class="bettercanvas-gpa-courses-container"><div class="bettercanvas-gpa-courses"></div></div>';

            if (api_options.gpa_calc_prepend === true) {
                document.querySelector(".ic-DashboardCard__box__container").prepend(container2);
                document.querySelector(".ic-DashboardCard__box__container").prepend(container);
            } else {
                document.querySelector(".ic-DashboardCard__box__container").appendChild(container2);
                document.querySelector(".ic-DashboardCard__box__container").appendChild(container);
            }

            let location = document.querySelector(".bettercanvas-gpa-courses");
            let cumulative = createGPACalcCourse(location, { "id": "cumulative", "enrollments": [{ "has_grading_periods": true, "current_period_computed_current_score": 0 }] });
            cumulative.id = "bettercanvas-cumulative-gpa";
            result.forEach(course => createGPACalcCourse(location, course));

            container.style.display = "none";

            editBtn.addEventListener("click", () => {
                if (container.style.display === "none") {
                    container.style.display = "inline-block";
                    editBtn.textContent = "Close Calculator";
                } else {
                    container.style.display = "none";
                    editBtn.textContent = "Edit Calculator";
                }
            });

            calculateGPA2();
        });
    } catch (e) {
        util_logError(e);
    }
}

function setupGPACalcNew() {
    if (current_page !== "/" && current_page !== "") return;
    if (options["gpa_calc"] === true) {
        try {
            grades?.then(result => {
    
                if (!document.querySelector(".ic-DashboardCard__box__container")) return;
    
                /*
                let container2 = document.querySelector(".bettercanvas-gpa-card") || document.createElement("div");
                container2.className = "bettercanvas-gpa-card";
                container2.style.display = options.gpa_calc === true ? "inline-block" : "none";
                */
    
                const container = document.querySelector(".bettercanvas-gpa-card") || document.createElement("div");
                container.className = "bettercanvas-gpa-card";
                container.style.display = "inline-block";
    
                
                let content = container.querySelector(".container") || makeElement("div", container, { "className": "container" });
                container.innerHTML = `<div class="bettercanvas-gpa-header-container">
                                        <h3 class="bettercanvas-gpa-header">GPA</h3>
                                      </div>
                                      <div>
                                        <div>
                                            <p id="bettercanvas-gpa-unweighted"></p>
                                            <p>Current</p>
                                        </div>
                                        <div style="display:${options["gpa_calc_weighted"] ? "block" : "none"}">
                                            <p id="bettercanvas-gpa-weighted"></p>
                                            <p>Weighted</p>
                                        </div>
                                        <div style="display:${options["gpa_calc_cumulative"] ? "block" : "none"}">
                                            <p id="bettercanvas-gpa-cumulative"></p>
                                            <p>Cumulative</p>
                                        </div>
                                    </div>`;
                
                //let editBtn = makeElement("button", container2, { "className": "bettercanvas-gpa-edit-btn", "textContent": "Edit Calculator" });
    
                //let container = document.querySelector(".bettercanvas-gpa") || document.createElement("div");
                //container.className = "bettercanvas-gpa";
                //container.innerHTML = '<div class="bettercanvas-gpa-header-container"><h3 class="bettercanvas-gpa-header">GPA Calculator</h3></div><div class="bettercanvas-gpa-courses-container"><div class="bettercanvas-gpa-courses"></div></div>';
    
                //let headerContainer = container2.querySelector(".bettercanvas-gpa-header-container") || makeElement("div", container2, { "className": "bettercanvas-gpa-header-container" });
                //let header = headerContainer.querySelector(".bettercanvas-gpa-header") || makeElement("h3", headerContainer, { "className": "bettercanvas-gpa-header", "textContent": "GPA" });
                let gpaSettings = container.querySelector(".bettercanvas-gpa-settings") || makeElement("button", container.querySelector(".bettercanvas-gpa-header-container"), { "className": "bettercanvas-gpa-settings", "id": "openCalculator", "innerHTML": gear_svg });
        
    
                gpaSettings.addEventListener("click", () => {
                    chrome.runtime.sendMessage({"type": "openCalculator"});
                });
    
                if (options.gpa_calc_prepend === true) {
                    document.querySelector(".ic-DashboardCard__box__container").prepend(container);
                    //document.querySelector(".ic-DashboardCard__box__container").prepend(container);
                } else {
                    //document.querySelector(".ic-DashboardCard__box__container").appendChild(container2);
                    document.querySelector(".ic-DashboardCard__box__container").appendChild(container);
                }
    
                /*
                let location = document.querySelector(".bettercanvas-gpa-courses");
                let cumulative = createGPACalcCourse(location, { "id": "cumulative", "enrollments": [{ "has_grading_periods": true, "current_period_computed_current_score": 0 }] });
                cumulative.id = "bettercanvas-cumulative-gpa";
                result.forEach(course => createGPACalcCourse(location, course));
                */
    
    
                /*
                editBtn.addEventListener("click", () => {
                    if (container.style.display === "none") {
                        container.style.display = "inline-block";
                        editBtn.textContent = "Close Calculator";
                    } else {
                        container.style.display = "none";
                        editBtn.textContent = "Edit Calculator";
                    }
                });
                */
    
                calculateGPA2();
        
            });
        } catch (e) {
            logError(e);
        }
    } else {
        const container = document.querySelector(".bettercanvas-gpa-card");
        if (container) container.style.display = "none";
    }
}
;// ./js/svg.js
//const assignmentSvg = `<svg class="bettercanvas-todo-svg" label="Assignment" name="IconAssignment" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false"><g role="presentation"><path d="M1468.2137,0 L1468.2137,564.697578 L1355.27419,564.697578 L1355.27419,112.939516 L112.939516,112.939516 L112.939516,1807.03225 L1355.27419,1807.03225 L1355.27419,1581.15322 L1468.2137,1581.15322 L1468.2137,1919.97177 L2.5243549e-29,1919.97177 L2.5243549e-29,0 L1468.2137,0 Z M1597.64239,581.310981 C1619.77853,559.174836 1655.46742,559.174836 1677.60356,581.310981 L1677.60356,581.310981 L1903.4826,807.190012 C1925.5058,829.213217 1925.5058,864.902104 1903.4826,887.038249 L1903.4826,887.038249 L1225.8455,1564.67534 C1215.22919,1575.17872 1200.88587,1581.16451 1185.86491,1581.16451 L1185.86491,1581.16451 L959.985883,1581.16451 C928.814576,1581.16451 903.516125,1555.86606 903.516125,1524.69475 L903.516125,1524.69475 L903.516125,1298.81572 C903.516125,1283.79477 909.501919,1269.45145 920.005294,1258.94807 L920.005294,1258.94807 Z M1442.35055,896.29929 L1016.45564,1322.1942 L1016.45564,1468.225 L1162.48643,1468.225 L1588.38135,1042.33008 L1442.35055,896.29929 Z M677.637094,1242.34597 L677.637094,1355.28548 L338.818547,1355.28548 L338.818547,1242.34597 L677.637094,1242.34597 Z M903.516125,1016.46693 L903.516125,1129.40645 L338.818547,1129.40645 L338.818547,1016.46693 L903.516125,1016.46693 Z M1637.62298,701.026867 L1522.19879,816.451052 L1668.22958,962.481846 L1783.65377,847.057661 L1637.62298,701.026867 Z M1129.39516,338.829841 L1129.39516,790.587903 L338.818547,790.587903 L338.818547,338.829841 L1129.39516,338.829841 Z M1016.45564,451.769356 L451.758062,451.769356 L451.758062,677.648388 L1016.45564,677.648388 L1016.45564,451.769356 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>`;
const dashboardSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-home"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l-2 0l9 -9l9 9l-2 0" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" /><path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" /></svg>`));
const coursesSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-book-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z" /><path d="M19 16h-12a2 2 0 0 0 -2 2" /><path d="M9 8h6" /></svg>`));
const calendarSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-week"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M4 11h16" /><path d="M7 14h.013" /><path d="M10.01 14h.005" /><path d="M13.01 14h.005" /><path d="M16.015 14h.005" /><path d="M13.015 17h.005" /><path d="M7.01 17h.005" /><path d="M10.01 17h.005" /></svg>`));
const inboxSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-mail"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>`));
const accountSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>`));

const assignmentsSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-pencil"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>`));
const chatsSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-message-dots"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 11v.01" /><path d="M8 11v.01" /><path d="M16 11v.01" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" /></svg>`));
const studySvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-book"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" /><path d="M3 6l0 13" /><path d="M12 6l0 13" /><path d="M21 6l0 13" /></svg>`));
const notesSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-note"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 20l7 -7" /><path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7" /></svg>`));
const leaderboardSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chart-bar-popular"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M9 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M15 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M4 20h14" /></svg>`));
const ratingSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-star"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>`));

const hourglassSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-hourglass-empty"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" /><path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z" /></svg>`;
const breatheSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-wind"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 8h8.5a2.5 2.5 0 1 0 -2.34 -3.24" /><path d="M3 12h15.5a2.5 2.5 0 1 1 -2.34 3.24" /><path d="M4 16h5.5a2.5 2.5 0 1 1 -2.34 3.24" /></svg>`;

const minimizeSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-bar-to-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20l16 0" /><path d="M12 14l0 -10" /><path d="M12 14l4 -4" /><path d="M12 14l-4 -4" /></svg>`));
const exitSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>`;
const maximizeSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-maximize"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /></svg>`));

const dollarSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-currency-dollar"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2" /><path d="M12 3v3m0 12v3" /></svg>`));
const musicSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-music"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M9 17v-13h10v13" /><path d="M9 8h10" /></svg>`;
const downSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" /></svg>`;

const leftSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>`;
const rightSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>`;

const bullhornSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-speakerphone"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 8a3 3 0 0 1 0 6" /><path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" /><path d="M12 8h0l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" /></svg>`;
const assignmentSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-file-description"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 17h6" /><path d="M9 13h6" /></svg>`;
const doneSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>`;
const circleSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>`;
const checkSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M9 12l2 2l4 -4" /></svg>`;
const quoteSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-quote"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 5a2 2 0 0 1 2 2v6c0 3.13 -1.65 5.193 -4.757 5.97a1 1 0 1 1 -.486 -1.94c2.227 -.557 3.243 -1.827 3.243 -4.03v-1h-3a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-3a2 2 0 0 1 2 -2z" /><path d="M18 5a2 2 0 0 1 2 2v6c0 3.13 -1.65 5.193 -4.757 5.97a1 1 0 1 1 -.486 -1.94c2.227 -.557 3.243 -1.827 3.243 -4.03v-1h-3a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-3a2 2 0 0 1 2 -2z" /></svg>`;
const noteSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-note"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 20l7 -7" /><path d="M13 20v-6a1 1 0 0 1 1 -1h6v-7a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7" /></svg>`;
const checklistSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-list-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3.5 5.5l1.5 1.5l2.5 -2.5" /><path d="M3.5 11.5l1.5 1.5l2.5 -2.5" /><path d="M3.5 17.5l1.5 1.5l2.5 -2.5" /><path d="M11 6l9 0" /><path d="M11 12l9 0" /><path d="M11 18l9 0" /></svg>`;
const tagSvg = `<svg  xmlns="http://www.w3.org/2000/svg" style="fill:none!important" width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-tag"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" /></svg>`;
const sparkSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-flare"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M11.106 2.553a1 1 0 0 1 1.788 0l2.851 5.701l5.702 2.852a1 1 0 0 1 .11 1.725l-.11 .063l-5.702 2.851l-2.85 5.702a1 1 0 0 1 -1.726 .11l-.063 -.11l-2.852 -5.702l-5.701 -2.85a1 1 0 0 1 -.11 -1.726l.11 -.063l5.701 -2.852z" /></svg>`;
const searchSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-search"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>`;
const fileSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-file"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>`;
const moduleSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-box"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" /><path d="M12 12l8 -4.5" /><path d="M12 12l0 9" /><path d="M12 12l-8 -4.5" /></svg>`;
const pencilSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-pencil"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>`;
const sitemapSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-sitemap"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M15 15m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z" /><path d="M6 15v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1" /><path d="M12 9l0 3" /></svg>`;
const backarrowSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-back"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 11l-4 4l4 4m-4 -4h11a4 4 0 0 0 0 -8h-1" /></svg>`;
const questionSvg = (/* unused pure expression or super */ null && (`<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-question-mark"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 8a3.5 3 0 0 1 3.5 -3h1a3.5 3 0 0 1 3.5 3a3 3 0 0 1 -2 3a3 4 0 0 0 -2 4" /><path d="M12 19l0 .01" /></svg>`));
const dotsSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>`;


;// ./js/features/todo.js





const discussion_svg = '<svg class="bettercanvas-todo-svg" name="IconDiscussion" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false"  ><g role="presentation"><path d="M677.647059,16 L677.647059,354.936471 L790.588235,354.936471 L790.588235,129.054118 L1807.05882,129.054118 L1807.05882,919.529412 L1581.06353,919.529412 L1581.06353,1179.29412 L1321.41176,919.529412 L1242.24,919.529412 L1242.24,467.877647 L677.647059,467.877647 L0,467.877647 L0,1484.34824 L338.710588,1484.34824 L338.710588,1903.24706 L756.705882,1484.34824 L1242.24,1484.34824 L1242.24,1032.47059 L1274.99294,1032.47059 L1694.11765,1451.59529 L1694.11765,1032.47059 L1920,1032.47059 L1920,16 L677.647059,16 Z M338.789647,919.563294 L903.495529,919.563294 L903.495529,806.622118 L338.789647,806.622118 L338.789647,919.563294 Z M338.789647,1145.44565 L677.726118,1145.44565 L677.726118,1032.39153 L338.789647,1032.39153 L338.789647,1145.44565 Z M112.941176,580.705882 L1129.41176,580.705882 L1129.41176,1371.40706 L710.4,1371.40706 L451.651765,1631.05882 L451.651765,1371.40706 L112.941176,1371.40706 L112.941176,580.705882 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
const quiz_svg = '<svg class="bettercanvas-todo-svg" label="Quiz" name="IconQuiz" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false"  ><g role="presentation"><g fill-rule="evenodd" stroke="none" stroke-width="1"><path d="M746.255375,1466.76417 L826.739372,1547.47616 L577.99138,1796.11015 L497.507383,1715.51216 L746.255375,1466.76417 Z M580.35118,1300.92837 L660.949178,1381.52637 L329.323189,1713.15236 L248.725192,1632.55436 L580.35118,1300.92837 Z M414.503986,1135.20658 L495.101983,1215.80457 L80.5979973,1630.30856 L0,1549.71056 L414.503986,1135.20658 Z M1119.32036,264.600006 C1475.79835,-91.8779816 1844.58834,86.3040124 1848.35034,88.1280123 L1848.35034,88.1280123 L1865.45034,96.564012 L1873.88634,113.664011 C1875.71034,117.312011 2053.89233,486.101999 1697.30034,842.693987 L1697.30034,842.693987 L1550.69635,989.297982 L1548.07435,1655.17196 L1325.43235,1877.81395 L993.806366,1546.30196 L415.712386,968.207982 L84.0863971,636.467994 L306.72839,413.826001 L972.602367,411.318001 Z M1436.24035,1103.75398 L1074.40436,1465.70397 L1325.43235,1716.61796 L1434.30235,1607.74796 L1436.24035,1103.75398 Z M1779.26634,182.406009 C1710.18234,156.41401 1457.90035,87.1020124 1199.91836,345.198004 L1199.91836,345.198004 L576.90838,968.207982 L993.806366,1385.10597 L1616.70235,762.095989 C1873.65834,505.139998 1804.68834,250.920007 1779.26634,182.406009 Z M858.146371,525.773997 L354.152388,527.597997 L245.282392,636.467994 L496.310383,887.609985 L858.146371,525.773997 Z"></path><path d="M1534.98715,372.558003 C1483.91515,371.190003 1403.31715,385.326002 1321.69316,466.949999 L1281.22316,507.305998 L1454.61715,680.585992 L1494.97315,640.343994 C1577.16715,558.035996 1591.87315,479.033999 1589.82115,427.164001 L1587.65515,374.610003 L1534.98715,372.558003 Z"></path></g></g></svg>';
const announcement_svg = '<svg class="bettercanvas-todo-svg" label="Announcement" name="IconAnnouncement" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" ><g role="presentation"><path d="M1587.16235,31.2784941 C1598.68235,7.78672942 1624.43294,-4.41091764 1650.63529,1.46202354 C1676.16,7.56084707 1694.11765,30.2620235 1694.11765,56.4643765 L1694.11765,56.4643765 L1694.11765,570.459671 C1822.87059,596.662024 1920,710.732612 1920,847.052612 C1920,983.372612 1822.87059,1097.55614 1694.11765,1123.75849 L1694.11765,1123.75849 L1694.11765,1637.64085 C1694.11765,1663.8432 1676.16,1686.65732 1650.63529,1692.6432 C1646.23059,1693.65967 1641.93882,1694.11144 1637.64706,1694.11144 C1616.52706,1694.11144 1596.87529,1682.36555 1587.16235,1662.93967 C1379.23765,1247.2032 964.178824,1242.34673 960,1242.34673 L960,1242.34673 L564.705882,1242.34673 L564.705882,1807.05261 L652.461176,1807.05261 C640.602353,1716.92555 634.955294,1560.05026 715.934118,1456.37026 C768.338824,1389.2832 845.590588,1355.28791 945.882353,1355.28791 L945.882353,1355.28791 L945.882353,1468.22908 C881.392941,1468.22908 835.312941,1487.09026 805.044706,1525.71614 C736.263529,1613.58438 759.981176,1789.54673 774.776471,1849.97026 C778.955294,1866.79849 775.115294,1884.6432 764.498824,1898.30908 C753.769412,1911.97496 737.28,1919.99379 720,1919.99379 L720,1919.99379 L508.235294,1919.99379 C477.063529,1919.99379 451.764706,1894.80791 451.764706,1863.5232 L451.764706,1863.5232 L451.764706,1242.34673 L395.294118,1242.34673 C239.548235,1242.34673 112.941176,1115.73967 112.941176,959.993788 L112.941176,959.993788 L112.941176,903.5232 L56.4705882,903.5232 C25.2988235,903.5232 0,878.337318 0,847.052612 C0,815.880847 25.2988235,790.582024 56.4705882,790.582024 L56.4705882,790.582024 L112.941176,790.582024 L112.941176,734.111435 C112.941176,578.478494 239.548235,451.758494 395.294118,451.758494 L395.294118,451.758494 L959.887059,451.758494 C976.828235,451.645553 1380.36706,444.756141 1587.16235,31.2784941 Z M1581.17647,249.706729 C1386.46588,492.078494 1128.96,547.871435 1016.47059,560.746729 L1016.47059,560.746729 L1016.47059,1133.47144 C1128.96,1146.34673 1386.46588,1202.02673 1581.17647,1444.51144 L1581.17647,1444.51144 Z M903.529412,564.699671 L395.294118,564.699671 C301.891765,564.699671 225.882353,640.709082 225.882353,734.111435 L225.882353,734.111435 L225.882353,959.993788 C225.882353,1053.39614 301.891765,1129.40555 395.294118,1129.40555 L395.294118,1129.40555 L903.529412,1129.40555 L903.529412,564.699671 Z M1694.11765,688.144376 L1694.11765,1006.07379 C1759.73647,982.694965 1807.05882,920.577318 1807.05882,847.052612 C1807.05882,773.527906 1759.73647,711.5232 1694.11765,688.144376 L1694.11765,688.144376 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
const assignment_svg = '<svg class="bettercanvas-todo-svg" label="Assignment" name="IconAssignment" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false"><g role="presentation"><path d="M1468.2137,0 L1468.2137,564.697578 L1355.27419,564.697578 L1355.27419,112.939516 L112.939516,112.939516 L112.939516,1807.03225 L1355.27419,1807.03225 L1355.27419,1581.15322 L1468.2137,1581.15322 L1468.2137,1919.97177 L2.5243549e-29,1919.97177 L2.5243549e-29,0 L1468.2137,0 Z M1597.64239,581.310981 C1619.77853,559.174836 1655.46742,559.174836 1677.60356,581.310981 L1677.60356,581.310981 L1903.4826,807.190012 C1925.5058,829.213217 1925.5058,864.902104 1903.4826,887.038249 L1903.4826,887.038249 L1225.8455,1564.67534 C1215.22919,1575.17872 1200.88587,1581.16451 1185.86491,1581.16451 L1185.86491,1581.16451 L959.985883,1581.16451 C928.814576,1581.16451 903.516125,1555.86606 903.516125,1524.69475 L903.516125,1524.69475 L903.516125,1298.81572 C903.516125,1283.79477 909.501919,1269.45145 920.005294,1258.94807 L920.005294,1258.94807 Z M1442.35055,896.29929 L1016.45564,1322.1942 L1016.45564,1468.225 L1162.48643,1468.225 L1588.38135,1042.33008 L1442.35055,896.29929 Z M677.637094,1242.34597 L677.637094,1355.28548 L338.818547,1355.28548 L338.818547,1242.34597 L677.637094,1242.34597 Z M903.516125,1016.46693 L903.516125,1129.40645 L338.818547,1129.40645 L338.818547,1016.46693 L903.516125,1016.46693 Z M1637.62298,701.026867 L1522.19879,816.451052 L1668.22958,962.481846 L1783.65377,847.057661 L1637.62298,701.026867 Z M1129.39516,338.829841 L1129.39516,790.587903 L338.818547,790.587903 L338.818547,338.829841 L1129.39516,338.829841 Z M1016.45564,451.769356 L451.758062,451.769356 L451.758062,677.648388 L1016.45564,677.648388 L1016.45564,451.769356 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';

const confetti = __webpack_require__(685);

/*
export function createTodoCreateBtn(location) {
    let confirmButton = makeElement("button", location, { "className": "bettercanvas-custom-btn", "textContent": "Create" });
    confirmButton.addEventListener("click", () => {
        chrome.storage.sync.get("custom_assignments_overflow", overflow => {
            chrome.storage.sync.get(overflow["custom_assignments_overflow"], storage => {
                let course_id = parseInt(location.querySelector("#bettercanvas-custom-course").value);

                const assignment = {
                    "plannable_id": new Date().getTime(),
                    "context_name": options.custom_cards[location.querySelector("#bettercanvas-custom-course").value].default,
                    "plannable": { "title": location.querySelector("#bettercanvas-custom-name").value },
                    "plannable_date": location.querySelector("#bettercanvas-custom-date").value + "T" + location.querySelector("#bettercanvas-custom-time").value + ":00",
                    "planner_override": { "marked_complete": false, "custom": true },
                    "plannable_type": "assignment",
                    "submissions": { "submitted": false },
                    "course_id": course_id,
                    "html_url": `/courses/${course_id}/assignments`
                };


                let found = false;
                let reload = () => {
                    location.classList.toggle("bettercanvas-custom-open");
                    loadBetterTodo();
                    loadCardAssignments();
                }

                const updates = {};
                let findOpenOverflow = (num) => {

                    // no overflow found, make a new one
                    if (num >= overflow["custom_assignments_overflow"].length) {
                        updates["custom_assignments_" + num] = [assignment];
                        updates["custom_assignments_overflow"] = [...overflow["custom_assignments_overflow"], "custom_assignments_" + num];
                        return;
                    }

                    const current_overflow = overflow["custom_assignments_overflow"][num];
                    const newOverflow = [...options[current_overflow], assignment];
                    const length = JSON.stringify(newOverflow).length;

                    if (length > 8000) {
                        return findOpenOverflow(num + 1);
                    }

                    updates[current_overflow] = newOverflow;
                    return;

                }

                findOpenOverflow(0);

            });
        })
    });
}
*/


function createTodoHeader(location) {
    let todoHeader = util_makeElement("h2", location, { "className": "todo-list-header", "style": "display: flex; align-items:center; justify-content:space-between;" });

    let headerText = util_makeElement("span", todoHeader, { "className": "bettercanvas-todo-header", "textContent": "To Do" });
    let addButton = util_makeElement("button", todoHeader, { "className": "bettercanvas-custom-btn", "textContent": "+ Add" });
    addButton.addEventListener("click", () => {
        document.getElementById("bettercanvas-todo-creator").classList.add("active");
    });

    headerText.addEventListener("click", () => {
        if (filter === "todo") {
            filter = "done";
            headerText.textContent = "Done";
        } else {
            filter = "todo";
            headerText.textContent = "To Do";
        }
        moreAssignmentCount = 0;
        moreAnnouncementCount = 0;
        loadBetterTodoMinimal();
    });
}


function createTodoSections(location) {

    let todoAssignments = util_makeElement("ul", location, { "id": "bettercanvas-todo-list" });
    /*
    let todoAssignments = document.createElement("ul");
    todoAssignments.id = "bettercanvas-todo-list";
    location.appendChild(todoAssignments);
    */
    let announcementHeader = util_makeElement("h2", location, { "className": "todo-list-header", "textContent": "Announcements" });
    let todoAnnouncements = util_makeElement("ul", location, { "id": "bettercanvas-announcement-list" });
    /*
    let todoAnnouncements = document.createElement("ul");
    todoAnnouncements.id = "bettercanvas-announcement-list";
    location.appendChild(todoAnnouncements);
    */
    let loader = '<div class="bettercanvas-todo-item-loader"><div style="width: 100px" class="bettercanvas-skeleton-text"></div><div style="width: 200px" class="bettercanvas-skeleton-text"></div><div class="bettercanvas-skeleton-text"></div></div>';
    for (let i = 0; i < api_options.num_todo_items; i++) {
        todoAssignments.innerHTML += loader;
        todoAnnouncements.innerHTML += loader;
    }
}

function createTodoViewMore(location, type) {
    let viewMoreButton = util_makeElement("button", location, { "className": "bettercanvas-custom-btn bettercanvas-viewmore-btn", "textContent": "View More" });
    //viewMoreButton.classList.add("bettercanvas-viewmore-btn");
    const showMoreCount = 3;
    viewMoreButton.addEventListener("click", function (e) {
        if (type === "announcement") {
            moreAnnouncementCount += showMoreCount;
        } else {
            moreAssignmentCount += showMoreCount;
        }
        todo_loadBetterTodo();
    });
}

function resetBars() {
    document.getElementById("bettercanvas-todo-svg").textContent = "";
}

let confettiStop = 0;

function showConfetti() {
    const el = document.getElementById("bettercanvas-todo-confetti");
    el.classList.add("active");
    const completeConfetti = confetti.create(el, {
        resize: false,
        useWorker: true,
    });

    if (Date.now() % 4 === 0) {
        completeConfetti({
            startVelocity: 40,
            particleCount: 5,
            spread: 60,
            angle: 270,
            gravity: 1,
            ticks: 100,
            origin: {
                x: .5,
                y: -.2,
            }
        })
    }


    /*
    setInterval(() => {
        completeConfetti({
            startVelocity: 30,
            particleCount: 80,
            spread: 70,
            angle: 270,
            origin: {
                x: .5,
                y: 0,
            }
        })
    }, 1000);
    */

    if (Date.now() < confettiStop) {
        setTimeout(() => {
            showConfetti();
        }, 3);
    } else {
        setTimeout(() => {
            //el.classList.remove("active");
        }, 3000);
    }


    /*
        setTimeout(() => {
            el.classList.remove("active");
        }, 2000);
        */
}


function loadBars(config) {

    const keys = Object.keys(config);

    loadFilterCourses(keys);

    if (api_options["todo_style"] === "none") {
        document.getElementById("bettercanvas-todosidebar-progress").style.display = "none";
        return;
    }

    document.getElementById("bettercanvas-todosidebar-progress").style.display = "block";
    //document.getElementById("bettercanvas-todo-svg-container").style.height = "240px";

    const svg = document.getElementById("bettercanvas-todo-svg");

    const svgWidth = 300;
    const maxStrokeWidth = 40;
    const minRadius = 80;
    const gap = 5;


    let beginRadius = 0;

    const count = keys.length;

    const total = (count * maxStrokeWidth + count * gap) - gap;
    let strokeWidth = maxStrokeWidth;


    strokeWidth = Math.min(maxStrokeWidth, ((svgWidth / 2) - minRadius - (count * gap - gap)) / count);
    beginRadius = minRadius;


    const SEMI_CIRCLE = api_options["todo_style"] === "rainbow";

    const ypos = SEMI_CIRCLE ? strokeWidth / 2 : (svgWidth / 2);


    // progress text and percentage
    const progressText = document.getElementById("bettercanvas-todosidebar-progress-text");
    const progressFraction = document.getElementById("bettercanvas-todosidebar-progress-fraction");
    const progressPercentage = document.getElementById("bettercanvas-todosidebar-progress-percentage");

    let allComplete = 0;
    let allCount = 0;

    Object.keys(config).forEach(key => {
        allComplete += config[key]["complete"];
        allCount += config[key]["total"];
    });

    progressFraction.textContent = `${allComplete}/${allCount}`;
    progressPercentage.textContent = `${parseInt(allComplete / allCount * 100)}%`;
    progressText.style = "left: 50%; bottom: 50%;transform: translate(-50%, 50%);";

    if (allCount === 0) {
        progressText.classList.add("bettercanvas-todosidebar-progress-none");
    } else {
        progressText.classList.remove("bettercanvas-todosidebar-progress-none");
    }


    // hide bars not in current config
    document.querySelectorAll(".bettercanvas-todo-bar-group").forEach(group => {
        if (keys.includes(group.dataset.todocourse)) {
            group.style.display = "block";
        } else {
            group.style.display = "none";
        }
    });

    for (let i = 0; i < keys.length; i++) {

        const totalCount = config[keys[i]].total;
        const submittedCount = config[keys[i]].complete;

        const radius = beginRadius + (i * strokeWidth) + (i * gap);
        const c = 2 * 3.14 * radius;

        let group = document.getElementById("bettercanvas-todo-group-" + keys[i]);
        if (!group) {
            group = document.createElementNS("http://www.w3.org/2000/svg", "g");
            group.classList.add("bettercanvas-todo-bar-group");
            group.id = "bettercanvas-todo-group-" + keys[i];
            group.dataset.todocourse = keys[i];
        }

        const circle = group.querySelector(".bettercanvas-todo-bar-circle") || document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.classList.add("bettercanvas-todo-bar-circle");

        let bar = group.querySelector(".bettercanvas-todo-bar");
        if (!bar) {
            bar = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bar.classList.add("bettercanvas-todo-bar");
            bar.setAttribute("stroke-dasharray", c);
            bar.setAttribute("stroke-dashoffset", c * .999); // Start at 0%
        }


        circle.setAttribute("cx", (svgWidth / 2));
        circle.setAttribute("cy", ypos);
        circle.setAttribute("r", radius);
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", api_options["card_" + keys[i]]["color"]);
        circle.setAttribute("stroke-width", strokeWidth + "px");


        bar.setAttribute("cx", (svgWidth / 2));
        bar.setAttribute("cy", ypos);
        bar.setAttribute("r", radius);
        bar.setAttribute("fill", "none");
        bar.setAttribute("stroke", api_options["card_" + keys[i]]["color"]);
        bar.setAttribute("stroke-width", strokeWidth + "px");
        bar.setAttribute("stroke-dasharray", c);
        //bar.setAttribute("stroke-dashoffset", c * .999); // Start at 0%

        // give it a buffer
        const percentage = Math.max(.001, submittedCount / totalCount);


        if (SEMI_CIRCLE) {
            circle.setAttribute("stroke-dasharray", c);
            circle.setAttribute("stroke-dashoffset", c * .5);
            progressText.style = "left: 50%; bottom: 20%;transform: translate(-50%, 50%);";
        }

        setTimeout(() => {
            if (SEMI_CIRCLE) {
                bar.setAttribute("stroke-dasharray", c);
                bar.setAttribute("stroke-dashoffset", c * .5 + (c * (1 - percentage) * .5));

            } else {
                bar.setAttribute("stroke-dasharray", c);
                bar.setAttribute("stroke-dashoffset", c * (1 - percentage));

            }
        }, 200);

        group.onmouseenter = (e) => {
            progressFraction.textContent = `${submittedCount}/${totalCount}`;
            progressPercentage.textContent = `${parseInt(submittedCount / totalCount * 100)}%`;
            showTooltip(api_options["card_" + keys[i]]["default"], e);
        }

        group.onmousemove = (e) => {
            moveTooltip(e);
        }

        group.onmouseleave = () => {
            if (courseFilter === null) {
                progressFraction.textContent = `${allComplete}/${allCount}`;
                progressPercentage.textContent = `${parseInt(allComplete / allCount * 100)}%`;
            } else {
                progressFraction.textContent = `${submittedCount}/${totalCount}`;
                progressPercentage.textContent = `${parseInt(submittedCount / totalCount * 100)}%`;
            }
            closeTooltip();
        }

        group.onclick = () => {
            setActiveCourseFilter(courseFilter === null ? keys[i] : null);
        }

        if (courseFilter !== null && parseInt(keys[i]) === parseInt(courseFilter)) {
            progressFraction.textContent = `${submittedCount}/${totalCount}`;
            progressPercentage.textContent = `${parseInt(submittedCount / totalCount * 100)}%`;
        }

        group.appendChild(circle);
        group.appendChild(bar);
        svg.appendChild(group);
        svg.style.transform = "rotate(180deg)";
    }

    if (SEMI_CIRCLE) {
        document.getElementById("bettercanvas-todo-svg-container").style.height = "150px";
        svg.setAttribute("viewBox", "0 0 300 165");
    }
}

async function createTodoProgress(location) {


    const containerHeight = api_options["todo_style"] === "rainbow" ? "150px" : (api_options["todo_style"] === "none" ? "0px" : "260px");
    const container = util_makeElement("div", location, { "id": "bettercanvas-todo-svg-container", "style": "height:" + containerHeight });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "bettercanvas-todo-svg";
    svg.setAttribute("viewBox", "0 0 300 300");
    svg.style = "stroke-linecap:round;display:block;";
    container.appendChild(svg);

    util_makeElement("div", container, { "id": "bettercanvas-todo-loader", "className": "bettercanvas-load-" + api_options["todo_style"] });
    //container.innerHTML = "<div id='bettercanvas-todo-svg-spinner'>I WILL BE THE SPONERR!!!</div>";
}

let todoTime = "day";

function createTodoTime(location) {
    const el = document.getElementById("bettercanvas-todosidebar-time") || util_makeElement("div", location, { "id": "bettercanvas-todosidebar-time" });
    //const slider = makeElement("div", el, { "id": "bettercanvas-todosidebar-slider" });
    const day = util_makeElement("button", el, { "id": "bettercanvas-todosidebar-day", "className": "bettercanvas-todosidebar-time-item bettercanvas-highlight-hover" });
    const dayText = util_makeElement("p", day, { "className": "bettercanvas-todosidebar-time-item-text", "textContent": "Day" });
    const week = util_makeElement("button", el, { "id": "bettercanvas-todosidebar-week", "className": "bettercanvas-todosidebar-time-item bettercanvas-highlight-hover" });
    const weekText = util_makeElement("p", week, { "className": "bettercanvas-todosidebar-time-item-text", "textContent": "Week" });
    const month = util_makeElement("button", el, { "id": "bettercanvas-todosidebar-month", "className": "bettercanvas-todosidebar-time-item bettercanvas-highlight-hover" });
    const monthText = util_makeElement("p", month, { "className": "bettercanvas-todosidebar-time-item-text", "textContent": "Month" });

    if (api_options.todo_time === "day") {
        //slider.style.left = "0";
        day.classList.add("active");
    } else if (api_options.todo_time === "week") {
        //slider.style.left = "34%";
        week.classList.add("active");
    } else if (api_options.todo_time === "month") {
        //slider.style.left = "67%";
        month.classList.add("active");
    }

    const change = (period, target) => {
        document.querySelectorAll(".bettercanvas-todosidebar-time-item").forEach(item => {
            item.classList.remove("active");
        });
        target.classList.add("active");
        todoTime = period;
        periodStart = getNearestPeriodStart(Date.now(), period);
        resetBars();
        resetItems();
        cacheTodoItems().then(todo_loadBetterTodo);
        chrome.storage.sync.set({ "todo_time": period });
    }

    day.onclick = () => change("day", day);
    week.onclick = () => change("week", week);
    month.onclick = () => change("month", month);

}

let cache = {};

function getTodoSvg(type) {
    switch (type) {
        case "assignment": return assignment_svg;
        case "discussion_topic": return discussion_svg;
        case "quiz": return quiz_svg;
        case "announcement": return announcement_svg;
        default: return null;
    }
}


let hoverDetails = {
    "announcement": {},
    "assignment": {},
    "discussion": {},
    "quiz": {}
};

async function loadHoverDetail(type, courseId, id) {

    if (hoverDetails[type][id]) return true;

    if (type !== "announcement") {
        const data = await getData(`${domain}/api/v1/courses/${courseId}/assignments/${id}`);
        hoverDetails[type][id] = data.description.replace(/<\/?[^>]+(>|$)/g, " ");
        return true;
    } else {
        let found = false;
        let searchCount = 1;
        while (searchCount < 5 && found === false) {

            let data = await getData(`${domain}/api/v1/announcements?context_codes[]=course_${courseId}&per_page=3&page=${searchCount}`);
            if (data.length > 0) {
                data.forEach(item => {
                    hoverDetails["announcement"][id] = item.message.replace(/<\/?[^>]+(>|$)/g, " ");
                });
            } else {
                return false;
            }

            if (hoverDetails["announcement"][id]) return true;
            searchCount++;

        }
    }

    return false;
}

function getPeriod(item) {
    let period;
    const date = new Date(item.plannable_date);
    const diffStart = date.getTime() - periodStart.getTime();
    const diffNearestDay = date.getTime() - new Date(Date.now()).setHours(0, 0, 0, 0);
    const diffNow = date.getTime() - Date.now();

    if (item.plannable_type === "announcement" && item.done === true) {
        period = "read";
    } else if (item.plannable_type === "announcement") {
        period = "unread"
    } else if (item.done === true && item.submissions?.graded === true) {
        period = "graded";
    } else if (item.done === true) {
        period = "ungraded";
    } else if (diffNow < 0) {
        period = "overdue";
    } else if (diffNow < 1000 * 60 * 60 * 6) {
        period = "soon";
    } else if (diffNearestDay < 1000 * 60 * 60 * 24) {
        period = "today";
    } else if (diffNearestDay < 1000 * 60 * 60 * 24 * 2) {
        period = "tomorrow";
    } else if (diffNearestDay < 1000 * 60 * 60 * 24 * 7) {
        period = "week";
    } else if (diffNearestDay < 1000 * 60 * 60 * 24 * 7 * 2) {
        period = "nextweek";
    } else {
        period = "later";
    }

    return { "diff": diffStart, "period": period };
}

async function cacheTodoItems() {

    return new Promise(async (resolve, reject) => {

        let innerCache = {};

        // const maxAssignmentCount = parseInt(options.num_todo_items) + moreAssignmentCount;
        //const maxAnnouncementCount = parseInt(options.num_todo_items) + moreAnnouncementCount;

        const data = await assignments;
        let items = combineAssignments(data);

        items.forEach(item => {
            if (!item.course_id) return;
            try {
                const itemState = api_options.assignment_states[item.plannable_id];
                const date = new Date(item.plannable_date);
                const svg = getTodoSvg(item.plannable_type);

                let listItemContainer = document.createElement("div");
                listItemContainer.classList.add("bettercanvas-todo-container");
                listItemContainer.dataset.id = item.plannable_id;
                const wrapper = util_makeElement("div", listItemContainer, { "className": "bettercanvas-todo-wrapper bettercanvas-highlight-hover" });
                const border = util_makeElement("div", wrapper, { "className": "bettercanvas-todo-item-border" });
                const todoitem = util_makeElement("a", wrapper, { "className": "bettercanvas-todo-item", "href": item.html_url });
                const course = util_makeElement("p", todoitem, { "className": "bettercanvas-todoitem-course", "textContent": api_options["card_" + item.course_id]?.default || item.context_name });
                const header = util_makeElement("div", todoitem, { "className": "bettercanvas-todo-item-header" });
                const title = util_makeElement("a", header, { "className": "bettercanvas-todoitem-title", "textContent": item.plannable.title });

                // check the completion state of the item
                if (item.plannable_type === "announcement") {
                    item.done = api_options["todo_read"].includes(item.plannable_id);
                } else {
                    item.done = item.submissions.submitted === true || api_options["todo_completed"].includes(item.plannable_id);
                }

                // todo date formatting
                let format = formatTodoDate(date, item.submissions, api_options["todo_hr24"]);
                const customItem = item.planner_override && item.planner_override.custom && item.planner_override.custom === true;

                if (customItem === true) {
                    const optionsBtn = util_makeElement("button", wrapper, { "className": "bettercanvas-todoitem-options", "innerHTML": dotsSvg });
                    const todoOptions = util_makeElement("div", wrapper, { "className": "bettercanvas-todo-options-popup" });
                    const removeAssignmentBtn = util_makeElement("button", todoOptions, { "className": "bettercanvas-todo-options-btn", "textContent": "Remove assignment" });

                    removeAssignmentBtn.onclick = async () => {
                        const storage = await chrome.storage.sync.get("custom_assignments_overflow");
                        const sync = await chrome.storage.sync.get(storage["custom_assignments_overflow"]);
                        storage["custom_assignments_overflow"].forEach(overflow => {
                            for (const custom of sync[overflow]) {
                                if (custom.plannable_id !== item.plannable_id) continue;
                                chrome.storage.sync.set({ [overflow]: sync[overflow].filter(x => x.plannable_id !== custom.plannable_id) }).then(() => {
                                    cacheTodoItems().then(todo_loadBetterTodo);
                                });
                            }
                        });
                    }

                    const clickout = (e) => {
                        if (!todoOptions.contains(e.target) && !optionsBtn.contains(e.target)) {
                            todoOptions.style.display = "none";
                            document.removeEventListener("click", clickout);
                        }
                    }

                    optionsBtn.onclick = (e) => {
                        e.stopPropagation();
                        todoOptions.style.display = "block";
                        document.addEventListener("click", clickout);
                    }

                }

                // if the item is done, show the points
                if (item.done === true && item.plannable_type !== "announcement") {
                    format.date = (item["is_custom"] ? "Self-" : "") + "Submitted";
                    format.fromnow = (item.plannable.points_possible ? (" - " + item.plannable.points_possible + " pts") : "");
                }

                const todoDate = util_makeElement("p", todoitem, { "className": "bettercanvas-todoitem-date", "textContent": format.date + " " + format.fromnow });

                // hover preview details
                if (api_options.hover_preview === true) {

                    todoitem.addEventListener("mouseover", () => {
                        const preview = document.getElementById("bettercanvas-hover-preview");
                        const previewTitle = document.getElementById("bettercanvas-hover-preview-title");
                        const previewText = document.getElementById("bettercanvas-hover-preview-description");

                        clearTimeout(delay);

                        delay = setTimeout(async () => {
                            if (delay === null) return;
                            if (customItem) {
                                previewTitle.textContent = "Custom assignment";
                                previewText.textContent = "Custom assignment";
                            } else {
                                await loadHoverDetail(item.plannable_type, item.course_id, item.plannable_id);

                                if (hoverDetails[item.plannable_type][item.plannable_id]) {
                                    previewTitle.textContent = item.plannable.title;
                                    previewText.textContent = hoverDetails[item.plannable_type][item.plannable_id];
                                } else {
                                    previewTitle.textContent = "No preview for this assignment";
                                    previewText.textContent = "";
                                }
                            }

                            const rect = listItemContainer.getBoundingClientRect();
                            preview.style.display = "block";
                            preview.style.top = `${rect.top}px`;
                            preview.style.left = `${rect.left - 420}px`;

                        }, 250);
                    });


                    todoitem.addEventListener("mouseleave", () => {
                        document.getElementById("bettercanvas-hover-preview").style.display = "none";
                        clearTimeout(delay);
                        delay = null;
                    });

                }

                // apply course color if enabled
                if (api_options.todo_colors === true) {
                    const color = api_options["card_" + item.course_id]?.color || "var(--bcborders)";
                    course.style = "color:" + color + "!important;";
                    listItemContainer.querySelector(".bettercanvas-todo-item-border").style = "background: " + color + "!important;";
                }

                // controls the completion state of the item
                const actionsBtn = util_makeElement("button", wrapper, { "className": "bettercanvas-todo-actions-btn", "innerHTML": item.done ? checkSvg : circleSvg });
                actionsBtn.addEventListener("click", async () => {
                    if (item.submissions.submitted === true) return;
                    const historyType = item.plannable_type === "announcement" ? "todo_read" : "todo_completed";
                    const storage = await chrome.storage.sync.get(historyType);

                    //remove from completed
                    if (storage[historyType].includes(item.plannable_id)) {
                        //actionsBtn.classList.remove("active");
                        actionsBtn.innerHTML = circleSvg;
                        const oldPeriod = getPeriod(item);
                        item.done = false;
                        const newPeriod = getPeriod(item);
                        console.log("periodInfo", oldPeriod, newPeriod);
                        final["data"]["completed"] = false;
                        cache = {
                            ...cache,
                            [newPeriod.period]: [...(cache[newPeriod.period] || []), final],
                            [oldPeriod.period]: (cache[oldPeriod.period] || []).filter(i => i["data"]["plannable_id"] !== item.plannable_id)
                        };
                        await chrome.storage.sync.set({ [historyType]: storage[historyType].filter(id => id !== item.plannable_id) });
                    } else {
                        //actionsBtn.classList.add("active");
                        actionsBtn.innerHTML = backarrowSvg;
                        const oldPeriod = getPeriod(item);
                        item.done = true;
                        const newPeriod = getPeriod(item);
                        console.log("periodInfo", oldPeriod, newPeriod);
                        final["data"]["completed"] = true;
                        cache = {
                            ...cache,
                            [newPeriod.period]: [...(cache[newPeriod.period] || []), final],
                            [oldPeriod.period]: (cache[oldPeriod.period] || []).filter(i => i["data"]["plannable_id"] !== item.plannable_id)
                        };
                        await chrome.storage.sync.set({ [historyType]: [...storage[historyType], item.plannable_id] });
                    }


                    final.el.classList.add("goodbye");

                    setTimeout(() => {
                        final.el.classList.remove("goodbye");
                        todo_loadBetterTodo();
                    }, 400);
                });

                setupTooltip(actionsBtn, "Mark as complete");

                // putting the item in the correct period
                let { period, diff } = getPeriod(item);


                if (format.dueSoon && (period === "soon" || period === "overdue")) {
                    todoDate.classList.add("bettercanvas-due-soon");
                }

                if (item.plannable_type !== "announcement" && (diff > getTimeChange() || diff < 0)) return;

                const final = { "data": item, "el": listItemContainer };

                if (innerCache[period]) {
                    innerCache[period].push(final);
                } else {
                    innerCache[period] = [final];
                }
            } catch (e) {
                console.log("************", e);
            }
        });
        cache = innerCache;
        resolve(innerCache);
    });

}

let todoType = "assignments";

function createTodoControls(location) {
    const controls = util_makeElement("div", location, { "id": "bettercanvas-todo-controls" });
    const switcher = util_makeElement("div", controls, { "className": "bettercanvas-todo-switcher" });
    const btn1 = util_makeElement("button", switcher, { "className": "bettercanvas-todo-control-btn bettercanvas-highlight-hover active", "innerHTML": assignmentSvg });
    const btn3 = util_makeElement("button", switcher, { "className": "bettercanvas-todo-control-btn bettercanvas-highlight-hover", "innerHTML": doneSvg });
    const btn2 = util_makeElement("button", switcher, { "className": "bettercanvas-todo-control-btn bettercanvas-highlight-hover", "innerHTML": bullhornSvg });

    setupTooltip(btn1, "To Do");
    setupTooltip(btn2, "Announcements");
    setupTooltip(btn3, "Done");

    btn1.addEventListener("click", async () => {
        document.querySelectorAll(".bettercanvas-todo-control-btn").forEach(btn => btn.classList.remove("active"));
        btn1.classList.add("active");
        todoType = "assignments";
        document.getElementById("bettercanvas-todo-new-btn").style.display = "block";
        resetItems();
        todo_loadBetterTodo();
    });

    btn2.addEventListener("click", async () => {
        document.querySelectorAll(".bettercanvas-todo-control-btn").forEach(btn => btn.classList.remove("active"));
        btn2.classList.add("active");
        todoType = "announcements";
        document.getElementById("bettercanvas-todo-new-btn").style.display = "none";
        resetItems();
        todo_loadBetterTodo();
    });

    btn3.addEventListener("click", async () => {
        document.querySelectorAll(".bettercanvas-todo-control-btn").forEach(btn => btn.classList.remove("active"));
        btn3.classList.add("active");
        todoType = "done";
        document.getElementById("bettercanvas-todo-new-btn").style.display = "none";
        resetItems();
        todo_loadBetterTodo();
    });


    //const btn3 = makeElement("button", controls, { "id": "bettercanvas-todo-new-btn", "textContent": "+ New Item" });
}

function createTodoTimeArrows(location) {
    const arrows = document.getElementById("bettercanvas-todo-time-arrows") || util_makeElement("div", location, { "id": "bettercanvas-todo-time-arrows" });
    const leftArrow = document.getElementById("bettercanvas-todo-time-arrow-left") || util_makeElement("button", arrows, { "id": "bettercanvas-todo-time-arrow-left", "className": "bettercanvas-todo-time-arrow bettercanvas-highlight-hover", "innerHTML": leftSvg });
    const label = document.getElementById("bettercanvas-todo-time-label") || util_makeElement("p", arrows, { "id": "bettercanvas-todo-time-label", "textContent": getTimeLabel() });
    const rightArrow = document.getElementById("bettercanvas-todo-time-arrow-right") || util_makeElement("button", arrows, { "id": "bettercanvas-todo-time-arrow-right", "className": "bettercanvas-todo-time-arrow bettercanvas-highlight-hover", "innerHTML": rightSvg });


    leftArrow.onclick = () => {
        changeTimePeriod(true, todoTime);
    }

    rightArrow.onclick = () => {
        changeTimePeriod(false, todoTime);
    }
}

function getNearestPeriodStart(period, t = null) {

    const time = t || todoTime;
    const start = new Date(period);

    let begin;
    if (time === "week") {
        // Get previous Monday
        begin = new Date(start);
        begin.setDate(start.getDate() - start.getDay() + 1);
        begin.setHours(0, 0, 0, 0);
    } else if (time === "month") {
        // Get 1st of current month
        begin = new Date(start.getFullYear(), start.getMonth(), 1);
        begin.setHours(0, 0, 0, 0);
    } else {
        // For "day" setting, use current date at midnight
        begin = new Date(start);
        begin.setHours(0, 0, 0, 0);
    }

    return begin;
}

let periodStart = getNearestPeriodStart(Date.now(), null);


function getTimeChange() {

    const change = new Date(periodStart.getTime());

    if (todoTime === "day") {
        change.setDate(change.getDate() + 1);
    } else if (todoTime === "week") {
        change.setDate(change.getDate() - change.getDay() + 7 + 1);
        change.setHours(0, 0, 0, 0);
    } else if (todoTime === "month") {
        change.setMonth(change.getMonth() + 1);
        change.setDate(1);
        change.setHours(0, 0, 0, 0);
    }

    return change.getTime() - periodStart.getTime();
}

function resetItems() {
    document.querySelector(".bettercanvas-todosidebar-items").textContent = "";;
}

function changeTimePeriod(previous = true) {

    if (todoTime === "day") {
        periodStart.setDate(periodStart.getDate() + (previous ? -1 : 1));
    } else if (todoTime === "week") {
        periodStart.setDate(periodStart.getDate() - periodStart.getDay() + (previous ? -7 : 7) + 1);
        periodStart.setHours(0, 0, 0, 0);
    } else if (todoTime === "month") {
        periodStart.setMonth(periodStart.getMonth() + (previous ? -1 : 1));
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
    }

    cacheTodoItems().then(async () => {
        resetBars();
        resetItems();
        todo_loadBetterTodo();
    });
}

function createTodoAddBtn(location) {

    const addBtn = util_makeElement("button", location, { "id": "bettercanvas-todo-new-btn", "textContent": "+ New Assignment" });

    addBtn.addEventListener("click", () => {
        document.getElementById("bettercanvas-todo-creator").classList.toggle("active");
    });

}

async function addCustomAssignment() {
    const overflow = await chrome.storage.sync.get("custom_assignments_overflow");
    const storage = await chrome.storage.sync.get(overflow["custom_assignments_overflow"]);

    const titleValue = document.getElementById("bettercanvas-todo-creator-name").value;
    if (titleValue === "") {
        document.getElementById("bettercanvas-todo-creator-name").classList.add("bettercanvas-creator-invalid");
        return false;
    }
    const courseValue = document.getElementById("bettercanvas-todo-creator-course").value;
    const courseId = courseValue === "none" ? -1 : parseInt(courseValue);
    const dateValue = document.getElementById("bettercanvas-todo-creator-date").value;
    if (dateValue === "") {
        document.getElementById("bettercanvas-todo-creator-date").classList.add("bettercanvas-creator-invalid");
        return false;
    }
    const timeValue = document.getElementById("bettercanvas-todo-creator-time").value;
    const urlValue = document.getElementById("bettercanvas-todo-creator-url-input").value;
    const pointsValue = document.getElementById("bettercanvas-todo-creator-points").value;

    const assignment = {
        "plannable_id": new Date().getTime(),
        "context_name": courseId === -1 ? "Unassigned" : api_options["card_" + courseId]["default"],
        "plannable": { "title": titleValue, "points_possible": pointsValue === "" ? null : parseInt(pointsValue) },
        "plannable_date": dateValue + "T" + timeValue + ":00",
        "planner_override": { "marked_complete": false, "custom": true },
        "plannable_type": "assignment",
        "submissions": { "submitted": false },
        "course_id": courseId,
        "html_url": `/courses/${courseId}/assignments`,
        "override_url": urlValue === "" ? null : urlValue,
        "is_custom": true,
    };

    /* handling overflow since the limit is 8kb per key */

    let found = false;
    let reload = () => {
        document.getElementById("bettercanvas-todo-new-section").classList.remove("active");
    }


    const repeatEl = document.getElementById("bettercanvas-todo-creator-repeat");
    const repeat = document.getElementById("bettercanvas-todo-creator-repeat").value !== "none" ? true : false;
    let end = document.querySelector(".bettercanvas-todo-creator-repeat-end.active input");



    const updates = {};
    const findOpenOverflow = (num, assignment) => {

        // no overflow found, make a new one
        if (num >= (updates["custom_assignments_overflow"]?.length || 0) + overflow["custom_assignments_overflow"].length) {
            console.log("num >= overflow[custom_assignments_overflow].length", num);
            updates["custom_assignments_" + num] = [assignment];
            if (!updates["custom_assignments_overflow"]) {
                updates["custom_assignments_overflow"] = [...api_options["custom_assignments_overflow"]];
            }
            console.log("pushing", "custom_assignments_" + num);
            updates["custom_assignments_overflow"].push("custom_assignments_" + num);
            return;
        }

        const current_overflow = updates["custom_assignments_overflow"] ? updates["custom_assignments_overflow"][num] : overflow["custom_assignments_overflow"][num];
        const newOverflow = [...(api_options[current_overflow] || []), ...(updates[current_overflow] || []), assignment];
        const length = JSON.stringify(newOverflow).length;

        // if the length of the string is over 8000000 bytes (sync storage limit), need to make a new overflow
        console.log("length", length);
        if (length * 2 > 8000) {
            return findOpenOverflow(num + 1, assignment);
        }

        updates[current_overflow] = newOverflow;
        return;

    }

    const recurringDate = new Date(assignment.plannable_date);
    const repeatEvery = repeatEl.value;

    if (repeat && end.type === "date") {
        // get the difference between the end date and the start date
        const endDate = new Date(end.value);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(0, 0, 0, 0);

        let i = 0;

        // loop until the recurring date is greater than the end date
        // also has a max of 300 iterations just in case
        while (recurringDate.getTime() <= endDate.getTime() && i < 300) {
            findOpenOverflow(0, { ...assignment, "plannable_id": Date.now() + i, "plannable_date": recurringDate.getTime() });
            if (repeatEvery === "week") {
                recurringDate.setDate(recurringDate.getDate() + 7);
            } else if (repeatEvery === "month") {
                recurringDate.setMonth(recurringDate.getMonth() + 1);
            } else {
                recurringDate.setDate(recurringDate.getDate() + 1);
            }
            i++;
        }
    } else {
        const iters = repeat ? parseInt(end.value) : 1;
        for (let i = 0; i < iters; i++) {
            findOpenOverflow(0, { ...assignment, "plannable_id": Date.now() + i, "plannable_date": recurringDate.getTime() });
            if (repeatEvery === "week") {
                recurringDate.setDate(recurringDate.getDate() + 7);
            } else if (repeatEvery === "month") {
                recurringDate.setMonth(recurringDate.getMonth() + 1);
            } else {
                recurringDate.setDate(recurringDate.getDate() + 1);
            }
        }
    }

    /* find the first available overflow with space */
    /* or create a new one if all are full */

    console.log(updates);
    cacheTodoItems().then(todo_loadBetterTodo);
    chrome.storage.sync.set(updates);
    return true;
}

function createTodoAddSection(location) {
    const addSection = util_makeElement("div", location, { "id": "bettercanvas-todo-new-section" });
    const titleText = util_makeElement("p", addSection, { "textContent": "Title" });
    const title = util_makeElement("input", addSection, { "textContent": "New Section", "id": "bettercanvas-todo-new-title" });
    const dueDateText = util_makeElement("p", addSection, { "textContent": "Due Date" });
    const dueDate = util_makeElement("input", addSection, { "type": "date", "id": "bettercanvas-todo-new-date" });
    const dueTime = util_makeElement("input", addSection, { "type": "time", "id": "bettercanvas-todo-new-time" });

    const courseText = util_makeElement("p", addSection, { "textContent": "Course" });
    const courseSelect = util_makeElement("select", addSection, { "id": "bettercanvas-todo-new-section-course" });

    const buttonContainer = util_makeElement("div", addSection, { "id": "bettercanvas-todo-new-section-buttons" });
    const addBtn = util_makeElement("button", buttonContainer, { "textContent": "Add", "id": "bettercanvas-todo-new-add" });
    const cancelBtn = util_makeElement("button", buttonContainer, { "textContent": "Cancel", "id": "bettercanvas-todo-new-cancel" });

    api_options["card_ids"].forEach(id => {
        const option = util_makeElement("option", courseSelect, { "textContent": api_options["card_" + id]["default"], "value": id });
    });

    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;

    dueDate.value = `${year}-${month}-${day}`;
    dueTime.value = `23:59`;

    addBtn.addEventListener("click", addCustomAssignment);
    cancelBtn.addEventListener("click", () => {
        document.getElementById("bettercanvas-todo-new-section").classList.remove("active");
    });
}


function setActiveCourseFilter(key) {
    courseFilter = key === null ? null : parseInt(key);
    document.getElementById("bettercanvas-todo-course-filter").classList.remove("active");
    document.getElementById("bettercanvas-todo-course-filter-active-text").textContent = key === null ? "All courses" : api_options["card_" + key]["default"];
    document.querySelectorAll(".bettercanvas-todo-bar-group").forEach(group => {
        group.style.opacity = key === null || parseInt(group.dataset.todocourse) === parseInt(key) ? "1" : ".25";
    });
    //resetItems();
    todo_loadBetterTodo();
}

function loadFilterCourses(keys) {
    const courseFilterOptions = document.getElementById("bettercanvas-todo-course-filter-options");
    courseFilterOptions.textContent = "";

    const allOption = util_makeElement("div", courseFilterOptions, { "className": "bettercanvas-todo-course-filter-option" });
    const optionText = util_makeElement("p", allOption, { "className": "bettercanvas-todo-course-filter-option-text", "textContent": "All courses" });
    allOption.onclick = () => setActiveCourseFilter(null);

    keys.forEach(key => {
        const option = util_makeElement("div", courseFilterOptions, { "className": "bettercanvas-todo-course-filter-option" });
        const optionColor = util_makeElement("div", option, { "className": "bettercanvas-todo-course-filter-option-color", "style": "background:" + api_options["card_" + key]["color"] });
        const optionText = util_makeElement("p", option, { "className": "bettercanvas-todo-course-filter-option-text", "textContent": api_options["card_" + key]["default"] });

        option.onclick = () => setActiveCourseFilter(key);
    });
}

function createTodoCourseFilter(location) {
    const courseFilter = document.getElementById("bettercanvas-todo-course-filter") || util_makeElement("div", location, { "id": "bettercanvas-todo-course-filter" });

    const activeFilter = document.getElementById("bettercanvas-todo-course-filter-active") || util_makeElement("div", courseFilter, { "id": "bettercanvas-todo-course-filter-active", "className": "bettercanvas-highlight-hover" });
    const activeFilterText = document.getElementById("bettercanvas-todo-course-filter-active-text") || util_makeElement("p", activeFilter, { "id": "bettercanvas-todo-course-filter-active-text", "textContent": "All Courses" });
    const activeFilterIcon = document.getElementById("bettercanvas-todo-course-filter-active-icon") || util_makeElement("div", activeFilter, { "id": "bettercanvas-todo-course-filter-active-icon", "innerHTML": downSvg });
    const courseFilterOptions = document.getElementById("bettercanvas-todo-course-filter-options") || util_makeElement("div", courseFilter, { "id": "bettercanvas-todo-course-filter-options" });

    const todoFilterClickout = (e) => {
        if (!courseFilter.contains(e.target)) {
            courseFilter.classList.remove("active");
            document.removeEventListener("click", todoFilterClickout);
        }
    }

    activeFilter.onclick = () => {
        courseFilter.classList.toggle("active");
        document.addEventListener("click", todoFilterClickout);
    }
}

function createTodoAssignmentCreator() {
    let creator = document.getElementById("bettercanvas-todo-creator");
    if (!creator) {
        creator = util_makeElement("div", document.body, { "id": "bettercanvas-todo-creator" });
        creator.innerHTML = `
            <div id="bettercanvas-todo-creator-container">
                <div id="bettercanvas-todo-creator-header">
                    <h3>Create Assignment</h3>
                    <button id="bettercanvas-todo-creator-close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div>
                    <p>Assignment Name*</p>
                    <input type="text" id="bettercanvas-todo-creator-name" placeholder="Assignment Title">
                </div>
                <div>
                    <p>Course*</p>
                    <select id="bettercanvas-todo-creator-course"></select>
                </div>
                <div>
                    <p>Due Date*</p>
                    <div id="bettercanvas-todo-creator-timesets">
                        <input type="date" id="bettercanvas-todo-creator-date">
                        <input type="time" id="bettercanvas-todo-creator-time" value="23:59">
                    </div>
                </div>
                <div id="bettercanvas-todo-creator-optional-header">
                    <span>Optional</span>
                </div>
                <div id="bettercanvas-todo-creator-optional">
                    <div>
                        <p>Points</p>
                        <input type="text" id="bettercanvas-todo-creator-points" placeholder="Max points">
                    </div>
                    <div>
                        <p>Repeat</p>
                        <select id="bettercanvas-todo-creator-repeat">
                            <option value="none">None</option>
                            <option value="day">Every day</option>
                            <option value="week">Every week</option>
                            <option value="month">Every month</option>
                        </select>
                    </div>
                    <div id="bettercanvas-todo-creator-end-after-container">
                        <div>
                            <p>End repeat</p>
                            <select id="bettercanvas-todo-creator-end-repeat" value="date">
                                <option value="date">On date</option>
                                <option value="after">After x times</option>
                            </select>
                        </div>
                        <div id="bettercanvas-todo-creator-repeat-date" class="bettercanvas-todo-creator-repeat-end active">
                            <p>End repeat after</p>
                            <input type="date" id="bettercanvas-todo-creator-repeat-date-input">
                        </div>
                        <div id="bettercanvas-todo-creator-repeat-after" class="bettercanvas-todo-creator-repeat-end">
                            <p>End repeat after</p>
                            <div style="position:relative">
                                <input type="number" id="bettercanvas-todo-creator-repeat-after-input" placeholder="0">
                                <p id="bettercanvas-todo-creator-repeat-label"></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="bettercanvas-todo-creator-url">
                    <p>URL</p>
                    <input type="text" id="bettercanvas-todo-creator-url-input" placeholder="Paste a link">
                </div>
                <button id="bettercanvas-todo-creator-submit">Add new assignment</button>
            </div>
        `;

        const nameInput = creator.querySelector("#bettercanvas-todo-creator-name");
        nameInput.oninput = () => {
            nameInput.classList.remove("bettercanvas-creator-invalid");
        }

        const dateInput = creator.querySelector("#bettercanvas-todo-creator-date");
        dateInput.onchange = () => {
            dateInput.classList.remove("bettercanvas-creator-invalid");
        }

        // tooltip for the close button
        const closeBtn = document.getElementById("bettercanvas-todo-creator-close");
        setupTooltip(closeBtn, "Discard assignment");
        closeBtn.onclick = () => {
            creator.classList.remove("active");
        }

        // course select options
        const courseSelect = document.getElementById("bettercanvas-todo-creator-course");

        api_options["card_ids"].forEach(id => {
            const option = util_makeElement("option", courseSelect, { "textContent": api_options["card_" + id]["default"], "value": id });
        });

        // open the correct repeat selector based on the repeat after value
        const repeatSelect = document.getElementById("bettercanvas-todo-creator-repeat");
        repeatSelect.addEventListener("change", () => {
            if (repeatSelect.value === "none") {
                document.getElementById("bettercanvas-todo-creator-end-after-container").classList.remove("active");
            } else {
                document.getElementById("bettercanvas-todo-creator-end-after-container").classList.add("active");
            }

            document.getElementById("bettercanvas-todo-creator-repeat-label").textContent = repeatSelect.value + "s";
        });

        const endRepeatSelect = document.getElementById("bettercanvas-todo-creator-end-repeat");
        endRepeatSelect.addEventListener("change", () => {
            if (endRepeatSelect.value === "after") {
                document.getElementById("bettercanvas-todo-creator-repeat-after").classList.add("active");
                document.getElementById("bettercanvas-todo-creator-repeat-date").classList.remove("active");
            } else {
                document.getElementById("bettercanvas-todo-creator-repeat-after").classList.remove("active");
                document.getElementById("bettercanvas-todo-creator-repeat-date").classList.add("active");
            }
        });

        document.getElementById("bettercanvas-todo-creator-submit").onclick = async () => {
            const success = await addCustomAssignment();
            if (success) {
                document.getElementById("bettercanvas-todo-creator").classList.remove("active");
            }
        }


    }

    creator.onclick = (e) => {
        if (e.target.id === "bettercanvas-todo-creator") {
            creator.classList.remove("active");
        }
    };
}

function createTodoQuestion(location) {

    setTimeout(() => {
        if (api_options["todo_question"] !== false || !document.getElementById("tfc-wall-rose")) return;
        const question = document.getElementById("bettercanvas-todo-question") || util_makeElement("div", location, { "id": "bettercanvas-todo-question", "textContent": "Why am I seeing 2 todo lists?" });
        const info = document.getElementById("bettercanvas-todo-question-info") || util_makeElement("div", location, { "id": "bettercanvas-todo-question-info" });
        info.innerHTML = `
            <button id="bettercanvas-todo-question-exit">x</button>
            <h3 style="font-weight:bold;font-size:18px;">🎯 2 todo lists?</h3>
            <p>You may be seeing the new BetterCanvas todo list as well as the Tasks for Canvas extension.</p>
            <p>⬆️ <strong>Top:</strong> BetterCanvas (ours)</p>
            <p>⬇️ <strong>Bottom:</strong> Tasks for Canvas</p>
            <p>We suggest disabling theirs for a smoother experience, but it's up to you!</p>
            <a href="https://tally.so/r/w5V6Bo" target="_blank">Leave feedback</a>
        `

        info.querySelector("#bettercanvas-todo-question-exit").onclick = () => {
            info.style.display = "none";
            question.style.display = "none";
            chrome.storage.sync.set({ "todo_question": true });
        }

        question.onclick = () => {
            info.style.display = "block";
        }
    }, 3000);
}

async function setupBetterTodoMinimal() {

    let list = document.querySelector(".bettercanvas-todosidebar");
    const oldList = document.querySelector(".Sidebar__TodoListContainer");
    if (api_options.better_todo !== true) {
        list.style.display = "none";
        if (oldList) oldList.style.display = "block";
        return;
    }
    //if (document.querySelector('.bettercanvas-todosidebar')) return;
    const side = document.querySelector("#right-side-wrapper");
    if (!side) return;


    try {
        list = list || document.createElement("div");
        list.style.display = "block";
        list.className = "bettercanvas-todosidebar";
        list.textContent = "";

        //const header = makeElement("div", list, { "id": "bettercanvas-todosidebar-header", "textContent": "Todo" });
        //createTodoTime(list);
        //createTodoTimeArrows(list);
        //createTodoCourseFilter(list);
        createTodoHeader(list);
        //const progress = makeElement("div", list, { "id": "bettercanvas-todosidebar-progress" });
        //const progressText = makeElement("div", progress, { "id": "bettercanvas-todosidebar-progress-text" });
        //const progressPercentage = makeElement("p", progressText, { "id": "bettercanvas-todosidebar-progress-percentage" });
        //const progressFraction = makeElement("p", progressText, { "id": "bettercanvas-todosidebar-progress-fraction" });
        //const progressNone = makeElement("p", progressText, { "id": "bettercanvas-todosidebar-progress-none", "textContent": "Nothing to do here!" });
        //createTodoControls(list);
        const items = util_makeElement("div", list, { "className": "bettercanvas-todosidebar-items" });
        //createTodoProgress(progress);
        createTodoSections(list);
        //createTodoAddBtn(list);
        //createTodoAddSection(list);

        const hoverPreview = document.getElementById("bettercanvas-hover-preview") || util_makeElement("div", document.body, { "id": "bettercanvas-hover-preview" });
        const hoverPreviewTitle = document.getElementById("bettercanvas-hover-preview-title") || util_makeElement("p", hoverPreview, { "id": "bettercanvas-hover-preview-title" });
        const hoverPreviewDescription = document.getElementById("bettercanvas-hover-preview-description") || util_makeElement("p", hoverPreview, { "id": "bettercanvas-hover-preview-description" });

        side.style.backdropFilter = "invert(.02)"; /*"brightness(.95)"*/;
        side.style.width = "310px";

        //if (feedback) list.append(feedback);

        side.prepend(list);
        if (oldList) oldList.style.display = "none";

        //todoTime = options["todo_time"];
        //periodStart = getNearestPeriodStart(Date.now(), todoTime);
        if (assignments === null) getAssignments();
        loadBetterTodoMinimal();

        //const confettiContainer = document.getElementById("bettercanvas-todo-confetti") || makeElement("canvas", progress, { "id": "bettercanvas-todo-confetti", "height": 1000, "width": 300 });
        createTodoAssignmentCreator();
        

        //createTodoQuestion(list);
    } catch (e) {
    }
}

async function setupBetterTodoModern() {

    let list = document.querySelector(".bettercanvas-todosidebar");
    const oldList = document.querySelector(".Sidebar__TodoListContainer");
    if (api_options.better_todo !== true) {
        list.style.display = "none";
        if (oldList) oldList.style.display = "block";
        return;
    }
    //if (document.querySelector('.bettercanvas-todosidebar')) return;
    const side = document.querySelector("#right-side-wrapper");
    if (!side) return;

    try {
        list = list || document.createElement("div");
        list.style.display = "block";
        list.className = "bettercanvas-todosidebar";
        list.textContent = "";

        //const header = makeElement("div", list, { "id": "bettercanvas-todosidebar-header", "textContent": "Todo" });
        createTodoTime(list);
        createTodoTimeArrows(list);
        createTodoCourseFilter(list);
        const progress = util_makeElement("div", list, { "id": "bettercanvas-todosidebar-progress" });
        const progressText = util_makeElement("div", progress, { "id": "bettercanvas-todosidebar-progress-text" });
        const progressPercentage = util_makeElement("p", progressText, { "id": "bettercanvas-todosidebar-progress-percentage" });
        const progressFraction = util_makeElement("p", progressText, { "id": "bettercanvas-todosidebar-progress-fraction" });
        const progressNone = util_makeElement("p", progressText, { "id": "bettercanvas-todosidebar-progress-none", "textContent": "Nothing to do here!" });
        createTodoControls(list);
        const items = util_makeElement("div", list, { "className": "bettercanvas-todosidebar-items" });
        createTodoProgress(progress);

        createTodoAddBtn(list);
        createTodoAddSection(list);

        const hoverPreview = document.getElementById("bettercanvas-hover-preview") || util_makeElement("div", document.body, { "id": "bettercanvas-hover-preview" });
        const hoverPreviewTitle = document.getElementById("bettercanvas-hover-preview-title") || util_makeElement("p", hoverPreview, { "id": "bettercanvas-hover-preview-title" });
        const hoverPreviewDescription = document.getElementById("bettercanvas-hover-preview-description") || util_makeElement("p", hoverPreview, { "id": "bettercanvas-hover-preview-description" });

        side.style.backdropFilter = "invert(.02)"; /*"brightness(.95)"*/;
        side.style.width = "310px";

        //if (feedback) list.append(feedback);

        side.prepend(list);
        if (oldList) oldList.style.display = "none";

        todoTime = api_options["todo_time"];
        periodStart = getNearestPeriodStart(Date.now(), todoTime);
        if (assignments === null) getAssignments();
        cache = await cacheTodoItems();
        todo_loadBetterTodo();

        const confettiContainer = document.getElementById("bettercanvas-todo-confetti") || util_makeElement("canvas", progress, { "id": "bettercanvas-todo-confetti", "height": 1000, "width": 300 });
        createTodoAssignmentCreator();

        createTodoQuestion(list);
    } catch (e) {
    }
}

async function setupBetterTodo() {
    if (api_options["todo_style_general"] === "modern") {
        setupBetterTodoModern();
    } else {
        setupBetterTodoMinimal();
    }

}

function getHeaderText(period) {

    if (period === "unread") {
        return ["", "Unread"];
    } else if (period === "read") {
        return ["", "Read"];
    } else if (period === "graded") {
        return ["", "Graded"];
    } else if (period === "ungraded") {
        return ["", "Ungraded"];
    } else if (period === "soon") {
        return ["Due", "soon"];
    } else if (period === "today") {
        return ["Due", "today"];
    } else if (period === "tomorrow") {
        return ["Due", "tomorrow"];
    } else if (period === "week") {
        return ["Due", "this week"];
    } else if (period === "nextweek") {
        return ["Due", "next week"];
    } else if (period === "month") {
        return ["Due", "this month"];
    } else if (period === "overdue") {
        return ["", "Overdue"];
    } else if (period === "completed") {
        return ["", "Completed"];
    } else {
        return ["Due", "later"];
    }
}

let delay;
let moreAssignmentCount = 0;
let moreAnnouncementCount = 0;
let filter = "todo";
let courseFilter = null;


const typeFilters = {
    "assignments": ["overdue", "soon", "today", "tomorrow", "week", "nextweek", "later"],
    "announcements": ["unread", "read"],
    "done": ["ungraded", "graded"]
}

function getTimeLabel() {
    const startDate = periodStart.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const endDate = new Date(periodStart.getTime() + getTimeChange(todoTime) - 1).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    return startDate + (todoTime !== "day" ? " - " + endDate : "");
}

function loadAssignmentGroup(period) {
    if (!cache[period]) return null;

    const fragment = document.createDocumentFragment();
    cache[period].forEach((item, count) => {
        try {
            if (courseFilter && courseFilter !== item.data.course_id) return;
            const doneBtn = item.el.querySelector(".bettercanvas-todo-actions-btn");
            fragment.appendChild(item.el);
            item.el.style = "--slide-open:" + count * .04 + "s";
            doneBtn.innerHTML = circleSvg;
            setupTooltip(doneBtn, "Mark as complete");
        } catch (e) {
        }
    });
    return fragment;
}

const gradesCache = {};

function loadDoneGroup(period) {
    if (!cache[period]) return null;

    const fragment = document.createDocumentFragment();
    cache[period].forEach((item, count) => {
        try {
            if (courseFilter !== null && courseFilter !== item.data.course_id) return;
            const doneBtn = item.el.querySelector(".bettercanvas-todo-actions-btn");

            if (gradesCache[item.data.plannable_id]) {
                const grade = gradesCache[item.data.plannable_id];
                let agoText = null;
                if (grade["submitted_at"] || grade["finished_at"]) {
                    const date = new Date(grade["submitted_at"] || grade["finished_at"]);
                    const relative = getRelativeDate(date, true);
                    agoText = " " + relative.time + " ago";
                }
                item.el.querySelector(".bettercanvas-todoitem-date").textContent = "Submitted" + (agoText ? agoText : "") + " - " + (gradesCache[item.data.plannable_id]["score"] !== undefined ? gradesCache[item.data.plannable_id]["score"] : "?") + "/" + item.data["plannable"]["points_possible"] + "pts";
            }

            if (item.data.submissions.submitted === true) {
                doneBtn.innerHTML = checkSvg;
                setupTooltip(doneBtn, "Submitted");
            } else {
                doneBtn.innerHTML = backarrowSvg;
                setupTooltip(doneBtn, "Mark as incomplete");
            }

            fragment.appendChild(item.el);
            item.el.style = "--slide-open:" + count * .04 + "s";
        } catch (e) {
        }

    });
    return fragment;

}

function loadAnnouncementGroup(period) {
    if (!cache[period]) return null;

    const fragment = document.createDocumentFragment();
    cache[period].toReversed().forEach((item, count) => {
        try {
            if (courseFilter && courseFilter !== item.data.course_id) return;
            const doneBtn = item.el.querySelector(".bettercanvas-todo-actions-btn");
            if (item.data.done === true) {
                doneBtn.innerHTML = backarrowSvg;
                setupTooltip(doneBtn, "Mark as unread");
            } else {
                doneBtn.innerHTML = circleSvg;
                setupTooltip(doneBtn, "Mark as read");
            }
            fragment.appendChild(item.el);
            item.el.style = "--slide-open:" + count * .04 + "s";
        } catch (e) {
        }
    })
    return fragment;
}

async function todo_loadBetterTodo() {
    if (api_options["todo_style_general"] === "modern") {
        loadBetterTodoModern();
    } else {
        loadBetterTodoMinimal();
    }
}


async function loadBetterTodoMinimal() {
    if (api_options.better_todo !== true) return;
    try {

        const discussion_svg = '<svg class="bettercanvas-todo-svg" name="IconDiscussion" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false"  ><g role="presentation"><path d="M677.647059,16 L677.647059,354.936471 L790.588235,354.936471 L790.588235,129.054118 L1807.05882,129.054118 L1807.05882,919.529412 L1581.06353,919.529412 L1581.06353,1179.29412 L1321.41176,919.529412 L1242.24,919.529412 L1242.24,467.877647 L677.647059,467.877647 L0,467.877647 L0,1484.34824 L338.710588,1484.34824 L338.710588,1903.24706 L756.705882,1484.34824 L1242.24,1484.34824 L1242.24,1032.47059 L1274.99294,1032.47059 L1694.11765,1451.59529 L1694.11765,1032.47059 L1920,1032.47059 L1920,16 L677.647059,16 Z M338.789647,919.563294 L903.495529,919.563294 L903.495529,806.622118 L338.789647,806.622118 L338.789647,919.563294 Z M338.789647,1145.44565 L677.726118,1145.44565 L677.726118,1032.39153 L338.789647,1032.39153 L338.789647,1145.44565 Z M112.941176,580.705882 L1129.41176,580.705882 L1129.41176,1371.40706 L710.4,1371.40706 L451.651765,1631.05882 L451.651765,1371.40706 L112.941176,1371.40706 L112.941176,580.705882 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
        const quiz_svg = '<svg class="bettercanvas-todo-svg" label="Quiz" name="IconQuiz" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false"  ><g role="presentation"><g fill-rule="evenodd" stroke="none" stroke-width="1"><path d="M746.255375,1466.76417 L826.739372,1547.47616 L577.99138,1796.11015 L497.507383,1715.51216 L746.255375,1466.76417 Z M580.35118,1300.92837 L660.949178,1381.52637 L329.323189,1713.15236 L248.725192,1632.55436 L580.35118,1300.92837 Z M414.503986,1135.20658 L495.101983,1215.80457 L80.5979973,1630.30856 L0,1549.71056 L414.503986,1135.20658 Z M1119.32036,264.600006 C1475.79835,-91.8779816 1844.58834,86.3040124 1848.35034,88.1280123 L1848.35034,88.1280123 L1865.45034,96.564012 L1873.88634,113.664011 C1875.71034,117.312011 2053.89233,486.101999 1697.30034,842.693987 L1697.30034,842.693987 L1550.69635,989.297982 L1548.07435,1655.17196 L1325.43235,1877.81395 L993.806366,1546.30196 L415.712386,968.207982 L84.0863971,636.467994 L306.72839,413.826001 L972.602367,411.318001 Z M1436.24035,1103.75398 L1074.40436,1465.70397 L1325.43235,1716.61796 L1434.30235,1607.74796 L1436.24035,1103.75398 Z M1779.26634,182.406009 C1710.18234,156.41401 1457.90035,87.1020124 1199.91836,345.198004 L1199.91836,345.198004 L576.90838,968.207982 L993.806366,1385.10597 L1616.70235,762.095989 C1873.65834,505.139998 1804.68834,250.920007 1779.26634,182.406009 Z M858.146371,525.773997 L354.152388,527.597997 L245.282392,636.467994 L496.310383,887.609985 L858.146371,525.773997 Z"></path><path d="M1534.98715,372.558003 C1483.91515,371.190003 1403.31715,385.326002 1321.69316,466.949999 L1281.22316,507.305998 L1454.61715,680.585992 L1494.97315,640.343994 C1577.16715,558.035996 1591.87315,479.033999 1589.82115,427.164001 L1587.65515,374.610003 L1534.98715,372.558003 Z"></path></g></g></svg>';
        const announcement_svg = '<svg class="bettercanvas-todo-svg" label="Announcement" name="IconAnnouncement" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" ><g role="presentation"><path d="M1587.16235,31.2784941 C1598.68235,7.78672942 1624.43294,-4.41091764 1650.63529,1.46202354 C1676.16,7.56084707 1694.11765,30.2620235 1694.11765,56.4643765 L1694.11765,56.4643765 L1694.11765,570.459671 C1822.87059,596.662024 1920,710.732612 1920,847.052612 C1920,983.372612 1822.87059,1097.55614 1694.11765,1123.75849 L1694.11765,1123.75849 L1694.11765,1637.64085 C1694.11765,1663.8432 1676.16,1686.65732 1650.63529,1692.6432 C1646.23059,1693.65967 1641.93882,1694.11144 1637.64706,1694.11144 C1616.52706,1694.11144 1596.87529,1682.36555 1587.16235,1662.93967 C1379.23765,1247.2032 964.178824,1242.34673 960,1242.34673 L960,1242.34673 L564.705882,1242.34673 L564.705882,1807.05261 L652.461176,1807.05261 C640.602353,1716.92555 634.955294,1560.05026 715.934118,1456.37026 C768.338824,1389.2832 845.590588,1355.28791 945.882353,1355.28791 L945.882353,1355.28791 L945.882353,1468.22908 C881.392941,1468.22908 835.312941,1487.09026 805.044706,1525.71614 C736.263529,1613.58438 759.981176,1789.54673 774.776471,1849.97026 C778.955294,1866.79849 775.115294,1884.6432 764.498824,1898.30908 C753.769412,1911.97496 737.28,1919.99379 720,1919.99379 L720,1919.99379 L508.235294,1919.99379 C477.063529,1919.99379 451.764706,1894.80791 451.764706,1863.5232 L451.764706,1863.5232 L451.764706,1242.34673 L395.294118,1242.34673 C239.548235,1242.34673 112.941176,1115.73967 112.941176,959.993788 L112.941176,959.993788 L112.941176,903.5232 L56.4705882,903.5232 C25.2988235,903.5232 0,878.337318 0,847.052612 C0,815.880847 25.2988235,790.582024 56.4705882,790.582024 L56.4705882,790.582024 L112.941176,790.582024 L112.941176,734.111435 C112.941176,578.478494 239.548235,451.758494 395.294118,451.758494 L395.294118,451.758494 L959.887059,451.758494 C976.828235,451.645553 1380.36706,444.756141 1587.16235,31.2784941 Z M1581.17647,249.706729 C1386.46588,492.078494 1128.96,547.871435 1016.47059,560.746729 L1016.47059,560.746729 L1016.47059,1133.47144 C1128.96,1146.34673 1386.46588,1202.02673 1581.17647,1444.51144 L1581.17647,1444.51144 Z M903.529412,564.699671 L395.294118,564.699671 C301.891765,564.699671 225.882353,640.709082 225.882353,734.111435 L225.882353,734.111435 L225.882353,959.993788 C225.882353,1053.39614 301.891765,1129.40555 395.294118,1129.40555 L395.294118,1129.40555 L903.529412,1129.40555 L903.529412,564.699671 Z M1694.11765,688.144376 L1694.11765,1006.07379 C1759.73647,982.694965 1807.05882,920.577318 1807.05882,847.052612 C1807.05882,773.527906 1759.73647,711.5232 1694.11765,688.144376 L1694.11765,688.144376 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
        const assignment_svg = '<svg class="bettercanvas-todo-svg" label="Assignment" name="IconAssignment" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false"><g role="presentation"><path d="M1468.2137,0 L1468.2137,564.697578 L1355.27419,564.697578 L1355.27419,112.939516 L112.939516,112.939516 L112.939516,1807.03225 L1355.27419,1807.03225 L1355.27419,1581.15322 L1468.2137,1581.15322 L1468.2137,1919.97177 L2.5243549e-29,1919.97177 L2.5243549e-29,0 L1468.2137,0 Z M1597.64239,581.310981 C1619.77853,559.174836 1655.46742,559.174836 1677.60356,581.310981 L1677.60356,581.310981 L1903.4826,807.190012 C1925.5058,829.213217 1925.5058,864.902104 1903.4826,887.038249 L1903.4826,887.038249 L1225.8455,1564.67534 C1215.22919,1575.17872 1200.88587,1581.16451 1185.86491,1581.16451 L1185.86491,1581.16451 L959.985883,1581.16451 C928.814576,1581.16451 903.516125,1555.86606 903.516125,1524.69475 L903.516125,1524.69475 L903.516125,1298.81572 C903.516125,1283.79477 909.501919,1269.45145 920.005294,1258.94807 L920.005294,1258.94807 Z M1442.35055,896.29929 L1016.45564,1322.1942 L1016.45564,1468.225 L1162.48643,1468.225 L1588.38135,1042.33008 L1442.35055,896.29929 Z M677.637094,1242.34597 L677.637094,1355.28548 L338.818547,1355.28548 L338.818547,1242.34597 L677.637094,1242.34597 Z M903.516125,1016.46693 L903.516125,1129.40645 L338.818547,1129.40645 L338.818547,1016.46693 L903.516125,1016.46693 Z M1637.62298,701.026867 L1522.19879,816.451052 L1668.22958,962.481846 L1783.65377,847.057661 L1637.62298,701.026867 Z M1129.39516,338.829841 L1129.39516,790.587903 L338.818547,790.587903 L338.818547,338.829841 L1129.39516,338.829841 Z M1016.45564,451.769356 L451.758062,451.769356 L451.758062,677.648388 L1016.45564,677.648388 L1016.45564,451.769356 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
        const x_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M18 6l-12 12"></path><path d="M6 6l12 12"></path></svg>';
        const check_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 12l5 5l10 -10"></path></svg>';
        const tag_svg = '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3z" /></svg>';
        // end of SVGs

        const maxAssignmentCount = parseInt(api_options.num_todo_items) + moreAssignmentCount;
        const maxAnnouncementCount = parseInt(api_options.num_todo_items) + moreAnnouncementCount;
        const hr24 = api_options.todo_hr24;
        const now = new Date();
        //const csrfToken = CSRFtoken();
        let todoAnnouncements = document.querySelector("#bettercanvas-announcement-list");
        let todoAssignments = document.querySelector("#bettercanvas-todo-list");
        let assignmentsToInsert = [];
        let announcementsToInsert = [];

        const data = await assignments;
        const items = combineAssignments(data);
        chrome.storage.sync.get(api_options.custom_assignments_overflow, storage => {
            //assignmentData = assignmentData === null ? data : assignmentData;
            items.forEach((item, index) => {
                let date = new Date(item.plannable_date);
                let itemState = api_options.assignment_states[item.plannable_id];

                let svg;
                switch (item.plannable_type) {
                    case "assignment": svg = assignment_svg; break;
                    case "discussion_topic": svg = discussion_svg; break;
                    case "quiz": svg = quiz_svg; break;
                    case "announcement": svg = announcement_svg; break;
                    default: return;
                }

                // if (item.plannable_type === "announcement") {
                //if (announcementsToInsert.length >= maxAnnouncementCount + 1) return;
                if (item.plannable_type !== "announcement") {
                    // leaving one extra assignment in the array to indicate there are more and the "view more" button should be created
                    if (assignmentsToInsert.length >= maxAssignmentCount + 1) return;
                    if (filter === "todo" && api_options.hide_completed === true && item.submissions.submitted === true) return;
                    if (filter === "todo" && ((api_options.todo_overdues !== true && now >= date) || (api_options.todo_overdues === true && item.submissions.submitted === true))) return;
                    if (filter === "done" && now <= date && !(itemState?.["rem"] === true || item?.submissions?.submitted === true)) return;
                    //if (item.plannable_type !== "assignment" && item.plannable_type !== "quiz" && item.plannable_type !== "discussion_topic") return;
                }
                if (filter === "todo" && ((itemState && itemState["rem"] === true) || (item.planner_override && item.planner_override.marked_complete === true))) return;

                let listItemContainer = document.createElement("div");
                listItemContainer.classList.add("bettercanvas-todo-container-minimal");
                listItemContainer.innerHTML = '<div class="bettercanvas-todo-actions"></div><div class="bettercanvas-todo-icon-minimal"></div><a class="bettercanvas-todo-item"></a><button class="bettercanvas-todo-actions-btn"><i class="icon-more bettercanvas-dots-icon" aria-hidden="true"></i></button>';
                listItemContainer.querySelector(".bettercanvas-todo-item").href = item.html_url;
                listItemContainer.dataset.id = item.plannable_id;
                listItemContainer.querySelector('.bettercanvas-todo-icon-minimal').innerHTML += svg;

                let listItem = listItemContainer.querySelector(".bettercanvas-todo-item");
                if (itemState?.["lbl"] && itemState["lbl"] !== "") {
                    //makeElement("span", listItem.querySelector(".bettercanvas-todo-item-header"), { "className": "bettercanvas-todo-label", "textContent": itemState["lbl"] });
                }
                if (itemState?.["crs"] === true) {
                    listItemContainer.querySelector(".bettercanvas-todo-item").style.textDecoration = "line-through";
                }
                const courseName = util_makeElement("p", listItemContainer.querySelector(".bettercanvas-todo-item"), { "textContent": item.context_name, "className": "bettercanvas-todoitem-course-minimal"});
                let title = util_makeElement("a", listItemContainer.querySelector(".bettercanvas-todo-item"), { "className": "bettercanvas-todoitem-title bettercanvas-todoitem-title-minimal", "textContent": item.plannable.title });
                if (api_options.todo_colors === true) title.style = "color:" + (api_options["card_" + item.course_id]?.color || "inherit") + "!important;";

                let format = formatTodoDate(date, item.submissions, hr24);
                let todoDate = util_makeElement("p", listItem, { "className": "bettercanvas-todoitem-date", "textContent": format.date + " " + format.fromnow });
                if (format.dueSoon) todoDate.classList.add("bettercanvas-due-soon");

                if (api_options.hover_preview === true) {
                    const customItem = item.planner_override && item.planner_override.custom && item.planner_override.custom === true;
                    listItem.addEventListener("mouseover", () => {
                        const preview = document.getElementById("bettercanvas-hover-preview");
                        const previewTitle = document.getElementById("bettercanvas-hover-preview-title");
                        const previewText = document.getElementById("bettercanvas-hover-preview-description");

                        clearTimeout(delay);

                        delay = setTimeout(async () => {
                            if (delay === null) return;
                            if (customItem) {
                                previewTitle.textContent = "Custom assignment";
                                previewText.textContent = "Custom assignment";
                            } else {
                                await loadHoverDetail(item.plannable_type, item.course_id, item.plannable_id);

                                if (hoverDetails[item.plannable_type][item.plannable_id]) {
                                    previewTitle.textContent = item.plannable.title;
                                    previewText.textContent = hoverDetails[item.plannable_type][item.plannable_id];
                                } else {
                                    previewTitle.textContent = "No preview for this assignment";
                                    previewText.textContent = "";
                                }
                            }

                            const rect = listItemContainer.getBoundingClientRect();
                            preview.style.display = "block";
                            preview.style.top = `${rect.top}px`;
                            preview.style.left = `${rect.left - 420}px`;

                        }, 250);
                    });


                    listItem.addEventListener("mouseleave", () => {
                        document.getElementById("bettercanvas-hover-preview").style.display = "none";
                        clearTimeout(delay);
                        delay = null;
                    });
                }

                const actions = listItemContainer.querySelector(".bettercanvas-todo-actions");

                let clickOutActions = (e) => {
                    if (e.target.className.includes("bettercanvas")) return;
                    document.body.removeEventListener("click", clickOutActions);
                    actions.style.display = "none";
                }

                listItemContainer.querySelector(".bettercanvas-todo-actions-btn").addEventListener("click", () => {
                    actions.style.display = "block";
                    setTimeout(() => {
                        document.body.addEventListener("click", clickOutActions);
                    }, 100);
                });

                let removeBtn = util_makeElement("div", actions, { "className": "bettercanvas-todo-action", "textContent": "Remove" });
                removeBtn.innerHTML += x_svg;
                const dueAt = new Date(item.plannable_date).getTime();

                let crossOffBtn = util_makeElement("div", actions, { "className": "bettercanvas-todo-action", "textContent": "Cross off" });
                crossOffBtn.innerHTML += check_svg;
                crossOffBtn.addEventListener("click", () => {
                    setAssignmentState(item.plannable_id, { "crs": listItemContainer.querySelector(".bettercanvas-todo-item").style.textDecoration === "line-through" ? false : true, "expire": dueAt });
                });
                let label = util_makeElement("span", actions, { "className": "bettercanvas-todo-action-tag", "textContent": "Label:" });
                label.innerHTML += tag_svg;
                let labelInput = util_makeElement("input", actions, { "className": "bettercanvas-todo-input", "type": "text", "placeholder": "Label", "value": itemState && itemState["lbl"] ? itemState["lbl"] : "" });
                labelInput.addEventListener("change", (e) => {
                    setAssignmentState(item.plannable_id, { "lbl": e.target.value, "expire": dueAt });
                });

                removeBtn.addEventListener('click', function () {
                    setAssignmentState(item.plannable_id, { "rem": filter === "todo", "expire": dueAt });
                    if (item.planner_override && item.planner_override.custom && item.planner_override.custom === true) {
                        // set item as complete locally
                        chrome.storage.sync.get("custom_assignments_overflow", overflow => {
                            chrome.storage.sync.get(overflow["custom_assignments_overflow"], storage => {
                                overflow["custom_assignments_overflow"].forEach(overflow => {
                                    for (let i = 0; i < storage[overflow].length; i++) {
                                        if (storage[overflow][i].plannable_id === item.plannable_id) {
                                            storage[overflow].splice(i, 1);
                                            chrome.storage.sync.set({ [overflow]: storage[overflow] }).then(() => {
                                            });
                                            break;
                                        }
                                    }
                                });
                            });
                        });
                    }
                });


                if (item.plannable_type === "announcement") {
                    announcementsToInsert.push(listItemContainer);
                } else {
                    assignmentsToInsert.push(listItemContainer);
                    if (item.submissions && item.submissions.submitted) {
                        listItemContainer.classList.add("bettercanvas-todo-item-completed");
                    }
                }
                //}
                //}


            });

            // appending assignments all at once
            todoAssignments.textContent = "";
            if (assignmentsToInsert.length > 0) {
                let i;
                for (i = 0; i < (assignmentsToInsert.length > maxAssignmentCount ? maxAssignmentCount : assignmentsToInsert.length); i++) {
                    todoAssignments.append(assignmentsToInsert[i]);
                }
                if (i !== assignmentsToInsert.length) createTodoViewMore(todoAssignments, "assignment");
            } else {
                util_makeElement("p", todoAssignments, { "className": "bettercanvas-none-due", "textContent": "None" });
            }

            // appending announcements all at once
            todoAnnouncements.textContent = "";
            if (announcementsToInsert.length > 0) {
                let i;
                for (i = announcementsToInsert.length - 1; i >= (announcementsToInsert.length - maxAnnouncementCount < 0 ? 0 : announcementsToInsert.length - maxAnnouncementCount); i--) {
                    todoAnnouncements.append(announcementsToInsert[i]);
                }
                if (i !== -1) createTodoViewMore(todoAnnouncements, "announcement");
            } else {
                util_makeElement("p", todoAnnouncements, { "className": "bettercanvas-none-due", "textContent": "None" });
            }

            cleanCustomAssignments();
        });

    } catch (e) {
        util_logError(e);
    }
}

async function loadBetterTodoModern() {
    if (api_options.better_todo !== true) return;
    try {

        //const maxAssignmentCount = parseInt(options.num_todo_items) + moreAssignmentCount;
        //const maxAnnouncementCount = parseInt(options.num_todo_items) + moreAnnouncementCount;

        const sidebar = document.querySelector(".bettercanvas-todosidebar-items");

        document.getElementById("bettercanvas-todo-time-label").textContent = getTimeLabel();

        //console.log("cache here", cache);

        let opened = 0;
        let celebrate = false;

        const bars = {};
        const newHistory = [];
        const newGrades = {};
        const newQuizzes = [];

        // regardless of the todotype, get the bar config for the current period
        typeFilters["done"].forEach(period => {
            if (!cache[period]) return;
            cache[period].forEach(async item => {
                // show confetti if the item has not been celebrated yet
                if (!api_options["todo_history"].includes(item.data.plannable_id)) {
                    celebrate = true;
                    newHistory.push(item.data.plannable_id);
                }

                if (bars[item.data.course_id]) {
                    bars[item.data.course_id]["complete"] += 1;
                    bars[item.data.course_id]["total"]++;
                } else {
                    bars[item.data.course_id] = { "complete": 1, "total": 1 };
                }

                if (todoType === "done" && period === "graded" && item.data.plannable_type === "assignment" && !gradesCache[item.data.id]) {
                    if (!newGrades[item.data.course_id]) newGrades[item.data.course_id] = [];
                    newGrades[item.data.course_id].push(item.data.plannable_id);
                } else if (todoType === "done" && period === "graded" && item.data.plannable_type === "quiz" && !gradesCache[item.data.id]) {
                    newQuizzes.push({ "course_id": [item.data.course_id], "quiz_id": (item.data.plannable_id) });
                }
            });
        });

        // retrieve the submissions for anything in newGrades
        for await (const key of Object.keys(newGrades)) {
            const ids = newGrades[key].join("&assignment_ids[]=");
            const res = await fetch(`${domain}/api/v1/courses/${key}/students/submissions?assignment_ids[]=${ids}`);
            try {
                const data = await res.json();
                data.forEach(item => gradesCache[item.assignment_id] = item);
            } catch (e) {
                console.log(e);
                console.log("bettercanvas - couldn't find grades");
            }
        }

        // retrieve the submissions for anything in newQuizzes
        for await (const quiz of newQuizzes) {
            const res = await fetch(`${domain}/api/v1/courses/${quiz.course_id}/quizzes/${quiz.quiz_id}/submission`);
            try {
                const data = await res.json();
                gradesCache[quiz.quiz_id] = data["quiz_submissions"][0];
            } catch (e) {
                console.log(e);
                console.log("bettercanvas - couldn't find quizzes");
            }
        }

        // update the history if something needs to be updated
        if (newHistory.length > 0) {
            chrome.storage.sync.set({ "todo_history": [...api_options["todo_history"], ...newHistory] });
        }

        typeFilters["assignments"].forEach(period => {
            if (!cache[period]) return;
            cache[period].forEach(item => {
                if (bars[item.data.course_id]) {
                    bars[item.data.course_id]["total"]++;
                } else {
                    bars[item.data.course_id] = { "complete": 0, "total": 1 };
                }
            });
        });

        // load the bars and celebrate
        loadBars(bars);
        document.getElementById("bettercanvas-todo-loader").style.display = "none";

        if (celebrate === true) {
            setTimeout(() => {
                confettiStop = Date.now() + (api_options["todo_confetti"] === "extra" ? 600 : api_options["todo_confetti"] === "normal" ? 200 : 0);
                showConfetti();
            }, 100);
        }

        typeFilters[todoType].forEach(period => {
            const container = document.getElementById("bettercanvas-list-" + period) || util_makeElement("div", sidebar, { "id": "bettercanvas-list-" + period, "className": "bettercanvas-todo-list-container" });

            const headerText = getHeaderText(period, todoTime);
            let count;
            if (courseFilter !== null) {
                count = (cache[period] || []).reduce((count, item) => item.data.course_id === courseFilter ? count + 1 : count, 0);
            } else {
                count = (cache[period] || []).length;
            }
            const header = container.querySelector(".bettercanvas-todo-list-header") || util_makeElement("div", container, { "className": "bettercanvas-todo-list-header" });
            header.textContent = "";
            const title = header.querySelector(".bettercanvas-todo-list-header-title") || util_makeElement("span", header, { "textContent": headerText[0] + " ", "style": "font-size:14px;" });
            const remaining = title.querySelector(".bettercanvas-todo-list-header-remaining") || util_makeElement("span", title, { "textContent": headerText[1], "style": "font-weight:700" });
            const titleCount = title.querySelector(".bettercanvas-todo-list-header-count") || util_makeElement("span", title, { "className": "bettercanvas-todo-list-header-count", "textContent": " (" + count + ")" });
            const arrow = header.querySelector(".bettercanvas-todo-list-arrow") || util_makeElement("div", header, { "className": "bettercanvas-todo-list-arrow", "innerHTML": downSvg });

            const list = container.querySelector(".bettercanvas-todo-list") || util_makeElement("ul", container, { "className": "bettercanvas-todo-list" });
            list.textContent = "";

            header.onclick = () => {
                if (container.classList.contains("bettercanvas-todo-list-closed")) {
                    container.classList.remove("bettercanvas-todo-list-closed");
                    container.classList.add("bettercanvas-todo-list-opened");
                } else {
                    container.classList.remove("bettercanvas-todo-list-opened");
                    container.classList.add("bettercanvas-todo-list-closed");
                }
            }

            if (todoType === "assignments") {
                const group = loadAssignmentGroup(period);
                if (group) {
                    list.appendChild(group);
                    // open the first available group
                    if (opened === 0 || (opened === 1 && (period === "overdue" || period === "soon" || period === "today" || period === "tomorrow"))) {
                        setTimeout(() => {
                            container.classList.remove("bettercanvas-todo-list-closed");
                            container.classList.add("bettercanvas-todo-list-opened");
                        }, 1);
                        opened++;
                    }
                }
                container.style.display = count === 0 ? "none" : "block";
            } else if (todoType === "done") {
                const group = loadDoneGroup(period);
                if (group) {
                    list.appendChild(group);
                    if (opened === 0 && period === "ungraded") {
                        setTimeout(() => {
                            container.classList.remove("bettercanvas-todo-list-closed");
                            container.classList.add("bettercanvas-todo-list-opened");
                        }, 1);
                        opened++;
                    }
                }
            } else if (todoType === "announcements") {
                const group = loadAnnouncementGroup(period)
                if (group) {
                    list.appendChild(group);
                    if (opened === 0 && period === "unread") {
                        setTimeout(() => {
                            container.classList.remove("bettercanvas-todo-list-closed");
                            container.classList.add("bettercanvas-todo-list-opened");
                        }, 1);
                        opened++;
                    }
                }
            }

            if (api_options["todo_openall"] === true || container.classList.contains("bettercanvas-todo-list-opened")) {
                setTimeout(() => {
                    container.classList.remove("bettercanvas-todo-list-closed");
                    container.classList.add("bettercanvas-todo-list-opened");
                }, 1);
            } else {
                container.classList.remove("bettercanvas-todo-list-opened");
                container.classList.add("bettercanvas-todo-list-closed");
            }

        });

        // if nothing was opened, then there's nothing to do
        if (opened === 0 && todoType === "assignments") {
            const nodues = document.getElementById("bettercanvas-sidebar-nodues") || util_makeElement("p", sidebar, { "id": "bettercanvas-sidebar-nodues", "textContent": "Nothing due" });
            nodues.style.display = opened === true ? "none" : "block";
        } else {
            if (document.getElementById("bettercanvas-sidebar-nodues")) document.getElementById("bettercanvas-sidebar-nodues").style.display = "none";
        }
        //return; 

        return;


        /*
        let allComplete = true;
        Object.keys(bars).forEach(key => {
            if (bars[key].total === 0 || bars[key].complete !== bars[key].total) {
                allComplete = false;
            }
        })

        */

    } catch (e) {
        util_logError(e);
    }
}

;// ./js/features/notes.js




let dashboardNotesTimer;
function delayDashboardNotesStorage(text) {
    clearTimeout(dashboardNotesTimer);
    dashboardNotesTimer = setTimeout(() => {
        chrome.storage.sync.set({ dashboard_notes_text: text });
    }, 1000);
}

function loadDashboardNotes() {
    if (api_options.dashboard_notes === true) {
        let notes = document.querySelector('.bettercanvas-dashboard-notes') || document.createElement("textarea");
        notes.classList.add("bettercanvas-dashboard-notes");
        notes.value = api_options.dashboard_notes_text;
        notes.placeholder = "Enter notes here";
        notes.style.display = "block";
        if (notes.parentElement === null) document.querySelector("#DashboardCard_Container").prepend(notes);
        notes.style.height = notes.scrollHeight + 5 + "px";
        notes.addEventListener('input', function () {
            delayDashboardNotesStorage(this.value);
            this.style.height = "1px";
            this.style.height = this.scrollHeight + 5 + "px";
        });
    } else {
        let notes = document.querySelector('.bettercanvas-dashboard-notes');
        if (notes) notes.style.display = "none";
    }
}
;// ./js/features/search.js




let timeout = null;

let activeFilters = [];

async function insertSearchBar() {
    let container = document.getElementById("bettercanvas-searchbar-container");
    if (api_options["global_search"] !== true) {
        if (container) container.style.display = "none";
        return;
    }


    let el;
    try {
        el = document.querySelector(".ic-Dashboard-header__actions").parentNode;
        el.style = "display:flex;align-items:center;flex-direction:row-reverse;"
    } catch (e) {
        return;
    }

    container = container || util_makeElement("div", el, { "id": "bettercanvas-searchbar-container" });
    container.style.display = "flex";

    const searchIcon = document.getElementById("bettercanvas-search-icon") || util_makeElement("div", container, { "id": "bettercanvas-search-icon", "innerHTML": searchSvg });
    const input = document.getElementById("bettercanvas-searchbar") || util_makeElement("input", container, { "id": "bettercanvas-searchbar", "placeholder": "Search..." });

    const modal = document.getElementById("bettercanvas-search-popup-container") || util_makeElement("div", document.body, { "id": "bettercanvas-search-popup-container", "className": "bettercanvas-clickout" });
    const popup = document.getElementById("bettercanvas-search-popup") || util_makeElement("div", modal, { "id": "bettercanvas-search-popup" });

    const searchInputContainer = document.getElementById("bettercanvas-search-input-container") || util_makeElement("div", popup, { "id": "bettercanvas-search-input-container" });
    const searchIconBig = document.getElementById("bettercanvas-search-icon-big") || util_makeElement("div", searchInputContainer, { "id": "bettercanvas-search-icon-big", "innerHTML": searchSvg });
    const searchInput = document.getElementById("bettercanvas-search-input") || util_makeElement("input", searchInputContainer, { "id": "bettercanvas-search-input", "placeholder": "Search..." });
    const resultsContainer = document.getElementById("bettercanvas-search-results-container") || util_makeElement("div", popup, { "id": "bettercanvas-search-results-container" });
    const filterContainer = document.getElementById("bettercanvas-search-filters") || util_makeElement("div", resultsContainer, { "id": "bettercanvas-search-filters" });
    const searchResults = document.getElementById("bettercanvas-search-results") || util_makeElement("div", resultsContainer, { "id": "bettercanvas-search-results" });


    const filters = ["Assignments", "Files", "Pages", "Modules"];
    filterContainer.textContent = "";

    const allFilters = util_makeElement("button", filterContainer, { "textContent": "All", "className": "active" });
    allFilters.onclick = () => {
        document.querySelectorAll("#bettercanvas-search-filters button").forEach(el => {
            el.classList.remove("active");
        })
        allFilters.classList.add("active");
        activeFilters = [];
        search(searchInput.value);
    }

    filters.forEach(filter => {
        const btn = util_makeElement("button", filterContainer, { "textContent": filter });
        btn.onclick = () => {
            if (activeFilters.includes(filter)) {
                btn.classList.remove("active");
                activeFilters = activeFilters.filter(f => f !== filter);
                if (activeFilters.length === 0) allFilters.classList.add("active");
            } else {
                btn.classList.add("active");
                activeFilters.push(filter);
                allFilters.classList.remove("active");
            }
            search(searchInput.value);
        }
    });

    container.onclick = async () => {
        const localStorage = await chrome.storage.local.get(["last_search"]);
        // if the last search was less than 24 hours ago, don't update cache
        if (localStorage["last_search"] < Date.now() - 1000 * 60 * 60 * 24) {
            updateSearchCache();
        }
        modal.classList.add("active");
        searchInput.focus();
    }

    modal.onclick = (e) => {
        if (e.target.classList.contains("bettercanvas-clickout")) {
            modal.classList.remove("active");
        }
    }
    


    searchInput.addEventListener("input", (e) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            search(e.target.value);
        }, 500);
    });

}

// if a user has a lot of courses, searching all of them at once (using the api's search_term param) is problematic
// instead, just get everything only once per day and cache it
async function updateSearchCache() {
    const updated = { "pages": {}, "files": {}, "modules": {} };

    api_options["card_ids"].forEach(async (id, index) => {
        setTimeout(async () => {
            try {
                const fileRes = await fetch(`${domain}/api/v1/courses/${id}/files?per_page=50&sort=updated_at&order=desc`);
                const fileData = await fileRes.json();
                updated["files"][id] = fileData.map(item => { return { "course_id": id, "name": item.filename, "time": item.updated_at || item.created_at, "id": item.id } });
            } catch (e) {

            }

            try {
                const pageRes = await fetch(`${domain}/api/v1/courses/${id}/pages?per_page=50`);
                const pageData = await pageRes.json();
                updated["pages"][id] = pageData.map(item => { return { "course_id": id, "name": item.title, "time": item.updated_at || item.created_at, "id": item.page_id } });
            } catch (e) {

            } finally {
            }

            try {
                const moduleRes = await fetch(`${domain}/api/v1/courses/${id}/modules?per_page=50`);
                const moduleData = await moduleRes.json();
                updated["modules"][id] = moduleData.map(item => { return { "course_id": id, "name": item.name, "time": undefined, "id": item.id } });
            } catch (e) {

            } finally {
                if (index === api_options["card_ids"].length - 1) {
                    await chrome.storage.local.set({ "search_cache": updated, "last_search": Date.now() });
                }
            }


        }, index * 500);
    });
}

const search_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function search(query) {
    const el = document.getElementById("bettercanvas-search-results");
    document.getElementById("bettercanvas-search-results-container").style.display = query === "" ? "none" : "block";

    const storage = await chrome.storage.local.get(["last_search", "search_cache"]);

    const items = (await assignments).filter(item => item.plannable_type !== "announcement" && item.plannable.title.toLowerCase().includes(query.toLowerCase()));
    const files = Object.keys(storage["search_cache"]["files"]).reduce((a, v) => a.concat(storage["search_cache"]["files"][v].filter(item => item.name.toLowerCase().includes(query.toLowerCase()))), []);
    const pages = Object.keys(storage["search_cache"]["pages"]).reduce((a, v) => a.concat(storage["search_cache"]["pages"][v].filter(item => item.name.toLowerCase().includes(query.toLowerCase()))), []);
    const modules = Object.keys(storage["search_cache"]["modules"]).reduce((a, v) => a.concat(storage["search_cache"]["modules"][v].filter(item => item.name.toLowerCase().includes(query.toLowerCase()))), []);


    el.textContent = "";

    const assignmentResults = util_makeElement("div", el, { "id": "bettercanvas-search-assignments", "className": "bettercanvas-search-results-section" });
    const pageResults = util_makeElement("div", el, { "id": "bettercanvas-search-pages", "className": "bettercanvas-search-results-section" });
    const fileResults = util_makeElement("div", el, { "id": "bettercanvas-search-files", "className": "bettercanvas-search-results-section" });
    const moduleResults = util_makeElement("div", el, { "id": "bettercanvas-search-modules", "className": "bettercanvas-search-results-section" });

    const assignmentsHeader = util_makeElement("h3", assignmentResults, { "textContent": "Assignments" });
    util_makeElement("span", assignmentsHeader, { "textContent": items.length > 5 ? "5+" : items.length });

    items.forEach((item, index) => {
        if (index > 4) return;
        try {
            const container = util_makeElement("a", assignmentResults, { "className": "bettercanvas-search-item-container", "href": `${domain}/courses/${item.course_id}/assignments/${item.plannable.id}` });
            const containerLeft = util_makeElement("div", container, { "className": "bettercanvas-search-item-container-left" });
            util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-icon", "innerHTML": pencilSvg });
            const details = util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-details" });
            util_makeElement("p", details, { "textContent": api_options["card_" + item.course_id]["default"], "className": "bettercanvas-search-item-details-course" });
            util_makeElement("p", details, { "textContent": item.plannable.title, "className": "bettercanvas-search-item-details-name" });
            const time = util_makeElement("div", container, { "className": "bettercanvas-search-item-time" });
            const date = new Date(item.plannable.due_at);
            const dateFormatted = isNaN(date.getTime()) ? "" : search_months[date.getMonth()] + " " + date.getDate();
            util_makeElement("p", time, { "textContent": dateFormatted, "className": "bettercanvas-search-item-time-text" });
        } catch (e) {
        }
    });

    if (items.length === 0) {
        util_makeElement("p", assignmentResults, { "textContent": "No pages found" });
    }


    const pagesHeader = util_makeElement("h3", pageResults, { "textContent": "Pages" });
    util_makeElement("span", pagesHeader, { "textContent": pages.length > 5 ? "5+" : pages.length });

    pages.forEach((item, index) => {
        if (index > 4) return;
        try {
            const container = util_makeElement("a", pageResults, { "className": "bettercanvas-search-item-container", "href": `${domain}/courses/${item.course_id}/pages/${item.id}` });
            const containerLeft = util_makeElement("div", container, { "className": "bettercanvas-search-item-container-left" });
            util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-icon", "innerHTML": sitemapSvg });
            const details = util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-details" });
            util_makeElement("p", details, { "textContent": api_options["card_" + item.course_id]["default"], "className": "bettercanvas-search-item-details-course" });
            util_makeElement("p", details, { "textContent": item.name, "className": "bettercanvas-search-item-details-name" });
            const time = util_makeElement("div", container, { "className": "bettercanvas-search-item-time" });
            const date = new Date(item.time);
            const dateFormatted = isNaN(date.getTime()) ? "" : search_months[date.getMonth()] + " " + date.getDate();
            util_makeElement("p", time, { "textContent": dateFormatted, "className": "bettercanvas-search-item-time-text" });
        } catch (e) {
        }
    });

    if (pages.length === 0) {
        util_makeElement("p", pageResults, { "textContent": "No pages found" });
    }


    const filesHeader = util_makeElement("h3", fileResults, { "textContent": "Files" });
    util_makeElement("span", filesHeader, { "textContent": files.length > 5 ? "5+" : files.length });

    files.forEach((item, index) => {
        if (index > 4) return;
        try {
            const container = util_makeElement("a", fileResults, { "className": "bettercanvas-search-item-container", "href": `${domain}/courses/${item.course_id}/files/${item.id}` });
            const containerLeft = util_makeElement("div", container, { "className": "bettercanvas-search-item-container-left" });
            util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-icon", "innerHTML": fileSvg });
            const details = util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-details" });
            util_makeElement("p", details, { "textContent": api_options["card_" + item.course_id]["default"], "className": "bettercanvas-search-item-details-course" });
            util_makeElement("p", details, { "textContent": item.name, "className": "bettercanvas-search-item-details-name" });
            const time = util_makeElement("div", container, { "className": "bettercanvas-search-item-time" });
            const date = new Date(item.time);
            const dateFormatted = isNaN(date.getTime()) ? "" : search_months[date.getMonth()] + " " + date.getDate();
            util_makeElement("p", time, { "textContent": dateFormatted, "className": "bettercanvas-search-item-time-text" });
        } catch (e) {
        }
    });

    if (files.length === 0) {
        util_makeElement("p", fileResults, { "textContent": "No files found" });
    }

    const modulesHeader = util_makeElement("h3", moduleResults, { "textContent": "Modules" });
    util_makeElement("span", modulesHeader, { "textContent": modules.length > 5 ? "5+" : modules.length });

    modules.forEach((item, index) => {
        if (index > 4) return;
        try {
            const container = util_makeElement("a", moduleResults, { "className": "bettercanvas-search-item-container", "href": `${domain}/courses/${item.course_id}/modules/${item.id}` });
            const containerLeft = util_makeElement("div", container, { "className": "bettercanvas-search-item-container-left" });
            util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-icon", "innerHTML": moduleSvg });
            const details = util_makeElement("div", containerLeft, { "className": "bettercanvas-search-item-details" });
            util_makeElement("p", details, { "textContent": api_options["card_" + item.course_id]["default"], "className": "bettercanvas-search-item-details-course" });
            util_makeElement("p", details, { "textContent": item.name, "className": "bettercanvas-search-item-details-name" });
            const time = util_makeElement("div", container, { "className": "bettercanvas-search-item-time" });
            const date = new Date(item.time);
            const dateFormatted = isNaN(date.getTime()) ? "" : search_months[date.getMonth()] + " " + date.getDate();
            util_makeElement("p", time, { "textContent": dateFormatted, "className": "bettercanvas-search-item-time-text" });
        } catch (e){
        }
    });

    document.querySelectorAll(".bettercanvas-search-results-section").forEach(section => {
        section.style.display = activeFilters.length === 0 ? "flex" : "none";
    });

    activeFilters.forEach(filter => {
        const section = document.getElementById("bettercanvas-search-" + filter.toLowerCase());
        section.style.display = "flex";
    });

}



;// ./js/features/deals.js



async function insertDeals() {
    let container = document.getElementById("bettercanvas-deals");
    if (container) {
        container.style.display = "block";
        return;
    }

    container = util_makeElement("div", document.body, {
        "id": "bettercanvas-deals",
        "style": "position: fixed; top: 0; left:var(--bcsidebarwidth); width: calc(100% - var(--bcsidebarwidth)); height: 100%; z-index: 100000; background: #000000f2;backdrop-filter: blur(10px);"
    });

    document.body.style.overflow = "hidden";

    const frame = util_makeElement("iframe", container, {
        "id": "bettercanvas-deals-frame",
        "style": "width: 100%; height: 100%; border: none;",
        "src": `chrome-extension://${chrome.runtime.id}/html/deals.html`
    });
}



;// ./js/features/sidebar.js




/*
import { loadTimerSidebar } from "./timer";
import { insertBreathe } from "./breathe";
*/


function showComingSoon() {
    const wrapper = document.getElementById("bettercanvas-coming-soon-container") || util_makeElement("div", document.body, { "id": "bettercanvas-coming-soon-container" });
    const container = document.getElementById("bettercanvas-coming-soon") || util_makeElement("div", wrapper, { "id": "bettercanvas-coming-soon" });
    wrapper.style.display = "flex";
    wrapper.onclick = (e) => {
        if (e.target.id === "bettercanvas-coming-soon-container" || e.target.id === "bettercanvas-coming-soon-btn") {
            wrapper.style.display = "none";
        }
    }

    container.innerHTML = `
        <div>
            <svg  xmlns="http://www.w3.org/2000/svg"  width="40"  height="40"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-puzzle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 2a3 3 0 0 1 2.995 2.824l.005 .176v1h3a2 2 0 0 1 1.995 1.85l.005 .15v3h1a3 3 0 0 1 .176 5.995l-.176 .005h-1v3a2 2 0 0 1 -1.85 1.995l-.15 .005h-3a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-1a1 1 0 0 0 -1.993 -.117l-.007 .117v1a2 2 0 0 1 -1.85 1.995l-.15 .005h-3a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-3a2 2 0 0 1 1.85 -1.995l.15 -.005h1a1 1 0 0 0 .117 -1.993l-.117 -.007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-3a2 2 0 0 1 1.85 -1.995l.15 -.005h3v-1a3 3 0 0 1 3 -3z" /></svg>
        </div>
        <h3>Widgets Coming Soon</h3>
        <p>Timers, music, quotes, notes, and more - these are locked for now, but not for long.</p>
        <p style="margin-top:14px;color:var(--bctext-0, #000)!important;"><strong>Here's the deal:</strong></p>
                <p>
                    The biggest update for BetterCanvas is on its way! Next semester you can unlock widget access + a bunch more by creating a free BetterCanvas account.
                </p>
        <button id="bettercanvas-coming-soon-btn">Got it!</button>
    `
}


const widgets = [
    { "name": "Timer", "icon": hourglassSvg, "load": showComingSoon, "active": () => false },
    { "name": "Breathe", "icon": breatheSvg, "load": showComingSoon, "active": () => false },
    { "name": "Music", "icon": musicSvg, "load": showComingSoon, "active": () => false },
    { "name": "Quote", "icon": quoteSvg, "load": showComingSoon, "active": () => false },
    { "name": "Notes", "icon": noteSvg, "load": showComingSoon, "active": () => false },
    { "name": "Reminders", "icon": checklistSvg, "load": showComingSoon, "active": () => false }
]

const dropdownItems = [
    { "name": "Home", "href": "" },
    { "name": "Files", "href": "/files" },
    { "name": "Assignments", "href": "/assignments" },
    { "name": "Grades", "href": "/grades" },

]

const bcPages = [
    { "name": "Perks", "icon": tagSvg, "load": insertDeals, "active": () => false },
]


let retrySetup = null;

async function updateSidebarPages() {

    console.log("updatingSidebarPages");

    if (retrySetup !== null) return;

    const menu = document.getElementById("menu");

    const pages = { ...api_options["sidebar_pages"], "init": true };
    const defaultActive = ["Dashboard",  "Courses", "Calendar", "Inbox", "Perks"];

    const items = menu.querySelectorAll(".ic-app-header__menu-list-item");

    items.forEach(item => {
        try {
            const text = item.querySelector(".menu-item__text");
            const link = item.querySelector(".ic-app-header__menu-list-link");
            if (!text || !link) return;

            const name = text.textContent.trim();
            const id = link?.id;
            const href = link?.href;

            if (pages["active"].reduce((a, v) => v["name"] === name || a, false)) return;
            if (pages["hidden"].reduce((a, v) => v["name"] === name || a, false)) return;

            // anything at this point is a new item

            const final = { "name": name, "href": href, "id": id };

            if (defaultActive.includes(name)) {
                pages["active"].push(final);
            } else {
                pages["hidden"].push(final);
            }

        } catch (e) {
            console.log("updateSidebarPages() error", item, pages, e);
            clearTimeout(retrySetup);
            retrySetup = setTimeout(updateSidebarPages, 5000);
            return;
        }
    });

    if (pages["active"].length === 0) {
        return;
    }

    await chrome.storage.sync.set({ "sidebar_pages": pages });
}

async function toggleCollapsed(section) {
    const storage = await chrome.storage.sync.get("sidebar_collapsed");
    if (storage["sidebar_collapsed"].includes(section)) {
        chrome.storage.sync.set({ "sidebar_collapsed": storage["sidebar_collapsed"].filter(x => x !== section) });
    } else {
        chrome.storage.sync.set({ "sidebar_collapsed": [...storage["sidebar_collapsed"], section] });
    }
}

let confirmLabelHover = null;

async function cleanSidebar() {


    const styleText = `
        :root {
            --bcsidebarlarge: 220px;
            --bcsidebarsmall: 90px;
        }
        .ic-app-header__menu-list-item {display:none;}
        #menu .ic-app-header__menu-list-link {position:relative;display:flex;border-radius:10px!important;width:100%!important;}
        .menu-item__text {text-align:left!important;flex:1!important;}
        #header {overflow:hidden;width: var(--bcsidebarlarge)!important;padding:14px!important;transition: width 0.2s;}
        body.bettercanvas-sidebar-small #header {width: var(--bcsidebarsmall)!important;}
        .ic-Layout-wrapper{margin-left:var(--bcsidebarlarge)!important;}
        body.bettercanvas-sidebar-small .ic-Layout-wrapper {margin-left:var(--bcsidebarsmall)!important;}
        .menu-item-icon-container svg, .menu-item-icon-container i::before {height:20px!important;width:20px!important;font-size:20px!important;line-height:20px!important;}
        #global_nav_profile_link {flex-direction: column;flex:0}
        #global_nav_profile_link .menu-item__text, #global_nav_help_link .menu-item__text {display: none;}
        #global_nav_help_link .menu-item-icon-container {flex: 0;}
        #global_nav_help_link {margin-left: auto;}
        .ic-app-header__menu-list-link svg {vertical-align:middle;}
        .menu-item-icon-container .ic-avatar {width:30px;height:30px;}
        .ic-app-header__logomark-container {padding:0;flex-wrap:wrap;justify-content:center;display:flex;align-items:center;padding-left:4px;}
        .ic-app-header__logomark-container .ic-app-header__menu-list-link {border-radius:10px;}
        .ic-app-header__logomark {flex:0;min-width:min(100%, 66px);}
        body.bettercanvas-sidebar-small #bettercanvas-sidebar-courses-container {display: none!important;}
        #bettercanvas-sidebar-minify-btn {left: var(--bcsidebarlarge);transform:translateX(-50%)}
        body.bettercanvas-sidebar-small #bettercanvas-sidebar-minify-btn {left: var(--bcsidebarsmall);}
        .menu-item__text {transition: none;position: static;left: auto;top: auto;transform: none;opacity: 1;text-align: center;display: block;line-height: 1.4;border-radius: 0;margin: 3px 0 0;padding: 0;background: transparent;white-space: normal;word-wrap: break-word;}
        body.bettercanvas-sidebar-small .menu-item__text {display:none}
        .menu-item__text::after {display: none;}
        .ic-app-header__menu-list-link:hover, .bettercanvas-sidebar-item:hover {background: none;backdrop-filter:brightness(1.2)}
        .ic-app-header__menu-list-link:hover .menu-item__text {opacity:1!important;}
        .ic-app-header__logomark {max-height:70px;max-width:max-content;}
        .ic-app-header__menu-list-item--active .menu-item__text {color: #000;}
        `

    const style = document.getElementById("bettercanvas-sidebar-style") || util_makeElement("style", document.head, { "textContent": styleText, "id": "bettercanvas-sidebar-style" });
    style.textContent = styleText;

    let widgetSection = document.getElementById("bettercanvas-sidebar-widgets");
    let coursesSection = document.getElementById("bettercanvas-sidebar-courses-container");

    if (api_options["clean_sidebar"] !== true) {
        if (widgetSection) widgetSection.classList.remove("active");
        if (coursesSection) coursesSection.style.display = "none";
        document.querySelectorAll(".bettercanvas-sidebar-category-header").forEach(el => el.style.display = "none");
        document.querySelectorAll(".ic-app-header__menu-list-item").forEach(el => el.style.display = "block");
        style.textContent = "";
        return;
    }

    if (api_options["sidebar_pages"]["init"] !== true) {
        updateSidebarPages();
    }

    if (api_options["sidebar_small"] !== true) {
        document.body.classList.remove("bettercanvas-sidebar-small");
    } else {
        document.body.classList.add("bettercanvas-sidebar-small");
    }
    const menuContainer = document.querySelector(".ic-app-header__main-navigation")
    const menu = document.getElementById("menu");
    const account = document.getElementById("global_nav_profile_link");
    const help = document.getElementById("global_nav_help_link")

    menu.classList.add("bettercanvas-sidebar");
    document.body.classList.add("bettercanvas-sidebar-enabled");

    if (help) {
        document.querySelector(".ic-app-header__logomark-container").appendChild(help);
        setupTooltip(help, "Help");
    }

    if (account) {
        document.querySelector(".ic-app-header__logomark-container").appendChild(account);
        setupTooltip(account, "Account");
    }


    // bettercanvas widgets section
    if (!widgetSection) {
        widgetSection = util_makeElement("div", menuContainer, { "id": "bettercanvas-sidebar-widgets", });
        menuContainer.insertBefore(widgetSection, menu);
    }

    //header
    const widgetSectionHeader = widgetSection.querySelector(".bettercanvas-sidebar-category-header") || util_makeElement("div", widgetSection, { "className": "bettercanvas-sidebar-category-header", "style": "cursor:pointer;" });
    const widgetHeaderText = widgetSection.querySelector(".bettercanvas-sidebar-category") || util_makeElement("p", widgetSectionHeader, { "style": "position:relative", "textContent": "Widgets", "className": "bettercanvas-sidebar-category" });
    const widgetHeaderBtn = widgetSection.querySelector(".bettercanvas-sidebar-category-header button") || util_makeElement("button", widgetSectionHeader, { "innerHTML": downSvg });
    const widgetCertification = widgetSection.querySelector(".bettercanvas-certified-label") || util_makeElement("div", widgetHeaderText, { "className": "bettercanvas-certified-label", "innerHTML": sparkSvg });
    widgetSectionHeader.onclick = () => toggleCollapsed("widgets");
    widgetSectionHeader.style.display = "flex";
    setupTooltip(widgetCertification, "These are BetterCanvas features!");


    // widget grid
    const widgetGrid = widgetSection.querySelector("#bettercanvas-sidebar-grid") || util_makeElement("div", widgetSection, { "id": "bettercanvas-sidebar-grid" });

    widgetGrid.textContent = "";

    if (widgetGrid.childNodes.length === 0) {
        widgets.forEach(item => {
            const btn = util_makeElement("button", widgetGrid, { "className": "bettercanvas-sidebar-grid-item" });
            btn.innerHTML = item.icon;
            btn.addEventListener("click", item.load);
            setupTooltip(btn, item.name);
        });
    }

    //pages section

    //header
    let pagesSectionHeader = document.getElementById("bettercanvas-sidebar-pages-header");
    if (!pagesSectionHeader) {
        pagesSectionHeader = util_makeElement("div", menuContainer, { "id": "bettercanvas-sidebar-pages-header", "className": "bettercanvas-sidebar-category-header", "style": "cursor:pointer;" });
        menuContainer.insertBefore(pagesSectionHeader, menu);
    }
    const pagesHeaderText = pagesSectionHeader.querySelector(".bettercanvas-sidebar-category") || util_makeElement("p", pagesSectionHeader, { "textContent": "Pages", "className": "bettercanvas-sidebar-category" });
    const pagesHeaderBtn = pagesSectionHeader.querySelector(".bettercanvas-sidebar-category-header button") || util_makeElement("button", pagesSectionHeader, { "innerHTML": downSvg });
    pagesSectionHeader.onclick = () => toggleCollapsed("pages");
    pagesSectionHeader.style.display = "flex";

    //const pagesHeader = document.getElementById("bettercanvas-sidebar-pages-header") || makeElement("p", menu, { "textContent": "Pages", "id": "bettercanvas-sidebar-pages-header", "className": "bettercanvas-sidebar-category" });

    bcPages.forEach(page => {
        const li = document.getElementById("bettercanvas-sidebar-" + page.name + "-container") || util_makeElement("li", menu, { "className": "ic-app-header__menu-list-item", "id": "bettercanvas-sidebar-" + page.name + "-container" });
        const a = li.querySelector(".ic-app-header__menu-list-link") || util_makeElement("a", li, { "id": "bettercanvas-sidebar-" + page.name + "-btn", "className": "ic-app-header__menu-list-link", "style": "cursor:pointer;" });
        const icon = li.querySelector(".menu-item-icon-container") || util_makeElement("div", a, { "className": "menu-item-icon-container", "innerHTML": page.icon });
        const text = li.querySelector(".menu-item__text") || util_makeElement("div", a, { "className": "menu-item__text", "textContent": page.name });
        const aside = li.querySelector(".bettercanvas-certified") || util_makeElement("div", a, { "className": "bettercanvas-certified", "innerHTML": sparkSvg });
        aside.style.display = api_options["sidebar_small"] ? "none" : "flex";
        
        li.onclick = () => {
            page.load();
            console.log(document.querySelectorAll(".ic-app-header__menu-list-item--active"));
            document.querySelectorAll(".ic-app-header__menu-list-item--active").forEach(el => el.classList.remove("ic-app-header__menu-list-item--active"));
            li.classList.add("ic-app-header__menu-list-item--active");
        }

        setupTooltip(aside, "This is a BetterCanvas feature!");
        
    });


    // showing/hiding list items
    const activeIds = api_options["sidebar_pages"]["active"].map(item => item.id);
    menu.querySelectorAll(".ic-app-header__menu-list-item").forEach(item => {
        try {
            const id = item.querySelector(".ic-app-header__menu-list-link")?.id;
            if (activeIds.includes(id)) {
                item.style.display = "flex";
                if (api_options["sidebar_small"]) {
                    setupTooltip(item, item.querySelector(".menu-item__text").textContent);
                } else {
                    item.onmouseenter = () => {};
                    item.onmouseleave = () => {};
                    item.onmousemove = () => {};
                }
            } else {
                item.style.display = "none";
            }
        } catch (e) {
            util_logError(e);
        }


    });



    // courses section
    let coursesContainer = document.getElementById("bettercanvas-sidebar-courses-container") || util_makeElement("div", menuContainer, { "id": "bettercanvas-sidebar-courses-container", "className": "bettercanvas-sidebar-section" });
    coursesContainer.style.display = "block";

    // header
    const coursesSectionHeader = coursesContainer.querySelector(".bettercanvas-sidebar-category-header") || util_makeElement("div", coursesContainer, { "className": "bettercanvas-sidebar-category-header", "style": "cursor:pointer;" });
    const coursesHeaderText = coursesContainer.querySelector(".bettercanvas-sidebar-category") || util_makeElement("p", coursesSectionHeader, { "textContent": "Courses", "className": "bettercanvas-sidebar-category" });
    const coursesHeaderBtn = coursesContainer.querySelector(".bettercanvas-sidebar-category-header button") || util_makeElement("button", coursesSectionHeader, { "innerHTML": downSvg });
    coursesSectionHeader.onclick = () => toggleCollapsed("courses");
    coursesSectionHeader.style.display = "flex";

    // course list
    const courseItems = document.getElementById("bettercanvas-sidebar-courses") || util_makeElement("div", coursesContainer, { "id": "bettercanvas-sidebar-courses", "className": "bettercanvas-sidebar-section" });
    courseItems.textContent = "";

    api_options["card_ids"].forEach((id, i) => {
        const container = util_makeElement("div", courseItems, { "className": "bettercanvas-sidebar-item-container" });
        const btn = util_makeElement("div", container, { "className": "bettercanvas-sidebar-item" });
        const svg = util_makeElement("div", btn, { "style": `width:10px;height:10px;border-radius:40px;background: ${api_options["card_" + id]["color"]}` });
        const p = util_makeElement("a", btn, { "className": "bettercanvas-sidebar-item-link", "textContent": api_options["card_" + id]["default"], "href": "/courses/" + id });
        const dropdownBtn = util_makeElement("button", btn, { "className": "bettercanvas-sidebar-dropdown-btn", "innerHTML": downSvg });

        // closes all dropdowns and opens/closes the dropdown that was clicked
        dropdownBtn.addEventListener("click", () => {
            let open = container.classList.contains("bettercanvas-sidebar-dropdown-open");
            document.querySelectorAll(".bettercanvas-sidebar-dropdown-open").forEach(el => el.classList.remove("bettercanvas-sidebar-dropdown-open"));
            if (open ? container.classList.remove("bettercanvas-sidebar-dropdown-open") : container.classList.add("bettercanvas-sidebar-dropdown-open"));
        });

        const dropdown = util_makeElement("div", container, { "className": "bettercanvas-sidebar-dropdown" });
        dropdownItems.forEach(item => {
            const link = util_makeElement("a", dropdown, { "className": "bettercanvas-sidebar-item-dropdown-link", "textContent": item.name, "href": "/courses/" + id + item.href });
        });

    });


    // collapsing the sections
    if (api_options["sidebar_collapsed"].includes("widgets")) {
        widgetSection.classList.remove("active");
    } else {
        widgetSection.classList.add("active");
    }
    if (api_options["sidebar_collapsed"].includes("pages")) {
        menu.classList.remove("active");
        pagesSectionHeader.classList.remove("active");
    } else {
        menu.classList.add("active");
        pagesSectionHeader.classList.add("active");
    }
    if (api_options["sidebar_collapsed"].includes("courses")) {
        coursesContainer.classList.remove("active");
    } else {
        coursesContainer.classList.add("active");
    }


    const header = document.getElementById("header");
    const minifyButton = document.getElementById("bettercanvas-sidebar-minify-btn") || util_makeElement("button", header, { "id": "bettercanvas-sidebar-minify-btn", "innerHTML": "Minify" });
    
    minifyButton.onclick = () => {
        chrome.storage.sync.set({ "sidebar_small": !api_options["sidebar_small"] });
    }

    const supportContainer = document.getElementById("bettercanvas-sidebar-support-container") || util_makeElement("div", menuContainer, { "id": "bettercanvas-sidebar-support-container" });
    const supportBtn = document.getElementById("bettercanvas-sidebar-support-btn") || util_makeElement("button", supportContainer, { "id": "bettercanvas-sidebar-support-btn", "textContent": "Senior? Tip a coffee :)" });
    const kofiContainer = document.getElementById("bettercanvas-kofi-container") || util_makeElement("div", menuContainer, { "id": "bettercanvas-kofi-container" });
    //const exitKofiContainer = document.getElementById("bettercanvas-exit-kofi") || makeElement("button", kofiContainer, { "id": "bettercanvas-exit-kofi", "innerHTML": exitSvg });

    supportBtn.onclick = () => {
        const kofiFrame = document.getElementById("bettercanvas-kofi") || util_makeElement("iframe", kofiContainer, { "id": "bettercanvas-kofi", "src": "https://ko-fi.com/bettercanvas/?hidefeed=true&widget=true&embed=true&preview=true" });
        kofiContainer.classList.toggle("active");
        const exitKofiContainer = util_makeElement("button", kofiContainer, { "id": "bettercanvas-exit-kofi", "innerHTML": exitSvg });
        exitKofiContainer.onclick = () => {kofiContainer.classList.toggle("active");};
    }

}



;// ./js/start.js



















function isDomainCanvasPage() {
    chrome.storage.sync.get(['custom_domain', 'dark_mode', 'dark_preset', 'device_dark', 'remind'], result => {
        api_options = result;
        if (result.custom_domain.length && result.custom_domain[0] !== "") {
            for (let i = 0; i < result.custom_domain.length; i++) {
                if (domain.includes(result.custom_domain[i])) {
                    startExtension();
                    break;
                    //return;
                }
            }

            loadAllPagesContent();

            // if the code reaches this point, its not a canvas page so run the reminders
        } else {
            setupCustomURL();
        }
    });
}

function loadAllPagesContent() {
    chrome.storage.onChanged.addListener((changes) => {
        if (changes["remind"]) reminderWatch();
        //if (changes["timer_open"] || changes["timer_minimized"]) insertTimer();
    });

    setTimeout(reminderWatch, 2000);
    setInterval(reminderWatch, 60000);

    //insertTimer();
    //setTimeout(insertTimer, 2000);
}

function applyOptionsChanges(changes) {
    let rewrite = {};
    Object.keys(changes).forEach(key => {
        rewrite[key] = changes[key].newValue;
    });
    api_options = { ...api_options, ...rewrite };

    // when an option is updated it will call the necessary functions again
    // so any changes made in the menu no longer require a refresh to apply

    console.log(changes);
    Object.keys(changes).forEach(key => {
        switch (key) {
            case ("dark_mode"):
            case ("dark_preset"):
            case ("device_dark"):
                toggleDarkMode();
                break;
            case ("auto_dark"):
            case ("auto_dark_start"):
            case ("auto_dark_end"):
                toggleAutoDarkMode();
                break;
            case ("gradient_cards"):
                aesthetics_changeGradientCards();
                break;
            case ("dashboard_notes"):
                loadDashboardNotes();
                break;
            case ("dashboard_grades"):
            case ("grade_hover"):
                if (!api_grades) getGrades();
                insertGrades();
                break;
            case ("assignments_due"):
            case ("num_assignments"):
                if (!assignments) getAssignments();
                if (document.querySelectorAll(".bettercanvas-card-assignment").length === 0) setupCardAssignments();
                loadCardAssignments();
                break;
            case ("custom_assignments"):
            case ("assignment_date_format"):
            case ("card_overdues"):
            case ("relative_dues"):
                cardAssignments = (0,cardassignments_namespaceObject.preloadAssignmentEls)();
                loadCardAssignments();
                break;
            case ((/card_\d+/).test(key) ? key : null):
            case ("custom_cards"):
            case ("custom_cards_2"):
            case ("custom_cards_3"):
                customizeCards();
                calculateGPA2();
                cleanSidebar();
                setupBetterTodo();
                break;
            case ("todo_colors"):
            case ("todo_style"):
            case ("better_todo"):
                setupBetterTodo();
                break;
            case ("todo_hr24"):
            case ("num_todo_items"):
            case ("hover_preview"):
            case ("todo_overdues"):
            case ("custom_cards_3"):
            case ("todo_openall"):
                //moreAnnouncementCount = 0;
                //moreAssignmentCount = 0;
                todo_loadBetterTodo();
                break;
            case ("gpa_calc"):
            case ("gpa_calc_prepend"):
            case ("gpa_calc_weighted"):
            case ("gpa_calc_cumulative"):
                if (!api_grades) getGrades();
                setupGPACalc();
                break;
            case ("gpa_calc_bounds"):
            case ("cumulative_gpa"):
                calculateGPA2();
                break;
            case ("custom_font"):
                loadCustomFont();
                break;
            case ("remlogo"):
            case ("disable_color_overlay"):
            case ("condensed_cards"):
            case ("hide_feedback"):
            case ("full_width"):
            case ("custom_styles"):
            case ("rounder_cards"):
                applyAestheticChanges();
                break;
            case ("show_updates"):
                showUpdateMsg();
                break;
            case ("remind"):
                showExampleReminder();
                break;
            case ("sidebar_pages"):
            case ("clean_sidebar"):
            case ("sidebar_collapsed"):
            case ("sidebar_small"):
                cleanSidebar();
                break;
            case ("global_search"):
                insertSearchBar();
                break;
            case ("card_ids"):
                cleanSidebar();
                break;
            case ("todo_style_general"):
                setupBetterTodo();
                break;
        }
    });
}

// needs to be removed in next update
// for users going from v5.12 -> v6.0 only
function updateCardColors(retries) {

    const updates = {};

    const cards = document.querySelectorAll(".ic-DashboardCard");
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        let match;
        try {
            match = card.querySelector(".ic-DashboardCard__link").href.match(/https:\/\/[^\/]+\/[^\/]+\/(.+)/);
        } catch (e) {
            setTimeout(() => updateCardColors(retries + 1), 500);
            return;
        }
        const id = match[1];
        const color = card.querySelector(".ic-DashboardCard__header-title span").style.color;
        updates["card_" + id] = { ...api_options["card_" + id], "color": color };
    }

    chrome.storage.sync.set(updates);
}

async function showUpdateV1() {
    if (api_options["update_messagev1"] !== false) return;

    try {
        document.querySelector(".ic-Layout-wrapper").style = "max-width:100%!important";
    } catch (e) {
    }

    updateCardColors(0);

    const clickout = document.getElementById("bettercanvas-updatev1-clickout") || util_makeElement("div", document.body, { "id": "bettercanvas-updatev1-clickout" });
    clickout.innerHTML = `
        <div id="bettercanvas-updatev1">
            <div>
                <button>
                    <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                </button>
            </div>
            <h3 style="font-weight:bold">BetterCanvas just got even better!</h3>
            <p>want to give our new features a try?</p>
            <ul>
                <li>
                    <div class="option" id="sidebar_updatev1">
                        <input type="radio" id="off" name="bcsidebar" class="checked">
                        <input type="radio" id="on" name="bcsidebar">
                        <div class="slider">
                            <div class="sliderknob"></div>
                            <div class="sliderbg"></div>
                        </div>
                        <span><strong>sidebar:</strong> cleaner, smoother</span>
                    </div>
                </li>
                <li>
                    <div class="option" id="todo_updatev1">
                            <input type="radio" id="off" name="bctodo">
                            <input type="radio" id="on" name="bctodo">
                            <div class="slider">
                                <div class="sliderknob"></div>
                                <div class="sliderbg"></div>
                            </div>
                            <span><strong>todo list</strong>: redesigned (progress wheel + confetti)</span>
                        </div>
                </li>
                <li>
                    <div class="option" id="search_updatev1">
                        <input type="radio" id="off" name="bcsearch" class="checked">
                        <input type="radio" id="on" name="bcsearch">
                        <div class="slider">
                            <div class="sliderknob"></div>
                            <div class="sliderbg"></div>
                        </div>
                        <span><strong>search bar:</strong> find anything in seconds</span>
                    </div>
                </li>
            </ul>
            <p style="font-size:13px;font-style:italic;margin:5px 0;color:var(--bctext-2, #535353);">(you can also toggle these features in the extension menu)</p>
            <p style="font-weight:bold;font-size:16px;margin: 20px 0 5px 0">🍀 good luck on finals! - George</p>
        </div>
    `;

    const sidebarSwitch = clickout.querySelector("#sidebar_updatev1");
    sidebarSwitch.onclick = () => {
        sidebarSwitch.querySelector("#on").checked = !api_options["clean_sidebar"];
        chrome.storage.sync.set({ "clean_sidebar": !api_options["clean_sidebar"] });
        sidebarSwitch.querySelector("#on").classList.toggle("checked");
        sidebarSwitch.querySelector("#off").classList.toggle("checked");
    }

    const todoSwitch = clickout.querySelector("#todo_updatev1");
    const startState = api_options["better_todo"];
    const startStyle = api_options["todo_style_general"];
    todoSwitch.querySelector((startState === true && startStyle === "modern") ? "#on" : "#off").checked = true;
    todoSwitch.querySelector((startState === true && startStyle === "modern") ? "#on" : "#off").classList.add("checked");
    todoSwitch.onclick =  () => {
        if (startState === false) { // updated but didn't have the list on
            chrome.storage.sync.set({ "better_todo": !api_options["better_todo"], "todo_style_general": "modern" });
            todoSwitch.querySelector("#on").checked = !api_options["better_todo"];
        } else if (startState === true) { // updated and had the list on already
            todoSwitch.querySelector("#on").checked = api_options["todo_style_general"] === "minimal";
            chrome.storage.sync.set({ "todo_style_general": api_options["todo_style_general"] === "minimal" ? "modern" : "minimal" });
        }
        todoSwitch.querySelector("#on").classList.toggle("checked");
        todoSwitch.querySelector("#off").classList.toggle("checked");
    }

    const searchSwitch = clickout.querySelector("#search_updatev1");
    searchSwitch.onclick =  () => {
        searchSwitch.querySelector("#on").checked = !api_options["global_search"];
        chrome.storage.sync.set({ "global_search": !api_options["global_search"] });
        searchSwitch.querySelector("#on").classList.toggle("checked");
        searchSwitch.querySelector("#off").classList.toggle("checked");
    }


    clickout.querySelector("button").onclick = () => {
        clickout.style.display = "none";
        chrome.storage.sync.set({ "update_messagev1": true });
    }
    
}

function startExtension() {
    toggleDarkMode();

    chrome.storage.sync.get(null, result => {
        api_options = { ...api_options, ...result };
        toggleAutoDarkMode();
        getApiData();
        setupPageMutationResponder();
        cleanSidebar();
        loadCustomFont();
        applyAestheticChanges();
        changeFavicon();
        updateReminders();

        setTimeout(() => runDarkModeFixer(false), 800);
        setTimeout(() => runDarkModeFixer(false), 4500);


        // recap stuff
        //timeElapsed();
        //setupCheckAssignmentSubmission(0);
        //displayRecap();
    });

    chrome.runtime.onMessage.addListener(recieveMessage);

    chrome.storage.onChanged.addListener(applyOptionsChanges);

    console.log("Better Canvas - running");
}

function recieveMessage(request, sender, sendResponse) {
    switch (request.message) {
        case ("getCards"): getCards(); sendResponse(true); break;
        case ("setcolors"): changeColorPreset(request.options); sendResponse(true); break;
        case ("getcolors"): sendResponse(getCardColors()); break;
        case ("inspect"): sendResponse(inspectDarkMode(true)); break;
        case ("fixdm"): sendResponse(runDarkModeFixer(true)); break;
        case ("sidebar"): updateSidebarPages(); sendResponse(true); break;
        case ("grades"):
            api_grades?.then(res => {
                sendResponse(res);
            });
            break;
        default: sendResponse(true);
    }
}

function dashboardMutationResponse(mutationList) {
    for (const mutation of mutationList) {
        if (mutation.type !== "childList") continue;
        if (mutation.target == document.querySelector("#DashboardCard_Container")) {
            let cards = document.querySelectorAll('.ic-DashboardCard');
            customizeCards(cards);
            aesthetics_changeGradientCards();
            setupCardAssignments();
            loadCardAssignments();
            insertGrades();
            loadDashboardNotes();
            setupGPACalc();
            showUpdateMsg();
            insertSearchBar();
            cleanSidebar();
            showUpdateV1();
            //insertTimer();
            //setupAssignments();
            //insertNotes();
            //displayRecap();
            //displayClassChats();
        } else if (mutation.target == document.querySelector('#right-side')) {
            if (!mutation.target.querySelector(".bettercanvas-todosidebar")) {
                setupBetterTodo();
            }
        }
    }
}

let respond = null;

function defaultMutationResponse(mutationList) {
    let rerender = false
    for (const mutation of mutationList) {
        if (mutation.type !== "childList") continue;
        if (api_options["clean_sidebar"] === true && !document.getElementById("bettercanvas-sidebar-courses")) {
            rerender = true;
        }
    };

    if (rerender === false) return;

    clearTimeout(respond);
    respond = null;
    respond = setTimeout(() => {
        if (respond === null) return;
        cleanSidebar();
        if (window.location.pathname.match(/courses\/\d+$/g)) setupBetterTodo();
    }, 10);
}

function setupPageMutationResponder() {
    let responder = null;
    if (api_current_page === "/" || api_current_page === "") {
        responder = dashboardMutationResponse;
    } else {
        responder = defaultMutationResponse;
    }
    const observer = new MutationObserver(responder);
    observer.observe(document.querySelector('html'), { childList: true, subtree: true });
}

async function setup() {
    console.log("SETTING UP BETTERCANVAS");
    getCards().then(() => {
        setTimeout(() => {
            console.log("Better Canvas - setting custom domain to " + domain);
            chrome.storage.sync.set({ custom_domain: [domain] }).then(location.reload());
        }, 100);

    }).catch(err => {
        console.log(err, "No cards found on this page - please navigate to dashboard");
        setTimeout(setup, 2000);
    });
}

function setupCustomURL() {
    //let test = getData(`${domain}/api/v1/dashboard/dashboard_cards?include[]=concluded&include[]=term`);
    let test = getData(`${domain}/api/v1/courses?${/*enrollment_state=active&*/""}per_page=100`);
    test.then(res => {
        if (res.length) {
            setup();
        } else {
            console.log("Better Canvas - this url doesn't seem to be a canvas url (1)");
        }
    }).catch(err => {
        console.log(err);
        console.log("Better Canvas - this url doesn't seem to be a canvas url (2)");
    });
}

isDomainCanvasPage();
/******/ })()
;