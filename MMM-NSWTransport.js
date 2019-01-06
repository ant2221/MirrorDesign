/* Live Bus Stop Info */

/* Magic Mirror
 * Module: UK Live Bus Stop Info
 *
 * By Nick Wootton
 * based on SwissTransport module by Benjamin Angst http://www.beny.ch
 * MIT Licensed.
 */

Module.register("MMM-NSWTransport", {

    // Define module defaults
    defaults: {
        updateInterval: 1 * 60 * 1000, // Update every 1 minutes.
        animationSpeed: 2000,
        fade: true,
        fadePoint: 0.25, // Start on 1/4th of the list.
        initialLoadDelay: 0, // start delay seconds.
        apiBase: 'https://api.transport.nsw.gov.au/v1/tp/trip',     //API Reference found at https://opendata.transport.nsw.gov.au/dataset/trip-planner-apis
        originID: '', //originID for start of journey. Find at https://transportnsw.info/stops  eg Town Hall Station = 10101101    &type_origin=any&name_origin=10101112 
        destinationID: '', //destinationID for end of journey. Find at https://transportnsw.info/stops eg Town Hall Station = 10101101    &type_destination=any&name_destination=10101101
        app_key: '', // TransportAPI App Key
        limit: '', //Maximum number of results to display                   &calcNumberOfTrips=5  
        excludeTrains: false,             //Exclude Trains    &exclMOT_1=0
        excludeLightRail: false,          //Exclude Bus
        excludeBus: false,                //Exclude Bus
        excludeCoach: false,              //Exclude Coach
        excludeFerry: false,              //Exclude Ferry
        excludeSchoolBus: false,          //Exclude School Bus
        nextBuses: 'no', //Use NextBuses API calls
        showRealTime: false, //expanded info when used with NextBuses
        showDelay: false, //expanded info when used with NextBuses
        showBearing: false, //show compass direction bearing on stop name
        maxDelay: -60, //if a bus is delayed more than 60 minutes exclude it
        debug: false,
        walkTime: 15    //time taken to get to transport stop
    },

    // Define required scripts.
    getStyles: function() {
        return ["bus.css", "font-awesome.css"];
    },

    // Define required scripts.
    getScripts: function() {
        return ["moment.js"];
    },

    //Define header for module.
    getHeader: function() {
        return this.config.header;
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);

        // Set locale.
        moment.locale(config.language);

        this.buses = {};
        this.loaded = false;
        this.scheduleUpdate(this.config.initialLoadDelay);

        this.updateTimer = null;

        this.url = encodeURI(this.config.apiBase + this.getParams());
        this.key = "apikey " + this.config.app_key;
        this.updateBusInfo(this);
    },

    // updateBusInfo IF module is visible (allows saving credits when using MMM-ModuleScheduler to hide the module)
    updateBusInfo: function(self) {
        if (this.hidden != true) {
            self.sendSocketNotification('GET_BUSINFO', { 'url': self.url, 'key': self.key});
        }
    },

    //Solve Time Issue of only showing 1 digit
    addZero: function(i) {
        if (i < 10) {
          i = "0" + i;
        }
        return i;
        },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        if (this.config.originID === "") {
            wrapper.innerHTML = "Please set the start point originID: " + this.originID + ".";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (this.config.destinationID === "") {
            wrapper.innerHTML = "Please set the end point destinationID: " + this.destinationID + ".";
            wrapper.className = "dimmed light small";
            return wrapper;
        } 

        if (this.config.app_key === "") {
            wrapper.innerHTML = "Please set the application key: " + this.app_key + ".";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (!this.loaded) {
            wrapper.innerHTML = "Loading bus Info ...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (this.buses.stopName !== null) {
            this.config.header = this.buses.stopName;
        }

        //Dump bus data
        if (this.config.debug) {
            Log.info(this.buses);
        }

        ////////////Build Table///////////////
        // *** Start Building Table
        var bustable = document.createElement("table");
        bustable.className = "small";

        //If we have departure info
        if (this.buses.data.length > 0) {

            for (var t in this.buses.data) {
                var bus = this.buses.data[t];

                var row = document.createElement("tr");
                bustable.appendChild(row);

                //Route name/Number
                var routeCell = document.createElement("td");
                routeCell.className = "routeTrain"
                if (bus.routeType == "Sydney Buses Network") {
                    routeCell.className = "routeBus";
                } else if (bus.routeType == "Sydney Trains Network") {
                   routeCell.className = "routeTrain";
                } else {
                    routeCell.className = "routeOther";
                }
                routeCell.innerHTML = " " + bus.routeName + " ";
                row.appendChild(routeCell);

                //extraInfo Info
                var extraInfoCell = document.createElement("td");
                extraInfoCell.className = "dest";
                extraInfoCell.innerHTML = bus.extraInfo;
                row.appendChild(extraInfoCell);

                //Time Tabled Departure
                var timeTabledCell = document.createElement("td");
                timeTabledCell.innerHTML = bus.expectedDeparture;
                //if(walkColour == "Green") {
                //    timeTabledCell.className = "Green";
                //} else if (walkColour == "Yellow") {
                //    timeTabledCell.className = "Yellow";
                //} else {
                    timeTabledCell.className = bus.walkColour;
                //}
                row.appendChild(timeTabledCell);

                if (this.config.showRealTime) {
                    //Real Time Feedback for Departure
                    var realTimeCell = document.createElement("td");
                    realTimeCell.innerHTML = "(" + bus.expectedDeparture + ")";
                    realTimeCell.className = "expTime";
                    row.appendChild(realTimeCell);
                }

                if (this.config.showDelay) {
                    //Delay Departure
                    var delayCell = document.createElement("td");

                    if (bus.delay > 1 || bus.delay < -1) {
                        label = " mins ";
                    } else {
                        label = " min ";
                    }

                    if (bus.delay < 0) {
                        delayCell.innerHTML = Math.abs(bus.delay) + label + "late";
                        delayCell.className = "late";
                    } else if (bus.delay > 0) {
                        delayCell.innerHTML = Math.abs(bus.delay) + label + "early";
                        delayCell.className = "early";
                    } else {
                        if (this.config.nextBuses.toLowerCase() === "yes") {
                            delayCell.innerHTML = " On Time ";
                            delayCell.className = "nonews";
                        } else {
                            delayCell.innerHTML = " Scheduled";
                            delayCell.className = "nonews";
                        }
                    }

                    row.appendChild(delayCell);
                }

                if (this.config.fade && this.config.fadePoint < 1) {
                    if (this.config.fadePoint < 0) {
                        this.config.fadePoint = 0;
                    }
                    var startingPoint = this.buses.length * this.config.fadePoint;
                    var steps = this.buses.length - startingPoint;
                    if (t >= startingPoint) {
                        var currentStep = t - startingPoint;
                        row.style.opacity = 1 - (1 / steps * currentStep);
                    }
                }

            }
        } else {
            var row1 = document.createElement("tr");
            bustable.appendChild(row1);

            var messageCell = document.createElement("td");
            messageCell.innerHTML = " " + this.buses.message + " ";
            messageCell.className = "bright";
            row1.appendChild(messageCell);

            var row2 = document.createElement("tr");
            bustable.appendChild(row2);

            var timeCell = document.createElement("td");
            timeCell.innerHTML = " " + this.buses.timestamp + " ";
            timeCell.className = "bright";
            row2.appendChild(timeCell);

        }

        wrapper.appendChild(bustable);
        // *** End building results table

        return wrapper;

    },

    /* processBuses(data)
     * Uses the received data to set the various values into a new array.
     */
    processBuses: function(data) {
        //Define object to hold bus data
        this.buses = {};
        //Define array of departure info
        this.buses.data = [];
        //Define timestamp of current data
        this.buses.timestamp = new Date();
        //Define message holder
        this.buses.message = null;

        //Check we have data back from API
        if (typeof data !== 'undefined' && data !== null) {

            //Figure out Bus Stop Name
            //Define empty stop name
            var stopName = "";

            if (typeof data.name !== 'undefined' && data.name !== null) {
                //Populate with stop name returned by TransportAPI info - Stop name & indicator combined
                stopName = data.name;

                //If requested, append the bearing as well - assuming it is there!
                if((this.config.showBearing) && (typeof data.bearing !== 'undefined' && data.bearing !== null)) {
                    stopName = stopName + " (" + data.bearing + ")";
                }

            } else if (typeof data.stop_name !== 'undefined' && data.stop_name !== null) {
                //Populate with stop name and bearing returned by TransportAPI info
                stopName = data.stop_name + " (" + data.bearing + ")";
            } else {
                //Default
                stopName = this.config.header;
            }
            //Set value
            this.buses.stopName = stopName;

            //Check we have route info
            if (typeof data.journeys !== 'undefined' && data.journeys !== null) {

                //... and some departures
                if (typeof data.journeys[0].legs !== 'undefined' && data.journeys[0].legs !== null) {

                    if (data.journeys.length > 0) {
                        //Figure out how long the results are
                        var counter = data.journeys.length;

                        //See if there are more results than requested and limit if necessary
                        if (counter > this.config.limit) {
                            counter = this.config.limit;
                        }

                        //Loop over the results up to the max - either counter of returned
                        for (var i = 0; i < counter; i++) {

                            var bus = data.journeys[i]
                            var delay = null;
                            var departureTimePlanned;
                            var thisDate;
                            var thisTimetableTime;
                            var thisLiveTime;
                            var rType;
                            var direction;
                            var walkColor;

                            if (this.config.nextBuses.toLowerCase() === "yes") {
                                //NextBuses Is On, so we need to use best & expected values - assuming they're present!
                                //Date
                                if(bus.expected_departure_date !== null){
                                    thisDate = bus.expected_departure_date;
                                } else {
                                    Log.error('NextBus info is missing - falling back to timetabled info');
                                    thisDate = bus.date;
                                }
                                //timetabled time
                                thisTimetableTime = bus.best_departure_estimate;
                                //live time
                                if (bus.expected_departure_time !== null) {
                                    thisLiveTime = bus.expected_departure_time;
                                } else {
                                    thisLiveTime = bus.best_departure_estimate;
                                }

                            } else {
                                //NextBuses Is Off, so we need to use aimed & expected values
                                //Date
                                //Planned Time
                                p = new Date(bus.legs[0].origin.departureTimePlanned);                                   //UTC Standard "2019-01-06T06:49:00Z"                    
                                thisDate = p.getFullYear() + "-" + this.addZero(p.getMonth() + 1) + "-" + this.addZero(p.getDay() + 1); //departureTimePlannedSplit[0]                                         //thisDate = "2019-01-06" PLANNED
                                thisTimetableTime = this.addZero(p.getHours()) + ":" + this.addZero(p.getMinutes());                   //thisTimetableTime = "01:45" PLANNED

                                //live (Estimated) time
                                e = new Date(bus.legs[0].origin.departureTimeEstimated);                            //UTC thisLiveTime = "01:49" ESTIMATE
                                thisLiveTime = this.addZero(e.getHours()) + ":" + this.addZero(e.getMinutes());     //thisLiveTime = "01:49" ESTIMATE
                                timeToWalk = Math.round(((e - (new Date(Date.now()))) / 60) / 1000);
                                if (timeToWalk < (this.config.walkTime - 1)) {
                                    walkColor = "Red"
                                } else if (timeToWalk < (this.config.walkTime + 3)) {
                                    walkColor = "Yellow"
                                } else {
                                    walkColor = "Green"
                                }
                            }

                            if (this.config.debug) {
                                Log.warn('===================================');
                                Log.warn(this.config.nextBuses.toLowerCase());
                                Log.warn(this.config.showDelay);
                                Log.warn(bus);
                                Log.warn(thisDate);
                                Log.warn(thisTimetableTime);
                                Log.warn(thisLiveTime);
                                Log.warn('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
                            }

                            //Only do these calc if showDelay is set in the config
                            if (this.config.showDelay) {
                                var arrRTDate = thisDate.split('-');
                                var arrRTTime = thisLiveTime.split(':');

                                var arrTTDate = thisDate.split('-');
                                var arrTTTime = thisTimetableTime.split(':');

                                var RTDate = new Date(arrRTDate[0], arrRTDate[1], arrRTDate[2], arrRTTime[0], arrRTTime[1]);
                                var TTDate = new Date(arrTTDate[0], arrTTDate[1], arrTTDate[2], arrTTTime[0], arrTTTime[1]);

                                delay = (((TTDate - RTDate) / 1000) / 60);
                            }
                            
                            rType = bus.legs[0].transportation.product.name;
                            if (rType == "Sydney Trains Network") {
                                direction = bus.legs[0].origin.name.slice(-10)
                            } else {
                                direction = "in " + timeToWalk + "min"
                            }

                            //Only push the info if the delay isn't excessive
                            if (delay > this.config.maxDelay) {
                                this.buses.data.push({
                                    routeName: bus.legs[0].transportation.disassembledName,
                                    routeType: rType,
                                    extraInfo: direction,
                                    timetableDeparture: thisTimetableTime,
                                    expectedDeparture: thisLiveTime,
                                    delay: delay,
                                    walkColour: walkColor
                                });
                            }
                        }
                    } else {
                        //No departures structure - set error message
                        this.buses.message = "No departure info returned";
                        if (this.config.debug) {
                            console.error("=======LEVEL 4=========");
                            console.error(this.buses);
                            console.error("^^^^^^^^^^^^^^^^^^^^^^^");
                        }
                    }
                } else {
                    //No departures returned - set error message
                    this.buses.message = "No departures scheduled";
                    if (this.config.debug) {
                        Log.error("=======LEVEL 3=========");
                        Log.error(this.buses);
                        Log.error("^^^^^^^^^^^^^^^^^^^^^^^");
                    }
                }
            } else {
                //No info returned - set error message
                this.buses.message = "No info about the stop returned";
                if (this.config.debug) {
                    Log.error("=======LEVEL 2=========");
                    Log.error(this.buses);
                    Log.error("^^^^^^^^^^^^^^^^^^^^^^^");
                }
            }
        } else {
            //No data returned - set error message
            this.buses.message = "No data returned";
            if (this.config.debug) {
                Log.error("=======LEVEL 1=========");
                Log.error(this.buses);
                Log.error("^^^^^^^^^^^^^^^^^^^^^^^");
            }
        }

        this.loaded = true;

        this.updateDom(this.config.animationSpeed);
    },

    /* getParams()
     * Generates an url with api parameters based on the config.
     * return String - URL params.
     */
    getParams: function() {
        var params = "?";
        params += "outputFormat=rapidJSON&TfNSWTR=true&version=10.2.1.42&coordOutputFormat=false&excludedMeans=checkbox";
        params += "&type_origin=any&name_origin=" + this.config.originID; 
        params += "&type_destination=any&name_destination=" + this.config.destinationID; 
        params += "&calcNumberOfTrips=" + this.config.limit;
        if (this.config.excludeTrains) {
            params += "&exclMOT_1=TURE";
        }
        if (this.config.excludeLightRail) {
            params += "&exclMOT_3=TURE";
        }
        if (this.config.excludeBus) {
            params += "&exclMOT_5=TURE";
        }
        if (this.config.excludeCoach) {
            params += "&exclMOT_7=TURE";
        }
        if (this.config.excludeFerry) {
            params += "&exclMOT_9=TURE";
        }
        if (this.config.excludeSchoolBus) {
            params += "&exclMOT_11=TURE";
        }

        if (this.config.debug) {
            Log.info("=======Params=========");
            Log.info(params);
        }

        return params;
    },

    /* scheduleUpdate()
     * Schedule next update.
     * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
     */
    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(function() {
            self.updateBusInfo(self);
        }, nextLoad);
    },


    // Process data returned
    socketNotificationReceived: function(notification, payload) {

        if (notification === 'BUS_DATA' && payload.url === this.url) {
            this.processBuses(payload.data);
            this.scheduleUpdate(this.config.updateInterval);
        }
    }

});
