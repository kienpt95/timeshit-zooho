import ZohoClient from './zohoClient';
import WorkingHour from './interface/workinghour';

export default class Zoho {
    private zohoClient: ZohoClient;

    constructor() {
        this.zohoClient = new ZohoClient();
    }

    async getMonthlyData(): Promise<Array<object>> {
        let result: Array<object> = [];
        await Promise.all([
            this.zohoClient.getMonthlyData(1),
            this.zohoClient.getMonthlyData(0)]
        ).then((values) => {
            result = values.flat();
        });

        return result;
    }

    async getTimeSheetData(): Promise<Array<object>> {
        return await this.zohoClient.getTimeSheetRecord();
    }

    static buildWorkingHoursData(monthlyData: Array<object>, timeSheetData: Array<object>): Array<object> {
        let x: WorkingHour;

        return new Array<object>();
    }
}
