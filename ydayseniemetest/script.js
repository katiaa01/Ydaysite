document.addEventListener('DOMContentLoaded', function() {
    // Variables pour stocker les informations de réservation
    let reservationData = {
        guests: 0,
        date: null,
        time: null,
        meal: 'dinner'
    };

    // Éléments DOM
    const menuItems = document.querySelectorAll('.menu-item');
    const reservationSteps = document.querySelectorAll('.reservation-step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const guestButtons = document.querySelectorAll('.guest-btn');
    const timeSlots = document.querySelectorAll('.time-slot');
    const mealTypeButtons = document.querySelectorAll('.meal-type-btn');
    const completeReservationBtn = document.getElementById('complete-reservation');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const okBtn = document.querySelector('.ok-btn');

    // ====== 1. Navigation entre les étapes ======
    
    // Fonction pour afficher une étape spécifique
    function showStep(stepId) {
        // Cacher toutes les étapes
        reservationSteps.forEach(step => {
            step.style.display = 'none';
        });
        
        // Afficher l'étape demandée
        const targetStep = document.getElementById(`${stepId}-step`);
        if (targetStep) {
            targetStep.style.display = 'block';
            
            // Animation de fade-in
            targetStep.style.opacity = 0;
            setTimeout(() => {
                targetStep.style.opacity = 1;
            }, 50);
        }
        
        // Mettre à jour le menu de navigation
        updateNavigationMenu(stepId);
    }
    
    // Mettre à jour les indicateurs visuels du menu de navigation
    function updateNavigationMenu(currentStep) {
        menuItems.forEach(item => {
            const itemStep = item.getAttribute('data-step');
            
            // Réinitialiser toutes les classes
            item.classList.remove('active', 'done');
            
            // Si c'est l'étape courante
            if (itemStep === currentStep) {
                item.classList.add('active');
            } 
            // Si c'est une étape précédente complétée
            else if (
                (currentStep === 'date' && itemStep === 'guests') ||
                (currentStep === 'placement' && (itemStep === 'guests' || itemStep === 'date')) ||
                (currentStep === 'time' && (itemStep === 'guests' || itemStep === 'date' || itemStep === 'placement')) ||
                (currentStep === 'menu' && (itemStep === 'guests' || itemStep === 'date' || itemStep === 'placement' || itemStep === 'time')) ||
                (currentStep === 'summary' && (itemStep === 'guests' || itemStep === 'date' || itemStep === 'placement' || itemStep === 'time' || itemStep === 'menu'))
            ) {
                item.classList.add('done');
            }
        });
    }
    
    // Écouteurs pour les items du menu de navigation
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const step = this.getAttribute('data-step');
            
            // Vérifier si les étapes précédentes sont complétées
            if (step === 'date' && reservationData.guests === 0) {
                alert('Veuillez d\'abord sélectionner le nombre de couverts.');
                return;
            }
            if (step === 'placement' && !reservationData.date) {
                alert('Veuillez d\'abord sélectionner une date.');
                return;
            }
            if (step === 'time' && !reservationData.date) {
                alert('Veuillez d\'abord sélectionner une date.');
                return;
            }
            if (step === 'menu' && !reservationData.time) {
                alert('Veuillez d\'abord sélectionner un horaire.');
                return;
            }
            if (step === 'summary' && !reservationData.time) {
                alert('Veuillez d\'abord sélectionner un horaire.');
                return;
            }
            
            showStep(step);
        });
    });
    
    // Écouteurs pour les boutons Suivant/Retour
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = this.getAttribute('data-next');
            
            // Vérifier si l'étape actuelle est complétée
            if (nextStep === 'date' && reservationData.guests === 0) {
                alert('Veuillez sélectionner le nombre de couverts.');
                return;
            }
            if (nextStep === 'placement' && !reservationData.date) {
                alert('Veuillez sélectionner une date.');
                return;
            }
            if (nextStep === 'time' && !reservationData.date) {
                alert('Veuillez sélectionner une date.');
                return;
            }
            if (nextStep === 'menu' && !reservationData.time) {
                alert('Veuillez sélectionner un horaire.');
                return;
            }
            if (nextStep === 'summary' && !reservationData.time) {
                alert('Veuillez sélectionner un horaire.');
                return;
            }
            
            showStep(nextStep);
        });
    });
    
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = this.getAttribute('data-back');
            showStep(prevStep);
        });
    });

    // ====== 2. Sélection du nombre de couverts ======
    
    // ====== 2. Sélection du nombre de couverts ======
