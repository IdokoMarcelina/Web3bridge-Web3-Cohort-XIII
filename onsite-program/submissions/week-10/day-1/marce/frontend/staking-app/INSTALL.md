# Installation Instructions

## 🚀 Complete the Setup

Your frontend is ready! Just need to install the remaining dependencies:

### Step 1: Install Wagmi Dependencies

```bash
npm install wagmi viem @tanstack/react-query
```

If installation is slow, try:
```bash
npm install wagmi viem @tanstack/react-query --timeout=300000
```

### Step 2: Configure Contract Addresses

Update `.env` file with your deployed contract addresses:

```env
# Replace with your actual contract addresses
VITE_STAKING_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_STAKING_TOKEN_ADDRESS=0x0987654321098765432109876543210987654321

# Optional: Add your WalletConnect project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Step 3: Start Development Server

```bash
npm run dev
```

## 📱 Features Ready to Use

Once dependencies are installed and contracts configured, you'll have access to:

✅ **Multi-wallet connection** (MetaMask, Injected)
✅ **Token staking** with approval flow
✅ **Withdrawal interface** with lock period validation
✅ **Rewards claiming** with real-time calculations
✅ **Emergency withdrawal** with penalty warnings
✅ **User dashboard** with staking position tracking
✅ **Protocol statistics** with TVL and APR data
✅ **Responsive design** for all devices
✅ **Black/White/Lemon theme** as requested

## 🎯 Demo Mode

The app includes a demo mode that shows all features when contracts aren't configured, so you can see the complete UI immediately!

## 🔧 Troubleshooting

**If you see Wagmi errors:**
- Make sure all dependencies are installed
- Restart the dev server after installing
- Check that .env file is in the root directory

**If contracts don't load:**
- Verify contract addresses in .env
- Make sure you're on the correct network
- Check that contracts are deployed and verified

## 🎨 Customization

The theme is fully customizable in `src/theme/`:
- Colors in `colors.js`
- Complete theme in `index.js`
- All styled-components use theme values

Ready to stake! 🚀