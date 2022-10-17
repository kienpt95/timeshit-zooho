
'use strict';

chrome.browserAction.onClicked.addListener(function(activeTab)
{
    var newURL = "https://people.zoho.com/hrportal1524046581683/zp";
    chrome.tabs.create({ url: newURL });
});
