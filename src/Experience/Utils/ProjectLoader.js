export default class ProjectLoader {
    constructor() {
        this.iframes = document.querySelectorAll('.project-card iframe')
        this.init()
    }

    init() {
        const observerOptions = {
            root: null,
            rootMargin: '200px', // Start loading before it's fully in view
            threshold: 0.01
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const iframe = entry.target
                const placeholder = iframe.parentElement.querySelector('.iframe-placeholder')

                if (entry.isIntersecting) {
                    // Load the iframe if not already loaded or if previously unloaded
                    if (iframe.dataset.src && iframe.src !== window.location.origin + iframe.dataset.src && !iframe.src.includes(iframe.dataset.src)) {
                        iframe.src = iframe.dataset.src

                        iframe.onload = () => {
                            iframe.style.opacity = '1'
                            if (placeholder) {
                                placeholder.style.opacity = '0'
                                setTimeout(() => {
                                    if (placeholder.style.opacity === '0') {
                                        placeholder.style.display = 'none'
                                    }
                                }, 500)
                            }
                        }
                    }
                } else {
                    // Unload iframe when it goes out of view to save memory/GPU
                    if (iframe.src) {
                        iframe.src = ''
                        iframe.style.opacity = '0'
                        if (placeholder) {
                            placeholder.style.display = 'flex'
                            placeholder.style.opacity = '1'
                        }
                    }
                }
            })
        }, observerOptions)

        this.iframes.forEach(iframe => observer.observe(iframe))
    }
}
