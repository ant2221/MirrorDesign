/* Magic Mirror Config Sample
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information how you can configurate this file
 * See https://github.com/MichMich/MagicMirror#configuration
 *
 */

var config = {
	address: "localhost", // Address to listen on, can be:
	                      // - "localhost", "127.0.0.1", "::1" to listen on loopback interface
	                      // - another specific IPv4/6 to listen on a specific interface
	                      // - "", "0.0.0.0", "::" to listen on any interface
	                      // Default, when address config is left out, is "localhost"
	port: 8080,
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], // Set [] to allow all IP addresses
	                                                       // or add a specific IPv4 of 192.168.1.5 :
	                                                       // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
	                                                       // or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
	                                                       // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	language: "en",
	timeFormat: 24,
	units: "metric",


	modules: [
		{
			module: "alert",
		},
		{
			module: "clock",
			position: "top_left",
			showDay: true
		},
		{
			module: "clock",
			position: "top_left",
			config: {
				timezone: 'Europe/London',
				displaySeconds: false,
				showPeriod: true,
				showDay: true,
				showDate: false,
				label: "London"
			}
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
	/*	{
			module: "weatherforecast",
			position: "top_right",
			header: "Weather Forecast",
			config: {
				location: "North Sydney",
				locationID: "2154855",  //ID from https://openweathermap.org/city
				appid: "9fd3c9daabcfdfe5da3f9383d0c49a74"
			}
		}, */
		{
			module: 'MMM-MyCommute',
			position: 'top_left',
			config: {
				apikey: 'AIzaSyCaX8BjoPJm4jKuX0SxwS_QhUV4HA-Q86s',
				origin: '211 Pacific Highway, North Sydney, 2000',
				startTime: '00:00',
				endTime: '23:59',
				destinations: [
					{
						destination: 'Town Hall, Sydney 2000',
						label: 'Town Hall',
						mode: 'transit',
						showNextVehicleDeparture: true,
						transitMode: 'train'
					},
					{
						destination: '1 Andersoon Street, Chatswood, 2067',
						label: 'Chatswood Chase',
						showNextVehicleDeparture: true,
						mode: 'transit',
						transitMode: 'bus'
					}
				]
			}
		},

		{
			module: "calendar",
			header: "NSW Holidays",
			position: "top_left",
			config: {
				calendars: [
					{
						symbol: "calendar-check",
						url: "https://www.officeholidays.com/ics/ics_region_iso.php?region_iso=NSW&tbl_country=Australia",
						maximumEntries: 4
					}
				]
			}
		}, 
		{
			module: 'MMM-NOAA3',
			position: 'top_right',
			config: {
			//	provider: "accuweather",   
			//	apiKey: "AHkKOx8N8yimQUp9vqe3WAAwEDZG0ERm",
			//	zip: "12407", 					//MUST have valid zip Code

				provider: "openweather",   
				apiKey: "9fd3c9daabcfdfe5da3f9383d0c49a74",
				
				airKey: "KhiiSD3n9s5e3yqzi", 
				css: "NOAA3",					//THIS MUST CONTAIN A CSS STYLE NAME 
				userlat: "-33.847",				//MUST HAVE BOTH
				userlon: "151.213"				//MUST HAVE BOTH
			}
		},
		{
			module: "compliments",
			position: "bottom_bar"
		},
/*		{
			module: "currentweather",
			position: "top_right",
			config: {
				location: "North Sydney",
				locationID: "2154855",  //ID from http://bulk.openweathermap.org/sample/; unzip the gz file and find your city
				appid: "9fd3c9daabcfdfe5da3f9383d0c49a74"
			}
		}, */   

		
	/*	{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "New York Times",
						url: "http://www.nytimes.com/services/xml/rss/nyt/HomePage.xml"
					}
				],
				showSourceTitle: true,
				showPublishDate: true
			}
		},	*/
	]

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
