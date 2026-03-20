import { gsap } from 'gsap'

export default class UpdateLog {
    constructor() {
        this.container = document.getElementById('updates-list')
        if (!this.container) return

        this.updates = []
        this.lang = document.documentElement.lang || 'en'
        this.isExpanded = false
        
        window.addEventListener('langChanged', (e) => {
            this.lang = e.detail.lang
            if (this.updates.length > 0) this.render()
        })

        this.init()
    }

    async init() {
        try {
            // Try fetching from the live API first
            const response = await fetch('/api/updates')
            if (!response.ok) throw new Error('API failed')
            this.updates = await response.json()
            this.render(this.updates)
        } catch (error) {
            console.warn('API fetch failed, falling back to static updates.json:', error)
            try {
                const response = await fetch('/updates.json')
                this.updates = await response.json()
                this.render(this.updates)
            } catch (jsonError) {
                console.error('Failed to load updates:', jsonError)
                this.container.innerHTML = '<p>Failed to load updates. Please try again later.</p>'
            }
        }
    }

    render(updates = this.updates) {
        this.container.innerHTML = '' // Clear loader

        if (!updates || updates.length === 0) {
            this.container.innerHTML = '<p class="update-text" style="text-align: center; width: 100%; opacity: 0.5;">No updates yet. Stay tuned!</p>'
            return
        }

        const maxInitial = 2;
        const displayUpdates = this.isExpanded ? updates : updates.slice(0, maxInitial);

        displayUpdates.forEach((update, index) => {
            const updateElement = document.createElement('div')
            updateElement.className = 'update-item'
            updateElement.style.opacity = '0'
            updateElement.style.transform = 'translateY(20px)'

            const date = new Date(update.date).toLocaleDateString(this.lang, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })

            const tagsHtml = update.tags.map(tag => `<span class="update-tag">${tag}</span>`).join('')

            let imageHtml = '';
            if (update.imageUrl) {
                imageHtml = `
                    <div class="update-image-container" style="cursor: pointer; margin-top: 1.5rem; border-radius: 8px; overflow: hidden; max-height: 250px;">
                        <img src="${update.imageUrl}" alt="${update.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" class="update-thumbnail" />
                    </div>
                `;
            }

            updateElement.innerHTML = `
                <div class="update-date">${date}</div>
                <div class="update-content-box">
                    <div class="update-header">
                        <h3 class="update-title">${update.title}</h3>
                        <div class="update-tags">${tagsHtml}</div>
                    </div>
                    <p class="update-text">${update.content}</p>
                    ${imageHtml}
                </div>
            `

            this.container.appendChild(updateElement)

            const contentBox = updateElement.querySelector('.update-content-box');
            contentBox.style.cursor = 'pointer';
            contentBox.addEventListener('click', () => {
                this.openLightbox(update);
            });

            // Intersection Observer for animation
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        gsap.to(updateElement, {
                            opacity: 1,
                            y: 0,
                            duration: 1,
                            delay: index * 0.1,
                            ease: 'power4.out'
                        })
                        observer.unobserve(entry.target)
                    }
                })
            }, { threshold: 0.1 })

            observer.observe(updateElement)
        })

        if (updates.length > maxInitial) {
            const btnContainer = document.createElement('div');
            btnContainer.style.textAlign = 'center';
            btnContainer.style.marginTop = '2rem';
            btnContainer.style.position = 'relative';
            btnContainer.style.zIndex = '2';

            const btn = document.createElement('button');
            btn.className = 'cta-button';
            btn.textContent = this.isExpanded ? 'Show Less' : 'Show All Updates';
            btn.style.marginTop = '0';
            
            btn.addEventListener('click', () => {
                this.isExpanded = !this.isExpanded;
                this.render(); // Re-render with new state
                
                // If showing less, scroll back to the updates section
                if (!this.isExpanded) {
                    const updatesSection = document.getElementById('updates');
                    if (updatesSection) {
                        updatesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });

            btnContainer.appendChild(btn);
            this.container.appendChild(btnContainer);
        }
    }

    openLightbox(update) {
        if (!this.lightbox) {
            this.lightbox = document.createElement('div');
            this.lightbox.className = 'update-lightbox';
            this.lightbox.innerHTML = `
                <div class="lightbox-overlay"></div>
                <div class="lightbox-content">
                    <button class="lightbox-close">&times;</button>
                    <img class="lightbox-img" src="" alt="" />
                    <div class="lightbox-text">
                        <h3 class="lightbox-title"></h3>
                        <p class="lightbox-desc"></p>
                    </div>
                </div>
            `;
            document.body.appendChild(this.lightbox);
            
            this.lightbox.querySelector('.lightbox-overlay').addEventListener('click', () => this.closeLightbox());
            this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        }

        const imgEl = this.lightbox.querySelector('.lightbox-img');
        if (update.imageUrl) {
            imgEl.src = update.imageUrl;
            imgEl.alt = update.title;
            imgEl.style.display = 'block';
        } else {
            imgEl.src = '';
            imgEl.style.display = 'none';
        }

        this.lightbox.querySelector('.lightbox-title').textContent = update.title;
        this.lightbox.querySelector('.lightbox-desc').textContent = update.content;

        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        if (this.lightbox) {
            this.lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}
