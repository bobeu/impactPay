import { expect } from 'chai';
import { ethers } from 'hardhat';
import { parseUnits } from 'ethers';

describe('ImpactPay', function () {
  let owner: any;
  let treasury: any;
  let funder: any;
  let claimant: any;
  let signer: any;

  let impactPay: any;
  let impactGoal: any; // used as verifier
  let token: any;

  const INITIAL_BALANCE = parseUnits('1000', 18);

  beforeEach(async function () {
    [owner, treasury, funder, claimant, signer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('MockERC20');
    token = await Token.deploy();
    await token.waitForDeployment();

    const ImpactGoal = await ethers.getContractFactory('ImpactGoal');
    impactGoal = await ImpactGoal.deploy(
      await token.getAddress(),
      treasury.address,
      owner.address, // approver
      signer.address // backendSigner
    );
    await impactGoal.waitForDeployment();

    const ImpactPay = await ethers.getContractFactory('ImpactPay');
    impactPay = await ImpactPay.deploy(
      await token.getAddress(),
      owner.address,
      treasury.address,
      await impactGoal.getAddress()
    );
    await impactPay.waitForDeployment();

    await token.mint(funder.address, INITIAL_BALANCE);
    await token.connect(funder).approve(await impactPay.getAddress(), INITIAL_BALANCE);
    
    // Set up verification for claimant
    await impactGoal.toggleUseVerifier();
    await impactGoal.onVerificationSuccess(claimant.address, 0); // LEVEL1
  });

  describe('Wealth Distribution', function () {
    it('Should allow distributeWealth with Stablecoin', async function () {
      await expect(
        impactPay.connect(funder).distributeWealth(
          parseUnits('100', 18),
          "John",
          "@john",
          "For a good cause",
          0, // PHILANTROPIST
          0  // LEVEL1
        )
      ).to.emit(impactPay, 'Funded');

      const funderInfo = await impactPay.funders(1);
      expect(funderInfo.amount).to.equal(parseUnits('100', 18));
      expect(funderInfo.currency).to.equal(1); // STABLECOIN
    });

    it('Should allow distributeWealth with Native currency', async function () {
      await expect(
        impactPay.connect(funder).distributeWealth(
          parseUnits('1', 18),
          "John",
          "@john",
          "For a good cause",
          0,
          0,
          { value: parseUnits('1', 18) }
        )
      ).to.emit(impactPay, 'Funded');

      const funderInfo = await impactPay.funders(1);
      expect(funderInfo.currency).to.equal(0); // NATIVE
    });
  });

  describe('Claiming', function () {
    it('Should allow a verified user to claim their share', async function () {
      await impactPay.connect(funder).distributeWealth(
        parseUnits('100', 18),
        "John",
        "@john",
        "Cause",
        0,
        0
      );

      const beforeBal = await token.balanceOf(claimant.address);
      await impactPay.connect(claimant).claimGigs(1);
      const afterBal = await token.balanceOf(claimant.address);

      expect(afterBal).to.be.gt(beforeBal);
    });

    it('Should revert if claiming before cooldown', async function () {
      await impactPay.setCooldown(3600); // 1 hour cooldown
      await impactPay.connect(funder).distributeWealth(
        parseUnits('100', 18),
        "John",
        "@john",
        "Cause",
        0,
        0
      );

      await expect(impactPay.connect(claimant).claimGigs(1)).to.be.revertedWith("Cdw in force");
    });
  });

  describe('Pool Rebalancing', function () {
    it('Should rebalance pool after max claim period', async function () {
      await impactPay.connect(funder).distributeWealth(
        parseUnits('100', 18),
        "John",
        "@john",
        "Cause",
        0,
        0
      );

      await ethers.provider.send('evm_increaseTime', [91 * 24 * 60 * 60]);
      await ethers.provider.send('evm_mine', []);

      await expect(impactPay.rebalancePool(1)).to.emit(impactPay, 'PoolRebalanced');
      const funderInfo = await impactPay.funders(1);
      expect(funderInfo.remainingPool).to.equal(0);
    });
  });
});
