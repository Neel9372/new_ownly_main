/* ═══════════════════════════════════════════════════
   OWNLY — Contract Integration
   ═══════════════════════════════════════════════════ */
import { Contract, JsonRpcSigner, JsonRpcProvider, parseEther } from 'ethers';
import { CONTRACT_ADDRESSES } from './constants';

// Minimal ABI for OwnlyProperty functions used by the frontend
const OWNLY_PROPERTY_ABI = [
  'function invest(uint256 propertyId) payable',
  'function claimRent(uint256 propertyId)',
  'function getPropertyTokenBalance(uint256 propertyId, address investor) view returns (uint256)',
  'function getPropertyDetails(uint256 propertyId) view returns (tuple(uint256 totalTokens, uint256 tokenPrice, uint256 tokensSold, bool active))',
  'function propertyCount() view returns (uint256)',
  'function properties(uint256) view returns (string name, string location, uint256 dbPropertyId, uint256 totalValue, uint256 totalTokens, uint256 totalRaised, address tokenAddress, bool isActive, bool isSold, uint256 saleAmount, uint256 createdAt)',
  'function totalRentPerToken(uint256 propertyId) view returns (uint256)',
  'function rentPerTokenClaimed(uint256 propertyId, address investor) view returns (uint256)',
];

export function getPropertyContract(signer: JsonRpcSigner) {
  return new Contract(
    CONTRACT_ADDRESSES.OwnlyProperty,
    OWNLY_PROPERTY_ABI,
    signer
  );
}

/**
 * Invest on-chain by sending MATIC to the smart contract.
 * Uses on-chain property ID directly if available (from DB), otherwise falls back to linear scan.
 */
export async function investOnChain(
  signer: JsonRpcSigner,
  dbPropertyId: number,
  amountInEth: string,
  onChainPropertyId?: number | null
) {
  const contract = getPropertyContract(signer);

  let onChainId = onChainPropertyId || 0;

  // Fallback: scan on-chain if on-chain ID wasn't provided by the backend
  if (onChainId === 0) {
    const count = await contract.propertyCount();
    for (let i = 1; i <= count; i++) {
      const prop = await contract.properties(i);
      if (Number(prop.dbPropertyId) === Number(dbPropertyId)) {
        onChainId = i;
        break;
      }
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

/**
 * Claim accumulated INRC rent for a property.
 * Investor calls this — they pay their own gas.
 */
export async function claimRentOnChain(
  signer: JsonRpcSigner,
  onChainPropertyId: number
) {
  const contract = getPropertyContract(signer);
  const tx = await contract.claimRent(onChainPropertyId);
  const receipt = await tx.wait();
  return receipt;
}

/**
 * Check how much INRC rent an investor can claim for a property.
 * Returns the claimable amount as a string (in wei — divide by 1e18 for INRC).
 */
export async function getClaimableRent(
  signer: JsonRpcSigner,
  onChainPropertyId: number,
  investorAddress: string
): Promise<string> {
  const contract = getPropertyContract(signer);
  
  // Get the token address for this property
  const prop = await contract.properties(onChainPropertyId);
  const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
  const token = new Contract(prop.tokenAddress, tokenAbi, signer);
  
  const balance = await token.balanceOf(investorAddress);
  const totalRent = await contract.totalRentPerToken(onChainPropertyId);
  const claimed = await contract.rentPerTokenClaimed(onChainPropertyId, investorAddress);
  
  // Claimable = (balance * totalRent / 1e18) - claimed
  const entitled = (BigInt(balance) * BigInt(totalRent)) / BigInt(1e18.toString());
  const claimable = entitled - BigInt(claimed);
  
  return claimable.toString();
}
