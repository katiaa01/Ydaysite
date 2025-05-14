document.addEventListener('DOMContentLoaded', function() {
    const menuLinks = document.querySelectorAll('.menu-link');
    const menuCategories = document.querySelectorAll('.menu-category');
    const dishItems = document.querySelectorAll('.dish-item');
    
    const cartDetailedView = document.getElementById('cart-detailed-view');
    const cartList = cartDetailedView.querySelector('.cart-list');
    // Les éléments de total du panier sont récupérés dans updateCartDisplay directement par ID
    const closeCartBtn = document.getElementById('close-cart-detailed-view');
    const validateCartBtnInModal = cartDetailedView.querySelector('#validate-cart-btn');
    const emptyCartBtn = document.getElementById('empty-cart-btn');

    const cartFab = document.getElementById('cart-fab');
    const cartFabBadge = document.getElementById('cart-fab-badge');

    const CART_STORAGE_KEY = 'restaurantEtoileDorCart';
    const MENU_VALIDATED_KEY = 'restaurantEtoileDorMenuValidated';

    function toggleCartDetailedView() {
        if (cartDetailedView) {
            cartDetailedView.classList.toggle('open');
        }
    }

    if (cartFab) cartFab.addEventListener('click', toggleCartDetailedView);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCartDetailedView);

    function loadCartFromStorage() {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
            try {
                const cartItems = JSON.parse(storedCart);
                // Réinitialiser les quantités affichées sur la page du menu
                dishItems.forEach(item => {
                    const qtyDisplay = item.querySelector('.qty-value');
                    if (qtyDisplay) qtyDisplay.textContent = '0';
                });
                // Mettre à jour les quantités basées sur le localStorage
                cartItems.forEach(storedItem => {
                    // Échapper les guillemets dans le nom du plat pour la sélection d'attribut
                    const escapedName = storedItem.name.replace(/"/g, '\\"').replace(/'/g, "\\'");
                    const menuItem = document.querySelector(`.dish-item[data-dish-name="${escapedName}"]`);
                    if (menuItem) {
                        const qtyDisplay = menuItem.querySelector('.qty-value');
                        if (qtyDisplay) qtyDisplay.textContent = storedItem.quantity;
                    }
                });
            } catch (error) {
                console.error("Erreur lors du chargement du panier depuis localStorage:", error);
                localStorage.removeItem(CART_STORAGE_KEY); // Supprimer le panier corrompu
            }
        }
        updateCartDisplay(); // Mettre à jour l'affichage du panier modal
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
                localStorage.removeItem(MENU_VALIDATED_KEY); // Invalider le menu si modifié
                updateCartDisplay();
            });
            minusBtn.addEventListener('click', function() {
                let qty = parseInt(qtyDisplay.textContent);
                if (qty > 0) {
                    qty--;
                    qtyDisplay.textContent = qty;
                    localStorage.removeItem(MENU_VALIDATED_KEY); // Invalider le menu si modifié
                    updateCartDisplay();
                }
            });
        }
    });

    function updateCartDisplay() {
        if (!cartList || !cartFabBadge) return;

        cartList.innerHTML = '';
        let subtotalNumericValue = 0;
        let totalItemsInCart = 0;
        const currentCartItemsForStorage = [];
        let hasItems = false;

        dishItems.forEach(item => {
            const qtyDisplay = item.querySelector('.qty-value');
            if (!qtyDisplay) return;
            const qty = parseInt(qtyDisplay.textContent);
            totalItemsInCart += qty;

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
                if (priceTypeIsNumeric) subtotalNumericValue += price * qty;

                currentCartItemsForStorage.push({ name: dishName, quantity: qty, price: price, priceDisplay: priceStr });

                const li = document.createElement('li');
                li.className = 'cart-item';
                li.setAttribute('data-dish-name', dishName);
                let displayItemTotal = priceTypeIsNumeric ? `${(price * qty).toFixed(2).replace('.', ',')}€` : priceStr; 

                li.innerHTML = `
                    <span class="cart-item-name">${dishName}</span>
                    <div class="cart-quantity-controls">
                        <button class="cart-qty-minus" aria-label="Diminuer ${dishName}">–</button>
                        <span class="cart-qty-value">${qty}</span>
                        <button class="cart-qty-plus" aria-label="Augmenter ${dishName}">+</button>
                    </div>
                    <span class="cart-item-price">${displayItemTotal}</span>
                    <button class="remove-from-cart" aria-label="Supprimer ${dishName}"><i class="fas fa-trash-alt"></i></button>
                `;
                li.querySelector('.cart-qty-plus').addEventListener('click', () => updateMenuQuantity(dishName, 1));
                li.querySelector('.cart-qty-minus').addEventListener('click', () => updateMenuQuantity(dishName, -1));
                li.querySelector('.remove-from-cart').addEventListener('click', () => setMenuQuantity(dishName, 0));
                cartList.appendChild(li);
            }
        });

        // Calcul et affichage de la réduction
        const discountRate = 0.10;
        const discountShortName = "Réduction Save & Serve";
        const discountFullName = "Bénéficiez de votre réduction Save & Serve";
        const discountPercentageText = "(-10%)";

        let discountAmount = 0;
        let finalTotal = subtotalNumericValue;

        const cartSubtotalValueElem = document.getElementById('cart-subtotal-value');
        const cartDiscountLineElem = document.querySelector('.cart-discount-line'); // L'élément P parent de la ligne de réduction
        const cartDiscountNameElem = document.getElementById('cart-discount-name');
        const cartDiscountAmountValueElem = document.getElementById('cart-discount-amount-value');
        const cartTotalFinalValueElem = document.getElementById('cart-total-final-value');

        if (subtotalNumericValue > 0) {
            discountAmount = subtotalNumericValue * discountRate;
            finalTotal = subtotalNumericValue - discountAmount;
            if (cartDiscountLineElem) cartDiscountLineElem.style.display = 'block'; // Ou 'flex' si vous utilisez flexbox pour l'alignement interne
            if (cartDiscountNameElem) {
                cartDiscountNameElem.textContent = `${discountShortName} ${discountPercentageText}`;
                cartDiscountNameElem.setAttribute('title', discountFullName);
            }
            if (cartDiscountAmountValueElem) cartDiscountAmountValueElem.textContent = `-${discountAmount.toFixed(2).replace('.', ',')}€`;
        } else {
            if (cartDiscountLineElem) cartDiscountLineElem.style.display = 'none';
        }

        if (cartSubtotalValueElem) cartSubtotalValueElem.textContent = subtotalNumericValue.toFixed(2).replace('.', ',') + '€';
        if (cartTotalFinalValueElem) cartTotalFinalValueElem.textContent = finalTotal.toFixed(2).replace('.', ',') + '€';
        
        saveCartToStorage(currentCartItemsForStorage);

        cartFabBadge.textContent = totalItemsInCart;
        cartFabBadge.classList.toggle('visible', totalItemsInCart > 0);
        
        if (validateCartBtnInModal) validateCartBtnInModal.disabled = !hasItems;
        if (emptyCartBtn) emptyCartBtn.disabled = !hasItems; // Activer/désactiver le bouton Vider
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

    function emptyCurrentCart() {
        if (confirm("Êtes-vous sûr de vouloir vider l'intégralité de votre panier ?")) {
            dishItems.forEach(item => {
                const qtyDisplay = item.querySelector('.qty-value');
                if (qtyDisplay) {
                    qtyDisplay.textContent = '0';
                }
            });
            localStorage.removeItem(MENU_VALIDATED_KEY);
            updateCartDisplay(); // Ceci mettra à jour l'affichage et le localStorage (qui sera vide)
        }
    }
    
    if (emptyCartBtn) {
        emptyCartBtn.addEventListener('click', emptyCurrentCart);
    }
    
    function validateCartAndReturn() {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        if (cartData) {
            const cartItems = JSON.parse(cartData);
            if (cartItems.length > 0) {
                localStorage.setItem(MENU_VALIDATED_KEY, 'true'); 
                alert('Menu validé ! Vous pouvez fermer cet onglet et retourner à la page de réservation.\nVotre sélection sera visible à l\'étape "Menu" et dans le récapitulatif.');
                toggleCartDetailedView(); // Fermer le panier modal
                 // Optionnel: fermer l'onglet si c'est pertinent pour l'UX
                 // window.close(); 
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
            } else if (menuLinks[0]) { // Si aucun n'est actif, activer le premier
                menuLinks[0].classList.add('active'); 
                categoryToShow = menuLinks[0].getAttribute('data-category');
            }
            menuCategories.forEach(category => {
                category.style.display = (category.getAttribute('data-category') === categoryToShow) ? 'block' : 'none';
            });
        }
    }

    // Initialisations
    initializeMenuDisplay();
    loadCartFromStorage(); 

    if (validateCartBtnInModal) {
        validateCartBtnInModal.addEventListener('click', validateCartAndReturn);
    }
});