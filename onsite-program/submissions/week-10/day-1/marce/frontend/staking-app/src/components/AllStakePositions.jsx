import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { contractService } from '../utils/contract';

const PositionsCard = styled.div`
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

const PositionsTitle = styled.h3`
  color: #7dd3fc;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-align: center;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(125, 211, 252, 0.2);
`;

const TabButton = styled.button`
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)' 
    : 'transparent'
  };
  color: ${props => props.active ? '#0f172a' : '#7dd3fc'};
  border: none;
  padding: 8px 16px;
  border-radius: 8px 8px 0 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)' 
      : 'rgba(125, 211, 252, 0.1)'
    };
  }
`;

const EventsList = styled.div`
  max-height: 400px;
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

const EventItem = styled.div`
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

const EventHeader = styled.div`
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

const EventType = styled.span`
  background: ${props => props.type === 'stake' 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  };
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const EventAmount = styled.span`
  color: #7dd3fc;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 16px;
`;

const EventDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  font-size: 12px;
`;

const EventDetail = styled.div`
  color: #94a3b8;
`;

const EventLabel = styled.span`
  color: #64748b;
  margin-right: 4px;
`;

const EventValue = styled.span`
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

const AllStakePositions = () => {
  const [activeTab, setActiveTab] = useState('stakes');
  const [stakeEvents, setStakeEvents] = useState([]);
  const [withdrawalEvents, setWithdrawalEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractService.isConfigured() && contractService.stakingContract) {
      loadEvents();
    }
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [stakes, withdrawals] = await Promise.all([
        contractService.getRecentStakeEvents(),
        contractService.getRecentWithdrawalEvents()
      ]);
      
      setStakeEvents(stakes.reverse()); // Show newest first
      setWithdrawalEvents(withdrawals.reverse());
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load stake positions');
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

  if (!contractService.isConfigured()) {
    return (
      <PositionsCard>
        <PositionsTitle>All Stake Positions</PositionsTitle>
        <StatusMessage type="error">
          Contract not configured
        </StatusMessage>
      </PositionsCard>
    );
  }

  if (!contractService.stakingContract) {
    return (
      <PositionsCard>
        <PositionsTitle>All Stake Positions</PositionsTitle>
        <StatusMessage>
          Please connect your wallet to view stake positions
        </StatusMessage>
      </PositionsCard>
    );
  }

  if (error) {
    return (
      <PositionsCard>
        <PositionsTitle>All Stake Positions</PositionsTitle>
        <StatusMessage type="error">
          {error}
        </StatusMessage>
        <RefreshButton onClick={loadEvents} disabled={loading}>
          {loading ? 'Loading...' : 'Retry'}
        </RefreshButton>
      </PositionsCard>
    );
  }

  const currentEvents = activeTab === 'stakes' ? stakeEvents : withdrawalEvents;

  return (
    <PositionsCard>
      <PositionsTitle>All Stake Positions</PositionsTitle>
      
      <RefreshButton onClick={loadEvents} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Events'}
      </RefreshButton>

      <TabContainer>
        <TabButton 
          active={activeTab === 'stakes'} 
          onClick={() => setActiveTab('stakes')}
        >
          Stakes ({stakeEvents.length})
        </TabButton>
        <TabButton 
          active={activeTab === 'withdrawals'} 
          onClick={() => setActiveTab('withdrawals')}
        >
          Withdrawals ({withdrawalEvents.length})
        </TabButton>
      </TabContainer>

      <EventsList>
        {currentEvents.length === 0 ? (
          <StatusMessage>
            {loading ? 'Loading events...' : `No ${activeTab} found in recent blocks`}
          </StatusMessage>
        ) : (
          currentEvents.map((event, index) => (
            <EventItem key={`${event.txHash}-${index}`}>
              <EventHeader>
                <EventType type={activeTab === 'stakes' ? 'stake' : 'withdrawal'}>
                  {activeTab === 'stakes' ? 'STAKE' : 'WITHDRAWAL'}
                </EventType>
                <EventAmount>{formatAmount(event.amount)} MIM</EventAmount>
              </EventHeader>
              
              <EventDetails>
                <EventDetail>
                  <EventLabel>User:</EventLabel>
                  <EventValue>{formatAddress(event.user)}</EventValue>
                </EventDetail>
                <EventDetail>
                  <EventLabel>Time:</EventLabel>
                  <EventValue>{formatTimestamp(event.timestamp)}</EventValue>
                </EventDetail>
                <EventDetail>
                  <EventLabel>Block:</EventLabel>
                  <EventValue>{event.blockNumber}</EventValue>
                </EventDetail>
                <EventDetail>
                  <EventLabel>Tx:</EventLabel>
                  <EventValue>{formatAddress(event.txHash)}</EventValue>
                </EventDetail>
              </EventDetails>
            </EventItem>
          ))
        )}
      </EventsList>
    </PositionsCard>
  );
};

export default AllStakePositions;