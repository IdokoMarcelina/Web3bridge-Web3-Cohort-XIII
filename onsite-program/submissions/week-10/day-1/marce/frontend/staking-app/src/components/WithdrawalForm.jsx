import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useContract } from '../context/ContractContext';

const FormCard = styled.div`
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

const FormTitle = styled.h3`
  color: #7dd3fc;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-align: center;
`;

const StakeInfo = styled.div`
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(125, 211, 252, 0.2);
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #94a3b8;
`;

const InfoValue = styled.span`
  color: #7dd3fc;
  font-weight: 600;
`;

const LockTimer = styled.div`
  background: ${props => props.unlocked 
    ? 'rgba(16, 185, 129, 0.1)' 
    : 'rgba(245, 158, 11, 0.1)'
  };
  border: 1px solid ${props => props.unlocked 
    ? 'rgba(16, 185, 129, 0.3)' 
    : 'rgba(245, 158, 11, 0.3)'
  };
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  text-align: center;
  color: ${props => props.unlocked ? '#86efac' : '#fbbf24'};
  font-weight: 600;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #7dd3fc;
    box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: ${props => props.disabled 
    ? 'rgba(71, 85, 105, 0.5)' 
    : props.emergency
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)'
  };
  color: ${props => props.disabled ? '#64748b' : props.emergency ? '#fef2f2' : '#0f172a'};
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  margin-bottom: 12px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.emergency 
      ? '0 4px 20px rgba(239, 68, 68, 0.3)'
      : '0 4px 20px rgba(125, 211, 252, 0.3)'
    };
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const MaxButton = styled.button`
  background: rgba(125, 211, 252, 0.1);
  border: 1px solid rgba(125, 211, 252, 0.3);
  color: #7dd3fc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 8px;

  &:hover {
    background: rgba(125, 211, 252, 0.2);
  }
`;

const StatusMessage = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  background: ${props => props.type === 'error' 
    ? 'rgba(239, 68, 68, 0.1)' 
    : props.type === 'success' 
    ? 'rgba(16, 185, 129, 0.1)'
    : 'rgba(59, 130, 246, 0.1)'
  };
  border: 1px solid ${props => props.type === 'error' 
    ? 'rgba(239, 68, 68, 0.3)' 
    : props.type === 'success' 
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(59, 130, 246, 0.3)'
  };
  color: ${props => props.type === 'error' 
    ? '#fca5a5' 
    : props.type === 'success' 
    ? '#86efac'
    : '#93c5fd'
  };
`;

const EmergencyWarning = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #fca5a5;
  line-height: 1.4;
`;

