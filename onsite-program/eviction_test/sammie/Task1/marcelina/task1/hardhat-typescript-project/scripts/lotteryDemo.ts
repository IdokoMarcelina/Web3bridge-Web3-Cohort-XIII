import { ethers } from "hardhat";
import { Lottery } from "../typechain-types";

async function main() {
  console.log(" Starting Lottery Contract Demo...\n");

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const players = signers.slice(1); 
  
  if (players.length < 20) {
    console.log(`  Warning: Only ${players.length} players available, will reuse some for second round`);
  }

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Available test players: ${players.length}\n`);


  console.log(" Deploying Lottery contract...");
  const LotteryFactory = await ethers.getContractFactory("Lottery");
  const lottery: Lottery = await LotteryFactory.deploy();
  await lottery.waitForDeployment();

  console.log(` Lottery deployed to: ${await lottery.getAddress()}\n`);

  await displayContractState(lottery, "Initial State");

  console.log(" FIRST LOTTERY ROUND");
  console.log("=" + "=".repeat(50));

  const initialBalances = await Promise.all(
    players.slice(0, 10).map(async (player, index) => {
      const balance = await ethers.provider.getBalance(player.address);
      console.log(`Player ${index + 1} (${player.address}): ${ethers.formatEther(balance)} ETH`);
      return balance;
    })
  );

  console.log("\n🎫 Adding 10 players to the lottery...");
  
  for (let i = 0; i < 10; i++) {
    const playerIndex = i + 1;
    console.log(`\n👤 Player ${playerIndex} entering lottery...`);
    
    const tx = await lottery.connect(players[i]).enterLottery({ 
      value: ethers.parseEther("0.01") 
    });
    
    const receipt = await tx.wait();
    
    const events = receipt!.logs;
    const playerJoinedEvent = events.find(event => 
      event.topics[0] === ethers.id("PlayerJoined(address,uint256,uint256)")
    );
    
    if (playerJoinedEvent) {
      console.log(`    Player ${playerIndex} joined successfully!`);
    }
    
    const winnerSelectedEvent = events.find(event => 
      event.topics[0] === ethers.id("WinnerSelected(address,uint256,uint256)")
    );
    
    if (winnerSelectedEvent) {
      const lotteryInterface = lottery.interface;
      const decodedEvent = lotteryInterface.parseLog({
        topics: winnerSelectedEvent.topics,
        data: winnerSelectedEvent.data
      });
      
      console.log(`\n WINNER SELECTED!`);
      console.log(`   Winner: ${decodedEvent!.args.winner}`);
      console.log(`   Prize: ${ethers.formatEther(decodedEvent!.args.prizeAmount)} ETH`);
      console.log(`   Lottery ID: ${decodedEvent!.args.lotteryId}`);
    }
    
    await displayContractState(lottery, `After Player ${playerIndex}`);
  }

  const firstWinner = await lottery.getRecentWinner();
  console.log(`\n First Round Winner: ${firstWinner}`);
  
  const winnerIndex = players.findIndex(player => player.address === firstWinner);
  if (winnerIndex !== -1) {
    const finalBalance = await ethers.provider.getBalance(players[winnerIndex].address);
    const balanceChange = finalBalance - initialBalances[winnerIndex];
    console.log(`   Winner's balance increased by: ${ethers.formatEther(balanceChange)} ETH`);
  }

  console.log("\n\n SECOND LOTTERY ROUND");
  console.log("=" + "=".repeat(50));

  console.log(" Lottery has automatically reset for the next round!");
  await displayContractState(lottery, "After Reset");

  console.log("\n Verifying players can enter new round...");
  for (let i = 0; i < 5; i++) {
    const hasEntered = await lottery.hasPlayerEntered(players[i].address);
    console.log(`   Player ${i + 1} can enter: ${!hasEntered ? "Yes" : "No"}`);
  }

  console.log("\n Adding 10 players for second round (reusing same players)...");
  
  const secondRoundBalances = await Promise.all(
    players.slice(0, 10).map(async (player) => {
      return await ethers.provider.getBalance(player.address);
    })
  );
  
  for (let i = 0; i < 10; i++) {
    const playerIndex = i + 1;
    
    console.log(`👤 Player ${playerIndex} entering second round...`);
    
    const tx = await lottery.connect(players[i]).enterLottery({ 
      value: ethers.parseEther("0.01") 
    });
    
    await tx.wait();
    console.log(`    Player ${playerIndex} joined second round!`);
    
    if (i === 9) { 
      const secondWinner = await lottery.getRecentWinner();
      console.log(`\n🏆 SECOND ROUND WINNER: ${secondWinner}`);
      
      
      const secondWinnerIndex = players.findIndex(player => player.address === secondWinner);
      if (secondWinnerIndex !== -1) {
        const finalBalance = await ethers.provider.getBalance(players[secondWinnerIndex].address);
        const initialBalance = secondRoundBalances[secondWinnerIndex];
        const balanceChange = finalBalance - initialBalance;
        console.log(`   Winner's balance increased by: ${ethers.formatEther(balanceChange)} ETH`);
      }
    }
  }

  await displayContractState(lottery, "After Second Round");

  console.log("\n📊 LOTTERY DEMO SUMMARY");
  console.log("=" + "=".repeat(50));
  console.log(`Contract Address: ${await lottery.getAddress()}`);
  console.log(`Total Rounds Completed: 2`);
  console.log(`First Round Winner: ${firstWinner}`);
  console.log(`Second Round Winner: ${await lottery.getRecentWinner()}`);
  console.log(`Current Lottery ID: ${await lottery.getLotteryId()}`);
  console.log(`Entry Fee: ${ethers.formatEther(await lottery.ENTRY_FEE())} ETH`);
  console.log(`Max Players: ${await lottery.MAX_PLAYERS()}`);
  
  console.log("\n Demo completed successfully!");
  console.log("The lottery contract is working as expected and ready for deployment!");
}

async function displayContractState(lottery: Lottery, title: string) {
  console.log(`\n ${title}:`);
  console.log(`   Lottery ID: ${await lottery.getLotteryId()}`);
  console.log(`   Players Count: ${await lottery.getPlayersCount()}`);
  console.log(`   Prize Pool: ${ethers.formatEther(await lottery.getPrizePool())} ETH`);
  console.log(`   Contract Balance: ${ethers.formatEther(await lottery.getContractBalance())} ETH`);
  console.log(`   Players Needed: ${await lottery.getPlayersNeeded()}`);
  
  const recentWinner = await lottery.getRecentWinner();
  if (recentWinner !== "0x0000000000000000000000000000000000000000") {
    console.log(`   Recent Winner: ${recentWinner}`);
  }
}

main().catch((error) => {
  console.error(" Error running lottery demo:");
  console.error(error);
  process.exitCode = 1;
});
