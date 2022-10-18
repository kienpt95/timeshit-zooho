import ZohoClient from './zohoClient';
import Utils from './utils';


Utils.onPageReady().then(async () => {
    let zohoClient = new ZohoClient();
    Promise.all([zohoClient.getMonthlyData(1), zohoClient.getMonthlyData(0)]).then((value) => {
        console.log(value.flat());
    });
});


