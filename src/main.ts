// src/main.ts
import { Game } from './Game';
import { Tournament } from './Tournament';
import { PlayerConfig, MatchSettings, TournamentSetupInfo, FourPlayerMatchSettings } from './interfaces';

const MAX_NAME_LENGTH = 20;
const COLOR_MAP: { [key: string]: string } = {
    "white": "#FFFFFF",
    "lightblue": "#ADD8E6",
    "red": "#FF0000",
    "lightgreen": "#90EE90"
};

let gameInstance: Game | null = null;
let tournamentInstance: Tournament | null = null;

// Screen Divs
let initialChoiceScreen: HTMLElement,
    gameSetupScreen: HTMLElement,
    fourPlayerMatchSetupScreen: HTMLElement,
    tournamentSetupScreen: HTMLElement,
    rulesScreen: HTMLElement,
    pongCanvas: HTMLCanvasElement,
    matchOverScreen: HTMLElement,
    tournamentWinnerScreen: HTMLElement,
    matchAnnouncementScreen: HTMLElement;

// Buttons and other elements
let singleMatchModeBtn: HTMLButtonElement,
    fourPlayerMatchModeBtn: HTMLButtonElement,
    tournamentModeBtn: HTMLButtonElement,
    readRulesBtn: HTMLButtonElement,
    rules_backToMainBtn: HTMLButtonElement,
    s_settingsForm: HTMLFormElement, s_backToMainBtn: HTMLButtonElement,
    fp_settingsForm: HTMLFormElement, fp_backToMainBtn: HTMLButtonElement,
    t_settingsForm: HTMLFormElement, t_backToMainBtn: HTMLButtonElement,
    matchOver_MainMenuBtn: HTMLButtonElement,
    tournamentEnd_MainMenuBtn: HTMLButtonElement,
    startNewTournamentBtn: HTMLButtonElement,
    newGameSettingsFromSingleMatchOverBtn: HTMLButtonElement;


function showScreen(screenToShow: HTMLElement | null) {
    const allScreens = [
        initialChoiceScreen, gameSetupScreen, fourPlayerMatchSetupScreen, tournamentSetupScreen,
        rulesScreen, pongCanvas, matchOverScreen, tournamentWinnerScreen, matchAnnouncementScreen
    ];
    allScreens.forEach(s => {
        if (s) s.style.display = 'none';
    });

    if (screenToShow) {
        if (screenToShow.id === 'pongCanvas') {
            screenToShow.style.display = 'block';
        } else if (['initialChoiceScreen', 'matchOverScreen', 'tournamentWinnerScreen', 'matchAnnouncementScreen'].includes(screenToShow.id)) {
            screenToShow.style.display = 'flex';
        } else if (['gameSetup', 'fourPlayerMatchSetupScreen', 'tournamentSetupScreen', 'rulesScreen'].includes(screenToShow.id)) {
            screenToShow.style.display = 'block';
        } else {
            screenToShow.style.display = 'block';
        }
    }
}

function getPlayerConfig(formPrefix: string, playerId: number, defaultName: string): PlayerConfig {
    const nameInput = document.getElementById(`${formPrefix}_p${playerId}Name`) as HTMLInputElement;
    const colorSelect = document.getElementById(`${formPrefix}_p${playerId}Color`) as HTMLSelectElement;
    const typeSelect = document.getElementById(`${formPrefix}_p${playerId}Type`) as HTMLSelectElement;

    const name = nameInput?.value.trim() || defaultName;
    const colorValue = colorSelect?.value || 'white';
    const type = (typeSelect?.value as 'human' | 'ai') || 'human';
    return { name, color: COLOR_MAP[colorValue] || COLOR_MAP['white'], type, id: playerId };
}

function getSinglePlayer1v1Config(formPrefix: string, playerId: number, defaultName: string): PlayerConfig {
    const nameInput = document.getElementById(`${formPrefix}_player${playerId}Name`) as HTMLInputElement;
    const colorSelect = document.getElementById(`${formPrefix}_player${playerId}Color`) as HTMLSelectElement;
    let type: 'human' | 'ai' = 'human';
    if (playerId === 2) {
        const typeSelect = document.getElementById(`${formPrefix}_player${playerId}Type`) as HTMLSelectElement;
        type = (typeSelect?.value as 'human' | 'ai') || 'human';
    } else if (playerId === 1) {
        type = 'human';
    }
    const name = nameInput?.value.trim() || defaultName;
    const colorValue = colorSelect?.value || 'white';
    return { name, color: COLOR_MAP[colorValue] || COLOR_MAP['white'], type, id: playerId };
}

