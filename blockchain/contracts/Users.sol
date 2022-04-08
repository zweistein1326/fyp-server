pragma solidity >=0.4.22 <0.9.0;

import '../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../node_modules/@openzeppelin/contracts/utils/Counters.sol';

contract Users is ERC721{
    struct User{
        address userAddress;
        string username;
        string password;
        uint256[] fileIds;
    }
    
    using Counters for Counters.Counter;
    Counters.Counter private _userIds;
    mapping(uint256 => User) public userInfo;
    
    constructor() public ERC721("FYPUser","FYPU"){}

    function createNewUser(address _userAddress, string memory _username, string memory _password) public returns (uint256){
        _userIds.increment();
        uint256 newUserId = _userIds.current();
        uint256[] memory fileIds;
        userInfo[newUserId] = User(_userAddress, _username, _password, fileIds);
        _mint(_userAddress, newUserId);
        return newUserId;
    }
    
    function addFileToUser(uint256 userId, uint256 fileTokenId) public {
        User storage user = userInfo[userId];
        uint256[] memory fileIds;
        fileIds.push(fileTokenId);
        user.fileIds = fileIds;
        userInfo[userId] = user;
    }
}