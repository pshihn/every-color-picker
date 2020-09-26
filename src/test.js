// citation
// -----------------------
// https://forum.processing.org/two/discussion/10104/drawing-x-number-of-lines-from-the-centre-of-a-circle-out-to-the-circumference
// http://stackoverflow.com/questions/9705123/how-can-i-get-sin-cos-and-tan-to-use-degrees-instead-of-radians
// http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
// http://stackoverflow.com/questions/21771939/html5-canvas-overlay-transparent-gradients
// https://gist.github.com/conorbuck/2606166
// http://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle

rgbToHsl = (r, g, b) => {
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

class ColorWheel {
  constructor(size, parent) {
    // canvas setup
    this.width = size;
    this.height = size;
    this.radLarge = (size / 2) - 5;
    this.radSmall = this.radLarge - 40;
    this.parent = document.querySelector(parent);
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    // event variables
    this.active = false;
    this.color = null;
    this.pos = null;
    // segment construction
    this.points = 40;
    this.angle = 360 / this.points;
    this.arc = Math.PI * 2 / this.points;
    // create
    this.init();
  }
  init() {
    // outer canvas
    this.outer = document.createElement('canvas');
    this.outer.width = this.width;
    this.outer.height = this.height;
    this.ctxA = this.outer.getContext('2d');
    // inner canvas
    this.inner = document.createElement('canvas');
    this.inner.width = this.width;
    this.inner.height = this.height;
    this.ctxB = this.inner.getContext('2d');
    this.ctxB.globalCompositeOperation = 'hard-light';
    // dot canvas
    this.dot = document.createElement('canvas');
    this.dot.width = this.width;
    this.dot.height = this.height;
    this.ctxC = this.dot.getContext('2d');
    // build
    this.parent.appendChild(this.outer);
    this.parent.appendChild(this.inner);
    this.parent.appendChild(this.dot);
    // add spectrum
    this.spectrum();
    // add events
    this.setEvents();
  }
  circle(ctx, x, y, r, style, start, end) {
    ctx.beginPath();
    ctx.arc(x, y, r, start || 0, end || Math.PI * 2);
    if (style.fill) {
      ctx.fillStyle = style.fill;
      ctx.fill();
    }
    if (style.stroke) {
      ctx.strokeStyle = style.stroke;
      ctx.stroke();
    }
    if (style.lineWidth) {
      ctx.lineWidth = style.lineWidth;
    }
  }
  triangle(ctx, points, fill) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = points.length - 2; i >= 0; i--) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.fillStyle = fill;
    ctx.fill();
  }
  spectrum() {
    for (let i = 1; i <= this.points; i++) {
      // arc points
      let a = i * this.angle;
      let b = (i - 1) * this.angle;
      // gradient vector
      let radius = this.radSmall + (this.radLarge - this.radSmall) / 2;
      let x1 = Math.cos(this.toRadians(a)) * radius + this.cx;
      let y1 = Math.sin(this.toRadians(a)) * radius + this.cy;
      let x2 = Math.cos(this.toRadians(b)) * radius + this.cx;
      let y2 = Math.sin(this.toRadians(b)) * radius + this.cy;
      // gradient
      let g = this.ctxA.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, 'hsl( ' + a + ', 100%, 50%)');
      g.addColorStop(1, 'hsl( ' + b + ', 100%, 50%)');
      // draw arc
      let o = 0.001;
      this.ctxA.beginPath();
      this.ctxA.arc(this.cx, this.cy, this.radLarge, this.toRadians(b) - o, this.toRadians(a) + o, false);
      this.ctxA.arc(this.cx, this.cy, this.radSmall, this.toRadians(a) + o, this.toRadians(b) - o, true);
      this.ctxA.fillStyle = g;
      this.ctxA.fill();
    }
  }
  toRadians(angle) {
    // convert angle to radians
    return angle * (Math.PI / 180);
  }
  inCircle(x0, y0, x1, y1, r) {
    // center of circle (x0,y0), mouse coordinates (x1,y1), radius (r)
    return Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) < r;
  }
  inTriangle(p, p0, p1, p2) {
    // point in circle (p), triangle points (p0, p1, p2)
    var A = 1 / 2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    var sign = A < 0 ? -1 : 1;
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;
    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
  }
  update(e, cw) {
    // get mouse pos
    let x = e.clientX - cw.inner.offsetLeft;
    let y = e.clientY - cw.inner.offsetTop;
    this.pos = { x: x, y: y };
    // check mouse is within bounds
    let outer = cw.inCircle(cw.cx, cw.cy, x, y, cw.radLarge),
      inner = cw.inCircle(cw.cx, cw.cy, x, y, cw.radSmall),
      tri;
    // check mouse in triangle
    if (this.tri) {
      tri = this.inTriangle(this.pos, this.tri[0], this.tri[1], this.tri[2]);
    }
    // draw
    if (outer && !inner) {
      cw.draw(x, y, false);
    } else if (tri) {
      cw.draw(x, y, true)
    }
  }
  draw(x, y, tri) {
    // get pixel data
    let da = this.ctxA.getImageData(x, y, 1, 1).data;
    let db = this.ctxB.getImageData(x, y, 1, 1).data;
    // draw equilateral triangle
    if (!tri) {
      // clear triangle canvas
      this.ctxB.clearRect(0, 0, this.inner.width, this.inner.height);
      this.ang = Math.atan2(y - this.cy, x - this.cx) * (180 / Math.PI);
      this.color = 'rgb(' + da[0] + ',' + da[1] + ',' + da[2] + ')';
      let angs = [0, 120, 240, 180];
      let pts = this.tri = [];
      for (let i = 0; i < angs.length; i++) {
        pts.push({
          x: Math.cos(this.toRadians(this.ang + angs[i])) * this.radSmall + this.cx,
          y: Math.sin(this.toRadians(this.ang + angs[i])) * this.radSmall + this.cy
        })
      }
      console.log(pts);
      // gradient 1 = black => white
      let g1 = this.ctxB.createLinearGradient(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      let hsl = rgbToHsl(da[0], da[1], da[2]);
      g1.addColorStop(0, 'hsl(' + hsl[0] * 360 + ',0%,100%)');
      g1.addColorStop(1, 'hsl(' + hsl[0] * 360 + ',0%,0%)');
      // gradient 2 = hue => transparent
      let g2 = this.ctxB.createLinearGradient(pts[0].x, pts[0].y, pts[3].x, pts[3].y);
      g2.addColorStop(0, this.color);
      g2.addColorStop(1, 'rgba(' + da[0] + ',' + da[1] + ',' + da[2] + ', 0)');
      // draw
      // **************************
      this.triangle(this.ctxB, pts, g2);
      this.triangle(this.ctxB, pts, g1);
      // *******************************
    }
    // clear dot canvas
    this.ctxC.clearRect(0, 0, this.dot.width, this.dot.height);
    let choice = tri ? db : da;
    this.dotCol = 'rgba(' + choice[0] + ',' + choice[1] + ',' + choice[2] + ',' + choice[3] + ')';
    let s = { stroke: '#fff', lineWidth: 2, fill: this.dotCol };
    this.circle(this.ctxC, x, y, 10, s);

    // TESTING - update view background
    this.parent.style.background = this.dotCol;
  }
  setEvents() {
    let self = this;
    this.dot.addEventListener('mousedown', e => {
      self.active = true;
      if (self.active) self.update(e, self);
    }, false);
    this.dot.addEventListener('mouseup', e => {
      self.active = false;
    }, false);
    this.dot.addEventListener('mousemove', e => {
      if (self.active) self.update(e, self);
    }, false);
    this.draw(230, 30, false);
  }
}

let colorWheel = new ColorWheel(350, '.view');