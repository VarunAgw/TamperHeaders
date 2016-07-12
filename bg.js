chrome.webRequest.onBeforeRequest.addListener(
        function (event) {
            return process_headers("BeforeRequest", event);
        }, {urls: ["<all_urls>"]}, ["blocking", "requestBody"]);

chrome.webRequest.onBeforeSendHeaders.addListener(
        function (event) {
            return process_headers("BeforeSendHeaders", event);
        }, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);

chrome.webRequest.onAuthRequired.addListener(
        function (event) {
            return process_headers("AuthRequired", event);
        }, {urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);


chrome.webRequest.onSendHeaders.addListener(
        function (event) {
            return process_scripts("SendHeaders", event);
        }, {urls: ["<all_urls>"]}, ["requestHeaders"]);

chrome.webRequest.onResponseStarted.addListener(
        function (event) {
            return process_scripts("ResponseStarted", event);
        }, {urls: ["<all_urls>"]}, ["responseHeaders"]);

chrome.webRequest.onCompleted.addListener(
        function (event) {
            return process_scripts("Completed", event);
        }, {urls: ["<all_urls>"]}, ["responseHeaders"]);

chrome.webRequest.onErrorOccurred.addListener(
        function (event) {
            return process_scripts("ErrorOccurred", event);
        }, {urls: ["<all_urls>"]});

function process_headers(type, event) {
	/*
    delete event.frameId;
    delete event.parentFrameId;
    delete event.requestId;
    delete event.tabId;
    delete event.timeStamp;
    delete event.statusLine;
	*/
    event.invoker = event.type;
    event.type = type;

    if (event.requestHeaders) {
        event.requestHeaders = associative_headers(event.requestHeaders);
    }
    if (event.responseHeaders) {
        event.responseHeaders = associative_headers(event.responseHeaders);
    }

    var result = tamper(event);
    if (null === result || undefined === typeof result) {
        return;
    }

    if ("BeforeRequest" === event.type) {
        if (false === result) {
            return {cancel: true};
        }
        if ("string" === typeof result) {
            return {redirectUrl: result};
        }
    }

    if ("BeforeSendHeaders" === event.type) {
        for (var name in result) {
            var header = result[name];
            if (null === header) {
                delete event.requestHeaders[name];
            }
            event.requestHeaders[name] = header;
        }
        return {requestHeaders: indexed_headers(event.requestHeaders)};
    }

    if ("HeadersReceived" === event.type) {
        if ("string" === typeof result) {
            return {redirectUrl: result};
        }
        if ("object" === typeof result) {
            for (var name in result) {
                var header = result[name];
                if (null === header) {
                    delete event.responseHeaders[name];
                }
                event.responseHeaders[name] = header;
            }
            return {responseHeaders: indexed_headers(event.responseHeaders)};
        }
    }

    if ("AuthRequired" === event.type) {
        if ("object" === typeof result) {
            return {authCredentials: result};
        }
    }
}

var web_requests = {};

function process_scripts(type, event) {
	event.invoker = event.type;
	event.type = type;

	web_requests[event.requestId] = web_requests[event.requestId] || {};
	if ("SendHeaders" === type) {
		web_requests[event.requestId]['request'] = associative_headers(event.requestHeaders);
	}
	if ("ResponseStarted" === type) {
		web_requests[event.requestId]['response'] = associative_headers(event.responseHeaders);
	}
	var web_request = web_requests[event.requestId];

	if (
		"Completed" === type &&
		-1 !== ["main_frame", "sub_frame"].indexOf(event.invoker)
	) {
		var data = {ua: {}};
		data.ua.userAgent = (Array.isArray(web_request['request']['User-Agent']) ? web_request['request']['User-Agent'][0] : "");
		data.ua.appVersion = data.ua.userAgent.replace(/^Mozilla\//, "");

		var script_code = "(" + function (data) {
			navigator.__defineGetter__('userAgent', function(){
				return data.ua.userAgent;
			});
			navigator.__defineGetter__('appVersion', function(){
				return data.ua.appVersion;
			});
		} + ")(" + JSON.stringify(data) + ")";

		var code = '(' + function (script_code) {
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.innerText = decodeURI(script_code);
			document.documentElement.insertBefore(script, document.documentElement.firstChild);
		} + ')("' + encodeURI(script_code) + '")';
		chrome.tabs.executeScript(event.tabId, {
			code: code,
			frameId: event.frameId,
			runAt: "document_start",
		});
	}
	
	if ("Completed" === type || "ErrorOccurred" === type) {
		delete web_requests[event.requestId]; // Free memory
	}
}
