// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.browserAction.onClicked.addListener(function(activeTab)
{
    var newURL = "https://people.zoho.com/hrportal1524046581683/zp";
    chrome.tabs.create({ url: newURL });
});

chrome.runtime.onInstalled.addListener(function() {
	// Default config
	//chrome.storage.sync.set({config: {}});
	// Set default badge BG color
	//chrome.browserAction.setBadgeBackgroundColor({color: '#FD297B'});
	
	/*
	// Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      // With a new rule ...
      chrome.declarativeContent.onPageChanged.addRules([
        {
          // That fires when a page's URL contains a 'g' ...
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              pageUrl: { urlContains: 'tinder.com' },
            })
          ],
          // And shows the extension's page action.
          actions: [ new chrome.declarativeContent.ShowPageAction() ]
        }
      ]);
    });
	*/
});