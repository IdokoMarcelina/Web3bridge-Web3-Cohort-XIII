import React from 'react';
import styled from 'styled-components';
import { useContract } from '../context/ContractContext';

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ConnectButton = styled.button`
  background: #FFFF00;
  color: #000000;
  border: 2px solid #FFFF00;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #E6E600;
    border-color: #E6E600;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const AddressDisplay = styled.div`
  color: #FFFFFF;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 8px 12px;
  background: #1a1a1a;
  border-radius: 6px;
  border: 1px solid #444;
`;

const DisconnectButton = styled.button`
  background: transparent;
  color: #FFFFFF;
  border: 2px solid #666;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    border-color: #FFFF00;
    color: #FFFF00;
  }
`;

const WalletConnect = () => {
  const { account, isLoading, isConnected, connectWallet, disconnectWallet, formatAddress, error } = useContract();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  if (isConnected && account) {
    return (
      <WalletContainer>
        <AddressDisplay>
          {formatAddress(account)}
        </AddressDisplay>
        <DisconnectButton onClick={disconnectWallet}>
          Disconnect
        </DisconnectButton>
      </WalletContainer>
    );
  }

  return (
    <WalletContainer>
      <ConnectButton onClick={handleConnect} disabled={isLoading}>
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </ConnectButton>
      {error && (
        <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </WalletContainer>
  );
};

export default WalletConnect;