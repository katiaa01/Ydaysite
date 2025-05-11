document.addEventListener('DOMContentLoaded', function() {
    const menuLinks = document.querySelectorAll('.menu-link');
    const menuCategories = document.querySelectorAll('.menu-category');
    const dishItems = document.querySelectorAll('.dish-item');
    const cartList = document.querySelector('.cart-list');
    const cartTotalElem = document.getElementById('cart-total');
    const CART_STORAGE_KEY = 'restaurantEtoileDorCart'; // Clé unique pour le localStorage
    const MENU_VALIDATED_KEY = 'restaurantEtoileDorMenuValidated'; // Nouvelle clé pour marquer la validation

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
                    // Construire un sélecteur d'attribut qui gère les guillemets et les apostrophes
                    const escapedName = storedItem.name.replace(/"/g, '\\"').replace(/'/g, "\\'");
                    const menuItem = document.querySelector(`.dish-item[data-dish-name="${escapedName}"]`);
                    if (menuItem) {
                        const qtyDisplay = menuItem.querySelector('.qty-value');
                        if (qtyDisplay) {
                            qtyDisplay.textContent = storedItem.quantity;
                        }
                    } else {
                        // console.warn(`Élément du menu non trouvé pour charger depuis localStorage: ${storedItem.name}`);
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
        // Important: Ne pas modifier MENU_VALIDATED_KEY ici. Il est géré par le bouton de validation.
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

        if (plusBtn && minusBtn && qtyDisplay) { // Vérifier que tous les éléments existent
            plusBtn.addEventListener('click', function() {
                let qty = parseInt(qtyDisplay.textContent);
                qty++;
                qtyDisplay.textContent = qty;
                localStorage.removeItem(MENU_VALIDATED_KEY); // Invalider le menu si on le modifie
                updateCartDisplay();
            });

            minusBtn.addEventListener('click', function() {
                let qty = parseInt(qtyDisplay.textContent);
                if (qty > 0) {
                    qty--;
                    qtyDisplay.textContent = qty;
                    localStorage.removeItem(MENU_VALIDATED_KEY); // Invalider le menu si on le modifie
                    updateCartDisplay();
                }
            });
        }
    });

    // --- Gestion du Panier (Affichage et Sauvegarde) ---
    function updateCartDisplay() {
        if (!cartList || !cartTotalElem) return; // S'assurer que les éléments du DOM existent

        cartList.innerHTML = ''; // Vider les éléments précédents
        let total = 0;
        const currentCartItemsForStorage = [];
        let hasItems = false;

        dishItems.forEach(item => {
            const qtyDisplay = item.querySelector('.qty-value');
            if (!qtyDisplay) return; // Passer si l'affichage de quantité n'est pas trouvé

            const qty = parseInt(qtyDisplay.textContent);
            if (qty > 0) {
                hasItems = true;
                const dishName = item.getAttribute('data-dish-name');
                const priceStr = item.getAttribute('data-dish-price');
                let price = 0;
                let priceTypeIsNumeric = true; // Par défaut, on suppose que le prix est numérique

                if (priceStr) {
                    const lowerPriceStr = priceStr.toLowerCase();
                    if (lowerPriceStr === "selon arrivage" || lowerPriceStr === "la paire") {
                        priceTypeIsNumeric = false; // Le prix n'est pas un simple nombre
                    } else {
                        price = parseFloat(String(priceStr).replace('€', '').replace(',', '.').trim());
                    }
                }
                
                if (isNaN(price)) price = 0; 

                if (priceTypeIsNumeric) {
                    total += price * qty;
                }

                currentCartItemsForStorage.push({
                    name: dishName,
                    quantity: qty,
                    price: price, // Prix numérique pour calculs
                    priceDisplay: priceStr // Affichage original du prix (ex: "14,00€", "Selon Arrivage")
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

        cartTotalElem.textContent = total.toFixed(2).replace('.', ',') + '€';
        saveCartToStorage(currentCartItemsForStorage); // Sauvegarder le panier mis à jour

        const validateCartBtn = document.getElementById('validate-cart-btn');
        if (validateCartBtn) {
            validateCartBtn.disabled = !hasItems;
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
            localStorage.removeItem(MENU_VALIDATED_KEY); // Invalider si on modifie
            updateCartDisplay();
        }
    }

    function setMenuQuantity(dishName, quantity) {
        const escapedName = dishName.replace(/"/g, '\\"').replace(/'/g, "\\'");
        const menuItem = document.querySelector(`.dish-item[data-dish-name="${escapedName}"]`);
        if (menuItem) {
            const qtyDisplay = menuItem.querySelector('.qty-value');
            qtyDisplay.textContent = quantity;
            localStorage.removeItem(MENU_VALIDATED_KEY); // Invalider si on modifie
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
                // Optionnel: tenter de fermer l'onglet. Peut être bloqué par le navigateur.
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
            } else if (menuLinks[0]) { // Vérifier que menuLinks[0] existe
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

    const cartAside = document.querySelector('.cart');
    if (cartAside) {
        let validateButton = document.getElementById('validate-cart-btn');
        if (!validateButton) { // Créer le bouton s'il n'existe pas dans le HTML
            validateButton = document.createElement('button');
            validateButton.id = 'validate-cart-btn';
            validateButton.className = 'button-validate-cart'; 
            validateButton.textContent = 'Valider et Retourner à la Réservation';
            cartAside.appendChild(validateButton);
        }
        validateButton.disabled = true; 
        validateButton.addEventListener('click', validateCartAndReturn);
    } else {
        console.error("L'élément .cart n'a pas été trouvé pour ajouter le bouton de validation.");
    }
});