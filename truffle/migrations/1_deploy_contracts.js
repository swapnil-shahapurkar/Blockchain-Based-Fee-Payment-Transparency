const Penalty = artifacts.require("Penalty");
const Payment = artifacts.require("Payment");
const Refund = artifacts.require("Refund");
const Schedule = artifacts.require("Schedule");
const Audit = artifacts.require("Audit");

module.exports = async function (deployer) {
    await deployer.deploy(Penalty);
    const penaltyInstance = await Penalty.deployed();

    await deployer.deploy(Payment);
    const paymentInstance = await Payment.deployed();

    await deployer.deploy(Refund);
    const refundInstance = await Refund.deployed();

    await deployer.deploy(Schedule);
    const scheduleInstance = await Schedule.deployed();

    await deployer.deploy(Audit);
    const auditInstance = await Audit.deployed();

    console.log("Contracts Deployed:");
    console.log("Penalty:", penaltyInstance.address);
    console.log("Payment:", paymentInstance.address);
    console.log("Refund:", refundInstance.address);
    console.log("Schedule:", scheduleInstance.address);
    console.log("Audit:", auditInstance.address);
};
