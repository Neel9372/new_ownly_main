/* ═══════════════════════════════════════════════════
   OWNLY — Contract Integration
   ═══════════════════════════════════════════════════ */
import { Contract, JsonRpcSigner, parseEther } from 'ethers';
import { CONTRACT_ADDRESSES } from './constants';

// Minimal ABI for OwnlyProperty invest function
const OWNLY_PROPERTY_ABI = [
  'function invest(uint256 propertyId) payable',
  'function getPropertyTokenBalance(uint256 propertyId, address investor) view returns (uint256)',
  'function getPropertyDetails(uint256 propertyId) view returns (tuple(uint256 totalTokens, uint256 tokenPrice, uint256 tokensSold, bool active))',
  'function propertyCount() view returns (uint256)',
  'function properties(uint256) view returns (string name, string location, uint256 dbPropertyId, uint256 totalValue, uint256 totalTokens, uint256 totalRaised, address tokenAddress, bool isActive, bool isSold, uint256 saleAmount, uint256 createdAt)',
];

export function getPropertyContract(signer: JsonRpcSigner) {
  return new Contract(
    CONTRACT_ADDRESSES.OwnlyProperty,
    OWNLY_PROPERTY_ABI,
    signer
  );
}

export async function investOnChain(
  signer: JsonRpcSigner,
  dbPropertyId: number,
  amountInEth: string
) {
  const contract = getPropertyContract(signer);
  
  // Find the on-chain property ID that matches our dbPropertyId
  const count = await contract.propertyCount();
  let onChainId = 0;
  for (let i = 1; i <= count; i++) {
    const prop = await contract.properties(i);
    if (Number(prop.dbPropertyId) === Number(dbPropertyId)) {
      onChainId = i;
      break;
    }
  }

  if (onChainId === 0) {
    throw new Error('Property not found on the blockchain. It may still be deploying.');
  }

  const tx = await contract.invest(onChainId, {
    value: parseEther(amountInEth),
    // Amoy testnet has erratic gas estimation; force 30 Gwei to ensure transaction acceptance
    gasPrice: parseEther("0.00000003"), // 30 Gwei 
  });
  const receipt = await tx.wait();
  return receipt;
}
