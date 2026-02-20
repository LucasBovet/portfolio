
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export default class GenevaViewer {
    constructor() {
        this.container = document.getElementById('geneva-container')

        if (!this.container) {
            console.warn('Geneva container not found')
            return
        }

        this.width = this.container.clientWidth
        this.height = this.container.clientHeight

        // Scene
        this.scene = new THREE.Scene()

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100)
        this.camera.position.set(3, 2, 4) // Further back for better view
        this.scene.add(this.camera)

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        })
        this.renderer.setSize(this.width, this.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.container.appendChild(this.renderer.domElement)

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableDamping = true
        this.controls.enableZoom = true
        this.controls.minDistance = 3
        this.controls.maxDistance = 10
        this.controls.enablePan = false
        this.controls.autoRotate = true
        this.controls.autoRotateSpeed = 2.0

        // Ensure controls rotate around center
        this.controls.target.set(0, 0, 0)

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5) // Brighter
        this.scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        directionalLight.position.set(5, 5, 5)
        this.scene.add(directionalLight)

        // Model
        this.loadModel()

        // Resize
        window.addEventListener('resize', () => this.resize())

        // Loop
        this.tick = this.tick.bind(this)
        requestAnimationFrame(this.tick)
    }

    loadModel() {
        const loader = new GLTFLoader()
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
        loader.setDRACOLoader(dracoLoader)

        loader.load(
            '/models/geneva.glb',
            (gltf) => {
                const model = gltf.scene

                // 1. Compute Bounding Box of the raw model
                const box = new THREE.Box3().setFromObject(model)
                const center = box.getCenter(new THREE.Vector3())
                const size = box.getSize(new THREE.Vector3())

                // 2. Create a Wrapper Group
                // This group will stay at (0,0,0) and rotate properly
                const wrapper = new THREE.Group()
                this.scene.add(wrapper)

                // 3. Add model to wrapper
                wrapper.add(model)

                // 4. Reposition Model inside Wrapper so its visual center is at (0,0,0)
                // We shift the model by negative center vector
                model.position.x = -center.x
                model.position.y = -center.y
                model.position.z = -center.z

                // 5. Scale the Wrapper (or model) to fit standardized size
                const maxDim = Math.max(size.x, size.y, size.z)
                const scale = 5.0 / maxDim // Balanced size (not too big/small)
                wrapper.scale.set(scale, scale, scale)

                // Adjust vertical position if needed (e.g. lift slightly)
                // wrapper.position.y = -0.5 

                this.model = wrapper

                // Add Geneva Label
                this.createLabel()
                this.setupRaycaster()
            },
            undefined,
            (error) => {
                console.error('Error loading geneva model:', error)
            }
        )
    }

    createLabel() {
        this.label = document.createElement('div')
        this.label.classList.add('geneva-label')
        this.label.textContent = 'GENEVA'
        this.label.style.position = 'absolute'
        this.label.style.color = 'white'
        this.label.style.fontFamily = "'Outfit', sans-serif"
        this.label.style.fontSize = '1.5rem'
        this.label.style.fontWeight = '700'
        this.label.style.pointerEvents = 'none'
        this.label.style.opacity = '0'
        this.label.style.transition = 'opacity 0.3s ease'
        this.label.style.textShadow = '0 2px 10px rgba(0,0,0,0.5)'
        this.label.style.left = '50%'
        this.label.style.top = '50%'
        this.label.style.transform = 'translate(-50%, -50%)'

        this.container.style.position = 'relative' // Ensure container is relative
        this.container.appendChild(this.label)
    }

    setupRaycaster() {
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2(-1, -1) // Start outside

        this.container.addEventListener('mousemove', (event) => {
            const rect = this.container.getBoundingClientRect()
            this.mouse.x = ((event.clientX - rect.left) / this.width) * 2 - 1
            this.mouse.y = -((event.clientY - rect.top) / this.height) * 2 + 1

            // Move label with mouse (optional, or just static center?) 
            // "hover on the geneva 3d thing that says geneva" implies tooltip or specific label.
            // Let's make it follow cursor slightly or just appear.

            this.label.style.left = `${event.clientX - rect.left}px`
            this.label.style.top = `${event.clientY - rect.top - 40}px`
        })

        this.container.addEventListener('mouseleave', () => {
            this.label.style.opacity = '0'
            this.container.style.cursor = 'default'
            this.mouse.set(100, 100) // Move raycaster out of view
        })
    }

    resize() {
        if (!this.container) return
        this.width = this.container.clientWidth
        this.height = this.container.clientHeight

        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(this.width, this.height)
    }

    tick() {
        this.controls.update()

        // Raycasting for Label
        if (this.raycaster && this.model && this.label) {
            this.raycaster.setFromCamera(this.mouse, this.camera)

            // Check intersection with model's children (recursive)
            const intersects = this.raycaster.intersectObject(this.model, true)

            if (intersects.length > 0) {
                this.label.style.opacity = '1'
                document.body.style.cursor = 'pointer'
            } else {
                this.label.style.opacity = '0'
                document.body.style.cursor = 'default'
            }
        }

        this.renderer.render(this.scene, this.camera)
        requestAnimationFrame(this.tick)
    }
}