function validatePlayerName(name: string, playerNameLabel: string): boolean {
    if (name.length === 0) {
        alert(`${playerNameLabel} name cannot be empty.`);
        return false;
    }
    if (name.length > MAX_NAME_LENGTH) {
        alert(`${playerNameLabel} name cannot exceed ${MAX_NAME_LENGTH} characters.`);
        return false;
    }
    return true;
}

window.addEventListener('DOMContentLoaded', () => {
    initialChoiceScreen = document.getElementById('initialChoiceScreen') as HTMLElement;
    gameSetupScreen = document.getElementById('gameSetup') as HTMLElement;
    fourPlayerMatchSetupScreen = document.getElementById('fourPlayerMatchSetupScreen') as HTMLElement;
    tournamentSetupScreen = document.getElementById('tournamentSetupScreen') as HTMLElement;
    rulesScreen = document.getElementById('rulesScreen') as HTMLElement;
    pongCanvas = document.getElementById('pongCanvas') as HTMLCanvasElement;
    matchOverScreen = document.getElementById('matchOverScreen') as HTMLElement;
    tournamentWinnerScreen = document.getElementById('tournamentWinnerScreen') as HTMLElement;
    matchAnnouncementScreen = document.getElementById('matchAnnouncementScreen') as HTMLElement;

    singleMatchModeBtn = document.getElementById('singleMatchModeBtn') as HTMLButtonElement;
    fourPlayerMatchModeBtn = document.getElementById('fourPlayerMatchModeBtn') as HTMLButtonElement;
    tournamentModeBtn = document.getElementById('tournamentModeBtn') as HTMLButtonElement;
    readRulesBtn = document.getElementById('readRulesBtn') as HTMLButtonElement;
    rules_backToMainBtn = document.getElementById('rules_backToMainBtn') as HTMLButtonElement;
    s_settingsForm = document.getElementById('settingsForm') as HTMLFormElement;
    s_backToMainBtn = document.getElementById('s_backToMainBtn') as HTMLButtonElement;
    fp_settingsForm = document.getElementById('fourPlayerSettingsForm') as HTMLFormElement;
    fp_backToMainBtn = document.getElementById('fp_backToMainBtn') as HTMLButtonElement;
    t_settingsForm = document.getElementById('tournamentSettingsForm') as HTMLFormElement;
    t_backToMainBtn = document.getElementById('t_backToMainBtn') as HTMLButtonElement;
    matchOver_MainMenuBtn = document.getElementById('matchOver_MainMenuBtn') as HTMLButtonElement;
    tournamentEnd_MainMenuBtn = document.getElementById('tournamentEnd_MainMenuBtn') as HTMLButtonElement;
    startNewTournamentBtn = document.getElementById('startNewTournamentBtn') as HTMLButtonElement;
    newGameSettingsFromSingleMatchOverBtn = document.getElementById('newGameSettingsBtn') as HTMLButtonElement;

    gameInstance = new Game(
        'pongCanvas',
        'matchOverScreen',
        'matchOverMessage',
        'playAgainBtn',
        'singleMatchOverButtons',
        'tournamentMatchOverButtons'
    );

    showScreen(initialChoiceScreen);

    if (singleMatchModeBtn) singleMatchModeBtn.onclick = () => showScreen(gameSetupScreen);
    if (fourPlayerMatchModeBtn) fourPlayerMatchModeBtn.onclick = () => showScreen(fourPlayerMatchSetupScreen);
    if (tournamentModeBtn) tournamentModeBtn.onclick = () => showScreen(tournamentSetupScreen);
    if (readRulesBtn) readRulesBtn.onclick = () => showScreen(rulesScreen);
    if (rules_backToMainBtn) rules_backToMainBtn.onclick = () => showScreen(initialChoiceScreen);
    if (s_backToMainBtn) s_backToMainBtn.onclick = () => showScreen(initialChoiceScreen);
    if (fp_backToMainBtn) fp_backToMainBtn.onclick = () => showScreen(initialChoiceScreen);
    if (t_backToMainBtn) t_backToMainBtn.onclick = () => showScreen(initialChoiceScreen);
    if (matchOver_MainMenuBtn) matchOver_MainMenuBtn.onclick = () => showScreen(initialChoiceScreen);
    if (tournamentEnd_MainMenuBtn) tournamentEnd_MainMenuBtn.onclick = () => showScreen(initialChoiceScreen);
    if (startNewTournamentBtn) startNewTournamentBtn.onclick = () => showScreen(tournamentSetupScreen);
    if (newGameSettingsFromSingleMatchOverBtn) {
        newGameSettingsFromSingleMatchOverBtn.onclick = () => {
            if (gameSetupScreen) showScreen(gameSetupScreen);
        };
    }

    if (s_settingsForm) {
        s_settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1 = getSinglePlayer1v1Config('s', 1, 'Player 1');
            const p2 = getSinglePlayer1v1Config('s', 2, 'Player 2');
            const scoreLimitInput = document.getElementById('s_scoreLimit') as HTMLInputElement;
            const scoreLimit = parseInt(scoreLimitInput.value, 10);

            if (!validatePlayerName(p1.name, "Player 1") || !validatePlayerName(p2.name, "Player 2")) return;
            if (p1.name.toLowerCase() === p2.name.toLowerCase()) {
                alert("Player names must be unique for a single match."); return;
            }
            if (isNaN(scoreLimit) || scoreLimit < 1 || scoreLimit > 21) {
                alert("Score limit must be between 1 and 21."); return;
            }
            const matchSettings: MatchSettings = { playerA: p1, playerB: p2, scoreLimit };
            if (gameInstance) {
                const singleMB = document.getElementById('singleMatchOverButtons') as HTMLElement;
                const tourneyMB = document.getElementById('tournamentMatchOverButtons') as HTMLElement;
                if(singleMB) singleMB.style.display = 'block';
                if(tourneyMB) tourneyMB.style.display = 'none';
                gameInstance.initializeGame(matchSettings, false, null);
                showScreen(pongCanvas);
                gameInstance.start();
            }
        });
    }

    if (fp_settingsForm) {
        fp_settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1_t1 = getPlayerConfig('fp', 1, 'P1(T1)');
            const p2_t1 = getPlayerConfig('fp', 2, 'P2(T1)');
            const p1_t2 = getPlayerConfig('fp', 3, 'P3(T2)');
            const p2_t2 = getPlayerConfig('fp', 4, 'P4(T2)');
            const scoreLimitInput = document.getElementById('fp_scoreLimit') as HTMLInputElement;
            const scoreLimit = parseInt(scoreLimitInput.value, 10);

            const players = [p1_t1, p2_t1, p1_t2, p2_t2];
            if (!players.every((p, i) => validatePlayerName(p.name, `Player ${i + 1}`))) return;
            const names = players.map(p => p.name.toLowerCase());
            const uniqueNames = new Set(names);
            if (names.length !== uniqueNames.size) {
                alert("All player names must be unique for a 4-player match."); return;
            }
            if (isNaN(scoreLimit) || scoreLimit < 1 || scoreLimit > 21) {
                alert("Score limit must be between 1 and 21."); return;
            }
            const fourPlayerSettings: FourPlayerMatchSettings = {
                team1PlayerA: p1_t1, team1PlayerB: p2_t1,
                team2PlayerA: p1_t2, team2PlayerB: p2_t2,
                scoreLimit
            };
            if (gameInstance) {
                const singleMB = document.getElementById('singleMatchOverButtons') as HTMLElement;
                const tourneyMB = document.getElementById('tournamentMatchOverButtons') as HTMLElement;
                if(singleMB) singleMB.style.display = 'block';
                if(tourneyMB) tourneyMB.style.display = 'none';
                gameInstance.initializeFourPlayerMatch(fourPlayerSettings);
                showScreen(pongCanvas);
                gameInstance.start();
            }
        });
    }

    if (t_settingsForm) {
        t_settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1 = getPlayerConfig('t', 1, 'Player 1');
            const p2 = getPlayerConfig('t', 2, 'Player 2');
            const p3 = getPlayerConfig('t', 3, 'Player 3');
            const p4 = getPlayerConfig('t', 4, 'Player 4');
            const scoreLimitInput = document.getElementById('t_scoreLimit') as HTMLInputElement;
            const pointsToWin = parseInt(scoreLimitInput.value, 10);

            if (![p1,p2,p3,p4].every((p, i) => validatePlayerName(p.name, `Player ${i + 1}`))) return;
            const names = [p1.name.toLowerCase(), p2.name.toLowerCase(), p3.name.toLowerCase(), p4.name.toLowerCase()];
            const uniqueNames = new Set(names);
            if (names.length !== uniqueNames.size) {
                alert("Player names in a tournament must be unique."); return;
            }
            if (isNaN(pointsToWin) || pointsToWin < 1 || pointsToWin > 21) {
                alert("Points to win (per match) must be between 1 and 21."); return;
            }
            const tournamentSetupData: TournamentSetupInfo = { player1: p1, player2: p2, player3: p3, player4: p4, pointsToWin };
            if (gameInstance) {
                tournamentInstance = new Tournament(tournamentSetupData, gameInstance, {
                    pongCanvasElement: pongCanvas,
                    matchOverScreenDiv: matchOverScreen,
                    matchOverMessageElement: document.getElementById('matchOverMessage') as HTMLElement,
                    tournamentMatchOverButtonsDiv: document.getElementById('tournamentMatchOverButtons') as HTMLElement,
                    nextMatchButton: document.getElementById('nextMatchBtn') as HTMLButtonElement,
                    tournamentWinnerScreenDiv: tournamentWinnerScreen,
                    tournamentWinnerMessageElement: document.getElementById('tournamentWinnerMessage') as HTMLElement,
                    matchAnnouncementScreenDiv: matchAnnouncementScreen,
                    announceMatchTitleElement: document.getElementById('announceMatchTitleText') as HTMLElement,
                    announceMatchVersusElement: document.getElementById('announceMatchVersusText') as HTMLElement,
                    announceMatchGoButton: document.getElementById('announceMatchGoBtn') as HTMLButtonElement
                });
                tournamentInstance.onTournamentEnd = () => { /* Optional callback */ };
                showScreen(null);
                tournamentInstance.startTournament();
            }
        });
    }

    // For the debugging log, create the list of expected IDs to make the log more helpful.
    const criticalElementIds: string[] = [
        'initialChoiceScreen', 'gameSetup', 'fourPlayerMatchSetupScreen', 'tournamentSetupScreen', 'rulesScreen', 'pongCanvas',
        'matchOverScreen', 'tournamentWinnerScreen', 'matchAnnouncementScreen',
        'singleMatchModeBtn', 'fourPlayerMatchModeBtn', 'tournamentModeBtn', 'readRulesBtn', 'rules_backToMainBtn',
        'settingsForm', 's_backToMainBtn', 'fourPlayerSettingsForm', 'fp_backToMainBtn', 'tournamentSettingsForm', 't_backToMainBtn',
        'matchOver_MainMenuBtn', 'tournamentEnd_MainMenuBtn', 'startNewTournamentBtn',
        'newGameSettingsBtn', // This is the ID for newGameSettingsFromSingleMatchOverBtn
        'announceMatchTitleText', 'announceMatchVersusText', 'announceMatchGoBtn',
        // Elements passed to Game constructor
        'matchOverMessage', 'playAgainBtn', 'singleMatchOverButtons', 'tournamentMatchOverButtons',
        // Elements passed to Tournament constructor (some overlap, some specific like nextMatchBtn)
        'nextMatchBtn' // Add any other specific IDs you absolutely need to verify
    ];
    
    const criticalElementsForCheck = criticalElementIds.map(id => document.getElementById(id));
    // Also include elements that are assigned directly without being in a list before
    const otherCriticalElements = [pongCanvas, initialChoiceScreen, gameSetupScreen, fourPlayerMatchSetupScreen, tournamentSetupScreen, rulesScreen, matchOverScreen, tournamentWinnerScreen, matchAnnouncementScreen, singleMatchModeBtn, fourPlayerMatchModeBtn, tournamentModeBtn, readRulesBtn, rules_backToMainBtn, s_settingsForm, s_backToMainBtn, fp_settingsForm, fp_backToMainBtn, t_settingsForm, t_backToMainBtn, matchOver_MainMenuBtn, tournamentEnd_MainMenuBtn, startNewTournamentBtn, newGameSettingsFromSingleMatchOverBtn];


    let allElementsFound = true;
    otherCriticalElements.forEach(el => {
        if (!el) {
            // This element was assigned directly to a variable. If it's null, its variable name can be a hint.
            // However, pinpointing the exact ID that failed requires iterating over a list of IDs.
            console.error(`A critical UI element (assigned directly to a variable) was not found. Check HTML IDs.`);
            allElementsFound = false;
        }
    });
    // Check elements fetched by ID within the criticalElementIds list for a more specific error message
    criticalElementIds.forEach(id => {
        if (!document.getElementById(id)) {
            console.error(`Critical UI element with ID '${id}' was not found. Check HTML.`);
            allElementsFound = false;
        }
    });


    if(allElementsFound) console.log("All critical UI elements successfully referenced (initial check).");
});