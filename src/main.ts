import Zoho from './zoho';
import Utils, { ApprovalStatus } from './utils';

async function bootstrap() {
    await Utils.onPageReady()
    let zoho = new Zoho();

    let monthlyRecords: Array<object> = [];
    let timeSheetRecords : Array<object> = [];

    await Promise.all([
        zoho.getMonthlyData(),
        zoho.getTimeSheetData()
    ]).then(values => [monthlyRecords, timeSheetRecords] = values)

    let workingHoursData = Zoho.buildWorkingHoursData(monthlyRecords, timeSheetRecords)
    console.log('monthlyRecords', monthlyRecords);
    console.log('timeSheetRecords', timeSheetRecords)
}

bootstrap();


