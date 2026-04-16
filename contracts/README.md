## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```


<!-- 
For the current project - impactPay:

1. I have completely modified the contract at `src/Impact.sol` which causes the test to break. Your task is to rewrite the tests ensuring they pass. Include every relevant and necessary test cases not already provided. 

2. Create comprehensive documentation for the contract code using Natspec comment. DO NOT ALTER THE CONTRACT CODE.

RULE:
- You must not modify the contract. If you find any descrepancy, create a `REPORT.md` file in the project root directory, add it to `gitginore` and include your recommended fixes in the file. -->
