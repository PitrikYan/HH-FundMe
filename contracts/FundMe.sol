// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol"; // library - knihovna funkci!!

import "hardhat/console.sol"; // diky tomu muzu v solidity kodu psat console.log(cokoli!); a pri testech se do konzole terminalu vypise "cokoli!"
// daji se pridavat i promenne..

// 883,746 gas before change to constant
// 864,216 after constant and before immutable
// 840,721 after..

error FundMeBitch__NotOwner(); // pro revert u funkci (jmeno kontraktu pouze pro prehlednost odkud chyba pochazi - konvekce)

// NatSpec format, komenty:
/**  @title Popis no co jde
 *   @author Kdo to zbastlil
 *   @notice Blaa blaaa blaaaa
 *   @dev poznamky pro ostatni developery
 */

contract FundMeBitch {
    using PriceConverter for uint256; // definovani pouziti funkci v knihovne => budou se pouzivat pro uint256!

    uint256 public constant MINIMUM_USD = 65 * 1e18; // 65 * 10 ** 18
    address[] private s_fundersAddresses;
    mapping(address => uint256) private s_howMuchTheyFunded;

    address private immutable i_theBoss;

    AggregatorV3Interface private s_priceFeed;

    modifier onlyTheBoss() {
        // _;  v tomhle pripade prvni vykona funkci a az pak require podminku
        //  require(msg.sender == i_theBoss, "You are not a BOSS!!");

        // more GAS friendly:
        if (msg.sender != i_theBoss) {
            revert FundMeBitch__NotOwner();
        }

        _; // prvni poresi revert a az pak pripadne zbytek kodu ve funkci
    }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    // pridavame vychytavku v podobe includu s_priceFeed zvenku (misto hardcode v fci v library)
    constructor(address _priceFeed) {
        i_theBoss = msg.sender;
        s_priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // kdyz nekdo zavola kontrakt s neexistujici funkci (spatne CALLDATA) a nebo posle prostredky bez volani funkce (klidne i 0)
    // zavolaji se tyhle fce: receive pri null calldata a fallback pri calldata!=null

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    // NatSpec format, komenty:
    /**
     *   @notice Popis co dela tahle fce
     *   @dev poznamky pro ostatni developery
     */

    // kdyby fce mela params:
    //*   @param parametry fce
    //*   @return parametry co vraci
    function fund() public payable {
        // pomoci fce prevede posilanou castku na dolary a zkontroluje minimum..

        //  "msg.value.getConversionRate()" => volam funkci z knihovny, msg.value je bran jako vstupni (prvni) parametr
        //  kdyz by funkce mela vice parametru tak to bude  "msg.value.getConversionRate(DRUHY PARAMETR)" !! a to presne ted udelame !!

        require(
            (msg.value).getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Tak to snad nemyslis vazne tyvole?! Minimalne 65!"
        );

        if (s_howMuchTheyFunded[msg.sender] == 0) {
            s_fundersAddresses.push(msg.sender);
        }

        // test HH console
        console.log(
            "K adrese %s v mappingu kde je ted %s prictu %s",
            msg.sender,
            s_howMuchTheyFunded[msg.sender],
            msg.value
        );

        s_howMuchTheyFunded[msg.sender] += msg.value; // pokazde se mu pricte poslana hodnota k jeho adrese
    }

    function withdraw() public onlyTheBoss {
        for (uint256 i = 0; i < s_fundersAddresses.length; i++) {
            address addressOfFunder = s_fundersAddresses[i];
            s_howMuchTheyFunded[addressOfFunder] = 0; // reset mappingu
        }
        // reset array:
        s_fundersAddresses = new address[](0); // priradim nove pole adres o NULA prvcích..

        // withdraw all fucking money: (vraci dva vystupy, takze nechame jen carku)
        (bool isItDone, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(isItDone, "It isnt done :(");

        // other ways:

        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
    }

    function theBestWithdraw() public payable onlyTheBoss {
        address[] memory theBestFundersAddresses = s_fundersAddresses;

        for (uint256 i = 0; i < theBestFundersAddresses.length; i++) {
            address addressOfFunder = theBestFundersAddresses[i];
            s_howMuchTheyFunded[addressOfFunder] = 0; // reset mappingu
        }
        // reset array:
        s_fundersAddresses = new address[](0); // priradim nove pole adres o NULA prvcích..

        // zrovna to posilam bossovi a ne msg.sender (protoze je to stejne onplyTheBoss)
        (bool isItDone, ) = i_theBoss.call{value: address(this).balance}("");
        require(isItDone, "It isnt done :(");
    }

    // GETTERS (of private variables) je to GAS cheaper mit promene private a pripadne ke zjistit funkci
    // ten kdo bude pracovat s kontraktem treba skrz API tak nebude videt vsechny s_promenne ale krasne funkce :)

    function ownerOf() public view returns (address) {
        return i_theBoss;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_fundersAddresses[index];
    }

    function getHowMuchTheyHave(address funder) public view returns (uint256) {
        return s_howMuchTheyFunded[funder];
    }

    // TADY SE VRACI TYP AggregatorV3Interface!!!
    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

// Concepts not cover yet:

// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly
