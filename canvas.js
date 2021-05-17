const canvas = document.getElementById('canvas');
const container = document.getElementById('container');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 3700;
const CANVAS_HEIGHT = 600;
const DEFAULT_RADIUS = 250;
const GAP = 50;
const RADIUS_LIMIT = 50;
const PEAK_GAP = 1.4;
const PEAK_OFFSET_SCALE = 20;
const PEAK_OFFSET_LIMIT = 10;
const COLORS = [
  'rgba(32,193,241,0.5)',
  'rgba(187,225,248,0.5)',
  'rgba(146,142,218,0.5)',
  'rgba(201,197,239,0.5)',
  'rgba(32,193,241,0.5)',
];

const LOCATIONS = [
  { x: 250, y: 220 },
  { x: 1000, y: 360 },
  { x: 1750, y: 250 },
  { x: 2520, y: 360 },
  { x: 3370, y: 220 },
];

const OFFSETS = LOCATIONS.map(({ x, y }, i) => {
  if (i === 0) return { x, y };

  return { x: LOCATIONS[i].x - LOCATIONS[i - 1].x, y: LOCATIONS[i].y - LOCATIONS[i - 1].y }
});

let mouse = {
  x: 0,
  y: 0,
}

let openedSections = 0;
let sectionHovered = false;
let scrollVector = 1;
let containerScrollPosition = CANVAS_WIDTH / 2 - window.innerWidth / 2;

const circle = (4 * (Math.sqrt(2) - 1) / 3);

const getDeadZones = (y, peaksOffesets) => {
  const deadZones = [];
  LOCATIONS.forEach(location => {
    const raduis = location.radius || DEFAULT_RADIUS;

    if (y > location.y - raduis / 1.6 && y < location.y + raduis / 1.6) {
      deadZones.push({
        start: { x: location.x - raduis, y },
        prepeak: { x: location.x - raduis / PEAK_GAP, y: y > location.y ? y - raduis / 50 : y + raduis / 50 },
        peak1: {
          x: location.x - raduis / 2 + (y > location.y ? peaksOffesets.topPeak1.x : peaksOffesets.bottomPeak1.x),
          y: y > location.y ? location.y + raduis / PEAK_GAP + peaksOffesets.topPeak1.y - GAP / 2 : location.y - raduis / PEAK_GAP - peaksOffesets.bottomPeak1.y + GAP / 2
        },
        peak2: {
          x: location.x + (y > location.y ? peaksOffesets.topPeak2.x : peaksOffesets.bottomPeak2.x),
          y: y > location.y ? location.y + raduis / 2 + GAP / 2 + peaksOffesets.topPeak2.y : location.y - raduis / 2 - GAP / 2 - peaksOffesets.bottomPeak2.y
        },
        peak3: {
          x: location.x + raduis / 2 + (y > location.y ? peaksOffesets.topPeak3.x : peaksOffesets.bottomPeak3.x),
          y: y > location.y ? location.y + raduis / PEAK_GAP + peaksOffesets.topPeak3.y - GAP / 2 : location.y - raduis / PEAK_GAP - peaksOffesets.bottomPeak3.y + GAP / 2
        },
        postpeak: { x: location.x + raduis / PEAK_GAP, y: y > location.y ? y - raduis / 50 : y + raduis / 50 },
        finish: { x: location.x + raduis, y },
      });
    }
  });

  return deadZones;
}

const getRandomOffset = (scale = 1, positive = false) => Math.random() * PEAK_OFFSET_SCALE * scale * (positive ? 1 : getRandomVector());
const getRandomVector = () => Math.random() > 0.5 ? 1 : -1;
const getRandomLimit = (scale = 1) => Math.floor(Math.random() * (PEAK_OFFSET_LIMIT * scale + 3));

