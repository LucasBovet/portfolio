import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import * as CANNON from 'cannon-es'

/**
 * Portfolio Integration
 */
const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true'
if (isPreview) {
    document.body.classList.add('is-preview')
}

// Fade out loader
const loader = document.getElementById('loader')
const fadeOutLoader = () => {
    if (loader) {
        loader.classList.add('fade-out')
    }
}

/**
 * Debug
 */
let gui
if (!isPreview) {
    gui = new GUI()
}
const debugObject = {}

const portfolioColors = {
    bg: '#050505',
    text: '#e1e1e1',
    accent: '#64ffda',
    accentLow: '#1a3d35'
}

debugObject.createSpheres = () => {
    createSpheres(
        0.5,
        {
            x: (Math.random() - 0.5) * 3,
            y: 5,
            z: (Math.random() - 0.5) * 3
        }
    )
}
if (gui) gui.add(debugObject, 'createSpheres')

debugObject.createCubes = () => {
    createCubes(
        0.5,
        {
            x: (Math.random() - 0.5) * 3,
            y: 5,
            z: (Math.random() - 0.5) * 3
        }
    )
}
if (gui) gui.add(debugObject, 'createCubes')

debugObject.reset = () => {
    for (const object of objectsUpdate) {
        object.body.removeEventListener('collide', playHitSound)
        world.removeBody(object.body)
    }
    objectsUpdate.splice(0, objectsUpdate.length)

    spheresInstances.count = 0
    cubesInstances.count = 0
}
if (gui) gui.add(debugObject, 'reset')

debugObject.isTilting = false
debugObject.tiltRotation = 0
debugObject.tiltBucket = () => {
    if (debugObject.isTilting) return
    debugObject.isTilting = true

    let startTime = Date.now()
    const duration = 2000

    const animateTilt = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        debugObject.tiltRotation = Math.sin(progress * Math.PI) * (Math.PI * 0.6)

        if (progress < 1) {
            window.requestAnimationFrame(animateTilt)
        } else {
            debugObject.tiltRotation = 0
            debugObject.isTilting = false
        }
    }
    animateTilt()
}
if (gui) gui.add(debugObject, 'tiltBucket').name('🗑️ Tilt & Empty')

/**
 * Base
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

/**
 * Sound
 */
const hitSound = new Audio('/sounds/hit.mp3')
let lastHitTime = 0

const playHitSound = (collision) => {
    const impactStenght = collision.contact.getImpactVelocityAlongNormal()
    const now = Date.now()

    // Increased threshold and more aggressive throttling for performance
    if (impactStenght > 2.0 && now - lastHitTime > 100) {
        hitSound.volume = Math.min(impactStenght / 20, 0.4) // Slightly lower volume for many objects
        hitSound.currentTime = 0
        hitSound.play().catch(() => { })
        lastHitTime = now
    }
}

/**
 * Textures
 */
const cubeTextureLoader = new THREE.CubeTextureLoader()
const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
], fadeOutLoader) // Fade loader once environment map is loaded

/**
 * Physics
 */
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, -9.82, 0)

const defaultMaterial = new CANNON.Material('default')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    { friction: 1, restitution: 0.3 } // Lowered restitution to prevent tunneling and excessive bouncing
)
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial

// Box Dimensions
const boxHeight = 2
const boxWidth = 4
const boxDepth = 4
const visualThickness = 0.02 // Thin, elegant walls
const collisionThickness = 1.0 // Heavy, invisible thickness for stability

const boxBody = new CANNON.Body({ mass: 0, material: defaultMaterial })

// Bottom collider (extends downwards)
boxBody.addShape(
    new CANNON.Box(new CANNON.Vec3(boxWidth / 2, collisionThickness / 2, boxDepth / 2)),
    new CANNON.Vec3(0, -collisionThickness / 2, 0)
)

// Walls colliders (extend outwards)
const wallNS = new CANNON.Box(new CANNON.Vec3(boxWidth / 2, boxHeight / 2, collisionThickness / 2))
const wallEW = new CANNON.Box(new CANNON.Vec3(collisionThickness / 2, boxHeight / 2, boxDepth / 2))

// North/South
boxBody.addShape(wallNS, new CANNON.Vec3(0, boxHeight / 2, -boxDepth / 2 - collisionThickness / 2))
boxBody.addShape(wallNS, new CANNON.Vec3(0, boxHeight / 2, boxDepth / 2 + collisionThickness / 2))

// East/West
boxBody.addShape(wallEW, new CANNON.Vec3(-boxWidth / 2 - collisionThickness / 2, boxHeight / 2, 0))
boxBody.addShape(wallEW, new CANNON.Vec3(boxWidth / 2 + collisionThickness / 2, boxHeight / 2, 0))

