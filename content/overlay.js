var citethis = {
  $: function (el) { return document.getElementById ( el ); },
  citationStyles: {
  	/**
  	 * These are functions which return a citation template. The variables
  	 * are prefixed by dollar signs.
  	 * @param {Object} data
  	 */
  	apa: function(data) {
		// apa specifies using not disclosed when the year is unknown http://owl.english.purdue.edu/owl/resource/560/10/
        var year = !data.year || data.year == '' ? "n.d." : "$year";

		// date should be spelled out!
		if ( data.author ) {
			return '$author. ('+year+') $title. Retrieved $lastAccessed, from $url';
		}
		else {
			return '$title. ('+year+') Retrieved $lastAccessed, from $url';
		}
	},
	ama: function(data) {
		if (data.author) {
			return '$author. $title. $url. Updated $lastUpdated. Accessed $lastAccessed.';
		}
		else {
			return '$title. $url. Updated $lastUpdated. Accessed $lastAccessed.';
		}
	},
	mla: function (data) {
		if (data.author) {
			return '"$title." $site. $lastUpdated. $publisher, Web. $lastAccessed. <$url>'
		}
		else {
			return '$author. "$title". $site. $lastUpdated. $publisher, Web. $lastAccessed. <$url>';
		}
	}
  },

  prefs: null,
  currentURL: '',
  citationStyle: '??specify default here',
  citationStyleCustom: '',
  dateformat: "MMMM dd, yyyy",
  debug: function ( msg ){

  	return;

  	var n = new Date(),
		timestamp = [
			n.getFullYear(),
			n.getMonth(),
			n.getDate (),
			n.getHours(),
			n.getMinutes(),
			n.getSeconds()
			].join ("");

  	citethis.$('txtDebug').value = timestamp + ': ' + msg + '\n' + citethis.$('txtDebug').value;
  },

  clearCitationList: function() {
	citethis.$('citationList').value = '';
  },

  addCitationToList: function(newCitation) {
	newCitation = newCitation || citethis.getCitationText ();
	citethis.$('citationList').value += newCitation;
  },

  onLoad: function() {
  	try {
		// initialization code

		this.initialized = true;
		this.strings = document.getElementById("citethis-strings");
		document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", function(e){
			this.showContextMenu(e);
		}, false);

        citethis.debug ( '1' );
		citethis.showCitationWindow(false);
		citethis.setPageVariables(true);
		window.setInterval(this.checkPage, 1000);
		var e = citethis.$('txtCitationText'), select = function(e){
			citethis.$('txtCitationText').select();
		};

	    citethis.debug (2);
		citethis.$('txtCitationText').addEventListener("focus", select, false);
		citethis.$('txtCitationText').addEventListener("click", select, false);

		var fields = 'txtAuthor txtYearPublished txtTitle txtURL txtLastAccessed txtLastUpdated'.split(' ');
		for (var i = 0; i < fields.length; i++) {
			citethis.$(fields[i]).addEventListener('blur', citethis.generateCitation, false);
		}

		citethis.debug(3);

		// setup preferences

		this.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("citethis.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
        citethis.debug(4);
		citethis.updateCitationStyle();
		citethis.debug(5);
		citethis.updateCitation();
		citethis.debug(6);
		
		citethis.$('btnAddToCitationList').onclick = function () { citethis.addCitationToList(); };

	}
	catch (e) {
		citethis.debug ( 'Load issue: ' + e.message );
	}
  },

  /**
   * Causes the citation to be updated.
   * @param {Object} immediateUpdate
   */
  updateCitation: function ( immediateUpdate ) {
  	try {
		if (!citethis.citethisWindowIsVisible())
			return;

		immediateUpdate = immediateUpdate === true;
		var f = citethis.setPageVariables;
		if (immediateUpdate) {
			f();
		}
		else {
			window.setTimeout(f, 1000);
		}
	}
	catch(e) {
		citethis.debug(e.message);
	}
  },

  updateCitationStyle: function () {
  	try {
		citethis.dateformat = String( citethis.prefs.getCharPref("dateformat") );
        citethis.debug("Got Date Format");

		citethis.citationStyle = String( citethis.prefs.getCharPref("citationStyle") ).toLowerCase();
		citethis.debug("Got citation style");
	    citethis.citethis.citationStyleCustom = String( citethis.prefs.getCharPref("citationStyleCustom") ).toLowerCase();
		citethis.debug("Got Custom Style");
	    citethis.$('lblCitationStyle').value = citethis.citationStyle.toUpperCase();

	}
	catch (e) {
		citethis.debug(e.message);
	}
  },

  /**
   * Used to observe changes on preferences.
   * @param {Object} subject
   * @param {Object} topic
   * @param {Object} data
   */
  observe: function(subject, topic, data)
   {
     if (topic != "nsPref:changed")
     {
       return;
     }


	 // update citation
     citethis.updateCitationStyle ();
     // update the citation
     citethis.updateCitation ();
   },


  shutdown: function()
  {
    this.prefs.removeObserver("", this);
  },


  checkPage: function () {
  	try {
		if (citethis.getURL() != citethis.currentURL) {
			citethis.currentURL = citethis.getURL();
			citethis.updateCitation();
		}
	}
	catch ( e ) {
		alert ( 'Problem checking page: ' + e.message );
	}
  },

  /**
   * Will generate the citation and set
   * the citation box with the value of that
   * citation.
   */
  generateCitation: function () {
	citethis.$('txtCitationText').value = citethis.getCitation ();
  },

  getCitationText: function () {
	return citethis.$('txtCitationText').value;
  },

  setPageVariables: function ( setLastAccessed ) {
  	citethis.doc = window._content.document;
  	citethis._isFirstRun = true;
	//setLastAccessed = setLastAccessed === true;
	setLastAccessed = true;
	citethis.$('txtAuthor').value = citethis.getAuthor ();
	citethis.$('txtYearPublished').value = citethis.getYearPublished ();
	citethis.$('txtTitle').value = citethis.getTitle ();
	citethis.$('txtURL').value = citethis.getURL ();
	if ( setLastAccessed ) {
		citethis.$('txtLastAccessed').value = citethis.getLastAccessed ();
		citethis.$('txtLastUpdated').value = citethis.getLastUpdated ();
	}

	citethis.generateCitation ();

  },

  showContextMenu: function(event) {
    // show or hide the menuitem based on what the context menu is on
    // see http://kb.mozillazine.org/Adding_items_to_menus
    document.getElementById("context-citethis").hidden = gContextMenu.onImage;
  },
  onMenuItemCommand: function(e) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    // promptService.alert(window, this.strings.getString("helloMessageTitle"),
                                // this.strings.getString("helloMessage"));
	//promptService.alert ( window, 'Citation', citethis.getCitation () );
	citethis.openCitationDialog ();
  },

  alert: function (msg) {
	var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    promptService.alert(window, 'Message', msg);
  },


  getCitation: function ( template ) {
  	var selectedTemplate = citethis.citationStyles[citethis.citationStyle];
  	template = template || selectedTemplate || citethis.citationStyles.apa;

	// if there is a custom template specified, use it here.
	if ( citethis.citationStyleCustom && citethis.citationStyleCustom != '') {
		template = citethis.citationStyleCustom;
	}

	var p = {
		author: citethis.$('txtAuthor').value,
		year: citethis.$('txtYearPublished').value,
		title: citethis.$('txtTitle').value,
		url: citethis.$('txtURL').value,
		lastAccessed: citethis.$('txtLastAccessed').value,
		lastUpdated: citethis.$('txtLastUpdated').value
	};

	// retrieve template using passed data.
    if ( typeof template == 'function' ) template = template(p);
	for ( var key in p ){
		template = template.replace ( "$" + key, p[key] );
	}
	return template;
  },

  _isFirstRun: true,
  getMetaTag: function ( metaTagName ) {
  	metaTagName = metaTagName.toLowerCase();
	citethis.debug ( "metaTag: " + metaTagName );
	try {
		if ( citethis._isFirstRun ) {
			citethis._isFirstRun = false;

			var root =  citethis.doc.documentElement;
			citethis.debug ( "root: " + root );
			if (root) {
				citethis.debug("root tag : " + root.tagName);
				//citethis.debug("innerhtml: \n" + root.innerHTML);
			}
		}
		var head = citethis.doc.getElementsByTagName ("head");
		citethis.debug ( "head length: " + head.length );
		//if (head.length > 0) {
			//head = head[0];
			//var meta = head.getElementsByTagName("meta"); // retrieve all of the document's meta tags
			var meta = citethis.doc.getElementsByTagName("meta");
			citethis.debug("meta.length = " + meta.length);
			//citethis.debug ("innerhtml\n" + head.innerHTML);
			citethis.debug("parts.length = " + citethis.doc.getElementsByTagName("script").length);
			for (var i = 0; i < meta.length; i++) {
				if (meta[i].name && meta[i].name == metaTagName) {
					return meta[i];
				}
			}
		//}
	}
	catch ( e ) {
		alert ( e.message );
	}
	return null;
  },

  _reduceWhitespace: function ( str ) {
  	return str.replace (/\s{2,}/, ' ');
  },

  siteSpecific: {
    Wikipedia: {
		// @todo cache these funcs. change on page load
		is: function () {

			return /wikipedia\.org\//i.test(gURLBar.value);
		},
		getAuthor: function () {
			return '';
		},
		getTitle: function () {
			return document.title.replace(/ - Wikipedia.+/, '');
		}
	}
  },

  getSiteSpecific: function(funcName) {
    // run site specific functions
    for (var site in citethis.siteSpecific) {
        var funcs = citethis.siteSpecific [ site ]; // set of functions
        if ( funcs && funcs.is && funcs.is () ) { // if func is exists
			if (funcs[funcName]) { // if func exists
				return funcs[funcName]();
			}
        }
    }
	return null;
  },

  getAuthor: function () {
  	var author = "Last, First",
		metaByl = citethis.getMetaTag ( "byl" ),
		siteSpec =  citethis.getSiteSpecific('getAuthor');

    citethis.debug("author: " + siteSpec);
    if ( siteSpec || siteSpec == '' ) return siteSpec;

	try {
		citethis.debug ( "metaByl: " + metaByl );
		if ( metaByl ) {
			// check for a byline meta element
			author = metaByl.content;
		}
		else {
			// see if there are any elements marked byline
			var elByl = citethis.doc.getElementsByClassName ( "byline" );

			if ( elByl && elByl.length > 0 ) {
				// strip and stripTags functions from prototypejs
				author = elByl[0].
					textContent.
					replace(/^\s+/, '').replace(/\s+$/, '');

				author = citethis._reduceWhitespace ( author );
;
			}
			else {
				var parts = citethis.doc.body ? citethis.doc.body.textContent.match ( /by (([A-Z\.'-] ?){2,3})/ ) : null;
				citethis.debug ( "parts: " + parts );
				if ( parts && parts[0] ) {
					author = citethis._reduceWhitespace ( parts[0] );
				}
				else {
					// other fail-safes
				}
			}
		}
	}
	catch(e){
		alert ( e.message );
	}
	return String(author).replace(/^by */i, '');
  },

  getYearPublished: function () {
	return new Date().getFullYear();
  },

  getURL: function () {
	return gURLBar.value;
  },

  getLastUpdated: function () {
  	return citethis.getLastAccessed();
  },

  getLastAccessed: function () {

	var m_names = ["January", "February", "March",
		"April", "May", "June", "July", "August", "September",
		"October", "November", "December"];

	var d = new Date();
	return citethis.Date.format(d, citethis.dateformat);
  },

  getTitle: function () {
  	var siteSpec =  citethis.getSiteSpecific('getTitle');
    if ( siteSpec ) return siteSpec;
	if ( document.title == "Mozilla Firefox" )
	   return "Website Title";
	// some people have reported the browser is attached to title.
	// i see no such thing! putting this here just in case.
	return document.title.replace(/ - Mozilla Firefox$/i, '');
  },

  onToolbarButtonCommand: function(e) {
    // just reuse the function above.  you can change this, obviously!
    citethis.onMenuItemCommand(e);
  },

  showCitationWindow: function ( val ) {
	citethis.$('citethisRoot').parentNode.style.display = val ? '' : 'none';
	if ( val ) {
		citethis.updateCitation();
	}
  },

  citethisWindowIsVisible: function () {
	return citethis.$('citethisRoot').parentNode.style.display == '';
  },

  toggleCitationWindow: function () {
	citethis.showCitationWindow ( ! citethis.citethisWindowIsVisible () );
  },

  openCitationDialog : function () {
	try {
		citethis.toggleCitationWindow ();
	}
	catch ( e ) {
		citethis.alert ( e.message );
	}

  }

};



// the following functions taken from datejs library, with MIT license.
citethis.Date = {}; 
citethis.Date.CultureInfo = {
    name: "en-US",
    englishName: "English (United States)",
    nativeName: "English (United States)",
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"],
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    amDesignator: "AM",
    pmDesignator: "PM",
    firstDayOfWeek: 0,
    twoDigitYearMax: 2029,
    dateElementOrder: "mdy",
    formatPatterns: {
        shortDate: "M/d/yyyy",
        longDate: "dddd, MMMM dd, yyyy",
        shortTime: "h:mm tt",
        longTime: "h:mm:ss tt",
        fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt",
        sortableDateTime: "yyyy-MM-ddTHH:mm:ss",
        universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ",
        rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT",
        monthDay: "MMMM dd",
        yearMonth: "MMMM, yyyy"
    },
    regexPatterns: {
        jan: /^jan(uary)?/i,
        feb: /^feb(ruary)?/i,
        mar: /^mar(ch)?/i,
        apr: /^apr(il)?/i,
        may: /^may/i,
        jun: /^jun(e)?/i,
        jul: /^jul(y)?/i,
        aug: /^aug(ust)?/i,
        sep: /^sep(t(ember)?)?/i,
        oct: /^oct(ober)?/i,
        nov: /^nov(ember)?/i,
        dec: /^dec(ember)?/i,
        sun: /^su(n(day)?)?/i,
        mon: /^mo(n(day)?)?/i,
        tue: /^tu(e(s(day)?)?)?/i,
        wed: /^we(d(nesday)?)?/i,
        thu: /^th(u(r(s(day)?)?)?)?/i,
        fri: /^fr(i(day)?)?/i,
        sat: /^sa(t(urday)?)?/i,
        future: /^next/i,
        past: /^last|past|prev(ious)?/i,
        add: /^(\+|after|from)/i,
        subtract: /^(\-|before|ago)/i,
        yesterday: /^yesterday/i,
        today: /^t(oday)?/i,
        tomorrow: /^tomorrow/i,
        now: /^n(ow)?/i,
        millisecond: /^ms|milli(second)?s?/i,
        second: /^sec(ond)?s?/i,
        minute: /^min(ute)?s?/i,
        hour: /^h(ou)?rs?/i,
        week: /^w(ee)?k/i,
        month: /^m(o(nth)?s?)?/i,
        day: /^d(ays?)?/i,
        year: /^y((ea)?rs?)?/i,
        shortMeridian: /^(a|p)/i,
        longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i,
        timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt)/i,
        ordinalSuffix: /^\s*(st|nd|rd|th)/i,
        timeContext: /^\s*(\:|a|p)/i
    },
    abbreviatedTimeZoneStandard: {
        GMT: "-000",
        EST: "-0400",
        CST: "-0500",
        MST: "-0600",
        PST: "-0700"
    },
    abbreviatedTimeZoneDST: {
        GMT: "-000",
        EDT: "-0500",
        CDT: "-0600",
        MDT: "-0700",
        PDT: "-0800"
    }
};
citethis.Date.getMonthNumberFromName = function (name) {
    var n = citethis.Date.CultureInfo.monthNames,
        m = citethis.Date.CultureInfo.abbreviatedMonthNames,
        s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
            return i;
        }
    }
    return -1;
};
citethis.Date.getDayNumberFromName = function (name) {
    var n = citethis.Date.CultureInfo.dayNames,
        m = citethis.Date.CultureInfo.abbreviatedDayNames,
        o = citethis.Date.CultureInfo.shortestDayNames,
        s = name.toLowerCase();
    for (var i = 0; i < n.length; i++) {
        if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) {
            return i;
        }
    }
    return -1;
};
citethis.Date.isLeapYear = function (year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
};
citethis.Date.getDaysInMonth = function (year, month) {
    return [31, (citethis.Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};
citethis.Date.getTimezoneOffset = function (s, dst) {
    return (dst || false) ? citethis.Date.CultureInfo.abbreviatedTimeZoneDST[s.toUpperCase()] : 		
		citethis.Date.CultureInfo.abbreviatedTimeZoneStandard[s.toUpperCase()];
};
citethis.Date.getTimezoneAbbreviation = function (offset, dst) {
    var n = (dst || false) ? citethis.Date.CultureInfo.abbreviatedTimeZoneDST : citethis.Date.CultureInfo.abbreviatedTimeZoneStandard,
    p;
    for (p in n) {
        if (n[p] === offset) {
            return p;
        }
    }
    return null;
};
citethis.Date.getDayName = function (dt, abbrev) {
    return abbrev ? citethis.Date.CultureInfo.abbreviatedDayNames[dt.getDay()] : citethis.Date.CultureInfo.dayNames[dt.getDay()];
};
citethis.Date.getMonthName = function (dt, abbrev) {
    return abbrev ? citethis.Date.CultureInfo.abbreviatedMonthNames[dt.getMonth()] : citethis.Date.CultureInfo.monthNames[dt.getMonth()];
};
citethis.Date.format = function (dt, format) {
	var self = dt;
    var p = function p(s) {
        return (s.toString().length == 1) ? "0" + s : s;
    };
    return format ? format.replace(/dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?/g, function (format) {
        switch (format) {
        case "hh":
            return p(self.getHours() < 13 ? self.getHours() : (self.getHours() - 12));
        case "h":
            return self.getHours() < 13 ? self.getHours() : (self.getHours() - 12);
        case "HH":
            return p(self.getHours());
        case "H":
            return self.getHours();
        case "mm":
            return p(self.getMinutes());
        case "m":
            return self.getMinutes();
        case "ss":
            return p(self.getSeconds());
        case "s":
            return self.getSeconds();
        case "yyyy":
            return self.getFullYear();
        case "yy":
            return self.getFullYear().toString().substring(2, 4);
        case "dddd":
            return citethis.Date.getDayName(dt);
        case "ddd":
            return citethis.Date.getDayName(dt, true);
        case "dd":
            return p(self.getDate());
        case "d":
            return self.getDate().toString();
        case "MMMM":
            return citethis.Date.getMonthName(dt);
        case "MMM":
            return citethis.Date.getMonthName(dt, true);
        case "MM":
            return p((self.getMonth() + 1));
        case "M":
            return self.getMonth() + 1;
        case "t":
            return self.getHours() < 12 ? 'A' : 'P';
        case "tt":
            return self.getHours() < 12 ? 'AM' : 'PM';
        case "zzz":
        case "zz":
        case "z":
            return "";
        }
    }) : this._toString();
};

window.addEventListener("load", function(e) { citethis.onLoad(e); }, false);
window.addEventListener("unload", function(e) { citethis.shutdown(e); }, false);

