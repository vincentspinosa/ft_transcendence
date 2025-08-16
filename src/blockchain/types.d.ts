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
