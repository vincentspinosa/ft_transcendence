import { BlockchainScoreBoard } from '../components/BlockchainScoreBoard';
import { BlockchainService } from './blockchainService';

// Экспортируем классы для использования в других частях приложения
export { BlockchainScoreBoard, BlockchainService };

// Инициализация компонента при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли контейнер для размещения компонента
    const blockchainContainer = document.getElementById('blockchain-scoreboard');
    if (blockchainContainer) {
        // Создаем экземпляр компонента
        const scoreBoard = new BlockchainScoreBoard('blockchain-scoreboard');
    }
});
