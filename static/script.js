document.addEventListener('DOMContentLoaded', function() {
    // Variables pour stocker les informations de réservation
    let reservationData = {
        guests: 1, // Initialisé à 1
        date: null,
        time: null,
        meal: 'dinner', // Valeur par défaut, peut être ajustée si le premier bouton actif est différent
        selectedMenu: [] // Pour stocker le menu choisi
    };

    // Clés localStorage
    const CART_STORAGE_KEY = 'restaurantEtoileDorCart';
    const MENU_VALIDATED_KEY = 'restaurantEtoileDorMenuValidated';

    // Éléments DOM
    const menuItemsNav = document.querySelectorAll('.reservation-menu .menu-item'); // Renommé pour clarté
    const reservationSteps = document.querySelectorAll('.reservation-step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    
    // Étape Couverts
    const guestsCountDisplay = document.getElementById('guests-count'); // Renommé pour clarté
    const decreaseBtn = document.getElementById('decrease-guests');
    const increaseBtn = document.getElementById('increase-guests');
    const summaryGuests = document.getElementById('summary-guests');

    // Étape Date
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthDisplay = document.getElementById('current-month'); // Renommé pour clarté
    const calendarDaysContainer = document.getElementById('calendar-days'); // Renommé pour clarté
    const selectedDateDisplay = document.getElementById('selected-date');
    const summaryDate = document.getElementById('summary-date');

    // Étape Horaire
    const mealTypeButtons = document.querySelectorAll('.meal-type-btn');
    const currentMealTypeDisplay = document.getElementById('current-meal-type'); // Renommé pour clarté
    const lunchTimesGrid = document.getElementById('lunch-times'); // Renommé pour clarté
    const dinnerTimesGrid = document.getElementById('dinner-times'); // Renommé pour clarté
    // const timeSlots = document.querySelectorAll('.time-slot'); // On les récupère dynamiquement car ils sont dans des grilles cachées
    const summaryTime = document.getElementById('summary-time');

    // Étape Menu
    const selectedMenuDisplayContainer = document.getElementById('selected-menu-display'); // Renommé pour clarté
    const viewMenuLink = document.getElementById('view-menu-link');
    const viewMenuLinkText = document.getElementById('view-menu-link-text');
    const menuNote = document.getElementById('menu-note');

    // Étape Récapitulatif
    const summaryMenuContent = document.getElementById('summary-menu-content');
    const summaryMenuTotal = document.getElementById('summary-menu-total');

    // Formulaire et Modal
    const contactForm = document.getElementById('contact-details-form'); // Cibler le formulaire
    const completeReservationBtn = document.getElementById('complete-reservation');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeModalBtn = confirmationModal.querySelector('.close-modal');
    const okBtn = confirmationModal.querySelector('.ok-btn');
    const confirmationEmailSpan = document.getElementById('confirmation-email');
    const confirmationNumberSpan = document.getElementById('confirmation-number');


    // ====== 1. Navigation entre les étapes ======
    function showStep(stepIdToShow) {
        reservationSteps.forEach(step => {
            step.style.display = 'none';
            step.style.opacity = 0; // Pour l'animation
        });
        
        const targetStep = document.getElementById(`${stepIdToShow}-step`);
        if (targetStep) {
            targetStep.style.display = 'block';
            setTimeout(() => { // Délai pour l'animation d'opacité
                targetStep.style.opacity = 1;
            }, 50);

            if (stepIdToShow === 'menu' || stepIdToShow === 'summary') {
                displaySelectedMenuInReservation();
            }
            if (stepIdToShow === 'summary') {
                // Assurer que les autres infos du récap sont à jour
                if (summaryGuests) summaryGuests.textContent = reservationData.guests > 0 ? `${reservationData.guests} ${reservationData.guests > 1 ? 'personnes' : 'personne'}` : '-';
                if (summaryDate && reservationData.date) {
                     const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                     summaryDate.textContent = reservationData.date.toLocaleDateString('fr-FR', options);
                } else if (summaryDate) {
                    summaryDate.textContent = "-";
                }
                if (summaryTime) summaryTime.textContent = reservationData.time || '-';
            }
        }
        updateNavigationMenu(stepIdToShow);
    }
    
    function updateNavigationMenu(currentStepId) {
        const stepOrder = ['guests', 'date', 'placement', 'time', 'menu', 'summary'];
        const currentIndex = stepOrder.indexOf(currentStepId);

        menuItemsNav.forEach(item => {
            const itemStep = item.getAttribute('data-step');
            item.classList.remove('active', 'done');
            
            const itemIndex = stepOrder.indexOf(itemStep);

            if (itemStep === currentStepId) {
                item.classList.add('active');
            } else if (itemIndex < currentIndex) {
                // Vérifier si l'étape précédente est réellement complétée
                let previousStepCompleted = true;
                if (itemStep === 'guests' && reservationData.guests < 1) previousStepCompleted = false;
                if (itemStep === 'date' && !reservationData.date) previousStepCompleted = false;
                // Placement est optionnel/pas de validation de donnée
                if (itemStep === 'time' && !reservationData.time) previousStepCompleted = false;
                // Menu est optionnel
                
                if(previousStepCompleted) item.classList.add('done');
            }
        });
    }
    
    menuItemsNav.forEach(item => {
        item.addEventListener('click', function() {
            const stepToNavigate = this.getAttribute('data-step');
            // Ajouter ici des vérifications si on veut empêcher la navigation directe
            // sans que les étapes précédentes soient remplies.
            // Pour l'instant, on permet la navigation directe.
            showStep(stepToNavigate);
        });
    });
    
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStepId = this.closest('.reservation-step').id.replace('-step', '');
            const nextStepId = this.getAttribute('data-next');
            
            let canProceed = true;
            if (currentStepId === 'guests' && reservationData.guests < 1) {
                alert('Veuillez sélectionner le nombre de couverts.');
                canProceed = false;
            }
            if (currentStepId === 'date' && !reservationData.date) {
                alert('Veuillez sélectionner une date.');
                canProceed = false;
            }
            // Placement n'a pas de validation de donnée
            if (currentStepId === 'time' && !reservationData.time) {
                alert('Veuillez sélectionner un horaire.');
                canProceed = false;
            }
            // Menu est optionnel, pas de blocage

            if (canProceed) {
                showStep(nextStepId);
            }
        });
    });
    
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStepId = this.getAttribute('data-back');
            showStep(prevStepId);
        });
    });

    // ====== 2. Sélection du nombre de couverts ======
    function updateGuestsDisplay() {
        if (guestsCountDisplay) guestsCountDisplay.textContent = reservationData.guests;
        if (summaryGuests) summaryGuests.textContent = reservationData.guests > 0 ? `${reservationData.guests} ${reservationData.guests > 1 ? 'personnes' : 'personne'}` : '-';
        
        if (decreaseBtn) decreaseBtn.disabled = reservationData.guests <= 1;
        // Mettre une limite max si besoin, ex: increaseBtn.disabled = reservationData.guests >= 10;
    }

    if (decreaseBtn && increaseBtn && guestsCountDisplay) {
        decreaseBtn.addEventListener('click', () => {
            if(reservationData.guests > 1) {
                reservationData.guests--;
                updateGuestsDisplay();
            }
        });
        increaseBtn.addEventListener('click', () => {
            // Ajouter une limite max si vous le souhaitez
            // if(reservationData.guests < 10) { 
            reservationData.guests++;
            updateGuestsDisplay();
            // }
        });
    }
    
    // ====== 3. Sélection de la date (Calendrier) ======
    let calendarDate = new Date(); // Renommé pour éviter conflit avec reservationData.date
    let calCurrentMonth = calendarDate.getMonth();
    let calCurrentYear = calendarDate.getFullYear();
    
    function initCalendar() {
        if (!currentMonthDisplay || !calendarDaysContainer || !prevMonthBtn || !nextMonthBtn) return;
        updateCalendarHeader();
        generateCalendarDays();
    }
    
    function updateCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
    }
    
    function updateCalendarHeader() {
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        if (currentMonthDisplay) currentMonthDisplay.textContent = `${months[calCurrentMonth]} ${calCurrentYear}`;
    }
    
    function generateCalendarDays() {
        if (!calendarDaysContainer) return;
        calendarDaysContainer.innerHTML = '';
        
        let firstDayOfMonth = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
        firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        
        const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty');
            calendarDaysContainer.appendChild(emptyDay);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = day;
            
            const currentLoopDate = new Date(calCurrentYear, calCurrentMonth, day);
            const isPastDate = currentLoopDate < new Date(todayYear, todayMonth, todayDay);

            if (day === todayDay && calCurrentMonth === todayMonth && calCurrentYear === todayYear) {
                dayElement.classList.add('today');
            }
            
            if (isPastDate) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', function() {
                    document.querySelectorAll('#calendar-days .day').forEach(d => d.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    reservationData.date = new Date(calCurrentYear, calCurrentMonth, day);
                    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                    const formattedDate = reservationData.date.toLocaleDateString('fr-FR', options);
                    if (selectedDateDisplay) selectedDateDisplay.textContent = formattedDate;
                    if (summaryDate) summaryDate.textContent = formattedDate;
                });
            }
            // Si une date a déjà été sélectionnée et correspond à ce jour, la marquer comme sélectionnée
            if (reservationData.date && 
                day === reservationData.date.getDate() &&
                calCurrentMonth === reservationData.date.getMonth() &&
                calCurrentYear === reservationData.date.getFullYear() &&
                !isPastDate) {
                dayElement.classList.add('selected');
            }
            calendarDaysContainer.appendChild(dayElement);
        }
    }

    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            calCurrentMonth--;
            if (calCurrentMonth < 0) {
                calCurrentMonth = 11;
                calCurrentYear--;
            }
            updateCalendar();
        });
        nextMonthBtn.addEventListener('click', function() {
            calCurrentMonth++;
            if (calCurrentMonth > 11) {
                calCurrentMonth = 0;
                calCurrentYear++;
            }
            updateCalendar();
        });
    }

    // ====== 4. Sélection de l'horaire ======
    if (mealTypeButtons.length > 0) {
        // Activer le premier bouton par défaut (ex: Dîner)
        const defaultActiveMealBtn = Array.from(mealTypeButtons).find(btn => btn.getAttribute('data-meal') === reservationData.meal) || mealTypeButtons[0];
        defaultActiveMealBtn.classList.add('active');
        if (currentMealTypeDisplay) currentMealTypeDisplay.textContent = defaultActiveMealBtn.textContent;
        if (reservationData.meal === 'lunch' && lunchTimesGrid) lunchTimesGrid.style.display = 'grid';
        else if (dinnerTimesGrid) dinnerTimesGrid.style.display = 'grid';


        mealTypeButtons.forEach(button => {
            button.addEventListener('click', function() {
                mealTypeButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const mealType = this.getAttribute('data-meal');
                reservationData.meal = mealType;
                
                if (currentMealTypeDisplay) currentMealTypeDisplay.textContent = this.textContent;
                
                if (lunchTimesGrid) lunchTimesGrid.style.display = mealType === 'lunch' ? 'grid' : 'none';
                if (dinnerTimesGrid) dinnerTimesGrid.style.display = mealType === 'dinner' ? 'grid' : 'none';
                
                document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('active'));
                reservationData.time = null;
                if (summaryTime) summaryTime.textContent = '-';
            });
        });
    }
    
    // Sélection des créneaux horaires (doit être délégué ou ré-attaché si les grilles sont cachées/affichées)
    function attachTimeSlotListeners() {
        const allTimeSlots = document.querySelectorAll('.time-slot');
        allTimeSlots.forEach(slot => {
            // Pour éviter d'ajouter plusieurs listeners, on peut enlever les anciens d'abord
            // C'est plus simple de les attacher une fois si les éléments sont toujours dans le DOM
            // ou d'utiliser la délégation d'événements sur .time-grid
            slot.addEventListener('click', function() {
                allTimeSlots.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                reservationData.time = this.getAttribute('data-time');
                if (summaryTime) summaryTime.textContent = reservationData.time;
            });
        });
    }
    attachTimeSlotListeners(); // Appeler une fois au chargement

    // ====== 5. Gestion de l'affichage du menu sélectionné ======
    function displaySelectedMenuInReservation() {
        const menuValidated = localStorage.getItem(MENU_VALIDATED_KEY);
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);

        if (!selectedMenuDisplayContainer || !summaryMenuContent || !summaryMenuTotal) return;

        if (menuValidated === 'true' && storedCart) {
            try {
                const cartItems = JSON.parse(storedCart);
                reservationData.selectedMenu = cartItems;

                if (cartItems.length > 0) {
                    selectedMenuDisplayContainer.innerHTML = '<h4>Votre sélection :</h4><ul class="selected-menu-list"></ul>';
                    const listElement = selectedMenuDisplayContainer.querySelector('.selected-menu-list');
                    let menuTotal = 0;

                    cartItems.forEach(item => {
                        const listItem = document.createElement('li');
                        let itemPriceText = '';
                        let itemTotal = 0;

                        // Utiliser priceDisplay pour l'affichage du prix unitaire, price pour le calcul
                        if (item.priceDisplay && typeof item.priceDisplay === 'string') {
                            const lowerPriceDisplay = item.priceDisplay.toLowerCase();
                            if (lowerPriceDisplay === "selon arrivage" || lowerPriceDisplay === "la paire") {
                                itemPriceText = `(${item.quantity} x ${item.priceDisplay})`;
                                // Pas de calcul de total pour ces items
                            } else { // C'est un prix numérique
                                itemTotal = item.price * item.quantity;
                                menuTotal += itemTotal;
                                itemPriceText = `(${item.quantity} x ${item.priceDisplay}) = ${itemTotal.toFixed(2).replace('.',',')}€`;
                            }
                        }
                        listItem.textContent = `${item.name} ${itemPriceText}`;
                        listElement.appendChild(listItem);
                    });

                    const totalP = document.createElement('p');
                    totalP.innerHTML = `<strong>Total Menu : ${menuTotal.toFixed(2).replace('.',',')}€</strong>`;
                    selectedMenuDisplayContainer.appendChild(totalP);

                    if (viewMenuLinkText) viewMenuLinkText.textContent = 'Modifier le Menu';
                    if (menuNote) menuNote.textContent = 'Votre menu a été importé. Cliquez sur "Modifier le Menu" pour le changer.';
                    
                    updateSummaryMenuDOM(cartItems, menuTotal);
                } else {
                    resetMenuDisplayInReservation("Le panier validé est vide.");
                }
            } catch (e) {
                console.error("Erreur de parsing du panier pour l'affichage dans la réservation:", e);
                resetMenuDisplayInReservation("Erreur lors du chargement du menu.");
            }
        } else {
            resetMenuDisplayInReservation("Vous n'avez pas encore validé de menu.");
        }
    }

    function resetMenuDisplayInReservation(message) {
        if (selectedMenuDisplayContainer) selectedMenuDisplayContainer.innerHTML = `<p class="step-description">${message}</p>`;
        if (viewMenuLinkText) viewMenuLinkText.textContent = 'Voir le Menu Complet';
        if (menuNote) menuNote.textContent = 'Note : La sélection de plats se fait sur la page du menu. Validez votre panier là-bas pour qu\'il apparaisse ici.';
        reservationData.selectedMenu = [];
        updateSummaryMenuDOM([], 0);
    }

    function updateSummaryMenuDOM(cartItems, menuTotal) {
        if (summaryMenuContent) {
            if (cartItems.length > 0) {
                summaryMenuContent.innerHTML = '<ul class="summary-menu-items-list"></ul>';
                const listElement = summaryMenuContent.querySelector('.summary-menu-items-list');
                cartItems.forEach(item => {
                    const listItem = document.createElement('li');
                    let itemDetailsText = `(${item.quantity} x ${item.priceDisplay})`;
                    listItem.innerHTML = `<span>${item.name}</span> <span style="font-style: italic; font-size: 0.9em;">${itemDetailsText}</span>`;
                    listElement.appendChild(listItem);
                });
            } else {
                summaryMenuContent.innerHTML = '<p>Aucun menu sélectionné.</p>';
            }
        }
        if (summaryMenuTotal) summaryMenuTotal.textContent = `${menuTotal.toFixed(2).replace('.',',')}€`;
    }
    
    window.addEventListener('focus', function() {
        const currentVisibleStep = Array.from(reservationSteps).find(step => step.style.display === 'block');
        if (currentVisibleStep) {
            const currentStepId = currentVisibleStep.id.replace('-step', '');
            if (currentStepId === 'menu' || currentStepId === 'summary') {
                displaySelectedMenuInReservation();
            }
        }
    });

    // ====== 6. Confirmation de la réservation ======
    if (completeReservationBtn) {
        completeReservationBtn.addEventListener('click', function() {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const privacy = document.getElementById('privacy').checked;
            
            if (!name || !email || !phone) {
                alert('Veuillez remplir tous les champs de coordonnées (Nom, Email, Téléphone).');
                return;
            }
            if (!privacy) {
                alert('Veuillez accepter la politique de confidentialité.');
                return;
            }
            
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert('Veuillez entrer une adresse email valide.');
                return;
            }
            
            const phonePattern = /^((\+)33|0)[1-9](\d{2}){4}$/;
            if (!phonePattern.test(phone.replace(/\s/g, ''))) { // Enlever les espaces pour la validation
                alert('Veuillez entrer un numéro de téléphone français valide (ex: 0612345678 ou +33612345678).');
                return;
            }
            
            // Vérifier si les données de base de la réservation sont là
            if (reservationData.guests < 1 || !reservationData.date || !reservationData.time) {
                alert('Des informations de réservation (couverts, date ou horaire) sont manquantes. Veuillez vérifier les étapes précédentes.');
                showStep('guests'); // Ramener à la première étape si quelque chose manque
                return;
            }

            // Soumission du formulaire (simulation)
            // Ici, vous pourriez envoyer `reservationData` (qui inclut `selectedMenu`)
            // et les infos du formulaire (name, email, phone, special-requests) à un backend.
            console.log("Données de réservation à envoyer:", reservationData);
            console.log("Coordonnées:", { name, email, phone, specialRequests: document.getElementById('special-requests').value });


            const confirmationNumber = generateConfirmationNumber();
            if (confirmationEmailSpan) confirmationEmailSpan.textContent = email;
            if (confirmationNumberSpan) confirmationNumberSpan.textContent = confirmationNumber;
            
            if (confirmationModal) confirmationModal.style.display = 'flex';

            // Optionnel: Nettoyer le localStorage après une réservation réussie
            // localStorage.removeItem(CART_STORAGE_KEY);
            // localStorage.removeItem(MENU_VALIDATED_KEY);
        });
    }
    
    function generateConfirmationNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `EDR-${year}${month}${day}-${random}`;
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            if (confirmationModal) confirmationModal.style.display = 'none';
        });
    }
    if (okBtn) {
        okBtn.addEventListener('click', function() {
            if (confirmationModal) confirmationModal.style.display = 'none';
            // Réinitialiser le formulaire et les données pour une nouvelle réservation
            if(contactForm) contactForm.reset();
            reservationData = { guests: 1, date: null, time: null, meal: 'dinner', selectedMenu: [] };
            updateGuestsDisplay();
            // Réinitialiser le calendrier (enlever la sélection)
            document.querySelectorAll('#calendar-days .day').forEach(d => d.classList.remove('selected'));
            if(selectedDateDisplay) selectedDateDisplay.textContent = "Aucune";
            // Réinitialiser l'horaire
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
            // Réinitialiser le menu (optionnel, car localStorage est nettoyé ou pas)
            resetMenuDisplayInReservation("Vous n'avez pas encore validé de menu.");

            localStorage.removeItem(CART_STORAGE_KEY); // Nettoyer pour la prochaine fois
            localStorage.removeItem(MENU_VALIDATED_KEY);

            showStep('guests'); 
            // window.location.href = 'index.html'; // Ou rediriger
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === confirmationModal) {
            if (confirmationModal) confirmationModal.style.display = 'none';
        }
    });

    // ====== Initialisation ======
    updateGuestsDisplay();
    initCalendar();
    attachTimeSlotListeners(); // S'assurer que les listeners sont attachés
    showStep('guests');
    // displaySelectedMenuInReservation(); // Appelé dans showStep si c'est l'étape menu ou summary
});