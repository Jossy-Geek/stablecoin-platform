import { expect } from "chai";
import { ethers } from "hardhat";
import { Stablecoin } from "../typechain-types";

describe("Stablecoin", function () {
  let stablecoin: Stablecoin;
  let owner: any;
  let minter: any;
  let burner: any;
  let user: any;

  beforeEach(async function () {
    [owner, minter, burner, user] = await ethers.getSigners();

    const StablecoinFactory = await ethers.getContractFactory("Stablecoin");
    stablecoin = await StablecoinFactory.deploy(
      "Stablecoin Token",
      "STC",
      ethers.parseEther("1000000"),
      owner.address,
      minter.address,
      burner.address
    );

    await stablecoin.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await stablecoin.name()).to.equal("Stablecoin Token");
      expect(await stablecoin.symbol()).to.equal("STC");
    });

    it("Should mint initial supply to admin", async function () {
      expect(await stablecoin.balanceOf(owner.address)).to.equal(
        ethers.parseEther("1000000")
      );
    });

    it("Should set correct roles", async function () {
      const MINTER_ROLE = await stablecoin.MINTER_ROLE();
      const BURNER_ROLE = await stablecoin.BURNER_ROLE();
      const PAUSER_ROLE = await stablecoin.PAUSER_ROLE();

      expect(await stablecoin.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      expect(await stablecoin.hasRole(BURNER_ROLE, burner.address)).to.be.true;
      expect(await stablecoin.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      await stablecoin.connect(minter).mint(user.address, amount);
      expect(await stablecoin.balanceOf(user.address)).to.equal(amount);
    });

    it("Should reject minting from non-minter", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        stablecoin.connect(user).mint(user.address, amount)
      ).to.be.revertedWithCustomError(stablecoin, "AccessControlUnauthorizedAccount");
    });

    it("Should update user balance mapping", async function () {
      const amount = ethers.parseEther("500");
      await stablecoin.connect(minter).mint(user.address, amount);
      expect(await stablecoin.getUserBalance(user.address)).to.equal(amount);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await stablecoin.connect(minter).mint(user.address, ethers.parseEther("1000"));
    });

    it("Should allow burner to burn tokens", async function () {
      const amount = ethers.parseEther("500");
      await stablecoin.connect(burner).burn(user.address, amount);
      expect(await stablecoin.balanceOf(user.address)).to.equal(
        ethers.parseEther("500")
      );
    });

    it("Should reject burning from non-burner", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        stablecoin.connect(user).burn(user.address, amount)
      ).to.be.revertedWithCustomError(stablecoin, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("Should allow pauser to pause", async function () {
      await stablecoin.connect(owner).pause();
      expect(await stablecoin.paused()).to.be.true;
    });

    it("Should prevent transfers when paused", async function () {
      await stablecoin.connect(minter).mint(user.address, ethers.parseEther("1000"));
      await stablecoin.connect(owner).pause();
      
      await expect(
        stablecoin.connect(user).transfer(owner.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(stablecoin, "EnforcedPause");
    });

    it("Should allow unpause", async function () {
      await stablecoin.connect(owner).pause();
      await stablecoin.connect(owner).unpause();
      expect(await stablecoin.paused()).to.be.false;
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await stablecoin.connect(minter).mint(user.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens correctly", async function () {
      const amount = ethers.parseEther("100");
      await stablecoin.connect(user).transfer(owner.address, amount);
      
      expect(await stablecoin.balanceOf(user.address)).to.equal(
        ethers.parseEther("900")
      );
      expect(await stablecoin.balanceOf(owner.address)).to.equal(
        ethers.parseEther("1000100")
      );
    });

    it("Should update user balances on transfer", async function () {
      const amount = ethers.parseEther("200");
      await stablecoin.connect(user).transfer(owner.address, amount);
      
      expect(await stablecoin.getUserBalance(user.address)).to.equal(
        ethers.parseEther("800")
      );
    });
  });
});
