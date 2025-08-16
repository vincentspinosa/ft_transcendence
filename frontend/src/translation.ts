export interface TranslationData {
    [key: string]: {
        en: string;
        fr: string;
        es: string;
    };
}

export class TranslationManager {
    private currentLanguage: string = 'en';
    private translations: TranslationData = {};
    private elementsToTranslate: Map<string, string> = new Map();

    constructor() {
        this.loadTranslations();
        this.loadSavedLanguage();
        this.initializeTranslation();
    }

    private loadTranslations(): void {
        this.translations = {
            // Main Menu
            'singleMatch1v1': {
                en: 'Single Match (1v1)',
                fr: 'Match Simple (1v1)',
                es: 'Partida Individual (1v1)'
            },
            'singleMatch2v2': {
                en: 'Single Match (2v2)',
                fr: 'Match Simple (2v2)',
                es: 'Partida Individual (2v2)'
            },
            'startTournament': {
                en: 'Start Tournament',
                fr: 'Commencer le Tournoi',
                es: 'Iniciar Torneo'
            },
            'readRules': {
                en: 'Read the Rules',
                fr: 'Lire les Règles',
                es: 'Leer las Reglas'
            },
            'logout': {
                en: 'Logout',
                fr: 'Déconnexion',
                es: 'Cerrar Sesión'
            },
            'languageSelector': {
                en: 'Language',
                fr: 'Langue',
                es: 'Idioma'
            },

            // Rules Screen
            'gameRulesTitle': {
                en: 'Game Rules & Tournament Format',
                fr: 'Règles du Jeu & Format du Tournoi',
                es: 'Reglas del Juego y Formato del Torneo'
            },
            'classicPongRules': {
                en: 'Classic Pong Rules (1v1)',
                fr: 'Règles du Pong Classique (1v1)',
                es: 'Reglas del Pong Clásico (1v1)'
            },
            'objective': {
                en: 'Objective: Be the first to reach the score limit.',
                fr: 'Objectif : Être le premier à atteindre la limite de score.',
                es: 'Objetivo: Ser el primero en alcanzar el límite de puntuación.'
            },
            'player1Controls': {
                en: 'Player 1 (left): \'Q\' (up), \'A\' (down).',
                fr: 'Joueur 1 (gauche) : \'Q\' (haut), \'A\' (bas).',
                es: 'Jugador 1 (izquierda): \'Q\' (arriba), \'A\' (abajo).'
            },
            'player2Controls': {
                en: 'Player 2 (right, if human): \'P\' (up), \'L\' (down).',
                fr: 'Joueur 2 (droite, si humain) : \'P\' (haut), \'L\' (bas).',
                es: 'Jugador 2 (derecha, si es humano): \'P\' (arriba), \'L\' (abajo).'
            },
            'scoreObjective': {
                en: 'Score by making the opponent miss the ball.',
                fr: 'Marquez en faisant rater la balle à l\'adversaire.',
                es: 'Anota haciendo que el oponente falle la pelota.'
            },
            '2v2Rules': {
                en: '2v2 Pong Rules (4 Players)',
                fr: 'Règles du Pong 2v2 (4 Joueurs)',
                es: 'Reglas del Pong 2v2 (4 Jugadores)'
            },
            '2v2Objective': {
                en: 'Objective: Your team is the first to reach the score limit.',
                fr: 'Objectif : Votre équipe est la première à atteindre la limite de score.',
                es: 'Objetivo: Tu equipo es el primero en alcanzar el límite de puntuación.'
            },
            '2v2Description': {
                en: 'Two players per team, one team on the left, one on the right. Each player controls one paddle.',
                fr: 'Deux joueurs par équipe, une équipe à gauche, une à droite. Chaque joueur contrôle une raquette.',
                es: 'Dos jugadores por equipo, un equipo a la izquierda, uno a la derecha. Cada jugador controla una paleta.'
            },
            'team1Left': {
                en: 'Team 1 (Left Side):',
                fr: 'Équipe 1 (Côté Gauche) :',
                es: 'Equipo 1 (Lado Izquierdo):'
            },
            'team2Right': {
                en: 'Team 2 (Right Side):',
                fr: 'Équipe 2 (Côté Droit) :',
                es: 'Equipo 2 (Lado Derecho):'
            },
            'workWithTeammate': {
                en: 'Work with your teammate to cover your side of the court.',
                fr: 'Travaillez avec votre coéquipier pour couvrir votre côté du terrain.',
                es: 'Trabaja con tu compañero para cubrir tu lado de la cancha.'
            },
            'ballPastTeam': {
                en: 'If the ball goes past your team\'s side (behind both paddles), the opposing team scores.',
                fr: 'Si la balle passe le côté de votre équipe (derrière les deux raquettes), l\'équipe adverse marque.',
                es: 'Si la pelota pasa el lado de tu equipo (detrás de ambas paletas), el equipo oponente anota.'
            },
            'tournamentRules': {
                en: 'Tournament Rules (1v1 Knockout)',
                fr: 'Règles du Tournoi (Élimination 1v1)',
                es: 'Reglas del Torneo (Eliminación 1v1)'
            },
            'tournamentDescription': {
                en: 'A 4-player knockout tournament using 1v1 classic rules.',
                fr: 'Un tournoi à élimination de 4 joueurs utilisant les règles classiques 1v1.',
                es: 'Un torneo de eliminación de 4 jugadores usando las reglas clásicas 1v1.'
            },
            'setup': {
                en: 'Setup: 4 players configured. Points to win per match are set. Names must be unique.',
                fr: 'Configuration : 4 joueurs configurés. Points pour gagner par match définis. Les noms doivent être uniques.',
                es: 'Configuración: 4 jugadores configurados. Puntos para ganar por partida establecidos. Los nombres deben ser únicos.'
            },
            'semiFinal1': {
                en: 'Semi-Final 1: Player 1 vs Player 2.',
                fr: 'Demi-Finale 1 : Joueur 1 vs Joueur 2.',
                es: 'Semi-Final 1: Jugador 1 vs Jugador 2.'
            },
            'semiFinal2': {
                en: 'Semi-Final 2: Player 3 vs Player 4.',
                fr: 'Demi-Finale 2 : Joueur 3 vs Joueur 4.',
                es: 'Semi-Final 2: Jugador 3 vs Jugador 4.'
            },
            'final': {
                en: 'Final: Winner of Semi-Final 1 vs Winner of Semi-Final 2.',
                fr: 'Finale : Vainqueur de la Demi-Finale 1 vs Vainqueur de la Demi-Finale 2.',
                es: 'Final: Ganador de Semi-Final 1 vs Ganador de Semi-Final 2.'
            },
            'champion': {
                en: 'Champion is the winner of the Final.',
                fr: 'Le champion est le vainqueur de la Finale.',
                es: 'El campeón es el ganador de la Final.'
            },
            'powerUpFeature': {
                en: 'Power-Up Feature',
                fr: 'Fonctionnalité Power-Up',
                es: 'Característica de Power-Up'
            },
            'powerUpDescription': {
                en: 'When enabled, a red and a green circle will appear randomly on the court. If the ball hits the red one, the ball size will increase to twice of the original one, and increase its speed by 20%. If it hits the green one, its size will shrink to half of the initial one, and its speed will be increased by 20%. The power-ups appear once per point if enabled, and their location is randomized.',
                fr: 'Lorsqu\'activé, un cercle rouge et un cercle vert apparaîtront aléatoirement sur le terrain. Si la balle touche le rouge, sa taille augmentera du double de l\'originale et sa vitesse de 20%. Si elle touche le vert, sa taille diminuera de moitié et sa vitesse augmentera de 20%. Les power-ups apparaissent une fois par point si activés, et leur emplacement est aléatoire.',
                es: 'Cuando está habilitado, aparecerá un círculo rojo y uno verde aleatoriamente en la cancha. Si la pelota golpea el rojo, su tamaño aumentará al doble del original y su velocidad en un 20%. Si golpea el verde, su tamaño se reducirá a la mitad del inicial y su velocidad aumentará en un 20%. Los power-ups aparecen una vez por punto si están habilitados, y su ubicación es aleatoria.'
            },
            'backToMainMenu': {
                en: 'Back to Main Menu',
                fr: 'Retour au Menu Principal',
                es: 'Volver al Menú Principal'
            },

            // 1v1 Setup
            'singleMatchSetup': {
                en: 'Single Match Setup (1 vs 1)',
                fr: 'Configuration du Match Simple (1 vs 1)',
                es: 'Configuración de Partida Individual (1 vs 1)'
            },
            'player1Left': {
                en: 'Player 1 (Left - \'Q\'/\'A\')',
                fr: 'Joueur 1 (Gauche - \'Q\'/\'A\')',
                es: 'Jugador 1 (Izquierda - \'Q\'/\'A\')'
            },
            'player2Right': {
                en: 'Player 2 (Right)',
                fr: 'Joueur 2 (Droite)',
                es: 'Jugador 2 (Derecha)'
            },
            'name': {
                en: 'Name:',
                fr: 'Nom :',
                es: 'Nombre:'
            },
            'paddleColor': {
                en: 'Paddle Color:',
                fr: 'Couleur de la Raquette :',
                es: 'Color de la Paleta:'
            },
            'white': {
                en: 'White',
                fr: 'Blanc',
                es: 'Blanco'
            },
            'lightblue': {
                en: 'Light Blue',
                fr: 'Bleu Clair',
                es: 'Azul Claro'
            },
            'red': {
                en: 'Red',
                fr: 'Rouge',
                es: 'Rojo'
            },
            'lightgreen': {
                en: 'Green',
                fr: 'Vert',
                es: 'Verde'
            },
            'type': {
                en: 'Type (\'P\'/\'L\' if Human):',
                fr: 'Type (\'P\'/\'L\' si Humain) :',
                es: 'Tipo (\'P\'/\'L\' si es Humano):'
            },
            'human': {
                en: 'Human',
                fr: 'Humain',
                es: 'Humano'
            },
            'ai': {
                en: 'AI',
                fr: 'IA',
                es: 'IA'
            },
            'pointsToWin': {
                en: 'Points to Win (1-21):',
                fr: 'Points pour Gagner (1-21) :',
                es: 'Puntos para Ganar (1-21):'
            },
            'enablePowerUps': {
                en: 'Enable Power-Ups',
                fr: 'Activer les Power-Ups',
                es: 'Habilitar Power-Ups'
            },
            'startGame': {
                en: 'Start Game',
                fr: 'Commencer la Partie',
                es: 'Iniciar Juego'
            },

            // 2v2 Setup
            'fourPlayerMatchSetup': {
                en: '4-Player Match Setup (2 vs 2)',
                fr: 'Configuration du Match 4 Joueurs (2 vs 2)',
                es: 'Configuración de Partida 4 Jugadores (2 vs 2)'
            },
            'team1LeftSide': {
                en: 'Team 1 (Left Side)',
                fr: 'Équipe 1 (Côté Gauche)',
                es: 'Equipo 1 (Lado Izquierdo)'
            },
            'team2RightSide': {
                en: 'Team 2 (Right Side)',
                fr: 'Équipe 2 (Côté Droit)',
                es: 'Equipo 2 (Lado Derecho)'
            },
            'player1TopLeft': {
                en: 'Player 1 (Top Left)',
                fr: 'Joueur 1 (Haut Gauche)',
                es: 'Jugador 1 (Arriba Izquierda)'
            },
            'player2BottomLeft': {
                en: 'Player 2 (Bottom Left)',
                fr: 'Joueur 2 (Bas Gauche)',
                es: 'Jugador 2 (Abajo Izquierda)'
            },
            'player3TopRight': {
                en: 'Player 3 (Top Right)',
                fr: 'Joueur 3 (Haut Droite)',
                es: 'Jugador 3 (Arriba Derecha)'
            },
            'player4BottomRight': {
                en: 'Player 4 (Bottom Right)',
                fr: 'Joueur 4 (Bas Droite)',
                es: 'Jugador 4 (Abajo Derecha)'
            },
            'color': {
                en: 'Color:',
                fr: 'Couleur :',
                es: 'Color:'
            },
            'start2v2Match': {
                en: 'Start 2v2 Match',
                fr: 'Commencer le Match 2v2',
                es: 'Iniciar Partida 2v2'
            },

            // Tournament Setup
            'tournamentSetup': {
                en: 'Tournament Setup (4 Players for 1v1 Matches)',
                fr: 'Configuration du Tournoi (4 Joueurs pour des Matchs 1v1)',
                es: 'Configuración del Torneo (4 Jugadores para Partidas 1v1)'
            },
            'player1SemiFinal1': {
                en: 'Player 1 (Semi-Final 1)',
                fr: 'Joueur 1 (Demi-Finale 1)',
                es: 'Jugador 1 (Semi-Final 1)'
            },
            'player2SemiFinal1': {
                en: 'Player 2 (Semi-Final 1)',
                fr: 'Joueur 2 (Demi-Finale 1)',
                es: 'Jugador 2 (Semi-Final 1)'
            },
            'player3SemiFinal2': {
                en: 'Player 3 (Semi-Final 2)',
                fr: 'Joueur 3 (Demi-Finale 2)',
                es: 'Jugador 3 (Semi-Final 2)'
            },
            'player4SemiFinal2': {
                en: 'Player 4 (Semi-Final 2)',
                fr: 'Joueur 4 (Demi-Finale 2)',
                es: 'Jugador 4 (Semi-Final 2)'
            },
            'pointsToWinPerMatch': {
                en: 'Points to Win (per match):',
                fr: 'Points pour Gagner (par match) :',
                es: 'Puntos para Ganar (por partida):'
            },
            'beginTournament': {
                en: 'Begin Tournament',
                fr: 'Commencer le Tournoi',
                es: 'Comenzar Torneo'
            },

            // Match Announcement
            'matchTitle': {
                en: 'Match Title',
                fr: 'Titre du Match',
                es: 'Título de la Partida'
            },
            'playerAVsPlayerB': {
                en: 'Player A plays against Player B!',
                fr: 'Le Joueur A joue contre le Joueur B !',
                es: '¡El Jugador A juega contra el Jugador B!'
            },
            'go': {
                en: 'GO!',
                fr: 'C\'EST PARTI !',
                es: '¡ADELANTE!'
            },

            // Match Over
            'playerXWins': {
                en: 'Player X wins the match!',
                fr: 'Le Joueur X gagne le match !',
                es: '¡El Jugador X gana la partida!'
            },
            'playAgain': {
                en: 'Play Again',
                fr: 'Rejouer',
                es: 'Jugar de Nuevo'
            },
            'nextMatch': {
                en: 'Next Match',
                fr: 'Match Suivant',
                es: 'Siguiente Partida'
            },
            'mainMenu': {
                en: 'Main Menu',
                fr: 'Menu Principal',
                es: 'Menú Principal'
            },

            // Tournament Over
            'congratulationsPlayerX': {
                en: 'Congratulations! Player X has won the tournament!',
                fr: 'Félicitations ! Le Joueur X a gagné le tournoi !',
                es: '¡Felicidades! ¡El Jugador X ha ganado el torneo!'
            },
            'playNewTournament': {
                en: 'Play New Tournament',
                fr: 'Jouer un Nouveau Tournoi',
                es: 'Jugar Nuevo Torneo'
            },

            // Language Selection Dialog
            'saveLanguagePreference': {
                en: 'Save language preference for next visit?',
                fr: 'Sauvegarder la préférence de langue pour la prochaine visite ?',
                es: '¿Guardar preferencia de idioma para la próxima visita?'
            }
        };
    }

