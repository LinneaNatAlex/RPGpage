// Magical Cursor Trail Effect
class MagicalCursor {
  constructor() {
    this.cursor = null;
    this.trails = [];
    this.sparkles = [];
    this.isEnabled = false;
    this.lastX = 0;
    this.lastY = 0;
    this.trailDelay = 0;
    
    this.init();
  }

  init() {
    // Create cursor element
    this.cursor = document.createElement('div');
    this.cursor.className = 'magical-cursor';
    document.body.appendChild(this.cursor);

    // Add event listeners
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Clean up old trails periodically
    setInterval(this.cleanupTrails.bind(this), 100);
  }

  handleMouseMove(e) {
    if (!this.isEnabled) return;

    const x = e.clientX;
    const y = e.clientY;

    // Update cursor position
    this.cursor.style.left = x - 12 + 'px';
    this.cursor.style.top = y - 12 + 'px';

    // Create trail particles
    this.trailDelay++;
    if (this.trailDelay % 3 === 0) { // Create trail every 3rd movement
      this.createTrail(x, y);
    }

    // Create sparkles occasionally
    if (Math.random() < 0.1) {
      this.createSparkle(x, y);
    }

    this.lastX = x;
    this.lastY = y;
  }

  handleMouseDown(e) {
    if (!this.isEnabled) return;
    
    // Create burst of sparkles on click
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.createSparkle(e.clientX, e.clientY);
      }, i * 50);
    }
  }

  handleMouseUp(e) {
    if (!this.isEnabled) return;
    
    // Create small trail burst
    for (let i = 0; i < 5; i++) {
      this.createTrail(e.clientX + (Math.random() - 0.5) * 20, e.clientY + (Math.random() - 0.5) * 20);
    }
  }

  createTrail(x, y) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.left = x - 5 + 'px';
    trail.style.top = y - 5 + 'px';
    
    // Add some randomness to trail position
    trail.style.left = (x - 5 + (Math.random() - 0.5) * 12) + 'px';
    trail.style.top = (y - 5 + (Math.random() - 0.5) * 12) + 'px';
    
    document.body.appendChild(trail);
    this.trails.push(trail);

    // Remove trail after animation
    setTimeout(() => {
      if (trail.parentNode) {
        trail.parentNode.removeChild(trail);
      }
      this.trails = this.trails.filter(t => t !== trail);
    }, 800);
  }

  createSparkle(x, y) {
    const sparkle = document.createElement('div');
    sparkle.className = 'cursor-sparkle';
    sparkle.style.left = x - 3 + 'px';
    sparkle.style.top = y - 3 + 'px';
    
    // Add random offset for sparkle
    sparkle.style.left = (x - 3 + (Math.random() - 0.5) * 18) + 'px';
    sparkle.style.top = (y - 3 + (Math.random() - 0.5) * 18) + 'px';
    
    document.body.appendChild(sparkle);
    this.sparkles.push(sparkle);

    // Remove sparkle after animation
    setTimeout(() => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
      this.sparkles = this.sparkles.filter(s => s !== sparkle);
    }, 1200);
  }

  cleanupTrails() {
    // Remove any orphaned trail elements
    this.trails = this.trails.filter(trail => {
      if (!trail.parentNode) {
        return false;
      }
      return true;
    });

    this.sparkles = this.sparkles.filter(sparkle => {
      if (!sparkle.parentNode) {
        return false;
      }
      return true;
    });
  }

  enable() {
    this.isEnabled = true;
    document.body.classList.add('magical-cursor-enabled');
    this.cursor.style.display = 'block';
  }

  disable() {
    this.isEnabled = false;
    document.body.classList.remove('magical-cursor-enabled');
    this.cursor.style.display = 'none';
    
    // Clean up all trails and sparkles
    this.trails.forEach(trail => {
      if (trail.parentNode) {
        trail.parentNode.removeChild(trail);
      }
    });
    this.sparkles.forEach(sparkle => {
      if (sparkle.parentNode) {
        sparkle.parentNode.removeChild(sparkle);
      }
    });
    this.trails = [];
    this.sparkles = [];
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }
}

// Initialize magical cursor
let magicalCursor = null;

export function initMagicalCursor() {
  if (!magicalCursor) {
    magicalCursor = new MagicalCursor();
  }
  return magicalCursor;
}

export function enableMagicalCursor() {
  if (!magicalCursor) {
    magicalCursor = new MagicalCursor();
  }
  magicalCursor.enable();
}

export function disableMagicalCursor() {
  if (magicalCursor) {
    magicalCursor.disable();
  }
}

export function toggleMagicalCursor() {
  if (!magicalCursor) {
    magicalCursor = new MagicalCursor();
  }
  magicalCursor.toggle();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMagicalCursor);
} else {
  initMagicalCursor();
}
