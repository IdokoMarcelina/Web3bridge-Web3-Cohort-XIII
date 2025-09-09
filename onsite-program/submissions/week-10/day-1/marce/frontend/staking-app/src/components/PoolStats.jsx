import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useContract } from '../context/ContractContext';

const StatsCard = styled.div`
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

const StatsTitle = styled.h3`
  color: #7dd3fc;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(125, 211, 252, 0.2);
  text-align: center;
`;

const StatLabel = styled.div`
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const StatValue = styled.div`
  color: #7dd3fc;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const StatusMessage = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
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
  text-align: center;
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

  &:hover {
    background: rgba(125, 211, 252, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PoolStats = () => {
  const { contractService, isInitialized } = useContract();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isInitialized && contractService.stakingContract) {
      loadStats();
      const interval = setInterval(loadStats, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [totalStaked, contractInfo] = await Promise.all([
        contractService.getTotalStaked(),
        contractService.getContractInfo()
      ]);

      setStats({
        totalStaked: parseFloat(totalStaked),
        currentAPR: (parseInt(contractInfo.currentRewardRate) / 100),
        initialAPR: (parseInt(contractInfo.initialApr) / 100),
        minLockDays: parseInt(contractInfo.minLockDuration) / 86400,
        emergencyPenalty: parseInt(contractInfo.emergencyWithdrawPenalty)
      });
    } catch (err) {
      console.error('Error loading pool stats:', err);
      setError('Failed to load pool statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(2);
  };

  if (!isInitialized) {
    return (
      <StatsCard>
        <StatsTitle>Pool Statistics</StatsTitle>
        <StatusMessage type="error">
          Contract not configured. Please connect your wallet.
        </StatusMessage>
      </StatsCard>
    );
  }

  if (error) {
    return (
      <StatsCard>
        <StatsTitle>Pool Statistics</StatsTitle>
        <StatusMessage type="error">
          {error}
        </StatusMessage>
        <RefreshButton onClick={loadStats} disabled={loading}>
          {loading ? 'Loading...' : 'Retry'}
        </RefreshButton>
      </StatsCard>
    );
  }

  if (!stats) {
    return (
      <StatsCard>
        <StatsTitle>Pool Statistics</StatsTitle>
        <StatusMessage>
          Loading pool statistics...
        </StatusMessage>
      </StatsCard>
    );
  }

  return (
    <StatsCard>
      <StatsTitle>Pool Statistics</StatsTitle>
      
      <StatsGrid>
        <StatItem>
          <StatLabel>Total Staked</StatLabel>
          <StatValue>{formatNumber(stats.totalStaked)} MIM</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Current APR</StatLabel>
          <StatValue>{stats.currentAPR.toFixed(2)}%</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Min Lock Period</StatLabel>
          <StatValue>{stats.minLockDays} Days</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>Emergency Penalty</StatLabel>
          <StatValue>{stats.emergencyPenalty}%</StatValue>
        </StatItem>
      </StatsGrid>

      <RefreshButton onClick={loadStats} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Stats'}
      </RefreshButton>
    </StatsCard>
  );
};

export default PoolStats;