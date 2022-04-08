pragma solidity >=0.4.22 <0.9.0;

import '../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../node_modules/@openzeppelin/contracts/utils/Counters.sol';

contract UniqueAsset is ERC721{

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(uint256 => string) public tokenURIs;
    string[{to:, from:, iat: }] credentialHistory;

    constructor() public ERC721("UniqueAsset","UNA"){}
    
    function awardItem(address recipient, string memory hash, string memory metadata) public returns (uint256){
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        tokenURIs[newItemId] = metadata;
        _mint(recipient, newItemId);
        return newItemId;
    }

    function abc() public returns (string memory){
        return 'abc';
    }

}