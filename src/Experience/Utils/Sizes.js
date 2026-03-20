import Performance from './Performance.js'
import EventEmitter from './EventEmitter.js'

export default class Sizes extends EventEmitter {
    constructor() {
        super()

        // Setup
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.pixelRatio = Performance.getSuggestedPixelRatio()

        // Resize event
        window.addEventListener('resize', () => {
            this.width = window.innerWidth
            this.height = window.innerHeight
            this.pixelRatio = Performance.getSuggestedPixelRatio()

            this.trigger('resize')
        })

        // Mouse event
        this.mouse = { x: 0, y: 0 }
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX / this.width * 2 - 1
            this.mouse.y = -(event.clientY / this.height) * 2 + 1

            this.trigger('mousemove')
        })

        // Scroll event
        this.scroll = window.scrollY
        window.addEventListener('scroll', () => {
            this.scroll = window.scrollY
            this.trigger('scroll')
        })

        // On reload, browsers often restore scroll position
        window.addEventListener('DOMContentLoaded', () => {
            this.scroll = window.scrollY
            this.trigger('scroll')
        })
    }
}
