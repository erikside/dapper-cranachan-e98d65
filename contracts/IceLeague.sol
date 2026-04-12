// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract IceLeague is ERC721A, Ownable {
    using Strings for uint256;

    uint256 public price = 0.01 ether;
    uint256 public maxSupply = 1000;
    uint256 public maxPerWallet = 3;

    bool public paused = true;
    bool public revealed;
    string public hiddenURI;
    string public baseURI;

    mapping(address => uint256) public minted;
    mapping(address => bool) public whitelist;

    constructor() ERC721A("IceLeague", "ICE") Ownable(msg.sender) {}

    function mint(uint256 quantity) external payable {
        require(!paused, "Paused");
        require(quantity > 0, "Zero qty");
        require(totalSupply() + quantity <= maxSupply, "Sold out");
        require(minted[msg.sender] + quantity <= maxPerWallet, "Limit");
        require(msg.value >= price * quantity, "Not enough ETH");
        minted[msg.sender] += quantity;
        _mint(msg.sender, quantity);
    }

    function mintWhitelist(uint256 quantity) external payable {
        require(whitelist[msg.sender], "Not WL");
        require(quantity > 0, "Zero qty");
        require(totalSupply() + quantity <= maxSupply, "Sold out");
        require(minted[msg.sender] + quantity <= maxPerWallet, "Limit");
        require(msg.value >= price * quantity, "Not enough ETH");
        minted[msg.sender] += quantity;
        _mint(msg.sender, quantity);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
        if (!revealed) {
            return hiddenURI;
        }
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function reveal() external onlyOwner {
        revealed = true;
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
    }

    function setHiddenURI(string calldata uri) external onlyOwner {
        hiddenURI = uri;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    function setWhitelist(address[] calldata users, bool allowed) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            whitelist[users[i]] = allowed;
        }
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function setMaxPerWallet(uint256 v) external onlyOwner {
        maxPerWallet = v;
    }

    function setMaxSupply(uint256 newMax) external onlyOwner {
        require(newMax >= totalSupply(), "Invalid max");
        maxSupply = newMax;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }
}
