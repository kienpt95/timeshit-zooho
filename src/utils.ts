export default class Utils {
    static onPageReady() : Promise<any>{
        return new Promise(resolve => {
            let pageReadyInterval = setInterval(() => {
                if(!$("#zpinitloading").length || !$("#zpinitloading").is(":visible")) {
                    resolve('done');
                    clearInterval(pageReadyInterval);
                }
            }, 200)
        })
    }
}
