import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Abi } from 'abitype';
import { useState } from 'react';
import type { ContractFunctionArgs, ContractFunctionName } from 'viem';

export interface UseScaffoldWriteContractOptions<TAbi extends Abi = Abi> {
  contractName: string;
  abi?: TAbi;
  address?: `0x${string}`;
}

export function useScaffoldWriteContract<TAbi extends Abi = Abi>({
  contractName,
  abi,
  address,
}: UseScaffoldWriteContractOptions<TAbi>) {
  const [isMining, setIsMining] = useState(false);

  // wagmi's writeContract hook gives us writeContract + async version + tx hash
  const {
    writeContract,
    writeContractAsync,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  // wait for the transaction to actually confirm on-chain
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // only allow payable / nonpayable function names from the ABI
  type FnName = ContractFunctionName<TAbi, 'nonpayable' | 'payable'>;

  // wrapper around writeContractAsync that toggles mining state
  const writeContractAsyncWithMining = async <
    TFunctionName extends FnName
  >(params: {
    functionName: TFunctionName;
    args?: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName>;
    value?: bigint;
  }) => {
    if (!abi || !address) {
      throw new Error(`Contract ${contractName} not found or not deployed`);
    }

    setIsMining(true);
    try {
      // build the params object in a way wagmi's giant union can accept
      const request = {
        abi,
        address,
        functionName: params.functionName,
        ...(params.args ? { args: params.args } : {}),
        ...(params.value !== undefined ? { value: params.value } : {}),
      };

      // tiny cast here: wagmi's types are stricter than necessary,
      // but we already enforce correct functionName + args above
      const result = await writeContractAsync(request as any);
      return result;
    } finally {
      setIsMining(false);
    }
  };

  return {
    // low-level version straight from wagmi if you want full control
    writeContract,

    // our wrapped async writer that tracks mining state
    writeContractAsync: writeContractAsyncWithMining,

    // transaction hash
    data: hash,

    // wagmi status flags + our mining flag
    isPending,
    error,
    isConfirming,
    isConfirmed,
    isMining: isMining || isPending || isConfirming,
  };
}