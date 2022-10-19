import ZohoClient from './zohoClient';
import Utils, { ApprovalStatus } from './utils';

async function bootstrap() {
    await Utils.onPageReady()
    let zohoClient = new ZohoClient();

    let monthlyRecords = await getMonthlyData(zohoClient)
    let timeSheetRecords = await getTimeSheetData(zohoClient)

    $.each(timeSheetRecords, (idx, value) => {
        if (value.approvalStatus == ApprovalStatus.PENDING || value.approvalStatus == ApprovalStatus.APPROVED) {

        }
    })
}

bootstrap();


async function getMonthlyData(zohoClient: ZohoClient) {
    await Promise.all([
        zohoClient.getMonthlyData(1),
        zohoClient.getMonthlyData(0)]
    ).then((values) => {
        return values.flat()
    });
}

async function getTimeSheetData(zohoClient: ZohoClient) {
    return await zohoClient.getTimeSheetRecord()
}
