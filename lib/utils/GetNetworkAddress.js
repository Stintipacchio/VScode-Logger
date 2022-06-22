'use babel';
var network = require('network');

export default class GetNetworkAddress {

	static isVmMac(mac) {
		if (!mac) return false;
		// Array of virtual machine MAC (not valid for statistics)
		const invalidMacs = [
			//VMWare
			'00:05:69', '00:1C:14', '00:0C:29', '00:50:56',
			//Virtualbox
			'08:00:27', '0A:00:27',
			//Virtual-PC
			'00:03:FF',
			//Hyper-V
			'00:15:5D'];

        //Loop on array of MAC withc are known to be VM
        for (let i=0; i<invalidMacs.length; i++) {
            //The input MAC match
            if (mac.startsWith(invalidMacs[i])) {
                return true;
            }
        }

        return false;
    }

    static async getAddress() {
        return new Promise(async function(resolve, reject) {
            network.get_interfaces_list(function(err, obj) {
                for(var i in obj) {
                    //Found real MAC, break loop
                    if (obj[i].ip_address && !(GetNetworkAddress.isVmMac(obj[i].mac_address))) {
                        resolve({
                          ipAddr: obj[i].ip_address,
                          macAddr: obj[i].mac_address
                        });
                    }
                }
                resolve({
									ipAddr: 'null',
									macAddr:'null'
								});
            })
        })
    }
}
