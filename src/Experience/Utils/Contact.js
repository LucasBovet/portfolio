import emailjs from '@emailjs/browser';

export default class Contact {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.messageElement = document.getElementById('form-message');

        // REPLACE THESE WITH YOUR ACTUAL EMAILJS KEYS
        // Sign up at https://www.emailjs.com/
        this.publicKey = 'jCftRkdxWSHgBxx8L';
        this.serviceId = 'service_xlv4x1f';
        this.templateId = 'template_634gnka';

        // Spam Protection
        this.loadTime = Date.now();
        this.minInteractionTime = 2000; // Minimum 2 seconds before submit allowed

        if (this.form) {
            this.init();
        }
    }

    init() {
        // Initialize EmailJS
        emailjs.init(this.publicKey);

        this.form.addEventListener('submit', (event) => {
            event.preventDefault();

            const submitBtn = this.form.querySelector('button[type="submit"]');

            if (this.validateSpamCheck()) {
                this.sendEmail(submitBtn);
            } else {
                console.warn('Spam detected.');
                // Simulate success to fool bots but don't send email
                this.showMessage('Message sent successfully!', 'success');
                this.form.reset();
                // Reset button state if it was disabled
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Message';
                    submitBtn.style.opacity = '1';
                }
            }
        });
    }

    validateSpamCheck() {
        // 1. Honeypot check
        const honeypot = this.form.querySelector('input[name="_honey"]');
        if (honeypot && honeypot.value !== '') {
            return false;
        }

        // 2. Time-based check
        const currentTime = Date.now();
        if (currentTime - this.loadTime < this.minInteractionTime) {
            return false;
        }

        return true;
    }

    sendEmail(submitBtn) {
        const originalBtnText = 'Send Message'; // Reset text reference

        // Set loading state
        submitBtn.textContent = 'Sending...';
        submitBtn.style.opacity = '0.7';
        this.messageElement.style.opacity = '0';

        emailjs.sendForm(this.serviceId, this.templateId, this.form)
            .then(() => {
                // Success
                this.showMessage('Message sent successfully! I will get back to you soon.', 'success');
                this.form.reset();
            }, (error) => {
                // Error
                console.error('EmailJS Error:', error);
                this.showMessage('Failed to send message. Please try again later.', 'error');
            })
            .finally(() => {
                // Reset button
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            });
    }

    showMessage(text, type) {
        this.messageElement.textContent = text;
        this.messageElement.style.color = type === 'success' ? '#64ffda' : '#ff6b6b';
        this.messageElement.style.opacity = '1';

        // Auto hide after 5 seconds
        setTimeout(() => {
            this.messageElement.style.opacity = '0';
        }, 5000);
    }
}
