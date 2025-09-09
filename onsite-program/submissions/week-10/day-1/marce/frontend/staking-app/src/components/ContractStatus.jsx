import React from 'react';
import styled from 'styled-components';
import { contractService } from '../utils/contract';

const StatusCard = styled.div`
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid ${props => 
    props.configured 
      ? 'rgba(16, 185, 129, 0.3)' 
      : 'rgba(245, 158, 11, 0.3)'
  };
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatusIcon = styled.div`
  font-size: 20px;
`;

const StatusTitle = styled.h3`
  color: ${props => 
    props.configured 
      ? '#10b981' 
      : '#f59e0b'
  };
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const StatusMessage = styled.p`
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const AddressInfo = styled.div`
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #7dd3fc;
`;

const AddressRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 4px;
  }
`;

const AddressLabel = styled.span`
  color: #94a3b8;
  min-width: 120px;
`;

const AddressValue = styled.span`
  word-break: break-all;
  color: ${props => props.configured ? '#10b981' : '#f59e0b'};
`;

const TokenInfo = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
  border: 1px solid rgba(16, 185, 129, 0.2);
`;

const ConfigInstructions = styled.div`
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
`;

const ContractStatus = () => {
  const isConfigured = contractService.isConfigured();
  const addresses = contractService.getAddresses();

  return (
    <StatusCard configured={isConfigured}>
      <StatusHeader>
        <StatusIcon>{isConfigured ? '✅' : '⚠️'}</StatusIcon>
        <StatusTitle configured={isConfigured}>
          {isConfigured ? 'Contracts Configured' : 'Configuration Required'}
        </StatusTitle>
      </StatusHeader>
      
      <StatusMessage>
        {isConfigured 
          ? 'Contracts ready for staking'
          : 'Contract configuration required'
        }
      </StatusMessage>
    </StatusCard>
  );
};

export default ContractStatus;