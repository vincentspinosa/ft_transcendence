interface Window {
    ethereum?: {
        request: (params: {
            method: string;
            params?: any[];
        }) => Promise<any>;
        on?: (event: string, callback: (data: any) => void) => void;
        removeListener?: (event: string, callback: (data: any) => void) => void;
        isMetaMask?: boolean;
        selectedAddress?: string;
        networkVersion?: string;
        chainId?: string;
    };
}

// Types for blockchain events
interface LogEntry {
    topics: string[];
    data: string;
    address: string;
    blockNumber: string;
    transactionHash: string;
}

// Types for event filters
interface EventFilter {
    fromBlock: string;
    toBlock: string;
    address: string;
    topics: string[];
}

// Types for RPC call results
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

// Blockchain network types