    private loadSavedLanguage(): void {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && ['en', 'fr', 'es'].includes(savedLanguage)) {
            this.currentLanguage = savedLanguage;
        }
    }

    private initializeTranslation(): void {
        this.scanAndTranslateElements();
        this.createLanguageSelector();
    }

    private scanAndTranslateElements(): void {
        // Scan all elements with data-translate attribute
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (key) {
                this.elementsToTranslate.set(key, element.textContent || '');
                this.translateElement(element, key);
            }
        });
    }

    private translateElement(element: Element, key: string): void {
        const translation = this.translations[key];
        if (translation && translation[this.currentLanguage as keyof typeof translation]) {
            element.textContent = translation[this.currentLanguage as keyof typeof translation];
        }
    }

    private createLanguageSelector(): void {
        const userInfoSection = document.getElementById('userInfoSection');
        if (!userInfoSection) return;

        const languageSelector = document.createElement('div');
        languageSelector.className = 'flex justify-center mb-4';
        languageSelector.innerHTML = `
            <div class="flex items-center space-x-2">
                <label for="languageSelect" class="text-white text-sm">${this.getTranslation('languageSelector')}:</label>
                <select id="languageSelect" class="p-2 rounded border border-[#444] bg-[#333] text-white text-sm">
                    <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>English</option>
                    <option value="fr" ${this.currentLanguage === 'fr' ? 'selected' : ''}>Français</option>
                    <option value="es" ${this.currentLanguage === 'es' ? 'selected' : ''}>Español</option>
                </select>
            </div>
        `;

        // Insert before the user profile section
        userInfoSection.insertBefore(languageSelector, userInfoSection.firstChild);

        // Add event listener
        const select = languageSelector.querySelector('#languageSelect') as HTMLSelectElement;
        select.addEventListener('change', (e) => {
            const newLanguage = (e.target as HTMLSelectElement).value;
            this.changeLanguage(newLanguage);
        });
    }

    public changeLanguage(newLanguage: string): void {
        if (!['en', 'fr', 'es'].includes(newLanguage)) return;

        const previousLanguage = this.currentLanguage;
        this.currentLanguage = newLanguage;

        // Update all translated elements
        this.elementsToTranslate.forEach((_, key) => {
            const elements = document.querySelectorAll(`[data-translate="${key}"]`);
            elements.forEach(element => {
                this.translateElement(element, key);
            });
        });

        // Update language selector
        const select = document.getElementById('languageSelect') as HTMLSelectElement;
        if (select) {
            select.value = newLanguage;
        }

        // Ask user if they want to save preference (only if language actually changed)
        if (previousLanguage !== newLanguage) {
            this.askToSavePreference();
        }
    }

    private askToSavePreference(): void {
        const message = this.getTranslation('saveLanguagePreference');

        if (confirm(`${message}\n`)) {
            localStorage.setItem('preferredLanguage', this.currentLanguage);
        }
    }

    public getTranslation(key: string): string {
        const translation = this.translations[key];
        if (translation && translation[this.currentLanguage as keyof typeof translation]) {
            return translation[this.currentLanguage as keyof typeof translation];
        }
        // Fallback to English if translation not found
        return translation?.en || key;
    }

    public getCurrentLanguage(): string {
        return this.currentLanguage;
    }
}

// Initialize translation manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TranslationManager();
});
