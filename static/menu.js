document.addEventListener('DOMContentLoaded', function() {
    const menuLinks = document.querySelectorAll('.menu-link');
    const menuCategories = document.querySelectorAll('.menu-category');
    const dishItems = document.querySelectorAll('.dish-item');
    
    // Panier détaillé (la modale/panneau)
    const cartDetailedView = document.getElementById('cart-detailed-view');
    const cartList = cartDetailedView.querySelector('.cart-list'); // Cibler DANS le panier détaillé
    const cartTotalElem = cartDetailedView.querySelector('#cart-total'); // Cibler DANS le panier détaillé
    const closeCartBtn = document.getElementById('close-cart-detailed-view');
    const validateCartBtnInModal = cartDetailedView.querySelector('#validate-cart-btn'); // Cibler DANS le panier détaillé

    // Icône flottante du panier (FAB)
    const cartFab = document.getElementById('cart-fab');
    const cartFabBadge = document.getElementById('cart-fab-badge');

    const CART_STORAGE_KEY = 'restaurantEtoileDorCart';
    const MENU_VALIDATED_KEY = 'restaurantEtoileDorMenuValidated';

    // --- Basculer l'affichage du panier détaillé ---
    function toggleCartDetailedView() {
        if (cartDetailedView) {
            cartDetailedView.classList.toggle('open');
        }
    }

    if (cartFab) {
        cartFab.addEventListener('click', toggleCartDetailedView);
    }
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', toggleCartDetailedView);
    }

    // --- Charger le panier depuis localStorage ---
    function loadCartFromStorage() {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
            try {
                const cartItems = JSON.parse(storedCart);
                dishItems.forEach(item => {
                    const qtyDisplay = item.querySelector('.qty-value');
                    if (qtyDisplay) qtyDisplay.textContent = '0';
                });
                cartItems.forEach(storedItem => {
                    const escapedName = storedItem.name.replace(/"/g, '\\"').replace(/'/g, "\\'");
                    const menuItem = document.querySelector(`.dish-item[data-dish-name="${escapedName}"]`);
                    if (menuItem) {
                        const qtyDisplay = menuItem.querySelector('.qty-value');
                        if (qtyDisplay) qtyDisplay.textContent = storedItem.quantity;
                    }
                });
            } catch (error) {
                console.error("Erreur lors du parsing du panier depuis localStorage:", error);
                localStorage.removeItem(CART_STORAGE_KEY);
            }
        }
        updateCartDisplay();
    }

    function saveCartToStorage(cartItems) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }

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

    dishItems.forEach(item => {
        const plusBtn = item.querySelector('.qty-plus');
        const minusBtn = item.querySelector('.qty-minus');
        const qtyDisplay = item.querySelector('.qty-value');

        if (plusBtn && minusBtn && qtyDisplay) {
            plusBtn.addEventListener('click', function() {
                let qty = parseInt(qtyDisplay.textContent);
                qty++;
                qtyDisplay.textContent = qty;
                localStorage.removeItem(MENU_VALIDATED_KEY);
                updateCartDisplay();
            });
            minusBtn.addEventListener('click', function() {
                let qty = parseInt(qtyDisplay.textContent);
                if (qty > 0) {
                    qty--;
                    qtyDisplay.textContent = qty;
                    localStorage.removeItem(MENU_VALIDATED_KEY);
                    updateCartDisplay();
                }
            });
        }
    });

    function updateCartDisplay() {
        if (!cartList || !cartTotalElem || !cartFabBadge) return;

        cartList.innerHTML = '';
        let totalNumericValue = 0;
        let totalItemsInCart = 0; // Compteur pour la pastille
        const currentCartItemsForStorage = [];
        let hasItems = false;

        dishItems.forEach(item => {
            const qtyDisplay = item.querySelector('.qty-value');
            if (!qtyDisplay) return;

            const qty = parseInt(qtyDisplay.textContent);
            totalItemsInCart += qty; // Ajouter la quantité de cet item au total pour la pastille

            if (qty > 0) {
                hasItems = true;
                const dishName = item.getAttribute('data-dish-name');
                const priceStr = item.getAttribute('data-dish-price');
                let price = 0;
                let priceTypeIsNumeric = true;

                if (priceStr) {
                    const lowerPriceStr = priceStr.toLowerCase();
                    if (lowerPriceStr === "selon arrivage" || lowerPriceStr === "la paire") {
                        priceTypeIsNumeric = false;
                    } else {
                        price = parseFloat(String(priceStr).replace('€', '').replace(',', '.').trim());
                    }
                }
                
                if (isNaN(price)) price = 0; 

                if (priceTypeIsNumeric) {
                    totalNumericValue += price * qty;
                }

                currentCartItemsForStorage.push({
                    name: dishName,
                    quantity: qty,
                    price: price,
                    priceDisplay: priceStr
                });

                const li = document.createElement('li');
                li.className = 'cart-item';
                li.setAttribute('data-dish-name', dishName);
                
                let displayItemTotal;
                if (priceTypeIsNumeric) {
                    displayItemTotal = `${(price * qty).toFixed(2).replace('.', ',')}€`;
                } else {
                    displayItemTotal = priceStr; 
                }

                li.innerHTML = `
                    <span class="cart-item-name">${dishName}</span>
                    <div class="cart-quantity-controls">
                        <button class="cart-qty-minus" aria-label="Diminuer la quantité de ${dishName}">–</button>
                        <span class="cart-qty-value">${qty}</span>
                        <button class="cart-qty-plus" aria-label="Augmenter la quantité de ${dishName}">+</button>
                    </div>
                    <span class="cart-item-price">${displayItemTotal}</span>
                    <button class="remove-from-cart" aria-label="Supprimer ${dishName} du panier"><i class="fas fa-trash-alt"></i></button>
                `;

                li.querySelector('.cart-qty-plus').addEventListener('click', function() { updateMenuQuantity(dishName, 1); });
                li.querySelector('.cart-qty-minus').addEventListener('click', function() { updateMenuQuantity(dishName, -1); });
                li.querySelector('.remove-from-cart').addEventListener('click', function() { setMenuQuantity(dishName, 0); });
                cartList.appendChild(li);
            }
        });

        cartTotalElem.textContent = totalNumericValue.toFixed(2).replace('.', ',') + '€';
        saveCartToStorage(currentCartItemsForStorage);

        // Mettre à jour la pastille du FAB
        cartFabBadge.textContent = totalItemsInCart;
        if (totalItemsInCart > 0) {
            cartFabBadge.classList.add('visible');
        } else {
            cartFabBadge.classList.remove('visible');
        }
        
        if (validateCartBtnInModal) {
            validateCartBtnInModal.disabled = !hasItems;
        }
    }

    function updateMenuQuantity(dishName, delta) {
        const escapedName = dishName.replace(/"/g, '\\"').replace(/'/g, "\\'");
        const menuItem = document.querySelector(`.dish-item[data-dish-name="${escapedName}"]`);
        if (menuItem) {
            const qtyDisplay = menuItem.querySelector('.qty-value');
            let currentQty = parseInt(qtyDisplay.textContent);
            currentQty += delta;
            if (currentQty < 0) currentQty = 0;
            qtyDisplay.textContent = currentQty;
            localStorage.removeItem(MENU_VALIDATED_KEY);
            updateCartDisplay();
        }
    }

    function setMenuQuantity(dishName, quantity) {
        const escapedName = dishName.replace(/"/g, '\\"').replace(/'/g, "\\'");
        const menuItem = document.querySelector(`.dish-item[data-dish-name="${escapedName}"]`);
        if (menuItem) {
            const qtyDisplay = menuItem.querySelector('.qty-value');
            qtyDisplay.textContent = quantity;
            localStorage.removeItem(MENU_VALIDATED_KEY);
            updateCartDisplay();
        }
    }
    
    function validateCartAndReturn() {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (cartData) {
            const cartItems = JSON.parse(cartData);
            if (cartItems.length > 0) {
                localStorage.setItem(MENU_VALIDATED_KEY, 'true'); 
                alert('Menu validé ! Vous pouvez fermer cet onglet et retourner à la page de réservation.\nVotre sélection sera visible à l\'étape "Menu" et dans le récapitulatif.');
                toggleCartDetailedView(); // Fermer le panier après validation
            } else {
                alert('Votre panier est vide. Veuillez sélectionner des plats avant de valider.');
            }
        } else {
            alert('Votre panier est vide.');
        }
    }

    function initializeMenuDisplay() {
        const activeLink = document.querySelector('.menu-link.active');
        if (menuLinks.length > 0) {
            let categoryToShow = '';
            if (activeLink) {
                categoryToShow = activeLink.getAttribute('data-category');
            } else if (menuLinks[0]) {
                menuLinks[0].classList.add('active'); 
                categoryToShow = menuLinks[0].getAttribute('data-category');
            }
            menuCategories.forEach(category => {
                category.style.display = (category.getAttribute('data-category') === categoryToShow) ? 'block' : 'none';
            });
        }
    }

    initializeMenuDisplay();
    loadCartFromStorage(); 

    if (validateCartBtnInModal) {
        validateCartBtnInModal.addEventListener('click', validateCartAndReturn);
    } else {
        console.error("Le bouton de validation dans la modale du panier n'a pas été trouvé.");
    }
});