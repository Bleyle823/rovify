'use client';

import { useReadContract, type UseReadContractReturnType } from 'wagmi';
import type { Abi } from 'abitype';
import type { ContractFunctionArgs, ContractFunctionName } from 'viem';

export interface UseScaffoldReadContractOptions<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'view' | 'pure'>
> {
  contractName: string;
  abi: TAbi;
  address: `0x${string}`;
  functionName: TFunctionName;
  args?: ContractFunctionArgs<TAbi, 'view' | 'pure', TFunctionName>;
  enabled?: boolean;
}

/**
 * Small wrapper around wagmi's useReadContract.
 * Handles query.enabled properly and hides the ugly type cast.
 */
export function useScaffoldReadContract<
  TAbi extends Abi,
  TFunctionName extends ContractFunctionName<TAbi, 'view' | 'pure'>
>({
  contractName,
  abi,
  address,
  functionName,
  args,
  enabled = true,
}: UseScaffoldReadContractOptions<TAbi, TFunctionName>): UseReadContractReturnType<
  TAbi,
  TFunctionName
> {
  const params = {
    abi,
    address,
    functionName,
    args,
    query: {
      // only run if abi + address are there and enabled is true
      enabled: enabled && Boolean(abi && address),
    },
  } as unknown; // wagmi types are too strict, so we cast

  // still returns fully typed data
  return useReadContract(params as any);
}
