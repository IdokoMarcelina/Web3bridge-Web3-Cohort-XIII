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
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 20px;
  background: ${props => props.disabled 
    ? 'rgba(71, 85, 105, 0.5)' 
    : 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)'
  };
  color: ${props => props.disabled ? '#64748b' : '#0f172a'};
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  margin-bottom: 12px;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(125, 211, 252, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const BalanceInfo = styled.div`
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #94a3b8;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BalanceLabel = styled.span`
  color: #7dd3fc;
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

const StakingForm = () => {
  const { account, contractService, isConnected, isInitialized } = useContract();
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  useEffect(() => {
    if (account && isInitialized) {
      loadBalanceData();
    }
  }, [account, isInitialized]);

  const loadBalanceData = async () => {
    try {
      if (!contractService.isConfigured()) return;
      
      const [tokenBalance, tokenAllowance] = await Promise.all([
        contractService.getTokenBalance(account),
        contractService.getTokenAllowance(account, contractService.getAddresses().STAKING)
      ]);
      
      setBalance(tokenBalance);
      setAllowance(tokenAllowance);
    } catch (error) {
      console.error('Error loading balance data:', error);
      setStatus({ type: 'error', message: 'Failed to load balance data' });
    }
  };

  const checkApprovalNeeded = (inputAmount) => {
    if (!inputAmount || parseFloat(inputAmount) === 0) {
      setNeedsApproval(false);
      return;
    }
    
    const amountFloat = parseFloat(inputAmount);
    const allowanceFloat = parseFloat(allowance);
    setNeedsApproval(amountFloat > allowanceFloat);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    checkApprovalNeeded(value);
  };

  const handleMaxClick = () => {
    setAmount(balance);
    checkApprovalNeeded(balance);
  };

  const handleApprove = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Approving tokens...' });

    try {
      await contractService.approveToken(amount);
      setStatus({ type: 'success', message: 'Tokens approved successfully!' });
      await loadBalanceData();
      checkApprovalNeeded(amount);
    } catch (error) {
      console.error('Approval error:', error);
      setStatus({ type: 'error', message: error.reason || 'Approval failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      setStatus({ type: 'error', message: 'Insufficient balance' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Staking tokens...' });

    try {
      await contractService.stake(amount);
      setStatus({ type: 'success', message: `Successfully staked ${amount} MIM!` });
      setAmount('');
      await loadBalanceData();
    } catch (error) {
      console.error('Staking error:', error);
      setStatus({ type: 'error', message: error.reason || 'Staking failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <FormCard>
        <FormTitle>Stake MIM Tokens</FormTitle>
        <StatusMessage type="info">
          Please connect your wallet to start staking
        </StatusMessage>
      </FormCard>
    );
  }

  if (!isInitialized) {
    return (
      <FormCard>
        <FormTitle>Stake MIM Tokens</FormTitle>
        <StatusMessage type="error">
          Contract not configured. Please check your environment setup.
        </StatusMessage>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <FormTitle>Stake MIM Tokens</FormTitle>
      
      <BalanceInfo>
        <div>
          <BalanceLabel>Your Balance:</BalanceLabel> {parseFloat(balance).toFixed(4)} MIM
        </div>
        <MaxButton onClick={handleMaxClick}>MAX</MaxButton>
      </BalanceInfo>

      <InputGroup>
        <Label>Amount to Stake</Label>
        <Input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={handleAmountChange}
          min="0"
          step="0.0001"
        />
      </InputGroup>

      {status && (
        <StatusMessage type={status.type}>
          {status.message}
        </StatusMessage>
      )}

      {needsApproval ? (
        <Button 
          onClick={handleApprove} 
          disabled={loading || !amount || parseFloat(amount) <= 0}
        >
          {loading ? 'Approving...' : `Approve ${amount} MIM`}
        </Button>
      ) : (
        <Button 
          onClick={handleStake} 
          disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance)}
        >
          {loading ? 'Staking...' : `Stake ${amount || '0'} MIM`}
        </Button>
      )}
    </FormCard>
  );
};

export default StakingForm;