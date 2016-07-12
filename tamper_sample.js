var event_types = {
    BeforeRequest: "BeforeRequest", // Redirect or cancel
    BeforeSendHeaders: "BeforeSendHeaders", // Change request headers
    HeadersReceived: "HeadersReceived", // Redirect or change response headers
    AuthRequired: "AuthRequired" // Add auth details
};
var invokers = {
    main_frame: "main_frame", sub_frame: "sub_frame",
    stylesheet: "stylesheet", script: "script", image: "image",
    object: "object", xmlhttprequest: "xmlhttprequest", other: "other"
};
var UA = {
    IE10: "Mozilla/5.0 (MSIE 10.0; Windows NT 6.1; Trident/5.0)",
    IE6: "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0; WOW64; Trident/4.0; SLCC1)",
    WinFirefox: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20120101 Firefox/33.0",
    MacFirefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0",
    MacSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A",
    iPad: "Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25",
    iPhone6: "Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25", Android44: "Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.114 Mobile Safari/537.36",
    Windows_Phone_8: "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)"
};
function tamper(event) {
    if (event_types.BeforeRequest === event.type) {
        return tamper_BeforeRequest(event, event.url);
    }
    if (event_types.BeforeSendHeaders === event.type) {
        return tamper_BeforeSendHeaders(event, event.url);
    }
    if (event_types.HeadersReceived === event.type) {
        return tamper_HeadersReceived(event, event.url);
    }
    if (event_types.AuthRequired === event.type) {
        return tamper_AuthRequired(event, event.url);
    }
}

function tamper_BeforeRequest(event, url) {
    if (
            url.match_pattern("*://*.facebook.com/*") ||
            url.match_pattern("*://miapps.micromaxinfo.com/*")
            ) {
        return false;
    }

    if (regex = url.match_regex(/^(.*)%E2%80%8E$/i)) {
        return url.replace(regex, "$1");
    }

    if (regex = url.match_regex("^https://(?:metareddit|(?:(?:m|np|www)\\.reddit))\\.com/(.*?)(?:\\.compact)?$")) {
        return url.replace(regex, "https://www.reddit.com/$1");
    }
}

function tamper_BeforeSendHeaders(event, url) {
	var res = {};
    if (url.match_pattern("*://gfycat.com/*")) {
        res["User-Agent"] = UA.Windows_Phone_8;
    }
	return res;
}

function tamper_HeadersReceived(event, url) {
    if (url.match_regex("\\.(xml|rss)$")) {
        return {"Content-Type": "application/xml; charset=utf-8"};
    }
}

function tamper_AuthRequired(event, url) {
    var res = null;
    url.match_pattern("https://auth.google.com/*") && (res = auth("username", "password"));
    return res;
}