#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var sys = require('util');
var HTMLFILE_DEFAULT = "index.html";
var HTMLFILE_FROM_URL = "index_url.html";
var CHECKSFILE_DEFAULT = "checks.json";
var CHECKURL_DEFAULT = "http://aqueous-everglades-3380.herokuapp.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;

};


var assertUrlExists = function(myurl) {

rest.get(myurl).on('complete', function(result) {
  if (result instanceof Error) {
    sys.puts('Error: ' + result.message);
    this.retry(5000); // try again after 5 sec
  } else {

     var outfile = HTMLFILE_FROM_URL;
     var out = result;
     fs.writeFileSync(outfile, out);  
     return result;
  }
});

};


var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var doNothingFn = function(result) { 	
     console.log("this function does nothing"); 
}  

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {

     var outfile = HTMLFILE_FROM_URL;
     var out = '';
     fs.writeFileSync(outfile, out);

    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url [url]', 'URL of the heroku Website', clone(assertUrlExists))
        .parse(process.argv);
    
/*
    console.log('LOG url: ' + program.url);
    console.log('LOG checks: ' + program.checks);
    console.log('LOG file: ' + program.file);
*/

if(program.url) {

setTimeout(function() {     
    var checkJson = checkHtmlFile(HTMLFILE_FROM_URL, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}, 2000);

} else {
    var checkJson = checkHtmlFile(program.file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}






} else {
    exports.checkHtmlFile = checkHtmlFile;
}

// ./grader.js --checks checks.json --url http://aqueous-everglades-3380.herokuapp.com
// ./grader.js --checks checks.json --file index.html
