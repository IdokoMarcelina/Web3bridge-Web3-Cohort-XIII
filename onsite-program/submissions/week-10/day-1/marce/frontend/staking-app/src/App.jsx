import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { ContractProvider } from './context/ContractContext';
import WalletConnect from './components/WalletConnect';
import StakingForm from './components/StakingForm';
import WithdrawalForm from './components/WithdrawalForm';
import PoolStats from './components/PoolStats';
import AllStakePositions from './components/AllStakePositions';
import UserStakeHistory from './components/UserStakeHistory';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
    color: #e2e8f0;
    line-height: 1.6;
    min-height: 100vh;
  }
`;

const Container = styled.div`
  min-height: 100vh;
  padding: 16px;
  width: 100%;
  
  @media (min-width: 768px) {
    padding: 24px;
  }
`;

const Header = styled.header`
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 20px 16px;
  }
`;

const Title = styled.h1`
  color: #7dd3fc;
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 700;
  background: linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Card = styled.div`
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(125, 211, 252, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%);
  color: #0f172a;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(125, 211, 252, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(125, 211, 252, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  width: 100%;
  
  @media (min-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const StatusCard = styled(Card)`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
`;

const ProgressCard = styled(Card)`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const CardIcon = styled.div`
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(125, 211, 252, 0.3));
`;

const CardTitle = styled.h2`
  color: #7dd3fc;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const ConnectedStatus = styled.div`
  text-align: center;
  padding: 20px 0;
`;

const DisconnectedStatus = styled.div`
  text-align: center;
  padding: 20px 0;
`;

const StatusIndicator = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.connected ? '#10b981' : '#f59e0b'};
  margin-bottom: 12px;
`;

const AddressDisplay = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 16px;
  color: #7dd3fc;
  background: rgba(15, 23, 42, 0.5);
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(125, 211, 252, 0.2);
  margin: 12px 0;
  word-break: break-all;
`;

const ReadyText = styled.p`
  color: #94a3b8;
  font-size: 16px;
  margin-top: 8px;
`;

const PromptText = styled.p`
  color: #94a3b8;
  font-size: 16px;
`;

const ProgressList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ProgressItem = styled.li`
  padding: 12px 0;
  font-size: 16px;
  color: ${props => props.completed ? '#10b981' : '#94a3b8'};
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

function App() {
  return (
    <ContractProvider>
      <GlobalStyle />
      <Container>
        <Header>
          <Title>StakeDApp</Title>
          <WalletConnect />
        </Header>
        
        <PoolStats />
        
        <MainGrid>
          <StakingForm />
          <WithdrawalForm />
        </MainGrid>
        
        <AllStakePositions />
        
        <UserStakeHistory />
      </Container>
    </ContractProvider>
  );
}

export default App;