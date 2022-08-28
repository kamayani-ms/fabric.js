const { diff } = require('deep-object-diff');

(function(exports) {

  exports.getFixture = function(name, original, callback) {
    getImage(getFixtureName(name), original, callback);
  };

  exports.getAsset = function(name, callback) {
    var finalName = getAssetName(name);
    if (fabric.isLikelyNode) {
      var plainFileName = finalName.replace('file://', '');
      return fs.readFile(plainFileName, { encoding: 'utf8' }, callback);
    }
    else {
      fabric.util.request(finalName, {
        onComplete: function(xhr) {
          callback(null, xhr.responseText);
        }
      });
    }
  };

  function createCanvasForTest(opts) {
    var fabricClass = opts.fabricClass || 'StaticCanvas';
    var options = { enableRetinaScaling: false, renderOnAddRemove: false, width: 200, height: 200 };
    if (opts.width) {
      options.width = opts.width;
    }
    if (opts.height) {
      options.height = opts.height;
    }
    return new fabric[fabricClass](null, options);
  };

  function getAbsolutePath(path) {
    var isAbsolute = /^https?:/.test(path);
    if (isAbsolute) { return path; };
    var imgEl = fabric.document.createElement('img');
    imgEl.src = path;
    var src = imgEl.src;
    imgEl = null;
    return src;
  }

  function localPath(path, filename) {
    return 'file://' + require('path').join(__dirname, path, filename)
  }

  function getAssetName(filename) {
    var finalName = '/assets/' + filename + '.svg';
    return fabric.isLikelyNode ? localPath('/../visual', finalName) : getAbsolutePath('/test/visual' + finalName);
  }
  exports.getAssetName = getAssetName;

  function getGoldeName(filename) {
    var finalName = '/golden/' + filename;
    return fabric.isLikelyNode ? localPath('/../visual', finalName) : getAbsolutePath('/test/visual' + finalName);
  }

  function getFixtureName(filename) {
    var finalName = '/fixtures/' + filename;
    return fabric.isLikelyNode ? localPath('/..', finalName) : getAbsolutePath('/test' + finalName);
  }

  function generateGolden(filename, original) {
    if (fabric.isLikelyNode && original) {
      var plainFileName = filename.replace('file://', '');
      var dataUrl = original.toDataURL().split(',')[1];
      console.log('creating golden for ', filename);
      fs.writeFileSync(plainFileName, dataUrl, { encoding: 'base64' });
    }
    else if (original) {
      original.toBlob(blob => {
        const formData = new FormData();
        formData.append('file', blob, filename);
        const request = new XMLHttpRequest();
        request.open('POST', '/goldens', true);
        request.send(formData);
      }, 'image/png');
    }
  }

  function getImage(filename, original, callback) {
    if (fabric.isLikelyNode && original) {
      var plainFileName = filename.replace('file://', '');
      if (!fs.existsSync(plainFileName)) {
        generateGolden(filename, original);
      }
    }
    else if (original) {
      fetch(`/goldens/${filename}`, { method: 'GET' })
        .then(res => res.json())
        .then(res => {
          !res.exists && generateGolden(filename, original);
        });
    }
    var img = fabric.document.createElement('img');
    img.onload = function() {
      img.onload = null;
      callback(img, false);
    };
    img.onerror = function(err) {
      img.onerror = null;
      callback(img, true);
      console.log('Image loading errored', err);
    };
    img.src = filename;
  }

  function dumpFailedTest(testName, original, golden, difference) {
    if (fabric.isLikelyNode && original && difference && golden) {
      var largeCanvas = fabric.util.createCanvasElement();
      largeCanvas.width = original.width + golden.width + difference.width;
      largeCanvas.height = Math.max(original.height, golden.height, difference.height);
      var ctx = largeCanvas.getContext('2d');
      ctx.drawImage(original, 0, 0);
      ctx.putImageData(difference, original.width, 0);
      ctx.drawImage(golden, original.width + difference.width, 0);
      var dataUrl = largeCanvas.toDataURL().split(',')[1];
      console.log('dumping failed test', testName);
      const fileName = localPath('../../cli_output', `${testName.replaceAll(' ', '_')}.png`);

      fs.writeFileSync(fileName.replace('file://', ''), dataUrl, { encoding: 'base64' });
    }
    // else if (original) {
    //   original.toBlob(blob => {
    //     const formData = new FormData();
    //     formData.append('file', blob, filename);
    //     const request = new XMLHttpRequest();
    //     request.open('POST', '/goldens', true);
    //     request.send(formData);
    //   }, 'image/png');
    // }
  }

  exports.visualTestLoop = function(QUnit) {
    var _pixelMatch;
    var visualCallback;
    var imageDataToChalk;
    if (fabric.isLikelyNode) {
      _pixelMatch = global.pixelmatch;
      visualCallback = global.visualCallback;
      imageDataToChalk = global.imageDataToChalk;
    }
    else {
      if (window) {
        _pixelMatch = window.pixelmatch;
        visualCallback = window.visualCallback;
      }
      imageDataToChalk = function() { return ''; };
    }

    var pixelmatchOptions = {
      includeAA: false,
      threshold: 0.095
    };

    return function testCallback(testObj) {
      if (testObj.disabled) {
        return;
      }
      fabric.StaticCanvas.prototype.requestRenderAll = fabric.StaticCanvas.prototype.renderAll;
      var testName = testObj.test;
      var code = testObj.code;
      var percentage = testObj.percentage;
      var golden = testObj.golden;
      var newModule = testObj.newModule;
      if (newModule) {
        QUnit.module(newModule, {
          beforeEach: testObj.beforeEachHandler,
        });
      }
      QUnit.test(testName, function(assert) {
        var done = assert.async();
        var fabricCanvas = createCanvasForTest(testObj);
        code(fabricCanvas, function(renderedCanvas) {
          var width = renderedCanvas.width;
          var height = renderedCanvas.height;
          var totalPixels = width * height;
          var imageDataCanvas = renderedCanvas.getContext('2d').getImageData(0, 0, width, height);
          var canvas = fabric.document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext('2d');
          var output = ctx.getImageData(0, 0, width, height);
          getImage(getGoldeName(golden), renderedCanvas, function(goldenImage) {
            ctx.drawImage(goldenImage, 0, 0);
            visualCallback.addArguments({
              enabled: true,
              golden: canvas,
              fabric: imageDataCanvas,
              diff: output,
              goldenName: golden
            });
            var imageDataGolden = ctx.getImageData(0, 0, width, height).data;
            var differentPixels = _pixelMatch(imageDataCanvas.data, imageDataGolden, output.data, width, height, pixelmatchOptions);
            var percDiff = differentPixels / totalPixels * 100;
            var okDiff = totalPixels * percentage;
            var isOK = differentPixels <= okDiff;
            assert.ok(
              isOK,
              testName + ' [' + golden + '] has too many different pixels ' + differentPixels + '(' + okDiff + ') representing ' + percDiff + '% (>' + (percentage * 100) + '%)'
            );
            if (!isOK) {
              // var stringa = imageDataToChalk(output);
              // console.log(stringa);
              dumpFailedTest(testName, renderedCanvas, canvas, output);
            }
            if ((!isOK && QUnit.debugVisual) || QUnit.recreateVisualRefs) {
              generateGolden(getGoldeName(golden), renderedCanvas);
            }
            fabricCanvas.dispose();
            done();
          });
        });
      });
    }
  }
})(typeof window === 'undefined' ? exports : this);
