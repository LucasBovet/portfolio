
import * as THREE from 'three'
import Experience from '../Experience.js'
import gsap from 'gsap'

const vertexShader = `
varying vec2 vUv;
varying float vWave;
uniform float uTime;
uniform float uHover;

void main() {
    vUv = uv;

    vec3 pos = position;

    // Subtle wave effect on hover
    float noiseFreq = 3.5;
    float noiseAmp = 0.15;
    vec3 noisePos = vec3(pos.x * noiseFreq + uTime, pos.y, pos.z);
    
    // Distort Z based on hover
    pos.z += sin(noisePos.x) * noiseAmp * uHover;
    vWave = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uHover;
varying vec2 vUv;
varying float vWave;

void main() {
    // Distort UV based on hover wave
    vec2 distortedUv = vUv;
    distortedUv.x += vWave * 0.1 * uHover;
    
    // Sample texture
    vec4 textureColor = texture2D(uTexture, distortedUv);
    
    // Add subtle color shift on hover
    // textureColor.rgb += uHover * 0.1;

    gl_FragColor = textureColor;
}
`

export default class ProjectGallery {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.sizes = this.experience.sizes
        this.camera = this.experience.camera
        this.time = this.experience.time
        this.resources = this.experience.resources

        this.projects = [] // Store meshes and DOM elements

        // Find all project cards with textures
        this.domElements = document.querySelectorAll('.card-image[data-texture]')

