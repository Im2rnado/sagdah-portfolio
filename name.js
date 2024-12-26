const svg = document.querySelector('.js-svg')
const wrapper = document.querySelector('.js-wrapper')
const cursor = document.querySelector('.js-cursor')
const mouse = {
  x: 0,
  y: 0,
  smoothX: 0,
  smoothY: 0,
  diff: 0
}
const head = {
  x: 0,
  y: 0
}
const viewport = {
  width: window.innerWidth,
  height: window.innerHeight
}
const particles = []

// Mouse move
function onMouseMove (e) {
  mouse.x = e.pageX
  mouse.y = e.pageY
}
window.addEventListener('mousemove', onMouseMove)

// Resize
function onResize () {
  viewport.width = window.innerWidth
  viewport.height = window.innerHeight
  
  svg.style.width = viewport.width + 'px'
  svg.style.height = viewport.height + 'px'
}
window.addEventListener('resize', onResize)
onResize()

// Emitter
function emitParticle () {
  let x = 0
  let y = 0
  let size = 0
  
  if (mouse.diff > 0.01) {
    x = mouse.smoothX
    y = mouse.smoothY
    size = mouse.diff
  } else {
    x = head.x
    y = head.y
    size = Math.random() * 100
  }

  const particle = new Particle(x, y, size)

  particles.push(particle)
  wrapper.prepend(particle.el)
}

// Render
function render (time) {
  // Smooth mouse
  mouse.smoothX += (mouse.x - mouse.smoothX) * 0.1
  mouse.smoothY += (mouse.y - mouse.smoothY) * 0.1
  
  mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY)
  
  emitParticle()
  
  // Cursor
  cursor.style.setProperty('--x', mouse.smoothX + 'px')
  cursor.style.setProperty('--y', mouse.smoothY + 'px')
  
  // Move head
  head.x = viewport.width * 0.5 + viewport.width * 0.375 * Math.cos(time * 0.0006)
  head.y = viewport.height * 0.5 + viewport.width * 0.05 * Math.cos(time * 0.0011)
  
  // raf
  requestAnimationFrame(render)
}

window.addEventListener('load', render)

/**
 * Particle
 */
class Particle {
  // Constructor
  constructor (x, y, size) {
    this.r = 20
    this.size = Math.sqrt(size) * 4 * (0.5 + Math.random() * 0.5) * (viewport.width / 1920)
    this.x = x
    this.y = y
    this.vy = 0
    this.seed = Math.random() * 1000
    this.freq = (0.5 + Math.random() * 1) * 0.01
    this.amplitude = (1 - Math.random() * 2) * 0.5

    this.color = "hsl(" + Math.random() * 360 + ", 100%, 50%)";

    this.el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    this.el.setAttribute('cx', this.x)
    this.el.setAttribute('cy', this.y)
    this.el.setAttribute('r', this.r)
    this.el.setAttribute('fill', this.color)

    this.init()
  }
  
  // Init
  
  init () {
    const self = this

    const tl = gsap.timeline({
      onUpdate: () => {
        self.x += Math.cos((gsap.ticker.frame + self.seed) * self.freq) * self.amplitude
        self.y += Math.sin((gsap.ticker.frame + self.seed) * self.freq) * self.amplitude + self.vy
        self.vy += 0.2
        self.el.setAttribute('cy', self.y)
        self.el.setAttribute('cx', self.x)
        self.el.setAttribute('r', self.r)
      }
    })

    tl.to(
      this,
      {
        r: this.size,
        duration: 0.25,
        ease: 'power1.inOut'
      }
    )

    tl.to(
      this,
      {
        duration: 1,
        r: 0,
        ease: 'power3.in'
      }
    )

    tl.call(this.kill.bind(this))
  }
  
  // Kill
  kill () {
    const self = this

    particles.forEach((particle, index) => {
      if (particle === self) {
        particles.splice(index, 1)
      }
    })
 
    self.el.remove()
  }
}
