// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract SVGTimeNFT is ERC721, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    
    constructor() ERC721("SVG Time NFT", "SVGTIME") Ownable(msg.sender) {}
    
    function mint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory svg = generateSVG();
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Time NFT #',
                        tokenId.toString(),
                        '", "description": "An on-chain SVG NFT that displays the current blockchain time", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }
    
    function generateSVG() internal view returns (string memory) {
        uint256 timestamp = block.timestamp;
        
        (uint256 year, uint256 month, uint256 day, uint256 hour, uint256 minute, uint256 second) = timestampToDateTime(timestamp);
        
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">',
                '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />',
                '<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />',
                '</linearGradient>',
                '<filter id="glow">',
                '<feGaussianBlur stdDeviation="3" result="coloredBlur"/>',
                '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>',
                '</filter>',
                '</defs>',
                '<rect width="400" height="300" fill="url(#bg)"/>',
                '<circle cx="200" cy="100" r="80" fill="none" stroke="white" stroke-width="3" opacity="0.3"/>',
                '<text x="200" y="60" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="white" opacity="0.8">Blockchain Time</text>',
                '<text x="200" y="90" font-family="monospace" font-size="20" text-anchor="middle" fill="white" filter="url(#glow)">',
                formatTime(hour), ':', formatTime(minute), ':', formatTime(second),
                '</text>',
                '<text x="200" y="110" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="white" opacity="0.7">',
                day.toString(), '/', month.toString(), '/', year.toString(),
                '</text>',
                '<text x="200" y="140" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="white" opacity="0.6">',
                'Block: ', (block.number).toString(),
                '</text>',
                '<text x="200" y="200" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="white" opacity="0.8">',
                'Timestamp: ', timestamp.toString(),
                '</text>',
                '<rect x="50" y="220" width="300" height="60" rx="10" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>',
                '<text x="200" y="240" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="white" opacity="0.9">',
                'On-Chain SVG NFT',
                '</text>',
                '<text x="200" y="255" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="white" opacity="0.7">',
                'Updates with every blockchain query',
                '</text>',
                '<text x="200" y="270" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="white" opacity="0.7">',
                'Fully decentralized and immutable',
                '</text>',
                '</svg>'
            )
        );
    }
    
    function formatTime(uint256 time) internal pure returns (string memory) {
        if (time < 10) {
            return string(abi.encodePacked("0", time.toString()));
        }
        return time.toString();
    }
    
    function timestampToDateTime(uint256 timestamp) internal pure returns (uint256 year, uint256 month, uint256 day, uint256 hour, uint256 minute, uint256 second) {
        second = timestamp % 60;
        timestamp /= 60;
        minute = timestamp % 60;
        timestamp /= 60;
        hour = timestamp % 24;
        timestamp /= 24;
        
        uint256 daysSinceEpoch = timestamp;
        
        year = 1970 + (daysSinceEpoch / 365);
        
        uint256 remainingDays = daysSinceEpoch % 365;
        month = (remainingDays / 30) + 1;
        day = (remainingDays % 30) + 1;
        
        if (month > 12) month = 12;
        if (month == 0) month = 1;
        
        if (day == 0) day = 1;
    }
    
    function getCurrentTime() public view returns (uint256, uint256, uint256, uint256, uint256, uint256) {
        return timestampToDateTime(block.timestamp);
    }
}