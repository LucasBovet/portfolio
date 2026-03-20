
export default class Translator {
    constructor() {
        this.language = 'en'
        this.translations = {
            en: {
                nav: {
                    about: 'About',
                    work: 'Work',
                    updates: 'Updates',
                    illustrations: 'Illustrations',
                    contact: 'Contact'
                },
                hero: {
                    title: 'Digital<br>Experiences',
                    subtitle: 'Crafting immersive web applications with precision and creativity.',
                    cta: 'View Projects'
                },
                about: {
                    title: 'About Me',
                    bio: 'I’m Lucas, a Geneva-based web designer and 3D designer working at the crossroads of design, interaction, and motion.<br><br>Coming from a strong background in web and graphic design, I create responsive websites, animated interfaces, and 3D visuals that balance aesthetics, usability, and performance.',
                    connect: 'Connect',
                    techStack: 'Tech Stack'
                },
                work: {
                    title: 'Selected Works',
                    freitag: {
                        title: 'Freitag 3D Experience',
                        desc: 'An interactive 3D showcase featuring custom shaders and physics-based interactions.',
                        cta: 'Launch Full Screen'
                    },
                    walk: {
                        title: 'Walking Simulation',
                        desc: 'An interactive 3D simulation featuring a custom character model with Mixamo animations and WASD controls.',
                        cta: 'Try Simulation'
                    },
                    kinetic: {
                        title: 'Kinetic Type Physics',
                        desc: 'Interactive typographic playground using Cannon.js for rigid body physics simulation.',
                        cta: 'View Experiment'
                    },
                    visualiser: {
                        title: '3D Room Visualiser',
                        desc: 'Architecture drafting tool and interior design simulator with real-time 3D rendering.',
                        cta: 'Open Visualiser'
                    },
                    physics: {
                        title: 'Cannon.js Physics',
                        desc: 'Experimental playground for rigid body dynamics using Cannon-es. High-performance instanced rendering with interactive gravity control.',
                        cta: 'Launch Experiment'
                    }
                },
                updates: {
                    title: 'Updates'
                },
                illustrations: {
                    title: 'Illustrations',
                    instruction: 'Drag to rotate'
                },
                contact: {
                    title: 'Get in Touch',
                    namePlaceholder: 'Name',
                    emailPlaceholder: 'Email',
                    messagePlaceholder: 'Message',
                    submit: 'Send Message'
                },
                footer: {
                    rights: '&copy; 2026 Lucas Bovet. All rights reserved.',
                    backToTop: 'Back to Top &uarr;'
                }
            },
            de: {
                nav: {
                    about: 'Über mich',
                    work: 'Arbeiten',
                    updates: 'Log',
                    illustrations: 'Illustrationen',
                    contact: 'Kontakt'
                },
                hero: {
                    title: 'Digitale<br>Erlebnisse',
                    subtitle: 'Entwicklung immersiver Webanwendungen mit Präzision und Kreativität.',
                    cta: 'Projekte ansehen'
                },
                about: {
                    title: 'Über Mich',
                    bio: 'Ich bin Lucas, ein Web- und 3D-Designer aus Genf, der an der Schnittstelle von Design, Interaktion und Motion arbeitet.<br><br>Mit einem starken Hintergrund in Web- und Grafikdesign erstelle ich responsive Websites, animierte Interfaces und 3D-Visuals, die Ästhetik, Benutzerfreundlichkeit und Leistung vereinen.',
                    connect: 'Verbinden',
                    techStack: 'Tech Stack'
                },
                work: {
                    title: 'Ausgewählte Arbeiten',
                    freitag: {
                        title: 'Freitag 3D Experience',
                        desc: 'Ein interaktives 3D-Showcase mit benutzerdefinierten Shadern und physikbasierten Interaktionen.',
                        cta: 'Vollbild starten'
                    },
                    walk: {
                        title: 'Laufsimulation',
                        desc: 'Eine interaktive 3D-Simulation mit einem benutzerdefinierten Charaktermodell, Mixamo-Animationen und WASD-Steuerung.',
                        cta: 'Simulation ausprobieren'
                    },
                    kinetic: {
                        title: 'Kinetische Typografie',
                        desc: 'Interaktiver typografischer Spielplatz mit Cannon.js für Starrkörperphysik-Simulation.',
                        cta: 'Experiment ansehen'
                    },
                    visualiser: {
                        title: '3D-Raumplaner',
                        desc: 'Architektur-Drafting-Tool und Innendesign-Simulator mit Echtzeit-3D-Rendering.',
                        cta: 'Planer öffnen'
                    },
                    physics: {
                        title: 'Cannon.js Physik',
                        desc: 'Experimentelles Spielfeld für Starrkörperdynamik mit Cannon-es. Hochleistungs-instanziertes Rendering mit interaktiver Gravitationssteuerung.',
                        cta: 'Experiment starten'
                    }
                },
                updates: {
                    title: 'Updates'
                },
                illustrations: {
                    title: 'Illustrationen',
                    instruction: 'Zum Drehen ziehen'
                },
                contact: {
                    title: 'Kontakt aufnehmen',
                    namePlaceholder: 'Name',
                    emailPlaceholder: 'E-Mail',
                    messagePlaceholder: 'Nachricht',
                    submit: 'Nachricht senden'
                },
                footer: {
                    rights: '&copy; 2026 Lucas Bovet. Alle Rechte vorbehalten.',
                    backToTop: 'Nach oben &uarr;'
                }
            },
            fr: {
                nav: {
                    about: 'À propos',
                    work: 'Projets',
                    updates: 'Journal',
                    illustrations: 'Illustrations',
                    contact: 'Contact'
                },
                hero: {
                    title: 'Expériences<br>Numériques',
                    subtitle: 'Conception d\'applications web immersives avec précision et créativité.',
                    cta: 'Voir les projets'
                },
                about: {
                    title: 'À propos de moi',
                    bio: 'Je suis Lucas, web designer et designer 3D basé à Genève, travaillant à la croisée du design, de l\'interaction et du mouvement.<br><br>Fort d\'une solide expérience en web et design graphique, je crée des sites responsives, des interfaces animées et des visuels 3D qui équilibrent esthétique, ergonomie et performance.',
                    connect: 'Se connecter',
                    techStack: 'Tech Stack'
                },
                work: {
                    title: 'Travaux Sélectionnés',
                    freitag: {
                        title: 'Expérience 3D Freitag',
                        desc: 'Une vitrine 3D interactive proposant des shaders personnalisés et des interactions basées sur la physique.',
                        cta: 'Lancer en plein écran'
                    },
                    walk: {
                        title: 'Simulation de Marche',
                        desc: 'Une simulation 3D interactive utilisant un personnage personnalisé, des animations Mixamo et des commandes WASD.',
                        cta: 'Essayer la simulation'
                    },
                    kinetic: {
                        title: 'Physique Typographique Cinétique',
                        desc: 'Terrain de jeu typographique interactif utilisant Cannon.js pour la simulation physique de corps rigides.',
                        cta: 'Voir l\'expérience'
                    },
                    visualiser: {
                        title: 'Visualiseur de Pièce 3D',
                        desc: 'Outil de dessin architectural et simulateur de design d\'intérieur avec rendu 3D en temps réel.',
                        cta: 'Ouvrir le Visu'
                    },
                    physics: {
                        title: 'Physique Cannon.js',
                        desc: 'Terrain d\'expérimentation pour la dynamique des corps rigides avec Cannon-es. Rendu instancié haute performance avec contrôle interactif de la gravité.',
                        cta: 'Lancer l\'Expérience'
                    }
                },
                updates: {
                    title: 'Mises à jour'
                },
                illustrations: {
                    title: 'Illustrations',
                    instruction: 'Faites glisser pour tourner'
                },
                contact: {
                    title: 'Prendre contact',
                    namePlaceholder: 'Nom',
                    emailPlaceholder: 'Email',
                    messagePlaceholder: 'Message',
                    submit: 'Envoyer le message'
                },
                footer: {
                    rights: '&copy; 2026 Lucas Bovet. Tous droits réservés.',
                    backToTop: 'Retour en haut &uarr;'
                }
            }
        }

        this.init()
    }

