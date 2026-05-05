// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title BillService contract for the ImpactpPay Protocol
/// @notice A contract that tracks the supported bill service providers such as BitGifty, Chimoney, etc
/** 
    ERROR CODE:

    1 - Invalid index
    2 - Invalid address
*/

abstract contract BillService {
    event BillServicesUpdated(address indexed newBillService);

    /// @notice List of registered bill service providers
    address[] internal billServices;

    /// @notice Flag showing whether to send fund to bill service or the creator;
    bool internal useBillService;

    function _beforeCall() internal view virtual {}

    /// @notice Set the `useBillService
    function toggleUseBillService() public returns(bool){
        _beforeCall();
        bool status = useBillService;
        useBillService = !status;
        return true;
    }

    function setBillService(address newBillService) public {
        _beforeCall();
        require(newBillService != address(0), "2");
        bool isIncluded;
        for(uint i = 0; i < billServices.length; i++) {
            if(billServices[i] == newBillService) isIncluded = true;
        }
        if(!isIncluded) billServices.push(newBillService);

        emit BillServicesUpdated(newBillService);
    }

}