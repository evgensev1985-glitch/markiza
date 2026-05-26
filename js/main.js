// Основной JavaScript для сайта мебельной фабрики «Маркиза»

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
const CONFIG = {
    apiBaseUrl: '/api', // Для будущей админки
    telegramBotToken: '', // Заполнить при настройке Telegram
    telegramChatId: '', // Заполнить при настройке Telegram
    formSpreeEndpoint: '' // Опционально: Formspree endpoint
};

// ============================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Плавная прокрутка к секции
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Форматирование цены
 */
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

/**
 * Показать toast-уведомление
 */
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 ${
        type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
    }`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
                    type === 'success' 
                        ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
                        : 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                }"/>
            </svg>
            <span class="font-medium">${message}</span>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// МОБИЛЬНОЕ МЕНЮ
// ============================================

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// ============================================
// МОДАЛЬНЫЕ ОКНА
// ============================================

let currentProduct = null;

function openCallbackModal() {
    const modal = document.getElementById('callbackModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeCallbackModal() {
    const modal = document.getElementById('callbackModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function openLeadModal(product) {
    currentProduct = product;
    const modal = document.getElementById('leadModal');
    const productName = document.getElementById('leadProductName');
    
    if (modal && productName) {
        productName.textContent = product.name;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeLeadModal() {
    const modal = document.getElementById('leadModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        currentProduct = null;
    }
}

// Закрытие модальных окон по клику на overlay
document.addEventListener('click', function(e) {
    if (e.target.id === 'callbackModal') {
        closeCallbackModal();
    }
    if (e.target.id === 'leadModal') {
        closeLeadModal();
    }
});

// Закрытие по ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCallbackModal();
        closeLeadModal();
    }
});

// ============================================
// ЗАГРУЗКА И ОТОБРАЖЕНИЕ ТОВАРОВ
// ============================================

async function loadProducts() {
    try {
        const response = await fetch('/data/products.json');
        if (!response.ok) throw new Error('Не удалось загрузить товары');
        
        const products = await response.json();
        renderProducts(products);
        setupFilters(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showToast('Не удалось загрузить каталог товаров', 'error');
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    container.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group" data-category="${product.category}">
            <div class="relative overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-600" loading="lazy">
                ${product.new ? '<span class="badge-new absolute top-4 left-4">Новинка</span>' : ''}
                ${product.sale ? '<span class="badge-sale absolute top-4 left-4">Акция</span>' : ''}
                ${!product.inStock ? '<span class="absolute top-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold">Нет в наличии</span>' : ''}
            </div>
            <div class="p-6">
                <h3 class="font-heading font-bold text-xl text-coffee-800 mb-2">${product.name}</h3>
                <p class="text-coffee-600 text-sm mb-4 line-clamp-2">${product.description}</p>
                <div class="flex items-center justify-between">
                    <div>
                        ${product.oldPrice ? `<p class="price-old">${formatPrice(product.oldPrice)}</p>` : ''}
                        <p class="price-current text-2xl font-bold">${formatPrice(product.price)}</p>
                    </div>
                    <button onclick='openLeadModal(${JSON.stringify(product).replace(/'/g, "&apos;")})' class="accent-gradient text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-coffee-400/20 transition-all active:scale-95">
                        Заказать
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function setupFilters(products) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.filter;
            
            // Активный класс
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Фильтрация
            const productCards = document.querySelectorAll('#productsContainer > .product-card');
            
            productCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                    card.style.animation = 'slideUp 0.5s ease-out forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// ОБРАБОТКА ФОРМ
// ============================================

/**
 * Отправка формы обратного звонка
 */
async function handleCallbackForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Блокируем кнопку
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        type: 'callback'
    };
    
    try {
        // TODO: Интегрировать с Telegram или EmailJS
        // await sendToTelegram(data);
        
        console.log('Заявка на звонок:', data);
        
        // Имитация отправки (удалить после интеграции)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showToast('Заявка отправлена! Мы перезвоним вам в ближайшее время.');
        closeCallbackModal();
        form.reset();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showToast('Произошла ошибка при отправке заявки', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Отправка формы заказа товара
 */
async function handleLeadForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        comment: formData.get('comment'),
        product: currentProduct ? currentProduct.name : 'Не указан',
        type: 'order'
    };
    
    try {
        // TODO: Интегрировать с Telegram или EmailJS
        // await sendToTelegram(data);
        
        console.log('Заказ товара:', data);
        
        // Имитация отправки (удалить после интеграции)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showToast('Заказ оформлен! Менеджер свяжется с вами для уточнения деталей.');
        closeLeadModal();
        form.reset();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showToast('Произошла ошибка при оформлении заказа', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Отправка данных в Telegram (для будущей интеграции)
 */
async function sendToTelegram(data) {
    if (!CONFIG.telegramBotToken || !CONFIG.telegramChatId) {
        throw new Error('Telegram не настроен');
    }
    
    const message = `
🔔 *Новая заявка с сайта*

Тип: ${data.type === 'callback' ? 'Обратный звонок' : 'Заказ товара'}
Имя: ${data.name}
Телефон: ${data.phone}
${data.product ? `Товар: ${data.product}` : ''}
${data.comment ? `Комментарий: ${data.comment}` : ''}

Время: ${new Date().toLocaleString('ru-RU')}
    `.trim();
    
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CONFIG.telegramChatId,
            text: message,
            parse_mode: 'Markdown'
        })
    });
    
    if (!response.ok) throw new Error('Ошибка Telegram API');
    
    return await response.json();
}

// ============================================
// АНИМАЦИИ ПРИ СКРОЛЛЕ
// ============================================

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                entry.target.classList.remove('section-hidden');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.classList.add('section-hidden');
        observer.observe(el);
    });
}

// ============================================
// СЧЁТЧИКИ В HERO-СЕКЦИИ
// ============================================

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const suffix = counter.dataset.suffix || '';
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current) + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + suffix;
            }
        };
        
        // Запуск при появлении в viewport
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                updateCounter();
                observer.disconnect();
            }
        });
        
        observer.observe(counter);
    });
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================

function setupHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('glass', 'shadow-lg');
            header.classList.remove('bg-transparent');
        } else {
            header.classList.remove('glass', 'shadow-lg');
            header.classList.add('bg-transparent');
        }
    });
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Загрузка товаров
    loadProducts();
    
    // Анимации
    setupScrollAnimations();
    animateCounters();
    setupHeaderScroll();
    
    // Обработчики форм
    const callbackForm = document.getElementById('callbackForm');
    const leadForm = document.getElementById('leadForm');
    
    if (callbackForm) {
        callbackForm.addEventListener('submit', handleCallbackForm);
    }
    
    if (leadForm) {
        leadForm.addEventListener('submit', handleLeadForm);
    }
    
    console.log('✅ Сайт «Маркиза» успешно загружен');
});
