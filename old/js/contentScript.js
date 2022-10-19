// Site URL without "/" at the end
var siteUrl;

var userId, csrf;

// This variable will be updated(with more value) each time ajax load by function getWorkingHourData
var myWorkingHoursByDate = [];

// Run a function once page finish to load (#zpinitloading invisible)
function onPageReady(callback) {
	// Only run on main page, without this check the function can run on ajax page like: commonAction.zp
	if(window.location.href.indexOf("/zp") == -1) {
		return;
	}

	var onPageReadyFn = setInterval(function(){
		if(!$("#zpinitloading").length || !$("#zpinitloading").is(":visible")) {
			if (typeof callback == "function") {
				callback();
			}

			// Custom callback function
			chrome.storage.sync.get(['config'], function(result){
				let config = result.config;
				if(typeof(config) != 'object') {
					return;
				}

				let onPageReadyCode = config.onpageready ? config.onpageready : '';
				if(onPageReadyCode) {
					eval(onPageReadyCode);
				}
			});

			clearInterval(onPageReadyFn);
		}
	}, 200);
}

function onSubPageReady(callback) {
	// Only run on main page, without this check the function can run on ajax page like: commonAction.zp
	if(window.location.href.indexOf("/zp") == -1) {
		return;
	}

	var onSubPageReadyFn = setInterval(function(){
		let loadingElm = $(".cont-wrap:not(.DN) > .main-wrp:not(.DN) > .Scrcont > #zp_page_loading, .cont-wrap:not(.DN) > .main-wrp:not(.DN) > .modal #zp_page_loading");
		if(!loadingElm.length || !loadingElm.is(":visible")) {
			if (typeof callback == "function") {
				callback();
			}

			// Custom callback function
			chrome.storage.sync.get(['config'], function(result){
				let config = result.config;
				if(typeof(config) != 'object') {
					return;
				}

				let onSubPageReadyCode = config.onsubpageready ? config.onsubpageready : '';
				if(onSubPageReadyCode) {
					eval(onSubPageReadyCode);
				}
			});

			clearInterval(onSubPageReadyFn);
		}
	}, 300);
}

