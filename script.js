// --- DOM Elements ---
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const navbar = document.getElementById('navbar');
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const currentYearSpan = document.getElementById('currentYear');

// --- Set Current Year in Footer ---
if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
}

// --- Mobile Navigation Toggle ---
if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// --- Sticky Navbar & Active Link Update on Scroll ---
window.addEventListener('scroll', () => {
    // Sticky Navbar
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Update Active Link
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// --- Scroll Reveal Animations ---
const fadeElements = document.querySelectorAll('.fade-in');

const appearOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, appearOptions);

fadeElements.forEach(el => {
    appearOnScroll.observe(el);
});

// --- Contact Form Validation ---
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // Validate Name
        const nameInput = document.getElementById('name');
        if (nameInput.value.trim() === '') {
            setErrorFor(nameInput);
            isValid = false;
        } else {
            setSuccessFor(nameInput);
        }
        
        // Validate Email
        const emailInput = document.getElementById('email');
        if (!isEmailValid(emailInput.value.trim())) {
            setErrorFor(emailInput);
            isValid = false;
        } else {
            setSuccessFor(emailInput);
        }
        
        // Validate Message
        const messageInput = document.getElementById('message');
        if (messageInput.value.trim() === '') {
            setErrorFor(messageInput);
            isValid = false;
        } else {
            setSuccessFor(messageInput);
        }
        
        // If valid, show success message and reset form
        if (isValid) {
            contactForm.style.display = 'none';
            formSuccess.classList.remove('hidden');
            
            // Optional: Reset after a few seconds
            setTimeout(() => {
                contactForm.reset();
                contactForm.style.display = 'block';
                formSuccess.classList.add('hidden');
                // Remove success classes
                const formGroups = document.querySelectorAll('.form-group');
                formGroups.forEach(group => group.classList.remove('success'));
            }, 5000);
        }
    });
}

function setErrorFor(input) {
    const formControl = input.parentElement;
    formControl.classList.add('error');
    formControl.classList.remove('success');
}

function setSuccessFor(input) {
    const formControl = input.parentElement;
    formControl.classList.remove('error');
    formControl.classList.add('success');
}

function isEmailValid(email) {
    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

// --- CMS Data Loader (Node.js API) ---
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/content')
        .then(response => response.json())
        .then(data => {
            // Update simple fields
            if (data.logoImage) document.getElementById('school-logo').src = data.logoImage;
            if (data.heroTitle) document.getElementById('displayHeroTitle').innerHTML = data.heroTitle;
            if (data.heroTagline) document.getElementById('displayHeroTagline').textContent = data.heroTagline;
            if (data.bgImage) document.getElementById('home').style.backgroundImage = `url('${data.bgImage}')`;
            if (data.aboutHistory) document.getElementById('displayAboutHistory').textContent = data.aboutHistory;

            // Update Teachers
            if (data.teachers && data.teachers.length > 0) {
                const teacherCards = document.querySelectorAll('.teacher-card');
                data.teachers.forEach((teacher, index) => {
                    if (teacherCards[index]) {
                        teacherCards[index].querySelector('.teacher-img').src = teacher.image;
                        teacherCards[index].querySelector('.teacher-name').textContent = teacher.name;
                        teacherCards[index].querySelector('.teacher-role').textContent = teacher.role;
                        teacherCards[index].querySelector('.teacher-portfolio').textContent = teacher.portfolio;
                    }
                });
            }

            // Update Gallery
            if (data.gallery && data.gallery.length > 0) {
                const galleryItems = document.querySelectorAll('.gallery-item');
                data.gallery.forEach((item, index) => {
                    if (galleryItems[index]) {
                        galleryItems[index].querySelector('img').src = item.image;
                        galleryItems[index].querySelector('.gallery-overlay span').textContent = item.caption;
                    }
                });
            }
        })
        .catch(err => console.error("Error fetching CMS data:", err));
});
