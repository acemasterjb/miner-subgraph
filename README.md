# miner-subgraph
Subgraph to index zap-miner events

## Installation

Initialize the node environment

```bash
npm i
```

Then run a `codegen` so you can generate the contracts and TheGraph schema

```bash
npx graph codegen
```

If you do not have graph installed, I recommend you do so with npm vs yarn, then run the above command

```bash
npm install -g @graphprotocol/graph-cli
```

## Deployment

**IMPORTANT**
Change the `github_user/subgraph_name` in the `package.json` if you would like to deploy from your Grpahh dashboard.

You will find the instances of this in the scripts property of `package.json`.

---

Unless there are changes you'd like to make to the following files:

```
./subgraph.yaml     # contains subgraph manifest
./schema.graphql    # defines what data gets indexed into your subgraph
./src/mapping.ts   # AssemblyScript code that translates on-chain events to GraphQL entities
```

... then just deploy the subgraph

```bash
npm run deploy
```

