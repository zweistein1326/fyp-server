const CredentialHash = artifacts.require('CredentialHash')
const Users = artifacts.require('Users');
const UniqueAsset = artifacts.require('UniqueAsset');

module.exports = function (deployer) {
    deployer.deploy(CredentialHash);
    deployer.deploy(Users);
    deployer.deploy(UniqueAsset);
}