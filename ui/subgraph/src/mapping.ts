import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  GoalCreated,
  Funded,
  BillGoalFulfilled,
  ScholarshipWithdrawal,
  GoalFlagged,
  Refunded,
  ReputationUpdated
} from "../generated/ImpactPay/ImpactPay";
import { Donor, Goal, Requester, GlobalStat, Donation, ReputationHistory } from "../generated/schema";

function getGlobalStat(): GlobalStat {
  let stat = GlobalStat.load("1");
  if (stat == null) {
    stat = new GlobalStat("1");
    stat.totalDonors = 0;
    stat.totalRequesters = 0;
    stat.totalVolume = BigInt.zero();
    stat.save();
  }
  return stat as GlobalStat;
}

export function handleGoalCreated(event: GoalCreated): void {
  let goal = new Goal(event.params.goalId.toString());
  goal.goalId = event.params.goalId;
  goal.creator = event.params.creator.toHexString();
  
  let gt = event.params.goalType;
  if (gt == 0) goal.goalType = "Default";
  else if (gt == 1) goal.goalType = "Bill";
  else goal.goalType = "Scholarship";
  
  goal.description = event.params.description;
  goal.extraInfo = event.params.extraInfo;
  goal.targetAmount = event.params.targetAmount;
  goal.amountRaised = BigInt.zero();
  goal.withdrawnAmount = BigInt.zero();
  goal.status = "OPEN";
  goal.flagsCount = 0;
  goal.lockedForReview = false;
  goal.createdAt = event.block.timestamp;
  goal.updatedAt = event.block.timestamp;
  goal.save();

  let requester = Requester.load(event.params.creator.toHexString());
  if (requester == null) {
    requester = new Requester(event.params.creator.toHexString());
    requester.address = event.params.creator;
    requester.completedGoals = 0;
    requester.unmetProofs = 0;
    requester.flaggedGoals = 0;
    requester.reputation = BigInt.zero();
    requester.save();

    let stat = getGlobalStat();
    stat.totalRequesters = stat.totalRequesters + 1;
    stat.save();
  }
}

export function handleFunded(event: Funded): void {
  let goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;

  goal.amountRaised = event.params.totalRaised;
  if (goal.amountRaised >= goal.targetAmount) {
    goal.status = "RAISED";
  }
  goal.updatedAt = event.block.timestamp;
  goal.save();

  let donorId = event.params.donor.toHexString();
  let donor = Donor.load(donorId);
  if (donor == null) {
    donor = new Donor(donorId);
    donor.address = event.params.donor;
    donor.totalDonated = BigInt.zero();
    donor.goalsSupported = 0;
    donor.successfulGoalsSupported = 0;
    donor.reputation = BigInt.zero();
    
    let stat = getGlobalStat();
    stat.totalDonors = stat.totalDonors + 1;
    stat.save();
  }
  
  donor.totalDonated = donor.totalDonated.plus(event.params.amount);
  donor.goalsSupported = donor.goalsSupported + 1;
  // Donor rep logic: (Total USD * 10) + (Goals * 50)
  // We'll update rep via handleReputationUpdated if we want exact on-chain sync,
  // but we can also update based on internal logic.
  donor.save();

  let donationId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let donation = new Donation(donationId);
  donation.donor = donorId;
  donation.goal = event.params.goalId.toString();
  donation.amount = event.params.amount;
  donation.extraInfo = event.params.extraInfo;
  donation.timestamp = event.block.timestamp;
  donation.save();

  let stat = getGlobalStat();
  stat.totalVolume = stat.totalVolume.plus(event.params.amount);
  stat.save();
}

export function handleBillGoalFulfilled(event: BillGoalFulfilled): void {
  let goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;
  
  goal.status = "FULFILLED";
  goal.withdrawnAmount = goal.amountRaised; // For full fulfillment
  goal.updatedAt = event.block.timestamp;
  goal.save();

  let requester = Requester.load(event.params.creator.toHexString());
  if (requester != null) {
    requester.completedGoals += 1;
    requester.save();
  }
}

export function handleScholarshipWithdrawal(event: ScholarshipWithdrawal): void {
  let goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;

  goal.withdrawnAmount = goal.withdrawnAmount.plus(event.params.amount);
  if (event.params.milestoneIndex == 4) { // Milestone.COMPLETED
    goal.status = "FULFILLED";
    
    let requester = Requester.load(event.params.creator.toHexString());
    if (requester != null) {
      requester.completedGoals += 1;
      requester.save();
    }
  }
  goal.updatedAt = event.block.timestamp;
  goal.save();
}

export function handleGoalFlagged(event: GoalFlagged): void {
  let goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;

  goal.flagsCount = event.params.flagsCount;
  if (event.params.lockedForReview) {
    goal.status = "LOCKED";
    goal.lockedForReview = true;
  }
  goal.updatedAt = event.block.timestamp;
  goal.save();

  let requester = Requester.load(event.params.creator.toHexString());
  if (requester != null) {
    requester.flaggedGoals += 1;
    requester.save();
  }
}

export function handleRefunded(event: Refunded): void {
  let goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;

  // If status becomes CANCELED in contract, we should mirror it.
  // The contract says: if sc.refundedAmount >= 80% then status = CANCELED
  // We can track this or just trust the next status update if any.
  // But wait, the Refunded event tells us a refund happened.
  
  let requester = Requester.load(event.params.creator.toHexString());
  if (requester != null) {
    requester.unmetProofs += 1;
    requester.save();
  }
}

export function handleReputationUpdated(event: ReputationUpdated): void {
  let userAddr = event.params.user.toHexString();
  
  let donor = Donor.load(userAddr);
  if (donor != null) {
    donor.reputation = donor.reputation.plus(event.params.change);
    donor.save();
  }

  let requester = Requester.load(userAddr);
  if (requester != null) {
    requester.reputation = requester.reputation.plus(event.params.change);
    requester.save();
  }

  let historyId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let history = new ReputationHistory(historyId);
  history.user = event.params.user;
  history.change = event.params.change;
  
  let baseScore = BigInt.zero();
  if (donor != null) baseScore = donor.reputation;
  else if (requester != null) baseScore = requester.reputation;
  
  history.newScore = baseScore;
  history.reason = event.params.reason;
  history.timestamp = event.block.timestamp;
  history.save();
}
