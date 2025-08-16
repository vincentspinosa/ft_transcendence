import { BlockchainScoreBoard } from './components/BlockchainScoreBoard';
import { BlockchainService } from './blockchainService';

// Export classes for use in other parts of the application
export { BlockchainScoreBoard, BlockchainService };

// Initialize component on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if container exists for component placement
    const blockchainContainer = document.getElementById('blockchain-scoreboard');
    if (blockchainContainer) {
        // Create component instance
        const scoreBoard = new BlockchainScoreBoard('blockchain-scoreboard');
    }
});
