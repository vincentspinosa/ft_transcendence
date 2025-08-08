// Глобальные типы для blockchain интеграции

interface Window {
    avalanche?: {
        request: (params: {
            method: string;
            params?: any[];
        }) => Promise<any>;
        on?: (event: string, callback: (data: any) => void) => void;
        removeListener?: (event: string, callback: (data: any) => void) => void;
    };
}

// Типы для событий блокчейна
interface LogEntry {
    topics: string[];
    data: string;
    address: string;
    blockNumber: string;
    transactionHash: string;
}

// Типы для фильтров событий
interface EventFilter {
    fromBlock: string;
    toBlock: string;
    address: string;
    topics: string[];
}

// Типы для результатов RPC вызовов
interface TransactionReceipt {
    blockHash: string;
    blockNumber: string;
    contractAddress: string | null;
    from: string;
    gasUsed: string;
    status: string;
    to: string;
    transactionHash: string;
    transactionIndex: string;
}

// Типы для ошибок
interface ErrorWithMessage {
    message: string;
}

// Type guard для проверки ошибок
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
}