// Format date to yyyy-mm-dd
function formatDate(date) {
    var dateArr = date.split("-");
        month = dateArr[1],
        day = dateArr[2],
        year = dateArr[0];

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

// Convert month from string to number 0?
function monthToNumber(monthStr) {
	let monthNum = '';
	switch(monthStr) {
	  case 'Jan':
		monthNum = '01';
		break;
	  case 'Feb':
		monthNum = '02';
		break;
	  case 'Mar':
		monthNum = '03';
		break;
	  case 'Apr':
		monthNum = '04';
		break;
	  case 'May':
		monthNum = '05';
		break;
	  case 'Jun':
		monthNum = '06';
		break;
	  case 'Jul':
		monthNum = '07';
		break;
	  case 'Aug':
		monthNum = '08';
		break;
	  case 'Sep':
		monthNum = '09';
		break;
	  case 'Oct':
		monthNum = '10';
		break;
	  case 'Nov':
		monthNum = '11';
		break;
	  case 'Dec':
		monthNum = '12';
		break;
	  default:
	}

	return monthNum;
}

// Convert date string from 01-Apr-2020 to 2020-04-01
function convertDate(date) {
	var dateArr = date.split("-");

	return dateArr[2] + '-' + monthToNumber(dateArr[1]) + '-' + dateArr[0];
}

// Return different hours between start/end time(YYYY-mm-dd HH:mm:ss)
function hourDiff(start, end) {
    var startDate = new Date(start);
    var endDate = new Date(end);
    var diff = endDate.getTime() - startDate.getTime();

    return diff;
}

// Return the different between two mm/yyyy
function monthDiff (startMonth, startYear, endMonth, endYear) {
	return parseInt(startMonth) - parseInt(endMonth) + (parseInt(startYear) - parseInt(endYear)) * 12;
}

// Return working time(seconds)
// Note: Salary hour will be calculated from 07h30AM -> 07h30PM, in this function we do NOT limit with this time
function calculateActualWorkingHours(checkin, checkout) {
	if(!checkin || !checkout) {
		return 0;
	}

	var date = checkin.split(" ")[0];
	var startLunch = date + ' 12:00:00';
	var endLunch = date + ' 13:15:00';

	var workingTime = 0;
	// Morning time
	if(checkin < startLunch) {
		// Get Min time
		var endMorning = startLunch.localeCompare(checkout) == -1 ? startLunch : checkout;
		workingTime += hourDiff(checkin, endMorning);
	}

	// Afternoon time
	if(checkout > endLunch) {
		// Get Max time
		var startAfternoon = endLunch.localeCompare(checkin) == -1 ? checkin : endLunch;
		workingTime += hourDiff(startAfternoon, checkout);
	}

	// Rounding one decimal
	workingHours = Math.round(workingTime / 1000 / 60 / 60 * 10) / 10;
	return workingHours;
}

// Add Timesheet Widget
function addTimeSheetWidget() {
	var timeSheetWidget = setInterval(function(){
		// Don't add twice
		if($("#herotimesheet-widget").length) {
			clearInterval(timeSheetWidget);
			return;
		}
		// Find widget list element to add
		else if($("#zp_d_wrow").length) {
			const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			let monthSelect = '<select class="monthSelect input-sm">';
			let d = new Date();
			let year = d.getFullYear();
			let month = d.getMonth();
			let monthIndex;
			for(i = 0; i <= 5; i++) {
				monthSelect += '<option value="' + i + '">';
				monthIndex = month - i;
				if(monthIndex < 0) {
					monthIndex = monthIndex + 12;
					year--;
				}
				monthSelect += monthNames[monthIndex] + '-' + year;
				monthSelect += '</option>';
			}
			monthSelect += '</select>';

			// Widget Block
			let html = '<div class="zp-sm-8 herotimesheet-widget" id="herotimesheet-widget" name="HEROTIMESHEET" widget="true" widid="herotimesheet" loaded="true">'
			+ '<div class="dash-col">'
			+ '<div class="dash-head hicon IC-drag">'
			+ '<h3 class="dash-title" data-toggle="tooltip" data-placement="right" data-html="true" title="Time is to be <b>enjoyed</b>, we don\'t <strike>count</strike> it!">HERO TimeSheet</h3>'
			+ '<div class="pull-right">'
			+ '<a class="new-record" href="#timesheet/form/add-formLinkName:Log_Timesheet">'
			+ '<button class="btn_lined" data-toggle="tooltip" data-html="true" title="Log Timesheet like a <b>HERO</b>"><i class="IC-add-r"></i> Log Timesheet</button>'
			+ '</a>'
			+ monthSelect
			+ '</div>'
			+ '</div>'
			+ '<div id="herotimesheet" class="loading dash-body">'
			+ '<div class="content-loader hidden"><div class="loader-inner line-scale"><div></div><div></div><div></div><div></div><div></div></div></div>'
			+ '</div>'
			+ '</div>'
			+ '</div>'
			+ '</div>';
			$("#zp_d_wrow").prepend(html);

			// Change month
			$(".monthSelect").on("change", function(){
				$("#herotimesheet").addClass("loading");
				getWorkingHourData(addTimeSheetTable, $(this).val());
			});

			// Add timesheet table to widget for current month
			getWorkingHourData(addTimeSheetTable);

			clearInterval(timeSheetWidget);
			return;
		}
	}, 1000);
}

// Return timesheet status when comparing workingHours vs timesheetHours
function getTimesheetStatus(workingHours, timesheetHours) {
	let timesheetStatus = "";
	if(workingHours == 0) {
		timesheetStatus = "No data";
	}
	else if(timesheetHours == workingHours) {
		timesheetStatus = "Perfect";
	}
	else if (timesheetHours > workingHours && timesheetHours <= (workingHours + 0.5)) {
		timesheetStatus = "Genius";
	}
	else if (timesheetHours > (workingHours + 0.5)) {
		timesheetStatus = "Over";
	}
	// timesheetHours < workingHours
	else {
		if(workingHours <= 8) {
			if(timesheetHours >= (workingHours - 0.5)) {
				timesheetStatus = "Good";
			}
			else {
				timesheetStatus = "Not enough";
			}
		} else {
			// timesheetHours must be >= 8
			if(timesheetHours >= 8) {
				timesheetStatus = "Good";
			} else {
				timesheetStatus = "Not enough";
			}
		}
	}

	return timesheetStatus;
}

// Return date status from status string of date
function getDateStatus(dateStatus) {
	let status = "";
	if(dateStatus == "Absent") {
		status = "absent";
	}
	else if(dateStatus == "Present") {
		status = "present";
	}
	else if(dateStatus == "Weekend") {
		status = "weekend";
	}
	else if(dateStatus.includes("Holiday")) {
		status = "holiday";
	}
	else if(dateStatus.includes("Leave")) {
		status = "leave";
	}

	return status;
}

// Generate timesheet table HTML from myWorkingHours
function addTimeSheetTable(myWorkingHours) {
	html = '<table class="herotimesheet table table-striped responsive nowrap"><thead>';
	html += '<th width="26%">Date</th><th width="18%">Working Hours</th><th width="18%">Logged Hours</th><th width="18%">Salary Hours</th><th width="20%">Status</th></tr>';
	html += '</thead>';
	html += '<tbody>';
	var appliedLeave = 0;
	// Recent day first
	$.each(myWorkingHours.reverse(), function(index, value){
		// Skip Sunday, Saturday
		if(value.day == 1 || value.day == 7) {
			return;
		}

		let dateClass = "";
		// Date statuses
		let dateStatus = getDateStatus(value.status);
		switch(dateStatus) {
			case "absent":
				dateClass += " absent";
				break;
			case "present":
				dateClass += " present";
				break;
			case "weekend":
				dateClass += " weekend";
				break;
			case "holiday":
				dateClass += " holiday";
				break;
			case "leave":
				dateClass += " leave";
				break;
		}

		// @Todo: Need to recheck
		if(value.leaveDaysTaken > 0) {
			appliedLeave += value.leaveDaysTaken;
		}

		// Timesheet statuses
		let timesheetStatus = value.timesheetStatus;
		switch(timesheetStatus) {
			case "No data":
				dateClass += " no-data";
				break;
			case "Good":
				dateClass += " good";
				break;
			case "Perfect":
				dateClass += " perfect";
				break;
			case "Genius":
				dateClass += " genius";
				break;
			case "Over":
				dateClass += " over";
				break;
			case "Not enough":
				dateClass += " not-enough";
				if(value.timesheetHours == 0) {
					dateClass += " zero-timesheet";
				}
				break;
		}

		// Salary hours
		let salaryHours = 0;
		if(value.workingHours > 6) {
			salaryHours = 8;
		} else if (value.workingHours > 4) {
			salaryHours = 6;
		} else if (value.workingHours > 2) {
			salaryHours = 4;
		} else if (value.workingHours > 0) {
			salaryHours = 2;
		}

		let dateTitle = '';
		let absentDesc = '';
		dateTitle += value.status;
		// Absent but still have workingHours (Punch in/out error, Work From Home,... , and submit regularization)
		if(value.status == 'Absent' && value.workingHours > 0) {
			if(value.approvalInfo.desc) {
				dateTitle += ' - ' + value.approvalInfo.desc;
				absentDesc = value.approvalInfo.desc;
			}
			dateTitle += ' (' + value.approvalInfo.new_intime.split(' ')[1] + '-' + value.approvalInfo.new_outtime.split(' ')[1] + ')';
		} else if(value.status == 'Present') {
			dateTitle += " (" + value.filo.ftime + "-" + value.filo.ttime + ")";
		}

		dateTitle += '<br/><b>Timesheet status:</b> ' + timesheetStatus;

		html += '<tr class="' + dateClass +'" data-toggle="tooltip" data-html="true" title="' + dateTitle + '">';
		html += '<td><span class="hidden">' + [value.attDate, value.status, absentDesc, timesheetStatus].join('|') + '</span>' + value.ldate + '</td>';
		html += '<td>' + value.workingHours + '</td><td>' + value.timesheetHours + '</td><td>' + salaryHours + '</td><td><span class="status">' + timesheetStatus + '</span></td>';
		html += '</tr>';
	});
	html += '</tbody>';
	html += '</table>';
	html += '<div class="content-loader hidden"><div class="loader-inner line-scale"><div></div><div></div><div></div><div></div><div></div></div></div>';
	$("#herotimesheet").html(html).removeClass("loading");
	$("#herotimesheet table.herotimesheet").DataTable({stateSave: true, lengthMenu: [[10, 15, 20, 25, 50, -1], [10, 15, 20, 25, 50, "All"]]});
}

/*
* Repopulate myWorkingHoursByDate variable and set value for myWorkingHours to process by callback function
* monthIndex: 0 = this month, 1 = last month,...
* endMonthDay: the day of end month period, default by 20 - monthy salary period
*/
function getWorkingHourData(callback, monthIndex = 0, endMonthDay = 20) {
	userId = $('#zpeople_userimage').attr('empid');
	csrf = $.cookie("CSRF_TOKEN");
	//console.log(userId);
	//console.log(csrf);

	monthIndex = parseInt(monthIndex);

	var attendance = [];
	// Attendance
	$.ajax({
		url: siteUrl + '/commonAction.zp',
		method: 'post',
		data: {
			'mode':'MONTH_CALENDAR_ACTION',
			'userId':userId,
			'view':'month',
			'preMonth':monthIndex + 1, // Last month
			'conreqcsr':csrf
		},
		success:function(data) {
			let attendanceReport1 = data.attendanceReport;
			let leaveReport1 = data.leaveReport;

			$.each(attendanceReport1, function(index, value){
				attendance.push(value);
			});

			$.ajax({
				url: siteUrl + '/commonAction.zp',
				method: 'post',
				data: {
					'mode':'MONTH_CALENDAR_ACTION',
					'userId':userId,
					'view':'month',
					'preMonth':monthIndex, // This month (by index)
					'conreqcsr':csrf
				},
				success:function(data) {
					let attendanceReport0 = data.attendanceReport;
					let leaveReport0 = data.leaveReport;

					$.each(attendanceReport0, function(index, value){
						attendance.push(value);
					});

					// Log TimeSheet
					$.ajax({
						url: siteUrl + '/viewAction.zp',
						method: 'post',
						data: {
							'mode':'fetchRecords',
							'formId': '412762000158024844',
							'viewId': '412762000158024846',
							'isOnload': 'true',
							'sortBy': 'Date:false',
							'startInd': 1,
							'limit': '300',
							'conreqcsr':csrf
						},
						success:function(data) {
							let timesheetRecords = data.recordDetails.message.recordDetails;
							let timesheetHoursByDate = [];
							$.each(timesheetRecords, function(index, value){
								// -1: Pending | 0: Rejected | 1: Approved | 2: Canceled | 4: Draft
								if(value.approvalStatus == '-1' || value.approvalStatus == '1') {
									let dateIndex = convertDate(value.fieldDetails[7]);
									if(timesheetHoursByDate[dateIndex]) {
										timesheetHoursByDate[dateIndex] = Number(timesheetHoursByDate[dateIndex]) + Number(value.fieldDetails[5]);
									} else {
										timesheetHoursByDate[dateIndex] = Number(value.fieldDetails[5]);
									}
								}
							});

							//console.log(timesheetRecords);
							//console.log(timesheetHoursByDate);

							var d = new Date();
							var date = d.getDate();
							// Month start from 0 = January, so if we use number => current month = month + 1
							var month = d.getMonth() + 1 - monthIndex;
							var year = d.getFullYear();
							if(date <= endMonthDay)
							{
								var lastMonth_byEndMonthDay = month - 1;
							}
							else
							{
								var lastMonth_byEndMonthDay = month;
							}

							if(lastMonth_byEndMonthDay > 0) {
								var lastMonth = year + '-' + lastMonth_byEndMonthDay + '-' + endMonthDay;
							} else {
								var lastYear = year - 1;
								lastMonth_byEndMonthDay += 12;
								var lastMonth = lastYear + '-' + lastMonth_byEndMonthDay + '-' + endMonthDay;
							}

							if(monthIndex > 0) {
								var thisMonth = year + '-' + month + '-' + endMonthDay;
							} else {
								// Current month, the lastest day which has data = Today
								var thisMonth = year + '-' + month + '-' + date;
							}

							var myWorkingHours = [];

							$.each(attendance, function(index, value){
								if(value.attDate > formatDate(lastMonth) && value.attDate <= formatDate(thisMonth) ){
									// -1: Pending | 0: Rejected | 1: Approved | 2: Canceled
									// We can check value.approvalInfo.status later, so only approved regularization will be used
									if(value.approvalInfo && value.approvalInfo.new_totalHours)
									{
										var workingHours = calculateActualWorkingHours(value.approvalInfo.new_intime, value.approvalInfo.new_outtime);
									} else {
										var workingHours = calculateActualWorkingHours(value.filo.checkin, value.filo.checkout);
									}
									workingHours = workingHours > 0 ? workingHours : 0;
									value.timesheetHours = timesheetHoursByDate[value.attDate] ? timesheetHoursByDate[value.attDate] : 0;
									value.workingHours = workingHours;
									value.timesheetStatus = getTimesheetStatus(value.workingHours, value.timesheetHours);
									// This kind of assignment seems break the std array, so we need 2 variables. This variable will be updated each time ajax load successfully
									myWorkingHoursByDate[value.attDate] = value;
									myWorkingHours.push(value);
								}
							});

							console.log(myWorkingHours);

							// Custom callback function
							chrome.storage.sync.get(['config'], function(result){
								let config = result.config;
								if(typeof(config) != 'object') {
									return;
								}

								let onDataLoadedCode = config.ondataloaded ? config.ondataloaded : '';
								if(onDataLoadedCode) {
									eval(onDataLoadedCode);
								}
							});

							if (typeof callback == "function") {
								callback(myWorkingHours);
							}
						}
					});
				}
			});
		}
	});

	// Report TimeSheet vs Punch Time
	/*$.ajax({
				url: 'https://people.smartosc.com/viewAction.zp',
				method: 'post',
				data: {
					'mode':'fetchRecords',
					'formId': '412762000007864390',
					'viewId': '412762000007864392',
					'isOnload': 'true',
					'startInd': 1,
					'conreqcsr':csrf
				},
				success:function(data) {
					//console.log(data);
					console.log(data.recordDetails.message.recordDetails);
				}
	});*/
}

function setDefaultFormData(){
	// Log timesheet form
	var evt = document.createEvent("HTMLEvents");
    evt.initEvent("change", false, true);

	// Fields: Division, Task, Project, Work location
	var setDefaultFields = ['412762000003736069', '412762000003736071', '412762000003736075', '412762000010757859'];
	$.each(setDefaultFields, function(index, fieldId){
		let inputValueField = jQuery('#zp_field_' + fieldId);
		// Add set default button, need to check if element existed or not, sometimes it loop to add many set default buttons
		if(!inputValueField.closest('.zp-label').find('.zplt-label > .set-default').length) {
			inputValueField.closest('.zp-label').find('.zplt-label').append('<span class="set-default" data-toggle="tooltip" title="Set default"><i class="IC-tick-2px ML5"></i></span>');
		}

		// Set default value
		chrome.storage.sync.get([fieldId], function(result){
			let fieldDefaultValue = result[fieldId];
			let inputValueFieldJS = document.getElementById('zp_field_' + fieldId);
			// Need to check to make sure input value field exist, sometime it can not be dispatched ?!
			if(fieldDefaultValue !== '' && typeof(fieldDefaultValue) != 'undefined' && typeof(inputValueFieldJS) != 'undefined' && inputValueFieldJS != null) {
				inputValueField.val(fieldDefaultValue);
				// This JS dispatchEvent will trigger Select2 change, jQuery trigger does not work :(
				inputValueFieldJS.dispatchEvent(evt);
				inputValueField.closest('.zp-label').addClass('default');
			}
		});
	});

	// Click on button to set default value
	jQuery(document).on("click", ".set-default", function(){
		let inputValueField = $(this).closest('.zp-label').find('input[id^="zp_field_"], select[id^="zp_field_"]');
		let fieldId = inputValueField.attr('fcid');
		let fieldValue = inputValueField.val();
		if(fieldValue == '-Select-') {
			fieldValue = '';
		}
		let storageValue = {};
		storageValue[fieldId] = fieldValue;
		chrome.storage.sync.set(storageValue);
		if(fieldValue !== '' && typeof(fieldValue) != 'undefined') {
			$(this).closest('.zp-label').addClass('default');
		} else {
			$(this).closest('.zp-label').removeClass('default');
		}

		$(this).addClass("clicked").delay(200).queue(function(){
			$(this).removeClass("clicked").dequeue();
		});
	});

	// Field Description - Predefined values
	chrome.storage.sync.get(['config'], function(result){
		let config = result.config;
		if(typeof(config) != 'object') {
			return;
		}

		let predefined_desc = config.predefined_desc;
		if(!predefined_desc.trim()) {
			return;
		}

		let predefined_desc_arr = predefined_desc.split("\n");
		let descArray = [];
		let hasDefaultSelect = false;
		$.each(predefined_desc_arr, function(index, value) {
			let predefinedDescItem = value.split("|");
			// Item must have text or value
			if(!predefinedDescItem[0] && !predefinedDescItem[1]) {
				return;
			}

			let descItem = {};
			descItem.default = false;
			if(predefinedDescItem[2] && predefinedDescItem[2].toUpperCase() == 'DEFAULT') {
				descItem.default = true;
				hasDefaultSelect = true;
			}
			// Item has value
			if(typeof(predefinedDescItem[1]) != 'undefined') {
				if(predefinedDescItem[0]) {
					descItem.text = predefinedDescItem[0];
				} else {
					descItem.text = predefinedDescItem[1];
				}
				descItem.value = predefinedDescItem[1];
			}
			// Item has text only
			else if(predefinedDescItem[0]) {
				descItem.text = predefinedDescItem[0];
				descItem.value = predefinedDescItem[0];
			}
			descArray.push(descItem);
		});

		let descField = $('#zp_field_412762000003736079');
		let selectDesc = '';
		let selectDefault = '';
		selectDesc += '<select class="descSelect input-sm">';
		selectDesc += '<option value="">Select a description</option>';
		$.each(descArray, function(index, value){
			selectDefault = value.default ? ' selected' : '';
			selectDesc += '<option value="' + value.value + '"' + selectDefault +'>' + value.text + '</option>';
		});
		selectDesc += '</select>';
		descField.closest('.zp-label').find('.zplt-label').append(selectDesc);
		// Append value of select to description
		$(document).on("change", "select.descSelect", function(){
			// Do nothing if no value
			if(!$(this).val()) {
				return;
			}

			let newDesc = '';
			if(descField.val().trim()) {
				newDesc = [descField.val(), $(this).val()].join("\n");
			} else {
				newDesc = $(this).val();
			}

			descField.val(newDesc);
		});

		if(hasDefaultSelect) {
			$('select.descSelect').trigger('change');
		}
	});
}

function addTimesheetStatusToCalendar() {
	// Ignore empty, weekend day
	$("#singlecalendar #calbody td.day:not(.empty, .weekend)").each(function(){
		let dateArr = $(this).attr('date').split('-');
		let date = formatDate(dateArr[2] + '-' + dateArr[0] + '-' + dateArr[1]);
		let data = myWorkingHoursByDate[date];
		if(data) {
			let dateClass = "";
			let dateStatus = getDateStatus(data.status);
				switch(dateStatus) {
				case "absent":
					dateClass += " absent";
					break;
				case "present":
					dateClass += " present";
					break;
				case "weekend":
					dateClass += " weekend";
					break;
				case "holiday":
					dateClass += " holiday";
					break;
				case "leave":
					dateClass += " leave";
					break;
			}

			let timeSheetStatus = data.timesheetStatus;
			switch(timeSheetStatus) {
				case "No data":
					dateClass += " no-data";
					break;
				case "Good":
					dateClass += " good";
					break;
				case "Perfect":
					dateClass += " perfect";
					break;
				case "Genius":
					dateClass += " genius";
					break;
				case "Over":
					dateClass += " over";
					break;
				case "Not enough":
					dateClass += " not-enough";
					if(data.timesheetHours == 0) {
						dateClass += " zero-timesheet";
					}
					break;
			}

			let dateTitle = '';
			dateTitle += data.status;

			// Show timesheet hour if present or absent but still have workingHours data (Punch in/out error, Work From Home,... , and submit regularization)
			if(data.status == 'Absent' && data.workingHours > 0) {
				if(data.approvalInfo.desc) {
					dateTitle += ' - ' + data.approvalInfo.desc;
				}
			}

			dateTitle += ' - ' + timeSheetStatus;
			if(data.workingHours > 0) {
				dateTitle += ' (' + data.timesheetHours + '/' + data.workingHours + ')';
			}
			// Use data-original-title better than title.(Use title may cause of tooltip not updated when change month)
			$(this).addClass(dateClass).attr("data-original-title", dateTitle).attr("data-toggle", "tooltip").attr("data-container", "#singlecalendar");
		}
	});
}

/*
* Add new timesheet record
* date: format 01-May-2020
* Other field values: Check the add timesheet record form
*/
function addTimesheetRecord(division, task, project, date, timesheethours, taskdescription = '', worklocation = 'Local', isdraft = true, callback = null, checktimesheet = true) {
	// Get loginUserZUID
	//console.log($("#pconnect"));

	// Check timesheet hours for logged date before adding record
	// @Todo checktimesheet: true/false/auto_adjust

	chrome.storage.sync.get(null, function(result){
		//let config = result.config;
		// Use default configured value if no value set
		if(!division) {
			division = result['412762000003736069'];
		}
		if(!task) {
			task = result['412762000003736071'];
		}
		if(!project) {
			project = result['412762000003736075'];
		}
		if(!worklocation) {
			worklocation = result['412762000010757859'];
		}

		$.ajax({
			url: siteUrl + '/addUpdateRecord.zp',
			method: 'post',
			data: {
				'Emp_info': userId,
				'Division': division,
				'Task': task,
				'Timesheet_Hours': timesheethours,
				'Project': project,
				'Work_location': 'Local',
				'Date': date,
				'Task_Description': taskdescription,
				'Billable_Hours': '0',
				'zp_tableName': 't_412762000158024844',
				/*'loginUserZUID': '702271892',*/
				'conreqcsr':csrf,
				'zp_formId': '412762000158024844',
				'zp_mode': 'addRecord',
				'isDraft': isdraft,
				'isResubmit': 'false',
			},
			success:function(data) {
				if (typeof callback == "function") {
					callback(data);
				}
			}
		});
	});
}

// Inject JS Files
function injectScript(src, where) {
	var elm = document.createElement('script');
	elm.src = src;
	document[where || 'head'].appendChild(elm);
}
/*
* ====================================
* Start here
* ====================================
*/

var currentUrl = window.location.href;
if(currentUrl.indexOf("//people.zoho.com") != -1 || currentUrl.indexOf("//people.smartosc.com") != -1) {
	if(currentUrl.indexOf("//people.zoho.com") != -1) {
		siteUrl = "https://people.zoho.com/hrportal1524046581683";
	} else {
		siteUrl = "https://people.smartosc.com/hrportal1524046581683";
	}

	// Custom callback function
	chrome.storage.sync.get(['config'], function(result){
		let config = result.config;
		if(typeof(config) != 'object') {
			return;
		}

		let customScripts = config.customscripts ? config.customscripts : '';
		if(customScripts) {
			// Custom script include
            var scripts = customScripts.split("\n");
            scripts.forEach(function(line) {
                if( line.substr(0, 1) !== '#' ) {
                    injectScript(line);
                }
            });
		}
	});

	jQuery(window).on('hashchange', function(e) {
		let hash = window.location.hash.toString();

		// Log timesheet
		if(hash == "#timesheet/form/add-formLinkName:Log_Timesheet") {
			onSubPageReady(function(){
				// SetTimeOut here because sometimes it seems trigger so fast and can not set default values
				//setTimeout(function() {
					setDefaultFormData();
					// Trigger field date change when sub page ready, only in submit new record form
					jQuery("#zp_field_412762000158026914").trigger("change");
				//}, 50);
			});
		}
		// Add timesheet widget to dashboard
		else if(hash == "#home/dashboard") {
			addTimeSheetWidget();
			// Just call onSubPage ready to make sure it's triggered all pages(to run custom callback function)
			onSubPageReady();
		} else {
			// Just call onSubPage ready to make sure it's triggered all pages(to run custom callback function)
			onSubPageReady();
		}
	});

	onPageReady(function(){
		let hash = window.location.hash.toString();
		// Add timesheet widget to dashboard
		if(hash == "#home/dashboard") {
			addTimeSheetWidget();
		}

		let d = new Date();
		let month = parseInt(d.getMonth() + 1);
		let year = d.getFullYear();

		let firstDayCurrentMonth = formatDate(year + '-' + month + '-01');
		// Get data for current month
		if(!myWorkingHoursByDate[firstDayCurrentMonth]) {
			getWorkingHourData(function(){
				// Trigger field date change when sub page ready, only in submit new record form
				if(hash == "#timesheet/form/add-formLinkName:Log_Timesheet") {
					jQuery("#zp_field_412762000003736077").trigger("change");
				}
			}, 0, 31);
		}

		// Refresh button on Dashboard
		jQuery("#zp_d_refdash a").on("click", function(){
			addTimeSheetWidget();
		});

		// Log timesheet
		if(window.location.hash == "#timesheet/form/add-formLinkName:Log_Timesheet") {
			onSubPageReady(setDefaultFormData);
		}

		// On click date field -> Show calendar -> then trigger field change once calendar clicked(select date)
		jQuery(document).on("click focusin", "#zp_field_412762000003736077", function(){
			let self = $(this);

			setTimeout(function(){
				$("#singlecalendar #calbody").on("click", function(){
					self.trigger('change');
				});

				addTimesheetStatusToCalendar();

				// Prev/Next month
				$(".IC-ar-lft, .IC-ar-rgt").on("click", function(){
					let thisMonth = $(this).parent().find('#calmonth').text();
					let thisMonthArr = thisMonth.split(' ');
					let monthNumOfThisMonth = monthToNumber(thisMonthArr[0]);
					let yearOfThisMonth = thisMonthArr[1];
					let firstDayThisMonth = yearOfThisMonth + '-' + monthNumOfThisMonth + '-01';
					// Last x month
					let lastXMonths = monthDiff(month, year, monthNumOfThisMonth, yearOfThisMonth);
					// getWorkingHourData of month if month in past and have not data loaded yet
					if(lastXMonths >= 0 && !myWorkingHoursByDate[firstDayThisMonth]) {
						getWorkingHourData(function(){
							addTimesheetStatusToCalendar();
						}, lastXMonths, 31);
					} else {
						addTimesheetStatusToCalendar();
					}
				});
			}, 200);
		});

		// Calendar field
		jQuery(document).on("change keyup focusout", "#zp_field_412762000158026914", function(){

			let timeSheetHoursField = $("#zp_field_412762000158027981");

			if(!timeSheetHoursField.parent().find(".timesheet-hour").length)
			{
				timeSheetHoursField.after("<div class='zp-msg'><div class='timesheet-hour'></div><div class='timesheet-status'></div></div>");
			}

			let self = $(this);
			setTimeout(function(){
				let selectedDate = convertDate(self.val());
				let workingHoursData = myWorkingHoursByDate[selectedDate];
				if(workingHoursData) {
					let hourLeft = Math.round((workingHoursData.workingHours - workingHoursData.timesheetHours) * 10) / 10;
					if(hourLeft < 0) {
						timeSheetHoursField.val(0).attr("placeholder", 0);
					} else {
						timeSheetHoursField.val(hourLeft).attr("placeholder", hourLeft);
					}

					timeSheetHoursField.parent().find(".timesheet-hour").html("<span class='hour-left'>" + hourLeft + "</span>/<span class='hour-total'>" + workingHoursData.workingHours + "</span> hours left to log");
				} else {
					timeSheetHoursField.val(0);
					timeSheetHoursField.parent().find(".timesheet-hour").html('No data');
				}

				timeSheetHoursField.trigger("change");
			}, 200);
		});

		// TimeSheet Hours field
		jQuery(document).on("change keyup", "#zp_field_412762000003736073", function(){
			let hours = parseFloat($(this).val());
			let hourLeft = parseFloat($(this).parent().find(".hour-left").text());
			let hourTotal = parseFloat($(this).parent().find(".hour-total").text());
			let cssClass = "";
			let timeSheetStatus = "";

			$("#zp_forms_add_btn, #zp_forms_addnew_btn").removeClass("disabled");

			if(isNaN(hourTotal) || hourTotal == 0) {
				cssClass = "no-data";
				timeSheetStatus = "No data";
			}
			else if(hours == hourLeft) {
				cssClass = "perfect";
				timeSheetStatus = "Perfect";
			}
			else if (hours > hourLeft && hours <= (hourLeft + 0.5)) {
				cssClass = "genius";
				timeSheetStatus = "Genius";
			}
			else if (hours > (hourLeft + 0.5)) {
				cssClass = "over";
				timeSheetStatus = "Over";
				$("#zp_forms_add_btn, #zp_forms_addnew_btn").addClass("disabled");
			}
			// hours < hourLeft
			else {
				if(hourTotal <= 8) {
					if(hours >= (hourLeft - 0.5)) {
						cssClass = "good";
						timeSheetStatus = "Good";
					}
					else {
						cssClass = "not-enough";
						timeSheetStatus = "Not enough";
					}
				} else {
					// hours + logged hours must be >= 8
					if((hours + (hourTotal - hourLeft)) >= 8) {
						cssClass = "good";
						timeSheetStatus = "Good";
					} else {
						cssClass = "not-enough";
						timeSheetStatus = "Not enough";
					}
				}
			}

			let timeSheetHourMsg = $(this).next(".zp-msg");
			let oldCssClass = timeSheetHourMsg.data("status-class");
			timeSheetHourMsg.removeClass(oldCssClass).addClass(cssClass).data("status-class", cssClass);
			timeSheetHourMsg.find(".timesheet-status").html(timeSheetStatus);
		});

		// Submit form or submit and new
		jQuery(document).on("click", "#zp_forms_add_btn, #zp_forms_addnew_btn", function(){
			// Do nothing if form has invalid field
			if($("#zp_form_body .zp-err-msg").length) {
				return;
			}

			let self = $(this);

			let d = new Date();
			let month = parseInt(d.getMonth() + 1);
			let year = d.getFullYear();

			let loggedDate = $("#zp_field_412762000003736077").val();
			let loggedDateArr = loggedDate.split("-");
			let loggedDateMonth = monthToNumber(loggedDateArr[1]);
			let loggedDateYear = loggedDateArr[2];

			// Last x month
			let lastXMonths = monthDiff(month, year, loggedDateMonth, loggedDateYear);

			// Call to update data based on selected date after form submit(data will be changed)
			getWorkingHourData(function(){
				onSubPageReady(function(){
					// If submit and new => trigger calendar field change after ajax load(data updated)
					if(self.attr("id") == "zp_forms_addnew_btn") {
						// Trigger field date change when sub page ready, only in submit new record form
						$("#zp_field_412762000003736077").trigger("change");
					}
				});
			}, lastXMonths, 31);
		});

		// Submit form, then add new
		jQuery(document).on("click", "#zp_forms_addnew_btn", function(){
			// Do nothing if form has invalid field
			if($("#zp_form_body .zp-err-msg").length) {
				return;
			}

			// Form to turn back after submit -> need to set default values again
			setTimeout(function(){
				onSubPageReady(function(){
					setDefaultFormData();
					// Don't need to trigger change calendar field here, done after ajax load above
				});
			}, 200);
		});

		// Custom callback function
		chrome.storage.sync.get(['config'], function(result){
			let config = result.config;
			if(typeof(config) != 'object') {
				return;
			}

			let onLoadCode = config.onload ? config.onload : '';
			if(onLoadCode) {
				eval(onLoadCode);
			}
		});
	});
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if(message === "start") {
		sendResponse("start");
		chrome.storage.sync.get(null, function(result){
			//Doing smt here...
		});
	}
});
