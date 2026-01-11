// OpenCV Web Worker
// 在后台线程加载和运行 OpenCV，避免阻塞主线程

let cvReady = false;

self.onmessage = async function(e) {
  const { type, id, data } = e.data;
  console.log('[Worker] Received message:', type, id);

  if (type === 'init') {
    try {
      console.log('[Worker] Loading OpenCV...');
      importScripts('/wasm/opencv.js');
      
      // 等待 OpenCV 初始化
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('OpenCV init timeout'));
        }, 60000);

        // 检查 cv 是否已经可用
        const checkReady = setInterval(() => {
          if (typeof cv !== 'undefined' && cv.Mat) {
            clearInterval(checkReady);
            clearTimeout(timeout);
            resolve();
          }
        }, 100);
      });
      
      cvReady = true;
      console.log('[Worker] OpenCV ready!');
      self.postMessage({ type: 'init', id, success: true });
    } catch (err) {
      console.error('[Worker] OpenCV init error:', err);
      self.postMessage({ type: 'init', id, success: false, error: err.message });
    }
    return;
  }
  
  if (type === 'deskew') {
    if (!cvReady) {
      self.postMessage({ type: 'deskew', id, success: false, error: 'OpenCV not ready' });
      return;
    }
    
    try {
      console.log('[Worker] Processing deskew...');
      const { imageData, width, height, options } = data;
      
      // 确保数据是 Uint8ClampedArray
      let pixelData;
      if (imageData instanceof Uint8ClampedArray) {
        pixelData = imageData;
      } else if (imageData.buffer) {
        pixelData = new Uint8ClampedArray(imageData.buffer || imageData);
      } else if (Array.isArray(imageData) || imageData.length) {
        pixelData = new Uint8ClampedArray(imageData);
      } else {
        throw new Error('Invalid imageData format');
      }
      
      console.log('[Worker] Image size:', width, 'x', height, 'data length:', pixelData.length);
      
      // 创建 ImageData 对象
      const imgData = new ImageData(pixelData, width, height);
      const result = processDeskew(imgData, options);
      
      console.log('[Worker] Deskew done, size:', result.width, 'x', result.height);
      
      // 转换为普通数组以便传输
      self.postMessage({ 
        type: 'deskew', 
        id, 
        success: true, 
        result: {
          data: Array.from(result.data),
          width: result.width,
          height: result.height
        }
      });
    } catch (err) {
      console.error('[Worker] Deskew error:', err);
      self.postMessage({ type: 'deskew', id, success: false, error: err.message });
    }
    return;
  }
};

function processDeskew(imageData, options) {
  const { autoDetect, cropWhiteBorder, rotateAngle } = options;
  
  // 创建 Mat
  let src = cv.matFromImageData(imageData);
  let result = src.clone();

  try {
    // 1. 自动检测并矫正倾斜
    if (autoDetect) {
      const corrected = autoCorrectSkew(src);
      if (corrected) {
        result.delete();
        result = corrected;
      }
    }

    // 2. 手动旋转
    if (rotateAngle && rotateAngle !== 0) {
      const rotated = rotateImage(result, rotateAngle);
      result.delete();
      result = rotated;
    }

    // 3. 裁切白边
    if (cropWhiteBorder) {
      const cropped = cropBorder(result);
      if (cropped) {
        result.delete();
        result = cropped;
      }
    }

    // 确保是 RGBA 格式
    let rgba = new cv.Mat();
    if (result.channels() === 1) {
      cv.cvtColor(result, rgba, cv.COLOR_GRAY2RGBA);
    } else if (result.channels() === 3) {
      cv.cvtColor(result, rgba, cv.COLOR_RGB2RGBA);
    } else {
      rgba = result.clone();
    }
    
    // 转换为输出格式
    const output = {
      data: new Uint8ClampedArray(rgba.data),
      width: rgba.cols,
      height: rgba.rows
    };
    
    rgba.delete();
    src.delete();
    result.delete();
    
    return output;
    
  } catch (err) {
    src.delete();
    if (result && !result.isDeleted()) result.delete();
    throw err;
  }
}

function autoCorrectSkew(src) {
  let gray = new cv.Mat();
  let edges = new cv.Mat();
  let lines = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Canny(gray, edges, 50, 150, 3);
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 100, 100, 10);

    if (lines.rows === 0) {
      return null;
    }

    const angles = [];
    for (let i = 0; i < lines.rows; i++) {
      const x1 = lines.data32S[i * 4];
      const y1 = lines.data32S[i * 4 + 1];
      const x2 = lines.data32S[i * 4 + 2];
      const y2 = lines.data32S[i * 4 + 3];
      
      const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      if (Math.abs(angle) < 45) {
        angles.push(angle);
      } else if (Math.abs(angle) > 45 && Math.abs(angle) < 135) {
        angles.push(angle - 90 * Math.sign(angle));
      }
    }

    if (angles.length === 0) {
      return null;
    }

    angles.sort((a, b) => a - b);
    const medianAngle = angles[Math.floor(angles.length / 2)];

    if (Math.abs(medianAngle) < 0.5) {
      return null;
    }

    return rotateImage(src, -medianAngle);
  } finally {
    gray.delete();
    edges.delete();
    lines.delete();
  }
}

function rotateImage(src, angle) {
  const center = new cv.Point(src.cols / 2, src.rows / 2);
  const M = cv.getRotationMatrix2D(center, angle, 1);
  
  const cos = Math.abs(Math.cos(angle * Math.PI / 180));
  const sin = Math.abs(Math.sin(angle * Math.PI / 180));
  const newWidth = Math.floor(src.rows * sin + src.cols * cos);
  const newHeight = Math.floor(src.rows * cos + src.cols * sin);
  
  M.doublePtr(0, 2)[0] += (newWidth - src.cols) / 2;
  M.doublePtr(1, 2)[0] += (newHeight - src.rows) / 2;

  const dst = new cv.Mat();
  cv.warpAffine(src, dst, M, new cv.Size(newWidth, newHeight), 
    cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));
  
  M.delete();
  return dst;
}

function cropBorder(src) {
  let gray = new cv.Mat();
  let thresh = new cv.Mat();
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, thresh, 250, 255, cv.THRESH_BINARY_INV);
    
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
    cv.morphologyEx(thresh, thresh, cv.MORPH_CLOSE, kernel);
    kernel.delete();

    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    if (contours.size() === 0) {
      return null;
    }

    let maxArea = 0;
    let maxRect = null;
    
    for (let i = 0; i < contours.size(); i++) {
      const rect = cv.boundingRect(contours.get(i));
      const area = rect.width * rect.height;
      if (area > maxArea) {
        maxArea = area;
        maxRect = rect;
      }
    }

    if (!maxRect || maxArea < src.rows * src.cols * 0.1) {
      return null;
    }

    const padding = 10;
    const x = Math.max(0, maxRect.x - padding);
    const y = Math.max(0, maxRect.y - padding);
    const w = Math.min(src.cols - x, maxRect.width + padding * 2);
    const h = Math.min(src.rows - y, maxRect.height + padding * 2);

    const roi = new cv.Rect(x, y, w, h);
    return src.roi(roi).clone();
  } finally {
    gray.delete();
    thresh.delete();
    hierarchy.delete();
    contours.delete();
  }
}

console.log('[Worker] OpenCV Worker loaded');
