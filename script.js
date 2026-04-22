document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    const links = document.querySelectorAll('.nav-links a');
    const navbar = document.querySelector('.navbar');

    // Toggle Menu
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');

        // Toggle icon animation
        const icon = mobileToggle.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            document.body.style.overflow = '';
        }
    });

    // Close mobile menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            document.body.style.overflow = '';
        });
    });

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            navbar.style.background = 'rgba(255, 255, 255, 0.9)';
        }
    });

    // Initialize Flatpickr
    flatpickr("#date", {
        dateFormat: "d/m/Y",
        minDate: "today",
        disableMobile: "true" // Force custom UI on mobile
    });

    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyB5D2kkpY3Rv-xqRO_we5JeE3oyVuFuL8k",
        authDomain: "smile-dental-ziro-2025.firebaseapp.com",
        projectId: "smile-dental-ziro-2025",
        storageBucket: "smile-dental-ziro-2025.firebasestorage.app",
        messagingSenderId: "629665408700",
        appId: "1:629665408700:web:904409243c6f6f560292b9"
    };

    // Initialize Firebase
    let db;
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    } catch (error) {
        console.warn("Firebase not initialized yet. Please add config.");
    }

    // Form Handling
    const bookingForm = document.getElementById('bookingForm');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = bookingForm.querySelector('button');
    const originalBtnText = submitBtn.innerHTML;

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!db) {
            alert("Please configure Firebase first!");
            return;
        }

        // Show processing state
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating Token...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.8';

        // Collect form data
        const formData = new FormData(bookingForm);
        const data = Object.fromEntries(formData.entries());

        // Date for token (e.g., "25/12/2025")
        const appointmentDate = document.getElementById('date').value;
        // Create a document ID based on date (e.g., "2025-12-25") to store the counter
        // We need to convert dd/mm/yyyy to yyyy-mm-dd for sorting/ID
        const [day, month, year] = appointmentDate.split('/');
        const dateId = `${year}-${month}-${day}`;

        try {
            let tokenNumber = 0;

            // Run a transaction to ensure unique, sequential tokens
            await db.runTransaction(async (transaction) => {
                const counterRef = db.collection('daily_counters').doc(dateId);
                const counterDoc = await transaction.get(counterRef);

                if (!counterDoc.exists) {
                    tokenNumber = 1;
                    transaction.set(counterRef, { count: 1 });
                } else {
                    const newCount = counterDoc.data().count + 1;
                    tokenNumber = newCount;
                    transaction.update(counterRef, { count: newCount });
                }

                // Save appointment details
                const appointmentRef = db.collection('appointments').doc();
                transaction.set(appointmentRef, {
                    ...data,
                    token: tokenNumber,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            // Send email via FormSubmit (Optional: include token in message)
            // We append the token to the message so you see it in the email
            data.message = `[Token #${tokenNumber}] ${data.message || ''}`;

            await fetch('https://formsubmit.co/ajax/bitukumar467@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    _subject: `Token #${tokenNumber} - Appointment Request`,
                    _template: "table"
                })
            });

            // Success UI
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';

            // WhatsApp Message
            // Format: "Hello, I have booked an appointment. Token: #123. Name: John Doe. Date: 25/12/2025"
            // This makes it easier for the clinic to confirm quickly.
            const waMessage = encodeURIComponent(`Hello Smile Dental,\nI have booked an appointment.\n\nToken: #${tokenNumber}\nName: ${data.name}\nDate: ${appointmentDate}\n\nPlease confirm my slot.`);
            const waLink = `https://wa.me/918794942745?text=${waMessage}`; // Added clinic number

            // Show Token Number & Share Button
            successMessage.style.display = 'block';
            successMessage.innerHTML = `
                <div style="text-align: center;">
                    <i class="fa-solid fa-check-circle" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
                    <strong>Booking Confirmed!</strong><br>
                    <span style="font-size: 1.5rem; color: #065f46; display: block; margin: 10px 0;">
                        Your Token Number: <strong>${tokenNumber}</strong>
                    </span>
                    <a href="${waLink}" target="_blank" class="btn" style="background: #25D366; color: white; font-size: 0.9rem; padding: 8px 16px; margin-top: 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fa-brands fa-whatsapp"></i> Share Token on WhatsApp
                    </a>
                    <br><br>
                    <small>Please arrive on time.</small>
                </div>
            `;
            successMessage.style.opacity = '0';
            successMessage.style.background = '#d1fae5';
            successMessage.style.color = '#065f46';
            setTimeout(() => successMessage.style.opacity = '1', 10);

            // Clear form
            bookingForm.reset();

            // Message stays visible indefinitely so user has time to share
            // setTimeout removed as per request

        } catch (error) {
            console.error('Error:', error);
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';

            successMessage.style.display = 'block';
            successMessage.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Error generating token. Please try again.';
            successMessage.style.background = '#fee2e2';
            successMessage.style.color = '#991b1b';
            successMessage.style.opacity = '1';
        }
    });

    // Smooth Scroll for Anchor Links (Polyfill-like behavior for better control)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    });
});
