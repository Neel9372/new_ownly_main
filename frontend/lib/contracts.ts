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
  propertyId: number,
  amountInEth: string
) {
  const contract = getPropertyContract(signer);
  const tx = await contract.invest(propertyId, {
    value: parseEther(amountInEth),
  });
  const receipt = await tx.wait();
  return receipt;
}
