import { deployedContracts } from "@/contracts";
import { useMemo } from "react";
import { useChainId } from "wagmi";

type ContractInfo = {
  name: string;
  address: string;
  abi: any[];
};

export function useAllContracts(): ContractInfo[] {
  const chainId = useChainId();

  return useMemo(() => {
    if (chainId == null) return [];

    type Deployed = typeof deployedContracts;
    type ChainKey = keyof Deployed; // 31337 | 84532

    if (!(chainId in deployedContracts)) return [];

    const contractsForChain = deployedContracts[chainId as ChainKey];

    return Object.entries(contractsForChain).map(([name, data]) => {
      const contract = data as { address: string; abi: any[] };
      return {
        name,
        address: contract.address,
        abi: contract.abi,
      };
    });
  }, [chainId]);
}