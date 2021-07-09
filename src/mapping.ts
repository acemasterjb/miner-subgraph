import { BigInt, log, Address } from "@graphprotocol/graph-ts";
import {
  NewDispute,
  Voted,
  DisputeVoteTallied,
} from "../generated/Dispute/ZapMaster";
import {
  ZapMaster,
  NewValue,
} from "../generated/Oracle/ZapMaster"
import { NewZapAddress, NonceSubmitted } from "../generated/Oracle/ZapMaster"
import { ZapOps} from "../generated/ZapOps/ZapOps"
import { Dispute, Vote, MiningEvent, MinerValue } from "../generated/schema";

let ZapMasterAddress = Address.fromString("0xe623305CC15792f4e3E4Cd8880B5B9D665976df5")
let ZapOpsAddress = Address.fromString("0x4646939E9336139b16213B06EaCbA0a53b999f94")

// event NewValue(uint256[5] _requestId, uint256 _time, uint256[5] _value, uint256 _totalTips, bytes32 indexed _currentChallenge);
export function handleNewValue(event: NewValue): void {
  let miningEventId = event.params._currentChallenge.toHex().concat("-event");
  // .concat(event.params._time.toString());


  let miningEvent = new MiningEvent(miningEventId);
  miningEvent.timestamp = event.block.timestamp;
  miningEvent.requestId = event.params._requestId;
  miningEvent.time = event.params._time;
  miningEvent.minedValue = event.params._value;
  miningEvent.totalTips = event.params._totalTips;
  miningEvent.currentChallenge = event.params._currentChallenge;
  miningEvent.blockNumber = event.block.number;

  miningEvent.save();
}

// event NonceSubmitted(address indexed _miner, string _nonce, uint256 indexed _requestId, uint256 _value, bytes32 _currentChallenge);
export function handleNonceSubmitted(event: NonceSubmitted): void {
  let valueId = event.params._currentChallenge
    .toHex()
    .concat("-value")
    .concat(event.params._miner.toHexString());

  let miningEventId = event.params._currentChallenge.toHex().concat("-event");

  let value = MinerValue.load(valueId);
  if (value == null){
    value = new MinerValue(valueId)
  }
  value.timestamp = event.block.timestamp;
  let requestIds = value.requestIds;
  requestIds.push(event.params._requestId);
  value.requestIds = requestIds;
  value.currentChallenge = event.params._currentChallenge;
  value.miningEvent = miningEventId;
  value.miningEventId = miningEventId;
  value.miner = event.params._miner;
  let values = value.values;
  values.push(event.params._value);
  value.values = values;
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
