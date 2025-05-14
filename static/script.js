// static/script.js
document.addEventListener('DOMContentLoaded', function() {
    let reservationData = {
        guests: 1,
        date: null,
        time: null,
        meal: 'dinner', 
        selectedMenu: [], // Sera rempli avec les items du panier
        menuTotal: 0 // Stockera le total FINAL du menu après réduction
    };

    const CART_STORAGE_KEY = 'restaurantEtoileDorCart';
    const MENU_VALIDATED_KEY = 'restaurantEtoileDorMenuValidated';

    // Sélections DOM
    const menuItemsNav = document.querySelectorAll('.reservation-menu .menu-item');
    const reservationSteps = document.querySelectorAll('.reservation-step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    
    const guestsCountDisplay = document.getElementById('guests-count');
    const decreaseBtn = document.getElementById('decrease-guests');
    const increaseBtn = document.getElementById('increase-guests');
    const summaryGuests = document.getElementById('summary-guests');

    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthDisplay = document.getElementById('current-month');
    const calendarDaysContainer = document.getElementById('calendar-days');
    const selectedDateDisplaySpan = document.getElementById('selected-date');
    const summaryDate = document.getElementById('summary-date');

    const mealTypeButtons = document.querySelectorAll('.meal-type-btn');
    const currentMealTypeDisplay = document.getElementById('current-meal-type');
    const lunchTimesGrid = document.getElementById('lunch-times');
    const dinnerTimesGrid = document.getElementById('dinner-times');
    const summaryTime = document.getElementById('summary-time');

    const selectedMenuDisplayContainer = document.getElementById('selected-menu-display');
    const viewMenuLink = document.getElementById('view-menu-link');
    const viewMenuLinkText = document.getElementById('view-menu-link-text');
    const menuNote = document.getElementById('menu-note');
    const refreshMenuButton = document.getElementById('refresh-menu-selection');

    // Éléments DOM pour le récapitulatif du menu
    const summaryMenuDetailsSection = document.getElementById('summary-menu-details');
    const summaryMenuContent = document.getElementById('summary-menu-content');
    // Les spans pour sous-total, réduction et total final du récapitulatif sont récupérés dans updateSummaryMenuDOM

    const contactForm = document.getElementById('contact-details-form');
    const completeReservationBtn = document.getElementById('complete-reservation');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeModalBtn = confirmationModal.querySelector('.close-modal');
    const okBtn = confirmationModal.querySelector('.ok-btn');
    const confirmationEmailSpan = document.getElementById('confirmation-email');
    const confirmationNumberSpan = document.getElementById('confirmation-number');

    // ====== 1. Navigation entre les étapes ======
    function showStep(stepIdToShow, fromReload = false) {
        if (!stepIdToShow || typeof stepIdToShow !== 'string' || stepIdToShow.trim() === '') {
            console.error(`showStep appelée avec un stepIdToShow invalide: "${stepIdToShow}". Affichage de 'guests'.`);
            stepIdToShow = 'guests';
        }

        let stepWasDisplayed = false;
        reservationSteps.forEach(step => {
            if (step.id === `${stepIdToShow}-step`) {
                step.style.display = 'block';
                step.style.opacity = 0;
                setTimeout(() => { step.style.opacity = 1; }, 50);
                stepWasDisplayed = true;
            } else {
                step.style.display = 'none';
                step.style.opacity = 0;
            }
        });
        
        if (!stepWasDisplayed) {
            console.error(`Étape "${stepIdToShow}-step" non trouvée. Affichage de 'guests'.`);
            const guestsStepFallback = document.getElementById('guests-step');
            if (guestsStepFallback) {
                guestsStepFallback.style.display = 'block';
                setTimeout(() => { guestsStepFallback.style.opacity = 1; }, 50);
                stepIdToShow = 'guests';
            } else {
                console.error("L'étape 'guests-step' de secours est introuvable.");
                return;
            }
        }

        if (stepIdToShow === 'menu' || stepIdToShow === 'summary' || fromReload) {
            loadAndDisplayMenuFromStorage(); 
        }
        if (stepIdToShow === 'summary') {
            updateFullSummaryDisplay(); // Ceci met à jour les infos générales, le menu est mis à jour par loadAndDisplay...
        }
        
        updateNavigationMenu(stepIdToShow);
    }
    
    function updateNavigationMenu(currentStepId) {
        if (!currentStepId) return;
        const stepOrder = ['guests', 'date', 'placement', 'time', 'menu', 'summary'];
        const currentIndex = stepOrder.indexOf(currentStepId);

        menuItemsNav.forEach(item => {
            const itemStep = item.getAttribute('data-step');
            item.classList.remove('active', 'done');
            const itemIndex = stepOrder.indexOf(itemStep);

            if (itemStep === currentStepId) {
                item.classList.add('active');
            } else if (itemIndex < currentIndex) {
                let stepIsDone = false;
                switch (itemStep) {
                    case 'guests':    stepIsDone = reservationData.guests >= 1; break;
                    case 'date':      stepIsDone = !!reservationData.date; break;
                    case 'placement': stepIsDone = true; break; 
                    case 'time':      stepIsDone = !!reservationData.time; break;
                    case 'menu':      stepIsDone = localStorage.getItem(MENU_VALIDATED_KEY) === 'true' && reservationData.selectedMenu.length > 0; break;
                }
                if (stepIsDone) {
                    item.classList.add('done');
                }
            }
        });
    }
    
    menuItemsNav.forEach(item => {
        item.addEventListener('click', function() {
            const stepToNavigate = this.getAttribute('data-step');
            if (stepToNavigate) showStep(stepToNavigate);
        });
    });
    
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStepElement = this.closest('.reservation-step');
            if (!currentStepElement) return;
            const currentStepId = currentStepElement.id.replace('-step', '');
            const nextStepId = this.getAttribute('data-next');
            if (!nextStepId) return;

            let canProceed = true;
            if (currentStepId === 'guests' && reservationData.guests < 1) {
                alert('Veuillez sélectionner le nombre de couverts.'); canProceed = false;
            } else if (currentStepId === 'date' && !reservationData.date) {
                alert('Veuillez sélectionner une date.'); canProceed = false;
            } else if (currentStepId === 'time' && !reservationData.time) {
                alert('Veuillez sélectionner un horaire.'); canProceed = false;
            } else if (currentStepId === 'menu' && reservationData.selectedMenu.length === 0 && localStorage.getItem(MENU_VALIDATED_KEY) === 'true') {
                // Si le menu a été "validé" mais est vide (par ex. vidé après validation), on peut alerter.
                // Ou permettre de passer si on veut un récap sans menu. Pour l'instant, on laisse passer.
            } else if (currentStepId === 'menu' && localStorage.getItem(MENU_VALIDATED_KEY) !== 'true') {
                 // Si on veut forcer la validation du menu avant de passer au récap.
                 // Pour l'instant, le bouton "Passer au récapitulatif" outrepasse cela.
            }

            if (canProceed) {
                showStep(nextStepId);
            }
        });
    });
    
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStepId = this.getAttribute('data-back');
            if (prevStepId) showStep(prevStepId);
        });
    });

    // ====== 2. Gestion des Couverts ======
    function updateGuestsDisplay() {
        if (guestsCountDisplay) guestsCountDisplay.textContent = reservationData.guests;
        if (summaryGuests) summaryGuests.textContent = reservationData.guests > 0 ? `${reservationData.guests} ${reservationData.guests > 1 ? 'personnes' : 'personne'}` : '-';
        if (decreaseBtn) decreaseBtn.disabled = reservationData.guests <= 1;
    }

    if (decreaseBtn && increaseBtn && guestsCountDisplay) {
        decreaseBtn.addEventListener('click', () => { if(reservationData.guests > 1) { reservationData.guests--; updateGuestsDisplay(); }});
        increaseBtn.addEventListener('click', () => { reservationData.guests++; updateGuestsDisplay(); });
    }
    
    // ====== 3. Gestion de la Date (Calendrier) ======
    let calendarDate = new Date();
    let calCurrentMonth = calendarDate.getMonth();
    let calCurrentYear = calendarDate.getFullYear();
    
    function initCalendar() {
        if (!currentMonthDisplay || !calendarDaysContainer || !prevMonthBtn || !nextMonthBtn) return;
        updateCalendarHeader(); generateCalendarDays();
    }
    function updateCalendar() { updateCalendarHeader(); generateCalendarDays(); }
    function updateCalendarHeader() {
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        if (currentMonthDisplay) currentMonthDisplay.textContent = `${months[calCurrentMonth]} ${calCurrentYear}`;
    }
    function generateCalendarDays() {
        if (!calendarDaysContainer) return;
        calendarDaysContainer.innerHTML = '';
        let firstDayOfMonth = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
        firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Lundi = 0
        const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
        const todayFull = new Date(); todayFull.setHours(0,0,0,0);
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div'); emptyDay.classList.add('day', 'empty'); calendarDaysContainer.appendChild(emptyDay);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div'); dayElement.classList.add('day'); dayElement.textContent = day;
            const currentLoopDate = new Date(calCurrentYear, calCurrentMonth, day);
            const isPastDate = currentLoopDate < todayFull;

            if (currentLoopDate.getTime() === todayFull.getTime()) { dayElement.classList.add('today'); }
            if (isPastDate) { dayElement.classList.add('disabled'); } 
            else {
                dayElement.addEventListener('click', function() {
                    document.querySelectorAll('#calendar-days .day.selected').forEach(d => d.classList.remove('selected'));
                    this.classList.add('selected');
                    reservationData.date = new Date(calCurrentYear, calCurrentMonth, day);
                    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                    const formattedDate = reservationData.date.toLocaleDateString('fr-FR', options);
                    if (selectedDateDisplaySpan) selectedDateDisplaySpan.textContent = formattedDate;
                    if (summaryDate) summaryDate.textContent = formattedDate;
                });
            }
            if (reservationData.date && day === reservationData.date.getDate() && calCurrentMonth === reservationData.date.getMonth() && calCurrentYear === reservationData.date.getFullYear() && !isPastDate) {
                dayElement.classList.add('selected');
            }
            calendarDaysContainer.appendChild(dayElement);
        }
    }
    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', () => { calCurrentMonth--; if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; } updateCalendar(); });
        nextMonthBtn.addEventListener('click', () => { calCurrentMonth++; if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; } updateCalendar(); });
    }

    // ====== 4. Gestion de l'Horaire ======
    function initializeTimeStep() {
        const activeMealBtn = document.querySelector('.meal-type-btn.active');
        if (activeMealBtn) {
            reservationData.meal = activeMealBtn.getAttribute('data-meal');
            if (currentMealTypeDisplay) currentMealTypeDisplay.textContent = activeMealBtn.textContent;
            if (lunchTimesGrid) lunchTimesGrid.style.display = reservationData.meal === 'lunch' ? 'grid' : 'none';
            if (dinnerTimesGrid) dinnerTimesGrid.style.display = reservationData.meal === 'dinner' ? 'grid' : 'none';
        } else if (mealTypeButtons.length > 0) { // Si aucun n'est actif par défaut, activer le premier (ou 'dinner' comme avant)
            const defaultMeal = Array.from(mealTypeButtons).find(btn => btn.getAttribute('data-meal') === 'dinner') || mealTypeButtons[0];
            if (defaultMeal) {
                defaultMeal.classList.add('active'); 
                initializeTimeStep(); // Relancer pour appliquer l'état
            }
        }
    }
    if (mealTypeButtons.length > 0) {
        initializeTimeStep(); // Appeler une fois pour configurer l'état initial
        mealTypeButtons.forEach(button => {
            button.addEventListener('click', function() {
                mealTypeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const mealType = this.getAttribute('data-meal');
                reservationData.meal = mealType;
                if (currentMealTypeDisplay) currentMealTypeDisplay.textContent = this.textContent;
                if (lunchTimesGrid) lunchTimesGrid.style.display = mealType === 'lunch' ? 'grid' : 'none';
                if (dinnerTimesGrid) dinnerTimesGrid.style.display = mealType === 'dinner' ? 'grid' : 'none';
                // Réinitialiser la sélection d'heure si le type de repas change
                document.querySelectorAll('.time-slot.active').forEach(slot => slot.classList.remove('active'));
                reservationData.time = null;
                if (summaryTime) summaryTime.textContent = '-';
            });
        });
    }
    function attachTimeSlotListeners() {
        const allTimeSlots = document.querySelectorAll('.time-slot');
        allTimeSlots.forEach(slot => {
            slot.addEventListener('click', function() {
                allTimeSlots.forEach(s => s.classList.remove('active')); // Désélectionner tous les autres
                this.classList.add('active');
                reservationData.time = this.getAttribute('data-time');
                if (summaryTime) summaryTime.textContent = reservationData.time;
            });
        });
    }

    // ====== 5. Gestion du Menu ======
    function loadAndDisplayMenuFromStorage() {
        const menuValidated = localStorage.getItem(MENU_VALIDATED_KEY);
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    
        if (!selectedMenuDisplayContainer) return;
    
        if (menuValidated === 'true' && storedCart) {
            try {
                const cartItems = JSON.parse(storedCart);
                reservationData.selectedMenu = cartItems; // Mettre à jour les données de réservation
                let calculatedMenuSubtotal = 0;
    
                let listContentMenuStep = '';
                if (cartItems.length > 0) {
                    cartItems.forEach(item => {
                        let itemPriceText = '';
                        if (item.priceDisplay && typeof item.priceDisplay === 'string') {
                            const lowerPriceDisplay = item.priceDisplay.toLowerCase();
                            if (lowerPriceDisplay === "selon arrivage" || lowerPriceDisplay === "la paire") {
                                itemPriceText = `(${item.quantity} x ${item.priceDisplay})`;
                            } else {
                                if (typeof item.price === 'number' && typeof item.quantity === 'number') {
                                    calculatedMenuSubtotal += item.price * item.quantity;
                                    itemPriceText = `(${item.quantity} x ${item.priceDisplay}) = ${(item.price * item.quantity).toFixed(2).replace('.', ',')}€`;
                                } else {
                                     itemPriceText = `(${item.quantity} x ${item.priceDisplay}) - Erreur prix`; // Cas d'erreur
                                }
                            }
                        }
                        listContentMenuStep += `<li>${item.name} ${itemPriceText}</li>`;
                    });
    
                    const discountRate = 0.10;
                    const discountShortName = "Réduction Save & Serve";
                    const discountFullName = "Bénéficiez de votre réduction Save & Serve";
                    const discountPercentageText = "(-10%)";
                    let discountAmountMenuStep = 0;
                    let finalTotalMenuStep = calculatedMenuSubtotal;
    
                    if (calculatedMenuSubtotal > 0) {
                        discountAmountMenuStep = calculatedMenuSubtotal * discountRate;
                        finalTotalMenuStep = calculatedMenuSubtotal - discountAmountMenuStep;
                    }
                    reservationData.menuTotal = finalTotalMenuStep;
    
                    selectedMenuDisplayContainer.innerHTML = '<h4>Votre sélection actuelle :</h4><ul class="selected-menu-list">' + listContentMenuStep + '</ul>';
                    
                    const subtotalP = document.createElement('p');
                    subtotalP.className = 'menu-step-subtotal-line';
                    subtotalP.innerHTML = `Sous-total: <span id="menu-step-subtotal-value">${calculatedMenuSubtotal.toFixed(2).replace('.', ',')}€</span>`;
                    selectedMenuDisplayContainer.appendChild(subtotalP);
    
                    const discountP = document.createElement('p');
                    discountP.className = 'menu-step-discount-line';
                    discountP.style.fontSize = '0.9em';
                    discountP.style.color = 'green';
                    discountP.style.display = (calculatedMenuSubtotal > 0 && discountAmountMenuStep > 0) ? 'block' : 'none'; // Ou 'flex'
                    discountP.innerHTML = `<span id="menu-step-discount-name" title="${discountFullName}">${discountShortName} ${discountPercentageText}</span> : <span id="menu-step-discount-amount-value">-${discountAmountMenuStep.toFixed(2).replace('.', ',')}€</span>`;
                    selectedMenuDisplayContainer.appendChild(discountP);
    
                    const totalFinalP = document.createElement('p');
                    totalFinalP.className = 'menu-step-total-final-line';
                    totalFinalP.innerHTML = `<strong>Total Menu: <span id="menu-step-total-final-value">${finalTotalMenuStep.toFixed(2).replace('.', ',')}€</span></strong>`;
                    selectedMenuDisplayContainer.appendChild(totalFinalP);
    
                    if (viewMenuLinkText) viewMenuLinkText.textContent = 'Modifier le Menu';
                    if (menuNote) menuNote.textContent = 'Votre menu a été importé. Cliquez sur "Modifier le Menu" ou "Actualiser" si besoin.';
                    
                    updateSummaryMenuDOM(cartItems, calculatedMenuSubtotal);
                } else {
                    resetMenuDisplayInReservation("Le panier que vous avez validé est vide. Cliquez sur 'Voir le Menu Complet' pour faire une sélection.");
                }
            } catch (e) {
                console.error("Erreur lors du chargement du menu depuis localStorage :", e);
                resetMenuDisplayInReservation("Erreur lors du chargement de votre menu. Veuillez réessayer.");
            }
        } else {
            resetMenuDisplayInReservation("Vous n'avez pas encore validé de menu. Cliquez sur 'Voir le Menu Complet'.");
        }
    }

    function resetMenuDisplayInReservation(message) {
        if (selectedMenuDisplayContainer) {
            selectedMenuDisplayContainer.innerHTML = `<p class="step-description">${message}</p>`;
        }
        if (viewMenuLinkText) viewMenuLinkText.textContent = 'Voir le Menu Complet';
        if (menuNote) menuNote.textContent = 'Note : La sélection de plats se fait sur la page du menu. Validez votre panier là-bas pour qu\'il apparaisse ici. Utilisez le bouton "Actualiser" après validation.';
        reservationData.selectedMenu = [];
        reservationData.menuTotal = 0;
        updateSummaryMenuDOM([], 0); // Met à jour le récap avec un panier vide et sous-total de 0
    }

    function updateSummaryMenuDOM(cartItems, menuSubtotalValue) {
        if (!summaryMenuContent || !summaryMenuDetailsSection) return;
    
        summaryMenuDetailsSection.style.display = cartItems.length > 0 ? 'block' : 'none';
    
        if (cartItems.length > 0) {
            summaryMenuContent.innerHTML = '<ul class="summary-menu-items-list"></ul>';
            const listElementSummary = summaryMenuContent.querySelector('.summary-menu-items-list');
            cartItems.forEach(item => {
                const listItem = document.createElement('li');
                let itemDetailsText = `(${item.quantity} x ${item.priceDisplay})`;
                // Pour éviter (1 x Selon Arrivage) = NaN€
                 if (item.priceDisplay && typeof item.priceDisplay === 'string') {
                    const lowerPriceDisplay = item.priceDisplay.toLowerCase();
                    if (!(lowerPriceDisplay === "selon arrivage" || lowerPriceDisplay === "la paire")) {
                        if (typeof item.price === 'number' && typeof item.quantity === 'number') {
                             itemDetailsText += ` = ${(item.price * item.quantity).toFixed(2).replace('.', ',')}€`;
                        }
                    }
                }
                listItem.innerHTML = `<span>${item.name}</span> <span style="font-style: italic; font-size: 0.9em;">${itemDetailsText}</span>`;
                listElementSummary.appendChild(listItem);
            });
        } else {
            summaryMenuContent.innerHTML = '<p>Aucun menu sélectionné.</p>';
        }
    
        const discountRate = 0.10;
        const discountShortName = "Réduction Save & Serve";
        const discountFullName = "Bénéficiez de votre réduction Save & Serve";
        const discountPercentageText = "(-10%)";
        let discountAmountSummary = 0;
        let finalTotalSummary = menuSubtotalValue;
    
        const summaryMenuSubtotalValueElem = document.getElementById('summary-menu-subtotal-value');
        const summaryMenuDiscountLineElem = document.querySelector('#summary-menu-details .summary-menu-discount-line'); // Cibler plus spécifiquement
        const summaryMenuDiscountNameElem = document.getElementById('summary-menu-discount-name');
        const summaryMenuDiscountAmountValueElem = document.getElementById('summary-menu-discount-amount-value');
        const summaryMenuTotalFinalValueElem = document.getElementById('summary-menu-total-final-value');
    
        if (menuSubtotalValue > 0) {
            discountAmountSummary = menuSubtotalValue * discountRate;
            finalTotalSummary = menuSubtotalValue - discountAmountSummary;
            if (summaryMenuDiscountLineElem) summaryMenuDiscountLineElem.style.display = 'block'; // Ou 'flex'
            if (summaryMenuDiscountNameElem) {
                 summaryMenuDiscountNameElem.textContent = `${discountShortName} ${discountPercentageText}`;
                 summaryMenuDiscountNameElem.setAttribute('title', discountFullName);
            }
            if (summaryMenuDiscountAmountValueElem) summaryMenuDiscountAmountValueElem.textContent = `-${discountAmountSummary.toFixed(2).replace('.', ',')}€`;
        } else {
            if (summaryMenuDiscountLineElem) summaryMenuDiscountLineElem.style.display = 'none';
        }
    
        if (summaryMenuSubtotalValueElem) summaryMenuSubtotalValueElem.textContent = `${menuSubtotalValue.toFixed(2).replace('.', ',')}€`;
        if (summaryMenuTotalFinalValueElem) summaryMenuTotalFinalValueElem.textContent = `${finalTotalSummary.toFixed(2).replace('.', ',')}€`;
    }
    
    if (refreshMenuButton) {
        refreshMenuButton.addEventListener('click', function() {
            // Forcer le rechargement de la page et aller à l'ancre de l'étape menu
            window.location.hash = 'menu-step-anchor'; // Ajoute une ancre (ne fonctionnera pas directement pour showStep au rechargement sans logique supplémentaire)
            window.location.reload(); 
            // La logique pour gérer #menu-step-anchor est dans handlePageReloadForMenuStep
        });
    }

    function handlePageReloadForMenuStep() {
        if (window.location.hash === '#menu-step-anchor') {
            showStep('menu', true); // 'true' indique que c'est après un rechargement
            // Nettoyer l'ancre de l'URL pour éviter des rechargements répétés sur cette étape
            if (history.pushState) { // Vérifier si pushState est supporté
                history.pushState("", document.title, window.location.pathname + window.location.search);
            } else { // Fallback pour navigateurs plus anciens
                window.location.hash = ''; 
            }
        } else {
            // Comportement normal au premier chargement de la page
            if (document.getElementById('guests-step')) { // S'assurer que l'étape existe
                 showStep('guests'); // Afficher la première étape par défaut
            } else {
                console.error("L'étape initiale 'guests-step' est introuvable ! La page risque de ne pas s'afficher correctement.");
            }
        }
    }
    
    // Réactualiser le menu si l'utilisateur revient sur l'onglet (au cas où il aurait validé le menu dans un autre onglet)
    window.addEventListener('focus', function() {
        const currentVisibleStep = Array.from(reservationSteps).find(step => step.style.display === 'block' || step.style.display === '');
        if (currentVisibleStep) {
            const currentStepId = currentVisibleStep.id.replace('-step', '');
            if (currentStepId === 'menu' || currentStepId === 'summary') {
                loadAndDisplayMenuFromStorage();
            }
        }
    });
    
    // ====== 6. Récapitulatif et Confirmation ======
    function updateFullSummaryDisplay() {
        if (summaryGuests) summaryGuests.textContent = reservationData.guests > 0 ? `${reservationData.guests} ${reservationData.guests > 1 ? 'personnes' : 'personne'}` : '-';
        if (summaryDate && reservationData.date) {
             const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
             summaryDate.textContent = reservationData.date.toLocaleDateString('fr-FR', options);
        } else if (summaryDate) { summaryDate.textContent = "-"; } // Si pas de date
        if (summaryTime) summaryTime.textContent = reservationData.time || '-';
        // La partie menu du récapitulatif est mise à jour via loadAndDisplayMenuFromStorage -> updateSummaryMenuDOM
    }

    if (completeReservationBtn) {
        completeReservationBtn.addEventListener('click', function(event) {
            event.preventDefault(); 
            const nameInput = document.getElementById('name'); 
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone'); 
            const privacyCheckbox = document.getElementById('privacy');
            
            if (!nameInput || !emailInput || !phoneInput || !privacyCheckbox) {
                console.error("Un ou plusieurs champs du formulaire de contact sont manquants.");
                alert("Erreur de configuration du formulaire. Veuillez contacter le support.");
                return;
            }

            const name = nameInput.value.trim(); 
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim(); 
            const privacy = privacyCheckbox.checked;

            // Validations
            if (!name || !email || !phone) { alert('Veuillez remplir tous les champs de coordonnées (Nom, Email, Téléphone).'); return; }
            if (!privacy) { alert('Veuillez accepter la politique de confidentialité pour continuer.'); return; }
            // Validation simple de l'email
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('L\'adresse email saisie n\'est pas valide.'); return; }
            // Validation du numéro de téléphone français (assez permissive)
            if (!/^((\+)33|0)[1-9](\d{2}){4}$/.test(phone.replace(/\s/g, ''))) { alert('Le numéro de téléphone saisi n\'est pas valide.'); return; }
            
            // Vérifier les infos de réservation de base
            if (reservationData.guests < 1 || !reservationData.date || !reservationData.time) {
                alert('Des informations de réservation essentielles (couverts, date, ou heure) sont manquantes. Veuillez vérifier les étapes précédentes.');
                showStep('guests'); // Ramener à la première étape si des infos manquent
                return;
            }

            // Ici, vous enverriez normalement les données au serveur.
            console.log("Données de réservation à envoyer:", {
                ...reservationData,
                contact: { name, email, phone, specialRequests: document.getElementById('special-requests').value }
            });

            const confirmationNumber = generateConfirmationNumber();
            if (confirmationEmailSpan) confirmationEmailSpan.textContent = email;
            if (confirmationNumberSpan) confirmationNumberSpan.textContent = confirmationNumber;
            if (confirmationModal) confirmationModal.style.display = 'flex'; // Afficher la modale
        });
    }

    function generateConfirmationNumber() {
        const d=new Date();return `EDR-${d.getFullYear().toString().slice(-2)}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`;
    }

    if (closeModalBtn) { closeModalBtn.addEventListener('click', () => { if (confirmationModal) confirmationModal.style.display = 'none'; }); }
    
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            if (confirmationModal) confirmationModal.style.display = 'none';
            // Réinitialiser le formulaire et les données de réservation
            if(contactForm) contactForm.reset();
            reservationData = { guests: 1, date: null, time: null, meal: 'dinner', selectedMenu: [], menuTotal: 0 };
            
            updateGuestsDisplay(); // Mettre à jour l'affichage des couverts
            
            // Réinitialiser le calendrier
            document.querySelectorAll('#calendar-days .day.selected').forEach(d => d.classList.remove('selected'));
            if(selectedDateDisplaySpan) selectedDateDisplaySpan.textContent = "Aucune";
            // Pas besoin de réinitialiser calCurrentMonth/Year ici, initCalendar s'en charge si on le rappelle
            
            // Réinitialiser l'horaire
            document.querySelectorAll('.time-slot.active').forEach(s => s.classList.remove('active'));
            initializeTimeStep(); // Pour remettre Déjeuner/Dîner à son état par défaut et effacer l'heure sélectionnée
            
            // Nettoyer le localStorage lié au menu
            localStorage.removeItem(CART_STORAGE_KEY); 
            localStorage.removeItem(MENU_VALIDATED_KEY);
            resetMenuDisplayInReservation("Vous n'avez pas encore validé de menu."); // Réinitialiser l'affichage du menu
            
            showStep('guests'); // Retourner à la première étape
        });
    }

    // Fermer la modale si on clique en dehors
    window.addEventListener('click', (event) => { 
        if (event.target === confirmationModal) { 
            if (confirmationModal) confirmationModal.style.display = 'none'; 
        } 
    });

    // --- Initialisation au chargement de la page ---
    if (reservationSteps.length > 0 && menuItemsNav.length > 0 && confirmationModal) {
        updateGuestsDisplay();
        initCalendar();
        attachTimeSlotListeners();
        initializeTimeStep(); 
        handlePageReloadForMenuStep(); // Gère l'affichage de la bonne étape au rechargement (y compris avec ancre)
    } else {
        console.error("Impossible d'initialiser le script de réservation : des éléments DOM structurels sont manquants.");
    }
});