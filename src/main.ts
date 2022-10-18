import ZohoClient from './zohoClient'
import Utils from './utils';

Utils.onPageReady().then(() => {
    let x = (new ZohoClient()).getUserId();
    console.log(x);
})

