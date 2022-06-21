'use babel';
var network = require('network');
/*
const sleep = ms => new Promise(r => setTimeout(r, ms));

let tmp_modules = '';
var network = '';

window.addEventListener('message', async event => {
		if(event.data.modules)tmp_modules = event.data.modules;
		//console.log(tmp_modules[5]);
		network = tmp_modules[5];
        console.log(network);
        
	}, 
);

async function ML(){
	while(tmp_modules == '') {
		console.log('waiting for modules');
		await sleep(1000);
	}
}
*/
export default class GetNetworkAddress {

	static isVmMac(mac) {
		if (!mac) return false;
		// Array di MAC di macchine virtuali (non validi per le statistiche)
		const invalidMacs = [
			//VMWare
			'00:05:69', '00:1C:14', '00:0C:29', '00:50:56',
			//Virtualbox
			'08:00:27', '0A:00:27',
			//Virtual-PC
			'00:03:FF',
			//Hyper-V
			'00:15:5D'];

        //Loop su array di MAC che si sa essere di VM
        for (let i=0; i<invalidMacs.length; i++) {
            //Il MAC in input combacia
            if (mac.startsWith(invalidMacs[i])) {
                return true;
            }
        }

        return false;
    }

    static async getAddress() {
        return new Promise(async function(resolve, reject) {
			//await ML();
            network.get_interfaces_list(function(err, obj) {
                for(var i in obj) {
                    //Trovato MAC non fittizio, interrompi loop
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
