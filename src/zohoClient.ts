export default class ZohoClient {
    private userId : string|undefined;

    public getUserId() {
        if (this.userId == undefined) {
            this.userId = $('#zpeople_userimage').attr('empid');
        }

        return this.userId;
    }
}
