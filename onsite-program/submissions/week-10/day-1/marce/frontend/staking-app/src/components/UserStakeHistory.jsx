import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useContract } from '../context/ContractContext';

const HistoryCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(125, 211, 252, 0.5);
    transform: translateY(-2px);
  }
`;

const HistoryTitle = styled.h3`
  color: #7dd3fc;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-align: center;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(125, 211, 252, 0.2);
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryLabel = styled.div`
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  font-weight: 500;
`;

const SummaryValue = styled.div`
  color: #7dd3fc;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const TransactionsList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(125, 211, 252, 0.3);
    border-radius: 3px;
  }
`;

const TransactionItem = styled.div`
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(125, 211, 252, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(125, 211, 252, 0.4);
    transform: translateX(4px);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const TransactionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`;

const TransactionType = styled.span`
  background: ${props => props.type === 'stake' 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
    : props.type === 'withdrawal'
    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  };
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const TransactionAmount = styled.span`
  color: #7dd3fc;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 16px;
`;

const TransactionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  font-size: 12px;
`;

const TransactionDetail = styled.div`
  color: #94a3b8;
`;

const DetailLabel = styled.span`
  color: #64748b;
  margin-right: 4px;
`;

const DetailValue = styled.span`
  color: #e2e8f0;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const StatusMessage = styled.div`
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  background: ${props => props.type === 'error' 
    ? 'rgba(239, 68, 68, 0.1)' 
    : 'rgba(59, 130, 246, 0.1)'
  };
  border: 1px solid ${props => props.type === 'error' 
    ? 'rgba(239, 68, 68, 0.3)' 
    : 'rgba(59, 130, 246, 0.3)'
  };
  color: ${props => props.type === 'error' 
    ? '#fca5a5' 
    : '#93c5fd'
  };
`;

const RefreshButton = styled.button`
  width: 100%;
  padding: 8px 16px;
  background: rgba(125, 211, 252, 0.1);
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 6px;
  color: #7dd3fc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;

  &:hover {
    background: rgba(125, 211, 252, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UserStakeHistory = () => {
  const { account, contractService, isConnected, isInitialized } = useContract();
  const [userTransactions, setUserTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (account && isInitialized) {
      loadUserHistory();
    }
  }, [account, isInitialized]);

  const loadUserHistory = async () => {
    if (!account) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [allStakes, allWithdrawals] = await Promise.all([
        contractService.getRecentStakeEvents(),
        contractService.getRecentWithdrawalEvents()
      ]);
      
      // Filter events for current user
      const userStakes = allStakes.filter(event => 
        event.user.toLowerCase() === account.toLowerCase()
      );
      const userWithdrawals = allWithdrawals.filter(event => 
        event.user.toLowerCase() === account.toLowerCase()
      );
      
      // Combine and sort by timestamp (newest first)
      const allUserTxs = [
        ...userStakes.map(tx => ({ ...tx, type: 'stake' })),
        ...userWithdrawals.map(tx => ({ ...tx, type: 'withdrawal' }))
      ].sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
      
      setUserTransactions(allUserTxs);
      
      // Calculate summary
      const totalStaked = userStakes.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const totalWithdrawn = userWithdrawals.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      setSummary({
        totalStaked,
        totalWithdrawn,
        netStaked: totalStaked - totalWithdrawn,
        transactionCount: allUserTxs.length,
        stakeCount: userStakes.length,
        withdrawalCount: userWithdrawals.length
      });
      
    } catch (err) {
      console.error('Error loading user history:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(4);
  };

  if (!isConnected) {
    return (
      <HistoryCard>
        <HistoryTitle>Your Stake History</HistoryTitle>
        <StatusMessage>
          Connect your wallet to view transaction history
        </StatusMessage>
      </HistoryCard>
    );
  }

  if (!isInitialized) {
    return (
      <HistoryCard>
        <HistoryTitle>Your Stake History</HistoryTitle>
        <StatusMessage type="error">
          Contract not configured. Please check your environment setup.
        </StatusMessage>
      </HistoryCard>
    );
  }


  if (error) {
    return (
      <HistoryCard>
        <HistoryTitle>Your Stake History</HistoryTitle>
        <StatusMessage type="error">
          {error}
        </StatusMessage>
        <RefreshButton onClick={loadUserHistory} disabled={loading}>
          {loading ? 'Loading...' : 'Retry'}
        </RefreshButton>
      </HistoryCard>
    );
  }

  return (
    <HistoryCard>
      <HistoryTitle>Your Stake History</HistoryTitle>
      
      <RefreshButton onClick={loadUserHistory} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh History'}
      </RefreshButton>

      {summary && (
        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Total Staked</SummaryLabel>
            <SummaryValue>{summary.totalStaked.toFixed(4)} MIM</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Total Withdrawn</SummaryLabel>
            <SummaryValue>{summary.totalWithdrawn.toFixed(4)} MIM</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Net Position</SummaryLabel>
            <SummaryValue>{summary.netStaked.toFixed(4)} MIM</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Transactions</SummaryLabel>
            <SummaryValue>{summary.transactionCount}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>
      )}

      <TransactionsList>
        {userTransactions.length === 0 ? (
          <StatusMessage>
            {loading ? 'Loading transactions...' : 'No transactions found in recent blocks'}
          </StatusMessage>
        ) : (
          userTransactions.map((tx, index) => (
            <TransactionItem key={`${tx.txHash}-${index}`}>
              <TransactionHeader>
                <TransactionType type={tx.type}>
                  {tx.type === 'stake' ? 'STAKE' : 'WITHDRAWAL'}
                </TransactionType>
                <TransactionAmount>{formatAmount(tx.amount)} MIM</TransactionAmount>
              </TransactionHeader>
              
              <TransactionDetails>
                <TransactionDetail>
                  <DetailLabel>Time:</DetailLabel>
                  <DetailValue>{formatTimestamp(tx.timestamp)}</DetailValue>
                </TransactionDetail>
                <TransactionDetail>
                  <DetailLabel>Block:</DetailLabel>
                  <DetailValue>{tx.blockNumber}</DetailValue>
                </TransactionDetail>
                <TransactionDetail>
                  <DetailLabel>Tx Hash:</DetailLabel>
                  <DetailValue>{formatAddress(tx.txHash)}</DetailValue>
                </TransactionDetail>
              </TransactionDetails>
            </TransactionItem>
          ))
        )}
      </TransactionsList>
    </HistoryCard>
  );
};

export default UserStakeHistory;