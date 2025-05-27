document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const header = document.querySelector('header');
    const progressBar = document.getElementById('progress-bar');
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const sections = document.querySelectorAll('section[id]');
    const contactForm = document.getElementById('contact-form');

    // Función para actualizar la barra de progreso
    function updateProgressBar() {
        const scrollPosition = window.scrollY;
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        const progress = (scrollPosition / totalHeight) * 100;
        progressBar.style.width = `${progress}%`;

        // Cambiar estilo del header al hacer scroll
        if (scrollPosition > 50) {
            header.classList.add('py-2');
            header.classList.add('shadow-md');
        } else {
            header.classList.remove('py-2');
            header.classList.remove('shadow-md');
        }
    }

    // Función para el scrollspy (destacar enlace activo según la sección visible)
    function updateActiveLink() {
        const scrollPosition = window.scrollY + 100; // Offset para mejor detección

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remover clase active de todos los enlaces
                navLinks.forEach(link => link.classList.remove('active'));
                mobileNavLinks.forEach(link => link.classList.remove('active'));
                
                // Añadir clase active al enlace correspondiente
                document.querySelector(`.nav-link[href*="#${sectionId}"]`)?.classList.add('active');
                document.querySelector(`.mobile-nav-link[href*="#${sectionId}"]`)?.classList.add('active');
            }
        });
    }

    // Funcionalidad del menú móvil
    menuToggle.addEventListener('click', function() {
        mobileMenu.classList.toggle('translate-x-full');
    });

    closeMenu.addEventListener('click', function() {
        mobileMenu.classList.add('translate-x-full');
    });

    // Cerrar menú móvil al hacer clic en un enlace
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.add('translate-x-full');
        });
    });

    // Scroll suave para los enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Offset para el header fijo
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Manejo del formulario de contacto
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showContactSuccessNotification();
            contactForm.reset();
        });
    }

    // Inicializar GSAP ScrollTrigger para animaciones al hacer scroll
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        // Animación para las tarjetas de servicios
        gsap.utils.toArray('.service-card').forEach((card, i) => {
            gsap.from(card, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: card,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                delay: i * 0.2
            });
        });
        
        // Animación para los pasos del proceso
        gsap.utils.toArray('.process-step').forEach((step, i) => {
            gsap.from(step, {
                x: -50,
                opacity: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: step,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                delay: i * 0.2
            });
        });
        
        // Animación para los testimonios
        gsap.utils.toArray('.testimonial-card').forEach((card, i) => {
            gsap.from(card, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                scrollTrigger: {
                    trigger: card,
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                delay: i * 0.2
            });
        });
    }

    // Event listeners
    window.addEventListener('scroll', function() {
        updateProgressBar();
        updateActiveLink();
    });

    // Inicializar al cargar la página
    updateProgressBar();
    updateActiveLink();
});