// Fungsi untuk membuka tab, ditempatkan di luar agar bisa diakses oleh onclick di HTML
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // KONFIGURASI FIREBASE (WAJIB DIISI!)
    // -----------------------------------------------------------------
    const firebaseConfig = {
        apiKey: "AIzaSyCYaFAqE_ZL_0E8qCb38ASepSYdEChzRpo",
        authDomain: "panelstore-14a1d.firebaseapp.com",
        projectId: "panelstore-14a1d",
        storageBucket: "panelstore-14a1d.firebasestorage.app",
        messagingSenderId: "656167175785",
        appId: "1:656167175785:web:27e9802988aaf1e11004f8"
    };

    // --- INISIALISASI ---
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Firebase initialization error. Pastikan firebaseConfig sudah benar.", e);
        alert("Terjadi kesalahan konfigurasi. Fitur login tidak akan berfungsi.");
        return; 
    }
    
    const auth = firebase.auth();
    const ui = new firebaseui.auth.AuthUI(auth);
    
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const welcomeMsg = document.getElementById('welcome-msg');
    const promoModal = document.getElementById('promo-modal');
    const authModal = document.getElementById('auth-modal');

    // --- MODAL & POP-UP LOGIC ---
    function openModal(modal) { if (modal) modal.classList.add('active'); }
    function closeModal(modal) { if (modal) modal.classList.remove('active'); }
    
    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
            if (modal && modal.id === 'promo-modal') {
                sessionStorage.setItem('promoClosed', 'true');
            }
        });
    });

    const promoRegisterBtn = document.getElementById('promo-register-btn');
    if(promoRegisterBtn) {
        promoRegisterBtn.addEventListener('click', () => {
            closeModal(promoModal);
            sessionStorage.setItem('promoClosed', 'true');
            openModal(authModal);
            ui.start('#firebaseui-auth-container', uiConfig);
        });
    }

    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            openModal(authModal);
            ui.start('#firebaseui-auth-container', uiConfig);
        });
    }

    // --- FIREBASEUI CONFIG ---
    const uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                if (authResult.additionalUserInfo.isNewUser) {
                    const randomDiscount = (Math.floor(Math.random() * 11) + 5) / 100;
                    localStorage.setItem('user_discount_' + authResult.user.uid, randomDiscount);
                }
                closeModal(authModal);
                return false;
            }
        },
        signInFlow: 'popup',
        signInOptions: [ firebase.auth.EmailAuthProvider.PROVIDER_ID ],
    };
    
    // --- MAIN AUTH STATE LOGIC ---
    auth.onAuthStateChanged(user => {
        const isLoggedIn = !!user;
        
        loginBtn.classList.toggle('hidden', isLoggedIn);
        userInfo.classList.toggle('hidden', !isLoggedIn);

        if (isLoggedIn) {
            welcomeMsg.textContent = `Hai, ${user.displayName || user.email.split('@')[0]}!`;
            closeModal(promoModal);
            if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut());
            
            const storedDiscount = localStorage.getItem('user_discount_' + user.uid);
            const discount = storedDiscount ? parseFloat(storedDiscount) : 0.10;
            applyDiscounts(discount);
        } else {
            removeDiscounts();
            if (!sessionStorage.getItem('promoClosed')) {
                setTimeout(() => openModal(promoModal), 1500);
            }
        }
    });

    // --- FUNGSI UTAMA UNTUK WHATSAPP ---
    function updateWhatsAppLinks(isLoggedIn = false, discount = 0) {
        const whatsAppNumber = '6288809776791';
        
        document.querySelectorAll('.product-card').forEach(card => {
            const buyButton = card.querySelector('.buy-button');
            const productName = card.querySelector('h3').innerText;
            const originalPrice = parseFloat(card.dataset.originalPrice);
            
            let message;
            if (isLoggedIn) {
                const discountedPrice = originalPrice * (1 - discount);
                message = `Halo, saya tertarik untuk memesan *${productName}* dengan harga diskon: *${formatRupiah(discountedPrice)}*`;
            } else {
                message = `Halo, saya tertarik untuk memesan *${productName}* dengan harga normal: *${formatRupiah(originalPrice)}*`;
            }
            
            const encodedMessage = encodeURIComponent(message);
            buyButton.href = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;
        });
    }

    // --- DISCOUNT FUNCTIONS ---
    function formatRupiah(number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number); }

    function applyDiscounts(discount) {
        document.querySelectorAll('[data-original-price]').forEach(card => {
            const priceElement = card.querySelector('.price');
            const originalPrice = parseFloat(card.dataset.originalPrice);
            const discountedPrice = originalPrice * (1 - discount);
            const discountPercentage = Math.round(discount * 100);
            priceElement.innerHTML = `<span class="original-price">${formatRupiah(originalPrice)}</span> ${formatRupiah(discountedPrice)} <span class="discount-label">${discountPercentage}% OFF</span>`;
        });
        updateWhatsAppLinks(true, discount); // Update link WA dengan status login dan diskon
    }

    function removeDiscounts() {
        document.querySelectorAll('[data-original-price]').forEach(card => {
            const priceElement = card.querySelector('.price');
            const originalPrice = parseFloat(card.dataset.originalPrice);
            priceElement.innerHTML = `Harga: ${formatRupiah(originalPrice)}`;
        });
        updateWhatsAppLinks(false); // Update link WA dengan status tidak login
    }
    
    // --- OTHER UI FUNCTIONS ---
    // Chat FAB
    const chatFabButton = document.getElementById('chat-fab-button');
    const liveChatLink = document.getElementById('live-chat-link');

    if (chatFabButton) {
        chatFabButton.addEventListener('click', () => {
            document.querySelector('.chat-fab-container').classList.toggle('open');
        });
    }

    if (liveChatLink) {
        liveChatLink.addEventListener('click', (e) => {
            e.preventDefault();
            if(typeof Tawk_API !== 'undefined' && Tawk_API.maximize) { 
                Tawk_API.maximize();
            } else { 
                alert('Layanan Live Chat sedang tidak tersedia.'); 
            }
            document.querySelector('.chat-fab-container').classList.remove('open');
        });
    }

    // Form Handlers
    async function handleFormSubmit(formId, statusElementId) {
        const form = document.getElementById(formId);
        const statusElement = document.getElementById(statusElementId);
        if (!form || !statusElement) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = new FormData(form);
            statusElement.textContent = "Mengirim...";
            statusElement.style.color = "var(--gray-text)";
            
            try {
                const response = await fetch(form.action, { method: 'POST', body: data, headers: {'Accept': 'application/json'} });
                if (response.ok) {
                    statusElement.textContent = "Terima kasih! Pesan Anda telah berhasil dikirim.";
                    statusElement.style.color = "var(--success-color)";
                    form.reset();
                } else {
                    statusElement.textContent = "Oops! Terjadi kesalahan.";
                    statusElement.style.color = "var(--error-color)";
                }
            } catch (error) {
                statusElement.textContent = "Oops! Terjadi kesalahan jaringan.";
                statusElement.style.color = "var(--error-color)";
            }
        });
    }
    handleFormSubmit('support-form', 'form-status');
    handleFormSubmit('review-form', 'review-form-status');

    // Panggil update link WA saat pertama kali halaman dimuat
    updateWhatsAppLinks(false);
});
