import EventEmitter from './EventEmitter.js'

export default class Controls extends EventEmitter {
    constructor() {
        super()

        this.actions = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            run: false
        }

        this.setKeyboard()
        this.setMobile()
    }

    setKeyboard() {
        window.addEventListener('keydown', (event) => {
            this.onKeyChange(event.code, true)
        })

        window.addEventListener('keyup', (event) => {
            this.onKeyChange(event.code, false)
        })
    }

    setMobile() {
        // Find buttons if they exist
        const buttons = {
            forward: document.getElementById('btn-up'),
            backward: document.getElementById('btn-down'),
            left: document.getElementById('btn-left'),
            right: document.getElementById('btn-right'),
            run: document.getElementById('btn-run')
        }

        const addEvents = (btn, action) => {
            if (!btn) return

            const start = (e) => {
                e.preventDefault()
                this.actions[action] = true
                if (action === 'run') btn.classList.add('active')
                this.trigger('keyChange')
            }

            const end = (e) => {
                e.preventDefault()
                this.actions[action] = false
                if (action === 'run') btn.classList.remove('active')
                this.trigger('keyChange')
            }

            btn.addEventListener('touchstart', start)
            btn.addEventListener('touchend', end)
            btn.addEventListener('mousedown', start)
            btn.addEventListener('mouseup', end)
            btn.addEventListener('mouseleave', end)
        }

        addEvents(buttons.forward, 'forward')
        addEvents(buttons.backward, 'backward')
        addEvents(buttons.left, 'left')
        addEvents(buttons.right, 'right')
        addEvents(buttons.run, 'run')
    }

    onKeyChange(code, isPressed) {
        switch (code) {
            case 'KeyW':
            case 'ArrowUp':
                this.actions.forward = isPressed
                break
            case 'KeyS':
            case 'ArrowDown':
                this.actions.backward = isPressed
                break
            case 'KeyA':
            case 'ArrowLeft':
                this.actions.left = isPressed
                break
            case 'KeyD':
            case 'ArrowRight':
                this.actions.right = isPressed
                break
            case 'ShiftLeft':
            case 'ShiftRight':
                this.actions.run = isPressed
                break
        }

        this.trigger('keyChange')
    }
}