        if (this.domElements.length > 0) {
            this.setupMeshes()
        }
    }

    setupMeshes() {
        // Shared Geometry
        const geometry = new THREE.PlaneGeometry(1, 1, 32, 32)

        this.domElements.forEach((element, index) => {
            const texturePath = element.dataset.texture
            // Load texture (using simple TextureLoader since specific paths might not be in Resources yet)
            const textureLoader = new THREE.TextureLoader()
            const texture = textureLoader.load(texturePath)

            // Material
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    uTime: { value: 0 },
                    uHover: { value: 0 },
                    uTexture: { value: texture }
                },
                side: THREE.DoubleSide,
                transparent: true
            })

            const mesh = new THREE.Mesh(geometry, material)
            this.scene.add(mesh)

            // Interaction States
            let hoverState = { value: 0 }

            // DOM Events for Hover
            element.addEventListener('mouseenter', () => {
                gsap.to(material.uniforms.uHover, { value: 1, duration: 0.5, ease: 'power2.out' })
            })

            element.addEventListener('mouseleave', () => {
                gsap.to(material.uniforms.uHover, { value: 0, duration: 0.5, ease: 'power2.out' })
            })

            // Store reference
            this.projects.push({
                mesh: mesh,
                element: element,
                material: material
            })
        })
    }

    update() {
        // Sync Mesh position/scale with DOM element

        for (const project of this.projects) {
            const rect = project.element.getBoundingClientRect()

            // Calculate size in 3D units at z=0 (assuming camera settings)
            // But strict HTML-WebGL sync requires calculation based on camera distance or using fixed pixel mapping logic.
            // Simplified approach: Map screen pixels to normalized device coordinates (NDC) then unproject.

            // Position (center of rect)
            // Convert to NDC (-1 to +1)
            // X: (rect.left + rect.width/2) / width * 2 - 1
            // Y: - ((rect.top + rect.height/2) / height * 2 - 1)

            // Since we are scrolling, rect.top changes.

            // However, typical WebGL sync needs to account for perspective if using PerspectiveCamera.
            // For simple PlaneGeometry often Orthographic is better, but main scene is Perspective.

            // Assuming this.camera.instance is Perspective.
            // We need to place mesh at a Z depth and match scale.

            // Let's assume mesh Z = 0 (or close to camera?)
            // Actually, we should place them at Z=0 for simplicity if other scene items don't block.
            // Or better: Use camera FOV to calculate scale.

            // This sync logic is complex. 
            // Better approach for quick implementation: Use 'position: fixed' canvas logic or...
            // Let's implement basic Perspective sync.
            // FOV height at distance D = 2 * D * tan(fov/2 * PI/180)

            // Distance from camera:
            const distance = this.camera.instance.position.z // Assuming camera at +Z looking at 0,0,0
            // Actually project gallery might need its own scene or careful placement to not intersect other 3D objects.
            // Let's place meshes at Z = 0 (same as Hero roughly?)
            // Hero is at Z=0.

            // If camera moves with scroll (it does in this template), then we need world coordinates relative to scroll.
            // Wait, does the camera move or the objects?
            // In typical scrolling sites, camera usually stays fixed and objects move, OR camera moves.
            // In this specific template (based on previous World.js code), 'this.instance.position.y += (scrollY...)' implies Camera moves.

            // If camera moves, fixed DOM elements move relative to viewport.
            // The rect.top is relative to viewport.

            // So: Mesh Position relative to Camera = (NDC_X, NDC_Y, -Distance_To_Place_In_Frustum)
            // So we parent mesh to Camera? No, parent to Scene but update position based on Camera position + Offset.

            // Formula for position in world space matching DOM rect:
            // 1. Get world position corresponding to screen coordinate (NDC) at depth Z=0.
            // Since camera moves in Y, we need absolute world Y.

            // EASIER: Just map NDC to a plane in front of camera.
            // Add mesh to Camera? No, scene structure matters.

            // Let's use the standard "Sync" formula:
            // mesh.position.copy(camera.position)
            // mesh.translateZ(-10) // Place 10 units in front
            // Then adjust XY based on FOV.

            // But wait, the previous code had objects fixed in world (Carousel at -29). Camera moves down.
            // So we should calculate World Position for the DOM element.
            // World Y = - (scrollY + rect.element.offsetTop) basically.

            // This is getting tricky to guess without seeing Camera setup.
            // Let's assume Camera moves Y.
            // DOM elements scroll naturally.
            // So Mesh should exist at specific Y coordinate in world space.
            // Y = - (Element Offset Top relative to Document / Document Height * World Height)? No.

            // Let's try: 
            // Mesh Y = Camera Y - (NDC Y offset converted to world units).
            // This works if updated every frame.

            this.updateProject(project, rect)
        }
    }

    updateProject(project, rect) {
        // Calculate dimensions in world units at mesh depth
        // We need the distance from camera to mesh.
        // Let's place mesh at z=0 (World z). Camera is at z=6 (Desktop).
        // Distance = 6.
        const dist = this.camera.instance.position.z - 0

        // 1. Visible height at this distance
        const fov = this.camera.instance.fov * (Math.PI / 180)
        const visibleHeight = 2 * Math.tan(fov / 2) * dist
        const visibleWidth = visibleHeight * (this.sizes.width / this.sizes.height)

        // 2. Map DOM rect (pixels) to World Units
        // Scale
        const scaleX = (rect.width / this.sizes.width) * visibleWidth
        const scaleY = (rect.height / this.sizes.height) * visibleHeight

        project.mesh.scale.set(scaleX, scaleY, 1)

        // Position
        // Centered screen (NDC 0,0) corresponds to Camera Position (center of view).
        // DOM rect center relative to screen center (in pixels):
        const pixelX = rect.left + rect.width / 2 - this.sizes.width / 2
        const pixelY = - (rect.top + rect.height / 2 - this.sizes.height / 2) // Inverted Y

        // Convert to World Units offset
        const offsetX = (pixelX / this.sizes.width) * visibleWidth
        const offsetY = (pixelY / this.sizes.height) * visibleHeight

        // Apply to mesh
        project.mesh.position.x = this.camera.instance.position.x + offsetX
        project.mesh.position.y = this.camera.instance.position.y + offsetY
        project.mesh.position.z = 0 // Fixed Z depth

        // Update Shader Time
        project.material.uniforms.uTime.value = this.time.elapsed * 0.001
    }
}
