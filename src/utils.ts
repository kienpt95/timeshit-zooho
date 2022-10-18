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

    static getCookie(name: string): string {
	    const nameLenPlus = (name.length + 1);
	    return document.cookie
		    .split(';')
            .map(c => c.trim())
            .filter(cookie => {
                return cookie.substring(0, nameLenPlus) === `${name}=`;
            })
            .map(cookie => {
                return decodeURIComponent(cookie.substring(nameLenPlus));
            })[0] || '';
    }
}
