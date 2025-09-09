# Quick Setup Guide

## Fix the Wagmi Installation Issue

The error you're seeing is due to missing Wagmi dependencies. Here's how to fix it:

### Step 1: Install Required Dependencies

```bash
cd frontend/staking-app
npm install wagmi viem @tanstack/react-query
```

If the installation takes too long or fails, try:
```bash
npm install wagmi viem @tanstack/react-query --timeout=300000
```

### Step 2: Create Environment File

Create `.env` in the project root:
```bash
# Copy the example
cp src/.env.example .env
```

Add your contract addresses:
```env
VITE_STAKING_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_STAKING_TOKEN_ADDRESS=0x0987654321098765432109876543210987654321
```

### Step 3: Switch to Full App

Once dependencies are installed, replace the simplified App.jsx with the full version:

```bash
# The full App.jsx with all components is available as App-full.jsx
# Just need to restore the imports and Wagmi providers
```

## Full App.jsx (restore this after dependency installation):

```jsx
import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { config } from './config/wagmi';
import { theme } from './theme';

import WalletConnection from './components/WalletConnection';
import ProtocolStats from './components/ProtocolStats';
import UserStakePosition from './components/UserStakePosition';
import StakingForm from './components/StakingForm';
import WithdrawForm from './components/WithdrawForm';
import RewardsSection from './components/RewardsSection';
import EmergencyWithdraw from './components/EmergencyWithdraw';

// ... rest of the styled components and app logic
```

## What's Built:

✅ **Complete Frontend Structure**
✅ **Wagmi Integration with your pattern**  
✅ **Black/White/Lemon Theme**
✅ **All Required Components**
✅ **Custom Hooks for Contract Interaction**
✅ **Responsive Design**
✅ **Error Handling**

## Components Created:

1. **WalletConnection** - Multi-wallet support
2. **StakingForm** - Token approval + staking
3. **WithdrawForm** - Withdrawal with lock checks
4. **RewardsSection** - Rewards display + claiming
5. **EmergencyWithdraw** - Emergency withdrawal with warnings
6. **UserStakePosition** - Personal dashboard
7. **ProtocolStats** - Global protocol metrics

## Custom Hooks:

1. **useStaking** - Contract write operations
2. **useStakingData** - Contract read operations  
3. **useToken** - ERC20 operations

The app follows your exact pattern from the governance voting example you provided!