import { expect } from 'chai';
import { ethers } from 'hardhat';
import { parseUnits, ZeroAddress } from 'ethers';

describe('ImpactPay', function () {
  let owner: any;
  let treasury: any;
  let approver: any;
  let signer: any;
  let creator: any;
  let donor: any;
  let billService: any;

  let impactPay: any;
  let token: any;

  const INITIAL_BALANCE = parseUnits('1000', 18);

  beforeEach(async function () {
    [owner, treasury, approver, signer, creator, donor, billService] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('MockERC20');
    token = await Token.deploy();
    await token.waitForDeployment();

    const ImpactPay = await ethers.getContractFactory('ImpactPay');
    impactPay = await ImpactPay.deploy(
      await token.getAddress(),
      treasury.address,
      approver.address,
      signer.address
    );
    await impactPay.waitForDeployment();

    await token.mint(creator.address, INITIAL_BALANCE);
    await token.mint(donor.address, INITIAL_BALANCE);

    await token.connect(creator).approve(await impactPay.getAddress(), INITIAL_BALANCE);
    await token.connect(donor).approve(await impactPay.getAddress(), INITIAL_BALANCE);
  });

  describe('Goal Creation', function () {
    it('should create a default goal', async function () {
      await expect(impactPay.connect(creator).createGoal(parseUnits('100', 18), "Help me", "extra"))
        .to.emit(impactPay, 'GoalCreated');
      
      const goal = await impactPay.getGoal(1);
      expect(goal.common.targetAmount).to.equal(parseUnits('100', 18));
      expect(goal.common.creator).to.equal(creator.address);
    });

    it('should create a bill goal', async function () {
      await impactPay.setBillService(billService.address);
      await expect(impactPay.connect(creator).createBillGoal(parseUnits('50', 18), "Electric", "utility", "", 0))
        .to.emit(impactPay, 'GoalCreated');
    });
  });

  describe('Funding', function () {
    it('should fund a goal', async function () {
      await impactPay.connect(creator).createGoal(parseUnits('100', 18), "Help", "");
      await expect(impactPay.connect(donor).fundGoal(1, parseUnits('50', 18), "Good luck"))
        .to.emit(impactPay, 'Funded');
      
      const goal = await impactPay.getGoal(1);
      expect(goal.common.raisedAmount).to.equal(parseUnits('50', 18));
    });
  });

  describe('Withdrawals', function () {
    it('should allow creator to claim funds for default goal', async function () {
      await impactPay.connect(creator).createGoal(parseUnits('100', 18), "Help", "");
      await impactPay.connect(donor).fundGoal(1, parseUnits('100', 18), "");
      
      const before = await token.balanceOf(creator.address);
      await impactPay.connect(creator).claimFund(1);
      const after = await token.balanceOf(creator.address);
      
      expect(after).to.be.gt(before);
    });

    it('should revert if unauthorized user tries to claim funds', async function () {
      await impactPay.connect(creator).createGoal(parseUnits('100', 18), "Help", "");
      await impactPay.connect(donor).fundGoal(1, parseUnits('100', 18), "");
      
      await expect(impactPay.connect(donor).claimFund(1))
        .to.be.revertedWith("Not authorized");
    });
  });

  describe('Flagging', function () {
    it('should allow donor to flag a goal', async function () {
      await impactPay.connect(creator).createGoal(parseUnits('100', 18), "Help", "");
      await impactPay.connect(donor).fundGoal(1, parseUnits('10', 18), "");
      
      await impactPay.connect(donor).toggleFlagGoal(1);
      const goal = await impactPay.getGoal(1);
      expect(goal.common.flagsCount).to.equal(1);
    });
  });
});