class Line {
  constructor(y) {
    this.y = y;
    this.color = '#FFFFFF';
    this.peaksOffesets = {
      topPeak1: { x: getRandomOffset(2), y: getRandomOffset(1, true) },
      topPeak2: { x: getRandomOffset(2), y: getRandomOffset(1, true) },
      topPeak3: { x: getRandomOffset(2), y: getRandomOffset(1, true) },
      bottomPeak1: { x: getRandomOffset(2), y: getRandomOffset(1, true) },
      bottomPeak2: { x: getRandomOffset(2), y: getRandomOffset(1, true) },
      bottomPeak3: { x: getRandomOffset(2), y: getRandomOffset(1, true) },
    };
    this.offsetsDeltasX = {
      topPeak1: 0,
      topPeak2: 0,
      topPeak3: 0,
      bottomPeak1: 0,
      bottomPeak2: 0,
      bottomPeak3: 0,
    };
    this.offsetsDeltasY = {
      topPeak1: 0,
      topPeak2: 0,
      topPeak3: 0,
      bottomPeak1: 0,
      bottomPeak2: 0,
      bottomPeak3: 0,
    };
    this.offsetsVectorsX = {
      topPeak1: getRandomVector(),
      topPeak2: getRandomVector(),
      topPeak3: getRandomVector(),
      bottomPeak1: getRandomVector(),
      bottomPeak2: getRandomVector(),
      bottomPeak3: getRandomVector(),
    };
    this.offsetsVectorsY = {
      topPeak1: getRandomVector(),
      topPeak2: getRandomVector(),
      topPeak3: getRandomVector(),
      bottomPeak1: getRandomVector(),
      bottomPeak2: getRandomVector(),
      bottomPeak3: getRandomVector(),
    };
    this.offsetsLimitsX = {
      topPeak1: getRandomLimit(5),
      topPeak2: getRandomLimit(5),
      topPeak3: getRandomLimit(5),
      bottomPeak1: getRandomLimit(5),
      bottomPeak2: getRandomLimit(5),
      bottomPeak3: getRandomLimit(5),
    };
    this.offsetsLimitsY = {
      topPeak1: getRandomLimit(),
      topPeak2: getRandomLimit(),
      topPeak3: getRandomLimit(),
      bottomPeak1: getRandomLimit(),
      bottomPeak2: getRandomLimit(),
      bottomPeak3: getRandomLimit(),
    };
    this.counter = 0;
  }

  draw = () => {
    ctx.beginPath();
    ctx.moveTo(0, this.y);

    const deadZones = getDeadZones(this.y, this.peaksOffesets);

    if (deadZones.length > 0) {
      ctx.lineTo(deadZones[0].start.x, deadZones[0].start.y);
      deadZones.forEach(deadZone => {
        ctx.lineTo(deadZone.start.x, deadZone.start.y);
        ctx.bezierCurveTo(deadZone.prepeak.x, deadZone.prepeak.y, deadZone.peak1.x, deadZone.peak1.y, deadZone.peak2.x, deadZone.peak2.y);
        ctx.bezierCurveTo(deadZone.peak3.x, deadZone.peak3.y, deadZone.postpeak.x, deadZone.postpeak.y, deadZone.finish.x, deadZone.finish.y);
      });
    }
    ctx.lineTo(CANVAS_WIDTH, this.y);

    ctx.strokeStyle = this.color;
    ctx.stroke();
  }

  update = () => {
    this.counter++;

    if (this.counter == 5) {
      Object.keys(this.peaksOffesets).forEach(key => {
        if (Math.abs(this.offsetsDeltasX[key]) < this.offsetsLimitsX[key]) {
          this.offsetsDeltasX[key] += this.offsetsVectorsX[key];
        } else {
          this.offsetsVectorsX[key] *= -1;
          this.offsetsDeltasX[key] = 0;
        }

        if (Math.abs(this.offsetsDeltasY[key]) < this.offsetsLimitsY[key]) {
          this.offsetsDeltasY[key] += this.offsetsVectorsY[key];
        } else {
          this.offsetsVectorsY[key] *= -1;
          this.offsetsDeltasY[key] = 0;
        }

        this.counter = 0;
        this.peaksOffesets[key].x += this.offsetsVectorsX[key];
        this.peaksOffesets[key].y += this.offsetsVectorsY[key];
      })
    }

    this.draw();
  }
}

