import { BigInt, log, Address } from "@graphprotocol/graph-ts";
import {
  ZapDispute,
  NewDispute,
  Voted,
  DisputeVoteTallied,
} from "../generated/ZapDispute/ZapDispute";
import {
  ZapLibrary,
  NewValue,
  NonceSubmitted,
} from "../generated/ZapLibrary/ZapLibrary"
import {ZapMaster, NewZapAddress} from "../generated/ZapMaster/ZapMaster"
import {ZapOps} from "../generated/ZapOps/ZapOps"
import { Dispute, Vote, MiningEvent, MinerValue} from "../generated/schema";

let ZapMasterAddress = Address.fromString("0x1BDd5e115a59444F6e83AbDee1A85c126b3Df03D")
let ZapOpsAddress = Address.fromString("0x7C221756253E1d0f0818225aAeE7de0b754fA73e")

// event NewValue(uint256[5] _requestId, uint256 _time, uint256[5] _value, uint256 _totalTips, bytes32 indexed _currentChallenge);
export function handleNewValue(event: NewValue): void {
  let miningEventId = event.params._currentChallenge.toHex().concat("-event");
  // .concat(event.params._time.toString());

  let miningEvent = new MiningEvent(miningEventId);
  miningEvent.timestamp = event.block.timestamp;
  miningEvent.requestIds.push(event.params._requestId)
  miningEvent.time = event.params._time;
  miningEvent.minedValues.push(event.params._value)
  miningEvent.totalTips = event.params._totalTips;
  miningEvent.currentChallenge = event.params._currentChallenge;
  miningEvent.blockNumber = event.block.number;

  miningEvent.save();
}

// event NonceSubmitted(address indexed _miner, string _nonce, uint256 indexed _requestId, uint256 _value, bytes32 _currentChallenge);
export function handleNonceSubmitted(event: NonceSubmitted): void {
  let valueId = event.params._currentChallenge
    .toHex()
    .concat("-value-")
    // .concat(event.params._requestId.toString())
    // .concat("-")
    .concat(event.params._miner.toHexString());

  let miningEventId = event.params._currentChallenge.toHex().concat("-event");
  // .concat("-event-")
  // .concat(event.params._requestId.toString());

  let value = new MinerValue(valueId);
  value.timestamp = event.block.timestamp;
  value.requestIds.push(event.params._requestId)
  value.currentChallenge = event.params._currentChallenge;
  value.miningEvent = miningEventId;
  value.miningEventId = miningEventId;
  value.miner = event.params._miner;
  value.values.push(event.params._value)
  value.blockNumber = event.block.number;

  value.save();
}

export function handleNewDispute(event: NewDispute): void {
  let contract = ZapMaster.bind(ZapMasterAddress);
  let disputeVars = contract.getAllDisputeVars(event.params._disputeId);

  let dispute = new Dispute(event.params._disputeId.toString());
  dispute.disputeId = event.params._disputeId;
  dispute.miner = event.params._miner;
  dispute.requestId = event.params._requestId;
  dispute.timestamp = event.params._timestamp;
  dispute.relatedMiningEventData = disputeVars.value7;
  dispute.blockNumber = event.block.number

  dispute.save();
}

// event Voted(uint256 indexed _disputeID, bool _position, address indexed _voter);
export function handleVoted(event: Voted): void {
  let dispute = Dispute.load(event.params._disputeID.toString());

  if (dispute === null) {
    dispute = new Dispute(event.params._disputeID.toString());

    let contract = ZapMaster.bind(ZapMasterAddress);
    let disputeVars = contract.getAllDisputeVars(event.params._disputeID);

    dispute.disputeId = event.params._disputeID;
    dispute.miner = disputeVars.value4;
    dispute.requestId = disputeVars.value7[0];
    dispute.timestamp = disputeVars.value7[1];
    dispute.relatedMiningEventData = disputeVars.value7;
    dispute.blockNumber = disputeVars.value7[5];
  }

  let opsContract = ZapOps.bind(ZapOpsAddress);

  let voteId = event.params._disputeID
    .toString()
    .concat("-vote-")
    .concat(event.params._voter.toHex());
  let vote = new Vote(voteId);

  vote.dispute = event.params._disputeID.toString();
  vote.disputeId = event.params._disputeID;
  vote.position = event.params._position;
  vote.voter = event.params._voter;
  vote.timestamp = event.block.timestamp;
  // vote.voteWeight = event.params._voteWeight;
  let blockNumber = dispute.blockNumber
  vote.voteWeight = opsContract.getBalanceAt(event.params._voter, blockNumber)

  vote.save();

  dispute.save();
}

// event DisputeVoteTallied(uint256 indexed _disputeID, int256 _result, address indexed _reportedMiner, address _reportingParty, bool _active);
export function handleDisputeVoteTallied(event: DisputeVoteTallied): void {
  let contract = ZapMaster.bind(ZapMasterAddress);
  let disputeVars = contract.getAllDisputeVars(event.params._disputeID);
  let dispute = Dispute.load(event.params._disputeID.toString());

  dispute.result = event.params._result;
  dispute.reportedMiner = event.params._reportedMiner;
  dispute.reportingParty = event.params._reportingParty;
  dispute.active = event.params._active;

  // dispute.disputeVotePassed = disputeVars.value2;
  dispute.relatedMiningEventData = disputeVars.value7;
  dispute.tally = disputeVars.value8;

  dispute.save();
}

export function handleNewZapAddress(event: NewZapAddress): void {}
