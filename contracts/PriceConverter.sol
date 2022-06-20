// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    // vsechny fve v knihovne musi byt internal!!

    function getPriceOfToken(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        /*AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        );*/
        (, int256 myPrice, , , ) = priceFeed.latestRoundData(); // volani fce z importovaneho interface a vytahuti konkretni promene z vystupu fce
        // fce vraci cenu ETH v USD s 8 desetinnymi misty navic
        // my potrebujeme dalsich 10 mist bo msg.value vraci WEI (18 mist)
        // a navic musime prekonvertovat na UINT
        return uint256(myPrice * 1e10);

        // deleno decimals at dostanu 1800 = eth price
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPriceOfToken(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        // the actual ETH/USD conversation rate, after adjusting the extra 0s.
        return ethAmountInUsd;

        // amount / 1e18 = amount eth
        // amount eth * eth price = price in usd
    }

    function getDecimalsOfInterface() internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        );
        return priceFeed.decimals();
    }
}
