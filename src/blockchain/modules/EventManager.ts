export class EventManager {
    private eventListeners: (() => void)[] = [];
    private scoreUpdateCallbacks: ((player: string, score: number) => void)[] = [];

    constructor() {
        // Empty constructor
    }

    /**
     * Subscribe to score updates
     */
    public onScoreUpdate(callback: (player: string, score: number) => void): void {
        this.scoreUpdateCallbacks.push(callback);
    }

    /**
     * Notify subscribers of score update
     */
    public notifyScoreUpdate(player: string, score: number): void {
        this.scoreUpdateCallbacks.forEach(callback => {
            try {
                callback(player, score);
            } catch (error) {
                console.error('Error in score update callback:', error);
            }
        });
    }

    /**
     * Subscribe to score update events
     */
    public subscribeToScoreUpdates(callback: (player: string, score: number) => void, contractAddress: string | null): void {
        if (!contractAddress) {
            throw new Error('Contract address not set');
        }

        // Simple solution: periodically update data
        // In real project, better to use WebSocket or proper event subscription
        const eventListener = async () => {
            try {
                // Simply call callback to update data
                // Callback will update UI by reloading all data
                console.log('Checking for score updates...');

                // Here we can add logic to check for changes
                // For now just notify that data needs to be updated
            } catch (error) {
                console.error('Error checking for events:', error);
            }
        };

        // Start interval to check events every 10 seconds
        const intervalId = setInterval(eventListener, 10000);

        // Save function for unsubscribing
        this.eventListeners.push(() => {
            clearInterval(intervalId);
        });
    }

    /**
     * Unsubscribe from all events
     */
    public unsubscribeFromEvents(): void {
        this.eventListeners.forEach(unsubscribe => unsubscribe());
        this.eventListeners = [];
    }
}
