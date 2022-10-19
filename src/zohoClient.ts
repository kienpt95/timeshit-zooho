// const axios = require('axios');
import Utils from './utils';
import Config from './config';

enum RequestMethod {
    POST = 'post',
    GET = 'get'
}

export default class ZohoClient {
    private userId: string | undefined;
    private token: string | undefined;

    public getSiteUrl(): string {
        return window.location.host;
    }

    public getUserId(): string {
        if (this.userId == undefined) {
            this.userId = $('#zpeople_userimage').attr('empid');
        }

        return this.userId || '';
    }

    public getToken() {
        if (this.token == undefined) {
            this.token = Utils.getCookie('CSRF_TOKEN');
        }
        return this.token;
    }

    public makeRequest(method: string, action: string, data: object): Promise<any> {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: action,
                method: method,
                data: data,
                success: (response) => {
                    resolve(response);
                },
                error: () => {
                    reject();
                }
            });
        });
    }

    public async getMonthlyData(monthIndex: number) : Promise<Array<object>>{
        let result : Array<object> = [];

        await this.makeRequest(RequestMethod.POST, '/commonAction.zp', {
            'mode': 'MONTH_CALENDAR_ACTION',
            'userId': this.getUserId(),
            'view': 'month',
            'preMonth': monthIndex,
            'conreqcsr': this.getToken()
        }).then((response) => {
            $.each(response.attendanceReport, (index, value) => {
                result.push(value)
            })
        }).catch((err) => {
            console.log('loi roi')
        });

        return result;
    }

    public getTimeSheetRecord() : Promise<any> {
        return new Promise((resolve) => {
            this.makeRequest(RequestMethod.POST, '/viewAction.zp', {
                'mode':'fetchRecords',
                'formId': Config.APPROVAL_FORM_ID,
                'viewId': Config.APPROVAL_VIEW_ID,
                'isOnload': 'true',
                'sortBy': 'Date:false',
                'startInd': 1,
                'limit': '300',
                'conreqcsr': this.getToken()
            }).then((response) => {
                resolve(response.recordDetails.message.recordDetails)
            });
        })

    }
}
