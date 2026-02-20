import './style.css'
import Experience from './Experience/Experience.js'
import Contact from './Experience/Utils/Contact.js'
import ContactVisual from './Experience/Utils/ContactVisual.js'
import GenevaViewer from './Experience/Utils/GenevaViewer.js'
import { gsap } from 'gsap'
import Translator from './Experience/Utils/Translator.js'
import { mainSources } from './Experience/sources.js'

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the 3D Experience on the canvas
    const canvas = document.querySelector('canvas.webgl')
    new Experience(canvas, undefined, mainSources)

    // Initialize Contact Form
    new Contact()

    // Initialize Contact Visual
    new ContactVisual()

    new GenevaViewer()

    // Initialize Translator
    new Translator()

    // Simple UI Entry Animation
    const tl = gsap.timeline({ delay: 0.5 })

    // Animate UI elements in
    gsap.set('nav', { opacity: 0, y: -20 })
    tl.to('nav', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
    tl.from('.hero-content', { opacity: 0, y: 20, duration: 1, ease: 'power3.out' }, '-=0.8')
})

/**
 * Title Typing Animation
 * Simulates a keyboard typing effect on the document title.
 */
const titleText = "Lucas Bovet - Creative Developer"
const typingSpeed = 150
const startDelay = 2000

let charIndex = 0

function typeTitle() {
    if (charIndex < titleText.length) {
        document.title = titleText.substring(0, charIndex + 1) + "|"
        charIndex++
        setTimeout(typeTitle, typingSpeed)
    } else {
        // Blink the cursor at the end
        let blinkCount = 0
        const blinkInterval = setInterval(() => {
            document.title = blinkCount % 2 === 0 ? titleText + "|" : titleText
            blinkCount++
            if (blinkCount > 5) {
                clearInterval(blinkInterval)
                document.title = titleText // Final state
            }
        }, 500)
    }
}

// Start typing after initial load
setTimeout(() => {
    document.title = ""
    setTimeout(typeTitle, 500)
}, startDelay)

// Back to Top functionality
const backToTopBtn = document.querySelector('.back-to-top')
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault()
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    })
}