    init() {
        this.createToggle()
        this.update()
    }

    createToggle() {
        const nav = document.querySelector('.nav-links')
        if (!nav) return

        // Container
        const container = document.createElement('div')
        container.className = 'lang-container'

        // Trigger Button
        const button = document.createElement('button')
        button.className = 'lang-btn'
        button.textContent = this.language.toUpperCase()
        button.setAttribute('aria-label', 'Select Language')

        // Toggle Dropdown
        const toggleDropdown = (e) => {
            e.stopPropagation()
            container.classList.toggle('active')
        }

        button.addEventListener('click', toggleDropdown)

        // Dropdown List
        const dropdown = document.createElement('div')
        dropdown.className = 'lang-dropdown'

        const languages = [
            { code: 'en', label: 'English' },
            { code: 'de', label: 'Deutsch' },
            { code: 'fr', label: 'Français' }
        ]

        languages.forEach(lang => {
            const option = document.createElement('button')
            option.className = 'lang-option'
            if (lang.code === this.language) option.classList.add('active')
            option.textContent = lang.code.toUpperCase() // or lang.label for full name
            option.setAttribute('aria-label', `Switch to ${lang.label}`)

            option.addEventListener('click', () => {
                this.setLanguage(lang.code, button)
                container.classList.remove('active')

                // Update active class
                dropdown.querySelectorAll('.lang-option').forEach(btn => btn.classList.remove('active'))
                option.classList.add('active')
            })

            dropdown.appendChild(option)
        })

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                container.classList.remove('active')
            }
        })

        container.appendChild(button)
        container.appendChild(dropdown)
        nav.appendChild(container)
    }

    setLanguage(lang, button) {
        if (this.language === lang) return

        this.language = lang
        // Update trigger button text
        // button is undefined when called initially
        if (button) {
            button.textContent = this.language.toUpperCase()
        }

        // Update html lang attribute
        document.documentElement.lang = this.language

        this.update()

        // Notify other components
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: this.language } }))
    }

    update() {
        const elements = document.querySelectorAll('[data-i18n]')
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n')
            // Traverse the translation object
            const keys = key.split('.')
            let translation = this.translations[this.language]

            for (const k of keys) {
                if (translation[k] === undefined) {
                    console.warn(`Missing translation for key: ${key} in language: ${this.language}`)
                    translation = null
                    break
                }
                translation = translation[k]
            }

            if (translation) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation
                } else {
                    el.innerHTML = translation
                }
            }
        })
    }
}