world.addBody(boxBody)

/**
 * Visual Box
 */
const frameMaterial = new THREE.MeshStandardMaterial({
    color: '#111111', metalness: 0.5, roughness: 0.8, // More matte, less reflective
    envMap: environmentMapTexture, envMapIntensity: 0.2
})

const glassMaterial = isPreview
    ? new THREE.MeshStandardMaterial({
        color: '#ffffff', metalness: 0, roughness: 0.5,
        transparent: true, opacity: 0.2, envMap: environmentMapTexture, envMapIntensity: 0.2,
        side: THREE.DoubleSide
    })
    : new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0, roughness: 0.2, transmission: 1, thickness: 0.5,
        transparent: true, opacity: 0.15, envMap: environmentMapTexture, envMapIntensity: 0.2,
        side: THREE.DoubleSide
    })

const boxGroup = new THREE.Group()
scene.add(boxGroup)

const createWall = (width, height, depth, x, y, z) => {
    // Elegant glass pane
    const glass = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), glassMaterial)
    glass.position.set(x, y, z)
    glass.receiveShadow = true
    boxGroup.add(glass)

    // Wireframe overlay
    const wireGeo = new THREE.WireframeGeometry(new THREE.BoxGeometry(width, height, depth))
    const line = new THREE.LineSegments(wireGeo, new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(portfolioColors.accent) },
            uOpacity: { value: isPreview ? 0.3 : 0.6 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            void main() {
                gl_FragColor = vec4(uColor, uOpacity);
            }
        `,
        transparent: true,
        depthTest: true
    }))
    line.position.set(x, y, z)
    boxGroup.add(line)
}

createWall(boxWidth, visualThickness, boxDepth, 0, -visualThickness / 2, 0)
createWall(boxWidth, boxHeight, visualThickness, 0, boxHeight / 2, -boxDepth / 2 - visualThickness / 2)
createWall(boxWidth, boxHeight, visualThickness, 0, boxHeight / 2, boxDepth / 2 + visualThickness / 2)
createWall(visualThickness, boxHeight, boxDepth, -boxWidth / 2 - visualThickness / 2, boxHeight / 2, 0)
createWall(visualThickness, boxHeight, boxDepth, boxWidth / 2 + visualThickness / 2, boxHeight / 2, 0)

const cornerGeo = new THREE.BoxGeometry(0.04, boxHeight, 0.04)
const corners = [
    { x: -boxWidth / 2 - visualThickness / 2, z: -boxDepth / 2 - visualThickness / 2 },
    { x: boxWidth / 2 + visualThickness / 2, z: -boxDepth / 2 - visualThickness / 2 },
    { x: -boxWidth / 2 - visualThickness / 2, z: boxDepth / 2 + visualThickness / 2 },
    { x: boxWidth / 2 + visualThickness / 2, z: boxDepth / 2 + visualThickness / 2 }
]
corners.forEach(pos => {
    const corner = new THREE.Mesh(cornerGeo, frameMaterial)
    corner.position.set(pos.x, boxHeight / 2, pos.z)
    corner.castShadow = true
    boxGroup.add(corner)
})

const topRimNS = new THREE.BoxGeometry(boxWidth + visualThickness * 2, 0.02, 0.02)
const topRimEW = new THREE.BoxGeometry(0.02, 0.02, boxDepth + visualThickness * 2)
const rimMat = new THREE.MeshBasicMaterial({ color: portfolioColors.accent })
const r1 = new THREE.Mesh(topRimNS, rimMat); r1.position.set(0, boxHeight, -boxDepth / 2 - visualThickness / 2); boxGroup.add(r1)
const r2 = new THREE.Mesh(topRimNS, rimMat); r2.position.set(0, boxHeight, boxDepth / 2 + visualThickness / 2); boxGroup.add(r2)
const r3 = new THREE.Mesh(topRimEW, rimMat); r3.position.set(-boxWidth / 2 - visualThickness / 2, boxHeight, 0); boxGroup.add(r3)
const r4 = new THREE.Mesh(topRimEW, rimMat); r4.position.set(boxWidth / 2 + visualThickness / 2, boxHeight, 0); boxGroup.add(r4)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(portfolioColors.accent, 1.2)
directionalLight.castShadow = !isPreview
if (directionalLight.castShadow) {
    directionalLight.shadow.mapSize.set(1024, 1024) // Reduced from 2048 for better performance
    directionalLight.shadow.camera.far = 15
    directionalLight.shadow.camera.left = -7
    directionalLight.shadow.camera.top = 7
    directionalLight.shadow.camera.right = 7
    directionalLight.shadow.camera.bottom = -7
}
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

const pointLight = new THREE.PointLight(portfolioColors.accent, 2, 10)
pointLight.position.set(0, 3, 0)
scene.add(pointLight)

/**
 * Sizes & Renderer
 */
const sizes = { width: window.innerWidth, height: window.innerHeight }
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-3, 3, 3)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
if (isPreview) {
    controls.autoRotate = true
    controls.autoRotateSpeed = 2
}

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isPreview,
    powerPreference: 'high-performance'
})
renderer.shadowMap.enabled = !isPreview
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(isPreview ? 1 : Math.min(window.devicePixelRatio, 2))

/**
 * Instanced Objects
 */
const objectsUpdate = []
const MAX_INSTANCES = isPreview ? 100 : 500 // Reduced from 1000 for better performance
const sphereGeo = new THREE.SphereGeometry(1, isPreview ? 8 : 12, isPreview ? 8 : 12) // Slightly reduced segments
const sphereMat = new THREE.MeshStandardMaterial({
    color: portfolioColors.accent, metalness: 0.3, roughness: 0.4, envMap: environmentMapTexture, envMapIntensity: 0.5
})
const spheresInstances = new THREE.InstancedMesh(sphereGeo, sphereMat, MAX_INSTANCES)
spheresInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
spheresInstances.count = 0
spheresInstances.castShadow = true
spheresInstances.receiveShadow = true
scene.add(spheresInstances)

function createSpheres(radius, position) {
    if (spheresInstances.count >= MAX_INSTANCES) return
    const body = new CANNON.Body({
        mass: 1, shape: new CANNON.Sphere(radius), material: defaultMaterial,
        sleepTimeLimit: 1, sleepSpeedLimit: 0.1,
        linearDamping: 0.1, angularDamping: 0.1 // Added damping for better stability
    })
    body.position.copy(position)
    body.addEventListener('collide', playHitSound)
    world.addBody(body)
    objectsUpdate.push({ type: 'sphere', radius, body })
    spheresInstances.count++
}

const cubeGeo = new THREE.BoxGeometry(1, 1, 1)
const cubeMat = new THREE.MeshStandardMaterial({
    color: '#ffffff', metalness: 0.2, roughness: 0.5, envMap: environmentMapTexture, envMapIntensity: 0.5
})
const cubesInstances = new THREE.InstancedMesh(cubeGeo, cubeMat, MAX_INSTANCES)
cubesInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
cubesInstances.count = 0
cubesInstances.castShadow = true
cubesInstances.receiveShadow = true
scene.add(cubesInstances)

function createCubes(width, position) {
    if (cubesInstances.count >= MAX_INSTANCES) return
    const body = new CANNON.Body({
        mass: 1, shape: new CANNON.Box(new CANNON.Vec3(width / 2, width / 2, width / 2)), material: defaultMaterial,
        sleepTimeLimit: 1, sleepSpeedLimit: 0.1,
        linearDamping: 0.1, angularDamping: 0.1 // Added damping for better stability
    })
    body.position.set(position.x, position.y, position.z)
    body.addEventListener('collide', playHitSound)
    world.addBody(body)
    objectsUpdate.push({ type: 'cube', width, body })
    cubesInstances.count++
}

const dummy = new THREE.Object3D()

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const animate = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // Incremented sub-steps to 3 for main page to fix scaling/tunnelling issues
    world.step(1 / 60, deltaTime, isPreview ? 1 : 3)

    const tiltAxis = new CANNON.Vec3(1, 0, 0)
    boxBody.quaternion.setFromAxisAngle(tiltAxis, debugObject.tiltRotation)
    boxGroup.quaternion.copy(boxBody.quaternion)

    let sIdx = 0, cIdx = 0
    let spheresMoved = false
    let cubesMoved = false

    for (let i = 0; i < objectsUpdate.length; i++) {
        const object = objectsUpdate[i]

        // Only update objects that are not sleeping to save CPU
        if (object.body.sleepState !== CANNON.Body.SLEEPING) {
            dummy.position.copy(object.body.position)
            dummy.quaternion.copy(object.body.quaternion)

            if (object.type === 'sphere') {
                dummy.scale.setScalar(object.radius)
                dummy.updateMatrix()
                spheresInstances.setMatrixAt(sIdx, dummy.matrix)
                spheresMoved = true
            } else {
                dummy.scale.setScalar(object.width)
                dummy.updateMatrix()
                cubesInstances.setMatrixAt(cIdx, dummy.matrix)
                cubesMoved = true
            }
        }

        if (object.type === 'sphere') sIdx++
        else cIdx++
    }

    if (spheresMoved) spheresInstances.instanceMatrix.needsUpdate = true
    if (cubesMoved) cubesInstances.instanceMatrix.needsUpdate = true

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate)
}

animate()

