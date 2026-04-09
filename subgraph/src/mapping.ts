import { BigInt } from "@graphprotocol/graph-ts";
import {
  Completed,
  Funded,
  GoalCreated,
  GoalFlagged,
} from "../generated/ImpactPay/ImpactPay";
import { Donor, Goal, Requester } from "../generated/schema";

function donorReputation(totalDonated: BigInt, successfulGoalsSupported: i32): BigInt {
  // Donor Reputation = (Total USD donated * 10) + (Successful goals supported * 50)
  return totalDonated.times(BigInt.fromI32(10)).plus(BigInt.fromI32(successfulGoalsSupported * 50));
}

function requesterReputation(completedGoals: i32, flaggedGoals: i32): BigInt {
  // Requester Reputation = (Completed goals * 100) - (Flagged goals * 500)
  return BigInt.fromI32(completedGoals * 100 - flaggedGoals * 500);
}

export function handleGoalCreated(event: GoalCreated): void {
  const id = event.params.goalId.toString();
  const goal = new Goal(id);
  goal.goalId = event.params.goalId;
  goal.creator = event.params.creator;
  goal.category = event.params.category.toString() == "0" ? "Bill" : "Scholarship";
  goal.description = event.params.description;
  goal.targetAmount = event.params.targetAmount;
  goal.amountRaised = BigInt.zero();
  goal.status = "Open";
  goal.flagsCount = 0;
  goal.completed = false;
  goal.save();

  let requester = Requester.load(event.params.creator.toHexString());
  if (requester == null) {
    requester = new Requester(event.params.creator.toHexString());
    requester.completedGoals = 0;
    requester.flaggedGoals = 0;
    requester.reputation = BigInt.zero();
    requester.save();
  }
}

export function handleFunded(event: Funded): void {
  const goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;
  goal.amountRaised = event.params.totalRaised;
  goal.status = "Funded";
  goal.save();

  let donor = Donor.load(event.params.donor.toHexString());
  if (donor == null) {
    donor = new Donor(event.params.donor.toHexString());
    donor.totalDonated = BigInt.zero();
    donor.goalsSupported = 0;
    donor.successfulGoalsSupported = 0;
  }
  donor.totalDonated = donor.totalDonated.plus(event.params.amount);
  donor.goalsSupported = donor.goalsSupported + 1;
  donor.reputation = donorReputation(donor.totalDonated, donor.successfulGoalsSupported);
  donor.save();
}

export function handleCompleted(event: Completed): void {
  const goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;
  goal.status = "Completed";
  goal.completed = true;
  goal.save();

  let donor = Donor.load(event.params.donor.toHexString());
  if (donor == null) {
    donor = new Donor(event.params.donor.toHexString());
    donor.totalDonated = BigInt.zero();
    donor.goalsSupported = 0;
    donor.successfulGoalsSupported = 0;
  }
  donor.successfulGoalsSupported = donor.successfulGoalsSupported + 1;
  donor.reputation = donorReputation(donor.totalDonated, donor.successfulGoalsSupported);
  donor.save();

  let requester = Requester.load(goal.creator.toHexString());
  if (requester == null) {
    requester = new Requester(goal.creator.toHexString());
    requester.completedGoals = 0;
    requester.flaggedGoals = 0;
  }
  requester.completedGoals = requester.completedGoals + 1;
  requester.reputation = requesterReputation(requester.completedGoals, requester.flaggedGoals);
  requester.save();
}

export function handleGoalFlagged(event: GoalFlagged): void {
  const goal = Goal.load(event.params.goalId.toString());
  if (goal == null) return;
  goal.flagsCount = event.params.flagsCount;
  goal.status = event.params.lockedForReview ? "LockedForReview" : goal.status;
  goal.save();

  let requester = Requester.load(goal.creator.toHexString());
  if (requester == null) {
    requester = new Requester(goal.creator.toHexString());
    requester.completedGoals = 0;
    requester.flaggedGoals = 0;
  }
  requester.flaggedGoals = requester.flaggedGoals + 1;
  requester.reputation = requesterReputation(requester.completedGoals, requester.flaggedGoals);
  requester.save();
}