let currentGuests = 1; // Initialiser à 1 au lieu de 0
const guestsCount = document.getElementById('guests-count');
const decreaseBtn = document.getElementById('decrease-guests');
const increaseBtn = document.getElementById('increase-guests');

function updateGuestsDisplay() {
    guestsCount.textContent = currentGuests;
    reservationData.guests = currentGuests; // Mettre à jour les données de réservation
    document.getElementById('summary-guests').textContent = 
        `${currentGuests} ${currentGuests > 1 ? 'personnes' : 'personne'}`;
    
    // Activer/désactiver les boutons
    decreaseBtn.disabled = currentGuests === 1;
    increaseBtn.disabled = currentGuests === 6;
    
    // Activer automatiquement le bouton Suivant
    const nextButton = document.querySelector('[data-next="date"]');
    if (nextButton) {
        nextButton.disabled = false;
    }
}

// Initialisation
updateGuestsDisplay(); // Ajouter cette ligne pour initialiser correctement

decreaseBtn.addEventListener('click', () => {
    if(currentGuests > 1) {
        currentGuests--;
        updateGuestsDisplay();
    }
});

increaseBtn.addEventListener('click', () => {
    if(currentGuests < 6) {
        currentGuests++;
        updateGuestsDisplay();
    }
});


    // ====== 3. Sélection de la date (Calendrier) ======
    
    // Variables pour le calendrier
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Initialiser le calendrier
    initCalendar();
    
    // Boutons de navigation du calendrier
    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });
    
    function initCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
    }
    
    function updateCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
    }
    
    function updateCalendarHeader() {
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        document.getElementById('current-month').textContent = `${months[currentMonth]} ${currentYear}`;
    }
    
    function generateCalendarDays() {
        const calendarDays = document.getElementById('calendar-days');
        calendarDays.innerHTML = '';
        
        // Premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
        let firstDay = new Date(currentYear, currentMonth, 1).getDay();
        // Ajuster pour que la semaine commence le lundi (0 = Lundi)
        firstDay = firstDay === 0 ? 6 : firstDay - 1;
        
        // Nombre de jours dans le mois
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Date d'aujourd'hui
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
        
        // Jours vides avant le premier jour du mois
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty');
            calendarDays.appendChild(emptyDay);
        }
        
        // Jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = day;
            
            // Vérifier si c'est aujourd'hui
            if (day === todayDay && currentMonth === todayMonth && currentYear === todayYear) {
                dayElement.classList.add('today');
            }
            
            // Désactiver les dates passées
            const dayDate = new Date(currentYear, currentMonth, day);
            if (dayDate < new Date(todayYear, todayMonth, todayDay)) {
                dayElement.classList.add('disabled');
            } else {
                // Ajouter un gestionnaire de clic pour les dates futures uniquement
                dayElement.addEventListener('click', function() {
                    // Retirer la classe selected de tous les jours
                    document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
                    
                    // Ajouter la classe selected au jour cliqué
                    this.classList.add('selected');
                    
                    // Sauvegarder la date
                    const selectedDate = new Date(currentYear, currentMonth, day);
                    reservationData.date = selectedDate;
                    
                    // Formater et afficher la date sélectionnée
                    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                    const formattedDate = selectedDate.toLocaleDateString('fr-FR', options);
                    document.getElementById('selected-date').textContent = formattedDate;
                    
                    // Mettre à jour le récapitulatif
                    document.getElementById('summary-date').textContent = formattedDate;
                });
            }
            
            calendarDays.appendChild(dayElement);
        }
    }

    // ====== 4. Sélection de l'horaire ======
    
    // Gestion des types de repas (déjeuner/dîner)
    mealTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            mealTypeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Sauvegarder le type de repas
            const mealType = this.getAttribute('data-meal');
            reservationData.meal = mealType;
            
            // Mettre à jour l'affichage du type de repas
            document.getElementById('current-meal-type').textContent = 
                mealType === 'dinner' ? 'Dîner' : 'Déjeuner';
            
            // Afficher les horaires correspondants
            document.getElementById('dinner-times').style.display = 
                mealType === 'dinner' ? 'grid' : 'none';
            document.getElementById('lunch-times').style.display = 
                mealType === 'lunch' ? 'grid' : 'none';
            
            // Réinitialiser la sélection de l'heure
            timeSlots.forEach(slot => slot.classList.remove('active'));
            reservationData.time = null;
            document.getElementById('summary-time').textContent = '-';
        });
    });
    
    // Sélection des créneaux horaires
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            // Retirer la classe active de tous les créneaux
            timeSlots.forEach(s => s.classList.remove('active'));
            
            // Ajouter la classe active au créneau cliqué
            this.classList.add('active');
            
            // Sauvegarder l'heure
            reservationData.time = this.getAttribute('data-time');
            
            // Mettre à jour le récapitulatif
            document.getElementById('summary-time').textContent = reservationData.time;
        });
    });

    // ====== 5. Confirmation de la réservation ======
    
    completeReservationBtn.addEventListener('click', function() {
        // Vérifier si tous les champs obligatoires sont remplis
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const privacy = document.getElementById('privacy').checked;
        
        if (!name || !email || !phone || !privacy) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        
        // Valider l'email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert('Veuillez entrer une adresse email valide.');
            return;
        }
        
        // Valider le téléphone (format français)
        const phonePattern = /^((\+)33|0)[1-9](\d{2}){4}$/;
        if (!phonePattern.test(phone)) {
            alert('Veuillez entrer un numéro de téléphone valide.');
            return;
        }
        
        // Générer un numéro de confirmation unique
        const confirmationNumber = generateConfirmationNumber();
        
        // Ajouter les informations dans le modal de confirmation
        document.getElementById('confirmation-email').textContent = email;
        document.getElementById('confirmation-number').textContent = confirmationNumber;
        
        // Mettre à jour le récapitulatif avec un message de confirmation
        const summaryDetails = document.querySelector('.summary-details');
        
        // Supprimer l'ancien message de confirmation s'il existe
        const oldMessage = document.querySelector('.confirmation-message');
        if (oldMessage) {
            oldMessage.remove();
        }
        
        // Créer un élément de message de confirmation
        const confirmationMessage = document.createElement('div');
        confirmationMessage.classList.add('confirmation-message');
        confirmationMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div class="confirmation-text">
                <h3>Réservation confirmée !</h3>
                <p>Numéro de confirmation : <strong>${confirmationNumber}</strong></p>
                <p>Un email récapitulatif a été envoyé à ${email}</p>
                <p>Nous nous réjouissons de vous accueillir !</p>
            </div>
        `;
        
        // Ajouter le message au récapitulatif
        summaryDetails.appendChild(confirmationMessage);
        
        // Afficher le modal de confirmation
        confirmationModal.style.display = 'flex';
    });
    
    // Fonction pour générer un numéro de confirmation
    function generateConfirmationNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        return `EDR-${year}${month}${day}-${random}`;
    }
    
    // Fermer le modal
    closeModalBtn.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });
    
    okBtn.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
        // Rediriger vers la page d'accueil ou réinitialiser le formulaire
        window.location.href = 'index.html';
    });
    
    // Fermer le modal en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });

    // ====== Initialisation ======
    
    // Commencer par l'étape des couverts
    showStep('guests');
});
