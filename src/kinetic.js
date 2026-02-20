
import './style.css'
import Experience from './Experience/Experience.js'
import KineticType from './Experience/Kinematics/KineticType.js'

// Check for preview mode
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('preview') === 'true') {
    document.body.classList.add('is-preview')
}

// Override Main World with KineticType
const canvas = document.querySelector('canvas.webgl')
const experience = new Experience(canvas, KineticType)