class Bubble {
  constructor(x, y, color, radius, chaos, step) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = radius;
    this.count = Math.PI;
    this.chaos = chaos;
    this.step = step;
  }

  draw = (radiusDelta = 0, hovered = false) => {
    let offsetX = 10 * Math.sin(this.count);
    let offsetY = 5 * Math.cos(this.count * 2);
    this.r = (this.radius + radiusDelta) / 2;

    this.count = hovered ? this.count + 0.02 : this.count + 0.01;

    ctx.beginPath();

    this.c = circle + (0.2 * Math.sin(this.count * (this.chaos + this.step)));
    ctx.moveTo(offsetX + 0, offsetY + -this.r);

    const tr1 = { x: offsetX + this.c * this.r, y: offsetY + -this.r };
    const tr2 = { x: offsetX + this.r, y: offsetY + -this.c * this.r };

    ctx.bezierCurveTo(
      tr1.x, tr1.y,
      tr2.x, tr2.y,
      offsetX + this.r, offsetY + 0
    );

    this.c = circle + (0.2 * Math.cos(this.count * (this.chaos + this.step)));
    ctx.bezierCurveTo(
      offsetX + this.r, offsetY + this.c * this.r,
      offsetX + this.c * this.r, offsetY + this.r,
      offsetX + 0, offsetY + this.r
    );

    this.c = circle + (0.2 * Math.sin(this.count * 2 * (this.chaos + this.step)));
    ctx.bezierCurveTo(
      offsetX + -this.c * this.r, offsetY + this.r,
      offsetX + -this.r, offsetY + this.c * this.r,
      offsetX + -this.r, offsetY + 0
    );

    this.c = circle + (0.2 * Math.cos(this.count + 1 * (this.chaos + this.step)));
    ctx.bezierCurveTo(
      offsetX + -this.r, offsetY + -this.c * this.r,
      offsetX + -this.c * this.r, offsetY + -this.r,
      offsetX + 0, offsetY + -this.r
    );

    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class BubbleSet {
  constructor(offset, location, color, radius, index) {
    this.x = offset.x;
    this.y = offset.y;
    this.location = location;
    this.color = color;
    this.radius = radius;
    this.step = Math.round(Math.random() * 100) / 100;
    this.radiusDelta = 0;
    this.radiusVector = 1;
    this.hovered = false;
    this.index = index;

    this.outer = new Bubble(this.x - this.radius / 2, this.y - this.radius / 2, this.color, this.radius + GAP, 0.9, this.step);
    this.middle = new Bubble(this.x - this.radius / 2, this.y - this.radius / 2, this.color, this.radius, 1, this.step);
    this.inner = new Bubble(this.x - this.radius / 2, this.y - this.radius / 2, this.color, this.radius - GAP, 1.1, this.step);
  }

  update = () => {
    if (mouse.x >= this.location.x - this.radius * 0.75
      && mouse.x <= this.location.x + this.radius * 0.75
      && mouse.y >= this.location.y - this.radius * 0.75
      && mouse.y <= this.location.y + this.radius * 0.75
    ) {
      this.hovered = true;
      sectionHovered = true;
      if (this.radiusDelta < RADIUS_LIMIT) {
        this.radiusDelta += this.radiusVector;
      }
    } else {
      this.hovered = false;
      if (this.radiusDelta > 0) {
        this.radiusDelta -= this.radiusVector;
      }
    }
    LOCATIONS[this.index].radius = this.radius + this.radiusDelta;

    ctx.translate(this.x, this.y);
    this.outer.draw(this.radiusDelta, this.hovered);
    this.middle.draw(this.radiusDelta, this.hovered);
    this.inner.draw(this.radiusDelta, this.hovered);
  }
}

window.addEventListener('mousemove', ({ clientX, clientY }) => {
  const rect = canvas.getBoundingClientRect();
  sectionHovered = false;

  mouse = { x: clientX - rect.left, y: clientY - rect.top };
});

container.addEventListener('scroll', () => {
  if (container.scrollLeft > containerScrollPosition) {
    scrollVector = 1;
  } else {
    scrollVector = -1;
  }
  containerScrollPosition = container.scrollLeft;
});

const lines = [];
for (let i = 0; i * 20 < CANVAS_HEIGHT; i++) {
  lines.push(new Line(i * 20));
}

const bubbles = OFFSETS.map((offset, i) => new BubbleSet(offset, LOCATIONS[i], COLORS[i], DEFAULT_RADIUS, i));

const animate = () => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  lines.forEach(line => line.update());
  bubbles.forEach(bubble => bubble.update());

  if (openedSections === 0 && !sectionHovered) {
    if (container.scrollLeft + window.innerWidth === CANVAS_WIDTH) {
      scrollVector = -1;
    }
    if (container.scrollLeft === 0) {
      scrollVector = 1;
    }
    container.scrollBy({ left: scrollVector });
  }

  requestAnimationFrame(animate);
};

animate();
