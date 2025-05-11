document.addEventListener('DOMContentLoaded', function() {
    const menuLinks = document.querySelectorAll('.menu-link');
    const menuCategories = document.querySelectorAll('.menu-category');
    const dishItems = document.querySelectorAll('.dish-item');
    const cartList = document.querySelector('.cart-list');
    const cartTotalElem = document.getElementById('cart-total');
    const CART_STORAGE_KEY = 'restaurantEtoileDorCart'; // Clé unique pour le localStorage

    // --- Charger le panier depuis localStorage ---
    function loadCartFromStorage() {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
            try {
                const cartItems = JSON.parse(storedCart);
                // Réinitialiser les quantités affichées sur la page avant de charger
                dishItems.forEach(item => {
                    const qtyDisplay = item.querySelector('.qty-value');
                    if (qtyDisplay) {
                        qtyDisplay.textContent = '0';
                    }
                });

                cartItems.forEach(storedItem => {
                    const menuItem = document.querySelector(`.dish-item[data-dish-name="${storedItem.name}"]`);
                    if (menuItem) {
                        const qtyDisplay = menuItem.querySelector('.qty-value');
                        if (qtyDisplay) {
                            qtyDisplay.textContent = storedItem.quantity;
                        }
                    }
                });
            } catch (error) {
                console.error("Erreur lors du parsing du panier depuis localStorage:", error);
                localStorage.removeItem(CART_STORAGE_KEY); // Supprimer les données corrompues
            }
        }
        updateCartDisplay(); // Mettre à jour l'affichage du panier après avoir chargé les quantités
    }

    // --- Sauvegarder le panier dans localStorage ---
    function saveCartToStorage(cartItems) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }

    // --- Navigation entre catégories ---
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const selectedCategory = this.getAttribute('data-category');
            menuCategories.forEach(category => {
                category.style.display = (category.getAttribute('data-category') === selectedCategory) ? 'block' : 'none';
            });
        });
    });

    // --- Gestion des quantités dans le menu ---
    dishItems.forEach(item => {
        const plusBtn = item.querySelector('.qty-plus');
        const minusBtn = item.querySelector('.qty-minus');
        const qtyDisplay = item.querySelector('.qty-value');

        plusBtn.addEventListener('click', function() {
            let qty = parseInt(qtyDisplay.textContent);
            qty++;
            qtyDisplay.textContent = qty;
            updateCartDisplay();
        });

        minusBtn.addEventListener('click', function() {
            let qty = parseInt(qtyDisplay.textContent);
            if (qty > 0) {
                qty--;
                qtyDisplay.textContent = qty;
                updateCartDisplay();
            }
        });
    });

    // --- Gestion du Panier (Affichage et Sauvegarde) ---
    function updateCartDisplay() {
        cartList.innerHTML = ''; // Vider les éléments précédents
        let total = 0;
        const currentCartItemsForStorage = [];

        dishItems.forEach(item => {
            const qty = parseInt(item.querySelector('.qty-value').textContent);
            if (qty > 0) {
                const dishName = item.getAttribute('data-dish-name');
                const priceStr = item.getAttribute('data-dish-price');
                let price = 0;
                
                // Gérer les prix non numériques
                if (priceStr && priceStr.toLowerCase() !== "selon arrivage" && priceStr.toLowerCase() !== "la paire") {
                    price = parseFloat(priceStr.replace('€', '').replace(',', '.').trim());
                }
                
                if (isNaN(price)) { 
                    price = 0; 
                }

                total += price * qty;

                currentCartItemsForStorage.push({
                    name: dishName,
                    quantity: qty,
                    price: price // Sauvegarder le prix numérique
                });

                const li = document.createElement('li');
                li.className = 'cart-item';
                li.setAttribute('data-dish-name', dishName);
                
                let displayPrice = `${(price * qty).toFixed(2).replace('.', ',')}€`;
                if (price === 0 && priceStr && (priceStr.toLowerCase() === "selon arrivage" || priceStr.toLowerCase() === "la paire")) {
                    displayPrice = priceStr; // Afficher "Selon Arrivage" ou "la paire"
                }

                li.innerHTML = `
                    <span class="cart-item-name">${dishName}</span>
                    <div class="cart-quantity-controls">
                        <button class="cart-qty-minus" aria-label="Diminuer la quantité de ${dishName}">–</button>
                        <span class="cart-qty-value">${qty}</span>
                        <button class="cart-qty-plus" aria-label="Augmenter la quantité de ${dishName}">+</button>
                    </div>
                    <span class="cart-item-price">${displayPrice}</span>
                    <button class="remove-from-cart" aria-label="Supprimer ${dishName} du panier"><i class="fas fa-trash-alt"></i></button>
                `;

                li.querySelector('.cart-qty-plus').addEventListener('click', function() {
                    updateMenuQuantity(dishName, 1);
                });
                li.querySelector('.cart-qty-minus').addEventListener('click', function() {
                    updateMenuQuantity(dishName, -1);
                });
                li.querySelector('.remove-from-cart').addEventListener('click', function() {
                    setMenuQuantity(dishName, 0);
                });
                cartList.appendChild(li);
            }
        });

        cartTotalElem.textContent = total.toFixed(2).replace('.', ',') + '€';
        saveCartToStorage(currentCartItemsForStorage); // Sauvegarder le panier mis à jour
    }

    // --- Fonctions d'aide pour mettre à jour les quantités du menu depuis les actions du panier ---
    function updateMenuQuantity(dishName, delta) {
        const menuItem = document.querySelector(`.dish-item[data-dish-name="${dishName}"]`);
        if (menuItem) {
            const qtyDisplay = menuItem.querySelector('.qty-value');
            let currentQty = parseInt(qtyDisplay.textContent);
            currentQty += delta;
            if (currentQty < 0) currentQty = 0;
            qtyDisplay.textContent = currentQty;
            updateCartDisplay();
        }
    }

    function setMenuQuantity(dishName, quantity) {
        const menuItem = document.querySelector(`.dish-item[data-dish-name="${dishName}"]`);
        if (menuItem) {
            const qtyDisplay = menuItem.querySelector('.qty-value');
            qtyDisplay.textContent = quantity;
            updateCartDisplay();
        }
    }

    // --- Initialisation ---
    function initializeMenuDisplay() {
        const activeLink = document.querySelector('.menu-link.active');
        if (menuLinks.length > 0) {
            let categoryToShow = '';
            if (activeLink) {
                categoryToShow = activeLink.getAttribute('data-category');
            } else {
                menuLinks[0].classList.add('active'); // Activer le premier lien par défaut
                categoryToShow = menuLinks[0].getAttribute('data-category');
            }
            menuCategories.forEach(category => {
                category.style.display = (category.getAttribute('data-category') === categoryToShow) ? 'block' : 'none';
            });
        }
    }

    initializeMenuDisplay();
    loadCartFromStorage(); // Charger le panier au démarrage de la page
});