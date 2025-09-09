import React, { createContext, useContext, useState, useEffect } from 'react';
import { contractService } from '../utils/contract';

const ContractContext = createContext();

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within ContractProvider');
  }
  return context;
};

export const ContractProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const userAccount = accounts[0];
          setAccount(userAccount);
          
          if (contractService.isConfigured()) {
            await contractService.connect(userAccount);
            setIsInitialized(true);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setError('Failed to check wallet connection');
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
      if (contractService.isConfigured()) {
        contractService.connect(accounts[0]);
      }
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }

      const userAccount = accounts[0];
      setAccount(userAccount);
      setIsConnected(true);
      
      try {
        await contractService.connect(userAccount);
        setIsInitialized(true);
      } catch (contractError) {
        console.error('Contract initialization failed:', contractError);
        setError('Contract not configured. Check your environment variables.');
      }
      
      return userAccount;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    setIsInitialized(false);
    setError(null);
    
    if (contractService && contractService.disconnect) {
      contractService.disconnect();
    }
  };

  const executeContractCall = async (contractMethod, ...args) => {
    if (!isConnected || !isInitialized) {
      throw new Error('Wallet not connected or contract not initialized');
    }

    try {
      return await contractMethod(...args);
    } catch (error) {
      console.error('Contract call failed:', error);
      
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      } else if (error.code === -32603) {
        throw new Error('Transaction failed. Please check your balance and try again.');
      } else if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else {
        throw new Error(error.reason || error.message || 'Transaction failed');
      }
    }
  };

  const refreshData = async () => {
    if (isInitialized && account) {
      try {
        await contractService.connect(account);
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
  };

  const value = {
    account,
    isConnected,
    isInitialized,
    isLoading,
    error,
    
    connectWallet,
    disconnectWallet,
    refreshData,
    
    contractService,
    executeContractCall,
    
    formatAddress: (address) => {
      if (!address) return '';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
    
    formatAmount: (amount, decimals = 4) => {
      return parseFloat(amount || 0).toFixed(decimals);
    },
    
    formatTimestamp: (timestamp) => {
      return new Date(parseInt(timestamp) * 1000).toLocaleString();
    }
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};