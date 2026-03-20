import './styles/style.css'
import Experience from './Experience/Experience.js'
import SimulationWorld from './Experience/World/SimulationWorld.js'
import Controls from './Experience/Utils/Controls.js'
import { simulationSources } from './Experience/sources.js'

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas.webgl')

    // Check for preview mode
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('preview') === 'true') {
        document.body.classList.add('is-preview')
    }

    // Initialize the experience with the SimulationWorld
    const experience = new Experience(canvas, SimulationWorld, simulationSources)

    // Add custom controls to the experience
    experience.controls = new Controls()

    // Disable default scroll/parallax behavior on the camera
    experience.camera.customUpdate = false

    // Position camera initially
    experience.camera.instance.position.set(0, 5, 10)

    // Tweak controls for better experience if needed
    if (experience.camera.controls) {
        experience.camera.controls.enabled = false // Usually we want follow cam, not orbit
    }
})
