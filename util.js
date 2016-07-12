function associative_headers(headers) {
    var associated_headers = {};
    for (var index in headers) {
        var header = headers[index];
        if ("undefined" === typeof associated_headers[header['name']]) {
            associated_headers[header['name']] = [];
        }
        associated_headers[header['name']].push(header['value']);
    }
    return associated_headers;
}

function indexed_headers(headers) {
    var indexed_headers = [];
    for (var header_name in headers) {
        var header = headers[header_name];
        if (null === header) {
            continue;
        }
        if (!Array.isArray(header)) {
            header = [header];
        }
        for (var index in header) {
            indexed_headers.push({name: header_name.toString(), value: header[index].toString()});
        }

    }
    return indexed_headers;
}

// https://stackoverflow.com/questions/26420269/call-googles-match-patterns-api
// https://stackoverflow.com/questions/12433271/can-i-allow-the-extension-user-to-choose-matching-domains
function patternToRegExp(pattern) {
    if (pattern == "<all_urls>")
        return /^(?:http|https|file|ftp):\/\/.*/;

    var split = /^(\*|http|https|file|ftp):\/\/(.*)$/.exec(pattern);
    if (!split) {
        throw Error("Invalid schema in " + pattern);
    }
    var schema = split[1];
    var fullpath = split[2];

    var split = /^([^\/]*)\/(.*)$/.exec(fullpath);
    if (!split) {
        throw Error("No path specified in " + pattern);
    }
    var host = split[1];
    var path = split[2];

    // File 
    if (schema == "file" && host != "")
        throw Error("Non-empty host for file schema in " + pattern);

    if (schema != "file" && host == "")
        throw Error("No host specified in " + pattern);

    if (!(/^(\*|\*\.[^*]+|[^*]*)$/.exec(host)))
        throw Error("Illegal wildcard in host in " + pattern);

    var reString = "^";
    reString += (schema == "*") ? "https*" : schema;
    reString += ":\\/\\/";
    // Not overly concerned with intricacies
    //   of domain name restrictions and IDN
    //   as we're not testing domain validity
    reString += host.replace(/\*\.?/, "[^\\/]*");
    reString += "(:\\d+)?";
    reString += "\\/";
    reString += path.replace("*", ".*");
    reString += "$";

    return RegExp(reString);
}

TM = {};

TM.parseURL = function (url) {
    // v1.1 (2016-Jul-8)
    if (undefined === url) {
        url = document.location;
    } else {
        var tmp = document.createElement("a");
        tmp.href = url;
        url = tmp;
    }

    var o = {};
    o.protocol = url.protocol; // http https
    o.hostname = url.hostname; // mail.google.com mail.varunagw.com
    o.port = url.port;         // 80 4521
    o.hostport = url.host;     // mail.google.com mail.varunagw.com:4521
    o.pathname = url.pathname; // /mail/a/b/ /mail/a/b/c
    o.search = url.search;     // ?s=a&ds=dsda&dds=vvv ?s&=a&ds=dsda&dds=vvv& ""
    o.hash = url.hash;         // #dsadas "" (cannot be # only)
    o.href = url.href;         // https://mail.google.com/mail/u/0/h/pis4p85m83kp/?s=a&ds=dsda&dds=vvv&#dsadas

    o.protocol = o.protocol.substr(0, o.protocol.indexOf(":"));

    o.host = url.hostname.split('.');
    o.hostrev = o.host.slice(0).reverse();
    o.hostlen = o.host.length;

    o.path = url.pathname.substr(1).split('/');
    o.pathrev = o.path.slice(0).reverse();
    o.pathlen = o.path.length;
    o.pathnow = o.pathrev[0];
    o.pathnow = o.pathrev[0];
    o.page = o.pathnow;

    o.filename = o.pathnow.split(".");
    o.extension = (1 == o.filename.length ? "" : o.filename.pop());
    o.filename = o.filename.join(".");

    o.argname = o.search.substr(1).replace(/^&+|&+$/, "");
    o.arglen = o.argname.split("&").length;
    o.arg = {};
    o.argE = {};

    o.argname.split("&").forEach(function (value) {
        if ("" === value) {
            return;
        }
        o.arg[value.split("=")[0]] = decodeURIComponent(value.split("=")[1]).split("+").join(" ");
        o.argE[value.split("=")[0]] = value.split("=")[1].split("+").join(" ");
    });
    o.toString = function () {
        return this.href;
    };
    return o;
};

String.prototype.match_pattern = function (pattern) {
    return patternToRegExp(pattern).test(this);
};
String.prototype.match_url = function (url) {
    return this.indexOf(url) === 0;
};
String.prototype.match_regex = function (regex) {
    if ("string" === typeof regex) {
        regex = new RegExp(regex);
    }
    return (regex.test(this) ? regex : false);
};
function auth(username, password, base64) {
    return (true === base64) ? btoa(username + ":" + password) : {"username": username, "password": password};
}