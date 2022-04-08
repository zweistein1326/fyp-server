pragma solidity >=0.4.22 <0.9.0;

contract CredentialHash{
    string public ipfsHash;

    function saveHash(string memory x) public {
        ipfsHash = x;
    }

    function getHash() public view returns (string memory x){
        return ipfsHash;
    }
}