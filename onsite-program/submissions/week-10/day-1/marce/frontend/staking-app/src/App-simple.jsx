import React from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { theme } from './theme';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.fonts.primary};
    background: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    line-height: 1.6;
  }

  button {
    font-family: inherit;
  }

  input {
    font-family: inherit;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${theme.colors.background.primary};
`;

const Header = styled.header`
  background: ${theme.colors.background.card};
  border-bottom: 2px solid ${theme.colors.border.primary};
  padding: ${theme.spacing.lg} ${theme.spacing.md};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: ${theme.colors.text.accent};
  font-size: ${theme.fontSizes.xxxl};
  font-weight: bold;
`;

const ConnectButton = styled.button`
  background: ${theme.colors.primary.lemon};
  color: ${theme.colors.primary.black};
  border: 2px solid ${theme.colors.primary.lemon};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${theme.colors.primary.lemonDark};
    border-color: ${theme.colors.primary.lemonDark};
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${theme.spacing.lg} ${theme.spacing.md};
`;

const DemoCard = styled.div`
  background: ${theme.colors.background.card};
  border: 2px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  margin: ${theme.spacing.md} 0;
  text-align: center;
`;

const DemoTitle = styled.h2`
  color: ${theme.colors.text.accent};
  font-size: ${theme.fontSizes.xl};
  margin-bottom: ${theme.spacing.md};
`;

const DemoText = styled.p`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.fontSizes.md};
  margin-bottom: ${theme.spacing.md};
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Header>
          <HeaderContent>
            <Logo>StakeDApp</Logo>
            <ConnectButton>Connect Wallet</ConnectButton>
          </HeaderContent>
        </Header>

        <MainContent>
          <DemoCard>
            <DemoTitle>Staking dApp Frontend</DemoTitle>
            <DemoText>
              This is the frontend for your staking smart contract built with React, Vite, and Styled Components.
            </DemoText>
            <DemoText>
              Theme: Black, White, and Lemon colors ✨
            </DemoText>
            <ConnectButton>
              Install Dependencies and Connect Wallet
            </ConnectButton>
          </DemoCard>
        </MainContent>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;