import './styles/style.css'
import Experience from './Experience/Experience.js'
import Contact from './Experience/Utils/Contact.js'
import ContactVisual from './Experience/Utils/ContactVisual.js'
import GenevaViewer from './Experience/Utils/GenevaViewer.js'
import { gsap } from 'gsap'
import Translator from './Experience/Utils/Translator.js'
import { mainSources } from './Experience/sources.js'

import ProjectLoader from './Experience/Utils/ProjectLoader.js'
import UpdateLog from './Experience/Utils/UpdateLog.js'

document.addEventListener('DOMContentLoaded', () => {
    // 1. Critical stuff: UI Animations, Translator, Project Loader
    new Translator()
    new ProjectLoader()
    new Contact()
    new UpdateLog()

    const tl = gsap.timeline({ delay: 0.2 })
    gsap.set('nav', { opacity: 0, y: -20 })
    tl.to('nav', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
    tl.from('.hero-content', { opacity: 0, y: 20, duration: 1, ease: 'power3.out' }, '-=0.8')

    // 2. Main Experience (Delayed or Idle)
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => initExperience())
    } else {
        setTimeout(initExperience, 500)
    }

    // 3. Section-based components (Intersection Observer)
    setupLazyComponents()
})

function initExperience() {
    const canvas = document.querySelector('canvas.webgl')
    if (canvas) {
        new Experience(canvas, undefined, mainSources)
    }
}

function setupLazyComponents() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'geneva-container') {
                    new GenevaViewer()
                } else if (entry.target.id === 'contact-visual') {
                    new ContactVisual()
                } else if (entry.target.classList.contains('skill-item')) {
                    const progress = entry.target.querySelector('.skill-progress')
                    const level = progress.getAttribute('data-level')
                    progress.style.width = level
                }

                if (entry.target.classList.contains('skill-item')) {
                    observer.unobserve(entry.target)
                } else if (entry.target.id === 'geneva-container' || entry.target.id === 'contact-visual') {
                    observer.unobserve(entry.target)
                }
            }
        })
    }, { rootMargin: '0px 0px -50px 0px' })

    const geneva = document.getElementById('geneva-container')
    const contact = document.getElementById('contact-visual')
    const skillItems = document.querySelectorAll('.skill-item')

    if (geneva) observer.observe(geneva)
    if (contact) observer.observe(contact)
    skillItems.forEach(item => observer.observe(item))
}

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
