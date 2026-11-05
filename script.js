// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
const menuToggle = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Update active link on scroll
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href').includes(current)) {
            item.classList.add('active');
        }
    });
});

// Scroll Reveal Animations
const sr = ScrollReveal({
    origin: 'bottom',
    distance: '60px',
    duration: 1000,
    delay: 200,
    easing: 'cubic-bezier(0.5, 0, 0, 1)'
});

sr.reveal('.hero-content .greeting', { origin: 'left' });
sr.reveal('.hero-content .name', { origin: 'left', delay: 300 });
sr.reveal('.hero-content .role', { origin: 'left', delay: 400 });
sr.reveal('.hero-content .summary', { origin: 'left', delay: 500 });
sr.reveal('.hero-content .hero-btns', { origin: 'left', delay: 600 });
sr.reveal('.hero-image', { origin: 'right', delay: 300 });

sr.reveal('.section-title', { distance: '40px' });
sr.reveal('.about-text', { origin: 'left' });
sr.reveal('.skills-container', { origin: 'right' });
sr.reveal('.service-card', { interval: 200 });
sr.reveal('.contact-info', { origin: 'left' });
sr.reveal('.contact-form-container', { origin: 'right' });

// Initialize EmailJS (Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS Public Key)
emailjs.init("7a0QNc7kHUwDI12n4");

// Form submission handler
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const btn = contactForm.querySelector('button');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;

    // Send email using EmailJS
    // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with your actual EmailJS config

    const templateParams = {
        from_name: document.getElementById('name').value,
        reply_to: document.getElementById('email').value,
        service: document.getElementById('service_type').value,
        message: document.getElementById('message').value
    };

    emailjs.send("service_fonk68p", "template_rda2cva", templateParams)
        .then(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;

            // Show success message
            formStatus.innerHTML = '<span style="color: #4ade80;">Message sent successfully! We will get back to you soon.</span>';
            formStatus.style.opacity = '1';

            // Reset form
            contactForm.reset();

            setTimeout(() => {
                formStatus.style.opacity = '0';
            }, 5000);
        }, (err) => {
            btn.innerHTML = originalText;
            btn.disabled = false;

            // Show error message
            formStatus.innerHTML = '<span style="color: #ef4444;">Failed to send message. Please try again.</span>';
            formStatus.style.opacity = '1';
            console.error('EmailJS Error:', err);
        });
});