const WithdrawalForm = () => {
  const { account, contractService, isConnected, isInitialized } = useContract();
  const [amount, setAmount] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [timeUntilUnlock, setTimeUntilUnlock] = useState(0);

  useEffect(() => {
    if (account && isInitialized) {
      loadUserData();
      const interval = setInterval(loadUserData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [account, isInitialized]);

  const loadUserData = async () => {
    try {
      const details = await contractService.getUserDetails(account);
      setUserDetails(details);
      setTimeUntilUnlock(parseInt(details.timeUntilUnlock));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Unlocked';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleMaxClick = () => {
    if (userDetails) {
      setAmount(userDetails.stakedAmount);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    if (parseFloat(amount) > parseFloat(userDetails.stakedAmount)) {
      setStatus({ type: 'error', message: 'Amount exceeds staked balance' });
      return;
    }

    if (!userDetails.canWithdraw) {
      setStatus({ type: 'error', message: 'Withdrawal not available - lock period not met' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Processing withdrawal...' });

    try {
      await contractService.withdraw(amount);
      setStatus({ type: 'success', message: `Successfully withdrew ${amount} MIM!` });
      setAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Withdrawal error:', error);
      setStatus({ type: 'error', message: error.reason || 'Withdrawal failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Processing emergency withdrawal...' });

    try {
      await contractService.emergencyWithdraw();
      setStatus({ type: 'success', message: 'Emergency withdrawal completed (10% penalty applied)' });
      setAmount('');
      await loadUserData();
    } catch (error) {
      console.error('Emergency withdrawal error:', error);
      setStatus({ type: 'error', message: error.reason || 'Emergency withdrawal failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Claiming rewards...' });

    try {
      await contractService.claimRewards();
      setStatus({ type: 'success', message: 'Rewards claimed successfully!' });
      await loadUserData();
    } catch (error) {
      console.error('Claim rewards error:', error);
      setStatus({ type: 'error', message: error.reason || 'Failed to claim rewards' });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <FormCard>
        <FormTitle>Withdraw & Rewards</FormTitle>
        <StatusMessage type="info">
          Please connect your wallet to view withdrawal options
        </StatusMessage>
      </FormCard>
    );
  }

  if (!isInitialized) {
    return (
      <FormCard>
        <FormTitle>Withdraw & Rewards</FormTitle>
        <StatusMessage type="error">
          Contract not configured. Please check your environment setup.
        </StatusMessage>
      </FormCard>
    );
  }

  if (!userDetails) {
    return (
      <FormCard>
        <FormTitle>Withdraw & Rewards</FormTitle>
        <StatusMessage type="info">
          Loading your staking information...
        </StatusMessage>
      </FormCard>
    );
  }

  const hasStake = parseFloat(userDetails.stakedAmount) > 0;
  const hasRewards = parseFloat(userDetails.pendingRewards) > 0;

  return (
    <FormCard>
      <FormTitle>Withdraw & Rewards</FormTitle>
      
      {hasStake && (
        <StakeInfo>
          <InfoRow>
            <InfoLabel>Staked Amount:</InfoLabel>
            <InfoValue>{parseFloat(userDetails.stakedAmount).toFixed(4)} MIM</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Pending Rewards:</InfoLabel>
            <InfoValue>{parseFloat(userDetails.pendingRewards).toFixed(6)} MIM</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Last Stake:</InfoLabel>
            <InfoValue>{new Date(parseInt(userDetails.lastStakeTimestamp) * 1000).toLocaleDateString()}</InfoValue>
          </InfoRow>
        </StakeInfo>
      )}

      {hasStake && (
        <LockTimer unlocked={userDetails.canWithdraw}>
          {userDetails.canWithdraw ? '🔓 Ready to withdraw' : `🔒 Unlocks in: ${formatTime(timeUntilUnlock)}`}
        </LockTimer>
      )}

      {status && (
        <StatusMessage type={status.type}>
          {status.message}
        </StatusMessage>
      )}

      {hasRewards && (
        <Button 
          onClick={handleClaimRewards} 
          disabled={loading}
        >
          {loading ? 'Claiming...' : `Claim ${parseFloat(userDetails.pendingRewards).toFixed(6)} MIM Rewards`}
        </Button>
      )}

      {hasStake && userDetails.canWithdraw && (
        <>
          <InputGroup>
            <Label>
              Amount to Withdraw
              <MaxButton onClick={handleMaxClick}>MAX</MaxButton>
            </Label>
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.0001"
              max={userDetails.stakedAmount}
            />
          </InputGroup>

          <Button 
            onClick={handleWithdraw} 
            disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(userDetails.stakedAmount)}
          >
            {loading ? 'Withdrawing...' : `Withdraw ${amount || '0'} MIM`}
          </Button>
        </>
      )}

      {hasStake && !userDetails.canWithdraw && (
        <>
          <EmergencyWarning>
            <strong>⚠️ Emergency Withdrawal Available</strong><br/>
            You can withdraw immediately but a 10% penalty will be applied to your staked amount.
            Current stake: {parseFloat(userDetails.stakedAmount).toFixed(4)} MIM<br/>
            You would receive: {(parseFloat(userDetails.stakedAmount) * 0.9).toFixed(4)} MIM<br/>
            Penalty: {(parseFloat(userDetails.stakedAmount) * 0.1).toFixed(4)} MIM
          </EmergencyWarning>

          <Button 
            emergency
            onClick={handleEmergencyWithdraw} 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Emergency Withdraw (10% Penalty)'}
          </Button>
        </>
      )}

      {!hasStake && (
        <StatusMessage type="info">
          No active stakes found. Start staking to earn rewards!
        </StatusMessage>
      )}
    </FormCard>
  );
};

export default WithdrawalForm;