const commonSources = []

const mainSources = [
    {
        name: 'heroModel',
        type: 'gltfModel',
        path: 'models/hero.glb'
    }
]

const simulationSources = [
    {
        name: 'animationIdle',
        type: 'gltfModel',
        path: 'models/idle.glb'
    },
    {
        name: 'animationWalk',
        type: 'gltfModel',
        path: 'models/walk.glb'
    },
    {
        name: 'animationRun',
        type: 'gltfModel',
        path: 'models/run.glb'
    }
]

export default [...mainSources, ...simulationSources]
export { mainSources, simulationSources }
