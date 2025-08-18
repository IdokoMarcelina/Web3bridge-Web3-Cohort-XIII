# Evict - Ethereum DeFi Interactions Project

This project demonstrates advanced Ethereum smart contract interactions, particularly focused on Uniswap V2 DeFi protocols. It includes comprehensive examples of token swapping, liquidity provision, and various DeFi operations.

## 🚀 Features

- ✅ **Smart Contract Development**: Lock contract with time-based access control
- ✅ **Uniswap V2 Integrations**: Complete implementation of all Uniswap V2 Router functions
- ✅ **Token Operations**: ERC20 token approvals, transfers, and balance checking
- ✅ **Liquidity Management**: Add/remove liquidity with proper validation
- ✅ **Error Handling**: Comprehensive error handling and validation
- ✅ **TypeScript Support**: Fully typed contracts and interactions
- ✅ **Gas Optimization**: Efficient transaction patterns

## 🛠️ Installation

```shell
npm install
```

## 🎮 Usage

### Basic Commands

```shell
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Start local node
npx hardhat node
```

### Demo Scripts

```shell
# Run the interactive demo (recommended first step)
npx hardhat run scripts/demoScript.ts

# Run Uniswap interactions on mainnet fork (requires API key)
npx hardhat run scripts/improvedInteractions.ts --fork https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY

# Run original contract interactions (fixed version)
npx hardhat run scripts/contractinteractions.ts --fork https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
```

## 📁 Project Structure

```
evict/
├── contracts/              # Smart contracts
│   ├── Lock.sol            # Time-locked ETH contract
│   ├── IERC20.sol          # ERC20 interface
│   ├── IERC20Permit.sol    # ERC20 Permit extension
│   ├── IUniswapV2Factory.sol
│   └── IUniswapV2Router02.sol
├── scripts/                # Interaction scripts
│   ├── demoScript.ts       # Interactive demo (START HERE)
│   ├── improvedInteractions.ts  # Enhanced Uniswap interactions
│   ├── contractinteractions.ts  # Original interactions (fixed)
│   └── [other liquidity scripts]
├── test/                   # Contract tests
├── hardhat.config.ts       # Hardhat configuration (TypeScript)
└── package.json           # Dependencies
```

## 🔧 What Was Fixed

This project had several issues that have been resolved:

### 1. Configuration Issues
- ✅ **Fixed Hardhat Config**: Converted from CommonJS to proper TypeScript syntax
- ✅ **Added TypeScript Support**: Proper type definitions and imports
- ✅ **Updated Dependencies**: All packages are compatible

### 2. Contract Interaction Issues
- ✅ **Balance Validation**: Added proper balance checks before transactions
- ✅ **Error Handling**: Comprehensive try-catch blocks with detailed error messages
- ✅ **Gas Management**: Added ETH to impersonated accounts for gas fees
- ✅ **Transaction Sequencing**: Fixed logical order of operations
- ✅ **Permit Signatures**: Corrected permit signing implementation

### 3. Code Quality Improvements
- ✅ **Helper Functions**: Modular, reusable functions for common operations
- ✅ **Logging**: Clear, emoji-enhanced console output
- ✅ **Documentation**: Comprehensive comments and structure
- ✅ **Type Safety**: Full TypeScript typing throughout

## 🧪 Testing

Run the comprehensive test suite:

```shell
# Run all tests
npx hardhat test

# Run tests with coverage
npx hardhat coverage

# Run specific test file
npx hardhat test test/Lock.ts
```

## 🌐 Network Configuration

The project is configured for:
- **Local Development**: Hardhat Network
- **Lisk Sepolia**: Testnet deployment ready
- **Mainnet Fork**: For realistic testing with actual tokens

## 🔐 Environment Variables

Create a `.env` file with:

```env
PRIVATE_KEY=your_private_key_here
ETHER_API_KEY=your_alchemy_api_key_here
```

## 📚 Learning Resources

This project demonstrates:
- **DeFi Protocol Integration**: How to interact with Uniswap V2
- **Smart Contract Security**: Time locks, access control, validation
- **Token Standards**: ERC20, ERC20Permit implementations
- **Testing Patterns**: Comprehensive test coverage
- **Development Best Practices**: TypeScript, error handling, documentation

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📄 License

MIT License - see LICENSE file for details.
