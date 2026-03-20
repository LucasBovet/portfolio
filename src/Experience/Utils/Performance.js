
export default class Performance {
    static getTier() {
        let score = 0

        // 1. Hardware Detection (GPU)
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase()

                // High performance cards
                if (renderer.includes('nvidia') || renderer.includes('amd') || renderer.includes('apple') || renderer.includes('rtx') || renderer.includes('gtx')) {
                    score += 2
                }

                // Mobile or integrated
                if (renderer.includes('mali') || renderer.includes('adreno') || renderer.includes('intel') || renderer.includes('mobile')) {
                    score -= 1
                }
            }
        }

        // 2. Network Detection
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
        if (connection) {
            if (connection.effectiveType === '4g' && connection.downlink > 10) {
                score += 1
            } else if (['3g', '2g', 'slow-2g'].includes(connection.effectiveType)) {
                score -= 2
            }
        }

        // 3. Device Memory
        if (navigator.deviceMemory) {
            if (navigator.deviceMemory >= 8) score += 1
            if (navigator.deviceMemory < 4) score -= 1
        }

        // Final Tier Mapping
        if (score <= -1) return 'low'
        if (score <= 1) return 'medium'
        return 'high'
    }

    static getSuggestedPixelRatio() {
        const tier = this.getTier()

        // Strategy: Force lower resolution on weak devices to maintain FPS
        if (tier === 'low') return 1
        if (tier === 'medium') return Math.min(window.devicePixelRatio, 1.5)

        // High tier: standard crisp 2x (or higher if native, capped at 2)
        return Math.min(window.devicePixelRatio, 2)
    }
}
