// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function saveConfig() {
	let config = {};
	$('.option').each(function(){
		config[$(this).attr("name")] = $(this).val();
	});
	
	chrome.storage.sync.set({config: config});
	
	$('#message').slideDown(200).find('.alert').html('Configuration successfully saved!').end().delay(2000).slideUp(400);
}

$('button.save-config').on('click', function(e){
	e.preventDefault();
	
	saveConfig();
});

$(document).ready(function(){
	chrome.storage.sync.get(['config'], function(result){
		let config = result.config;
		$('.option').each(function(){
			let option_name = $(this).attr("name");
			if(typeof(config) == 'object' && config[option_name]) {
				let option_value = config[option_name];
				$(this).val(option_value);
			}
		});
	});
});