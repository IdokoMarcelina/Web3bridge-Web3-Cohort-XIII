import { ethers } from 'ethers';

export const STAKING_ABI = [
  "function totalStaked() view returns (uint256)",
  "function stakingToken() view returns (address)", 
  "function getUserDetails(address _user) view returns (tuple(uint256 stakedAmount, uint256 lastStakeTimestamp, uint256 pendingRewards, uint256 timeUntilUnlock, bool canWithdraw))",
  "function getPendingRewards(address _user) view returns (uint256)",
  "function getTimeUntilUnlock(address _user) view returns (uint256)",
  "function userInfo(address) view returns (uint256 stakedAmount, uint256 lastStakeTimestamp, uint256 rewardDebt, uint256 pendingRewards)",
  "function currentRewardRate() view returns (uint256)",
  "function initialApr() view returns (uint256)",
  "function minLockDuration() view returns (uint256)",
  "function emergencyWithdrawPenalty() view returns (uint256)",
  
  "function stake(uint256 _amount)",
  "function withdraw(uint256 _amount)",
  "function claimRewards()",
  "function emergencyWithdraw()",
  
  "event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 newTotalStaked, uint256 currentRewardRate)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 timestamp, uint256 newTotalStaked, uint256 currentRewardRate, uint256 rewardsAccrued)",
  "event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp, uint256 newPendingRewards, uint256 totalStaked)",
  "event EmergencyWithdrawn(address indexed user, uint256 amount, uint256 penalty, uint256 timestamp, uint256 newTotalStaked)"
];

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

export const CONTRACT_ADDRESSES = {
  STAKING: import.meta.env.VITE_STAKING_CONTRACT_ADDRESS || null,
  TOKEN: import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS || null,
};

export class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.stakingContract = null;
    this.tokenContract = null;
  }

  async connect(account) {
    if (!window.ethereum) throw new Error('MetaMask not found');
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    
    if (CONTRACT_ADDRESSES.STAKING) {
      this.stakingContract = new ethers.Contract(
        CONTRACT_ADDRESSES.STAKING,
        STAKING_ABI,
        this.signer
      );
    }
    
    if (CONTRACT_ADDRESSES.TOKEN) {
      this.tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TOKEN,
        ERC20_ABI,
        this.signer
      );
    }
    
    return true;
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.stakingContract = null;
    this.tokenContract = null;
  }

  isConfigured() {
    return !!(CONTRACT_ADDRESSES.STAKING && CONTRACT_ADDRESSES.TOKEN);
  }

  getAddresses() {
    return CONTRACT_ADDRESSES;
  }

  async getTotalStaked() {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    const result = await this.stakingContract.totalStaked();
    return ethers.formatEther(result);
  }

  async getUserDetails(address) {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    const result = await this.stakingContract.getUserDetails(address);
    return {
      stakedAmount: ethers.formatEther(result[0]),
      lastStakeTimestamp: result[1].toString(),
      pendingRewards: ethers.formatEther(result[2]),
      timeUntilUnlock: result[3].toString(),
      canWithdraw: result[4]
    };
  }

  async getUserPendingRewards(address) {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    const result = await this.stakingContract.getPendingRewards(address);
    return ethers.formatEther(result);
  }

  async getTokenBalance(address) {
    if (!this.tokenContract) throw new Error('Token contract not initialized');
    const result = await this.tokenContract.balanceOf(address);
    return ethers.formatEther(result);
  }

  async getTokenAllowance(userAddress, spenderAddress) {
    if (!this.tokenContract) throw new Error('Token contract not initialized');
    const result = await this.tokenContract.allowance(userAddress, spenderAddress);
    return ethers.formatEther(result);
  }

  async approveToken(amount) {
    if (!this.tokenContract) throw new Error('Token contract not initialized');
    if (!CONTRACT_ADDRESSES.STAKING) throw new Error('Staking contract address not set');
    
    const tx = await this.tokenContract.approve(
      CONTRACT_ADDRESSES.STAKING,
      ethers.parseEther(amount.toString())
    );
    return tx.wait();
  }

  async stake(amount) {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    const tx = await this.stakingContract.stake(ethers.parseEther(amount.toString()));
    return tx.wait();
  }

  async withdraw(amount) {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    const tx = await this.stakingContract.withdraw(ethers.parseEther(amount.toString()));
    return tx.wait();
  }

  async claimRewards() {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    const tx = await this.stakingContract.claimRewards();
    return tx.wait();
  }

  async emergencyWithdraw() {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    const tx = await this.stakingContract.emergencyWithdraw();
    return tx.wait();
  }

  async getContractInfo() {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    
    const [currentRewardRate, initialApr, minLockDuration, emergencyWithdrawPenalty] = await Promise.all([
      this.stakingContract.currentRewardRate(),
      this.stakingContract.initialApr(),
      this.stakingContract.minLockDuration(),
      this.stakingContract.emergencyWithdrawPenalty()
    ]);

    return {
      currentRewardRate: currentRewardRate.toString(),
      initialApr: initialApr.toString(),
      minLockDuration: minLockDuration.toString(),
      emergencyWithdrawPenalty: emergencyWithdrawPenalty.toString()
    };
  }

  async getRecentStakeEvents(fromBlock = -2000) {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    
    try {
      const filter = this.stakingContract.filters.Staked();
      const events = await this.stakingContract.queryFilter(filter, fromBlock);
      
      return events.map(event => ({
        user: event.args.user,
        amount: ethers.formatEther(event.args.amount),
        timestamp: event.args.timestamp.toString(),
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }));
    } catch (error) {
      console.error('Error fetching stake events:', error);
      return [];
    }
  }

  async getRecentWithdrawalEvents(fromBlock = -2000) {
    if (!this.stakingContract) throw new Error('Staking contract not initialized');
    
    try {
      const filter = this.stakingContract.filters.Withdrawn();
      const events = await this.stakingContract.queryFilter(filter, fromBlock);
      
      return events.map(event => ({
        user: event.args.user,
        amount: ethers.formatEther(event.args.amount),
        timestamp: event.args.timestamp.toString(),
        blockNumber: event.blockNumber,
        txHash: event.transactionHash
      }));
    } catch (error) {
      console.error('Error fetching withdrawal events:', error);
      return [];
    }
  }
}

export const contractService = new ContractService();