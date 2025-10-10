import se2DeployedContracts from './deployedContracts';

export const deployedContracts = se2DeployedContracts;

export const getContract = (
  contractName: Extract<keyof typeof deployedContracts[84532], string>,
  chainId: number = 84532
) => {
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  if (!contracts) {
    throw new Error(`No contracts deployed on chain ${chainId}`);
  }

  const contract = contracts[contractName];
  if (!contract) {
    throw new Error(`Contract ${contractName} not found on chain ${chainId}`);
  }

  return contract;
};
