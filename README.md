# THIS PROJECT IS DEPRECATED

This project is deprecated and no longer maintained. Please check [sonar](https://github.com/sonarwhal/sonar) if you need a similar tool but more flexible and modern.

# Static Scan

This tool analyzes the HTML, CSS, and JavaScript of a site or application for common coding issues.
It warns about practices such as incomplete specification of CSS properties, invalid or incorrect
doctypes, and obsolete versions of popular JavaScript libraries.

It's easiest to use modern.IE by going to the [modern.IE site](https://dev.windows.com/en-us/microsoft-edge/tools/staticscan/)
and entering the URL to scan there. To customize the scan, or to use the scan
to process files behind a firewall, you can clone and build the files from this repo
and run the scan locally.

## How it works

The modern.IE local scan runs on a system behind your firewall; that system must have
access to the internal web site or application that is to be scanned.
Once the files have been analyzed, the analysis results are sent back to the modern.IE
site to generate a complete formatted report that includes advice on remediating any issues.
The report generation code and formatted pages from the modern.IE site are not included in this repo.

Since the local scan generates JSON output, you can alternatively use it as a standalone scanner
or incorporate it into a project's build process by processing the JSON with a local script.

The main service for the scan is in the `app.js` file; it acts as an HTTP server.
It loads the contents of the web page and calls the individual tests, located in `/lib/checks/`.
Once all the checks have completed, it responds with a JSON object representing the results.

## Installation and configuration

* [Install node.js](https://github.com/joyent/node/wiki/Installation). You can use a [pre-compiled Windows executable](https://github.com/joyent/node/wiki/Installation#installing-on-windows) if desired. Version 0.10 or higher is required.
* If you want to modify the code and submit revisions, [Install git](http://git-scm.com/downloads). You can choose [GitHub for Windows](http://windows.github.com/) instead if you prefer. Then clone this repository. If you just want to run locally then downloading then you just need to download the latest version from [here](https://github.com/InternetExplorer/modern.IE-static-code-scan/archive/master.zip) and unzip it
* Install dependencies. From the Modern.ie subdirectory, type: `npm install`
* If desired, set an environment variable `PORT` to define the port the service will listen on. By default the port number is 1337. The Windows command to set the port to 8181 would be: `set PORT=8181`

### CLI
The scanner has a CLI interface that prints directly the results for a website. You just have to run the following command to use it:

```
static-code-scan
```

![demo](https://cloud.githubusercontent.com/assets/4303/10773742/6a4f47d6-7cba-11e5-9d25-7da62fb66edd.gif)

Note: Windows users may need to navigate to the Modern.ie subdirectory and type `npm link` to get the `static-code-scan` command to work.

### Via browser

* Start the scan service: From the Modern.ie subdirectory, type: `node app.js` and the service should respond with a status message containing the port number it is using.
* Run a browser and go to the service's URL; assuming you are using the default port and are on the same computer, the URL would be: `http://localhost:1337/`
* Follow the instructions on the page.

## Testing

The project contains a set of unit tests in the `/test/` directory. To run the unit tests, type `grunt nodeunit`.

## JSON output

Once the scan completes, it produces a set of scan results in JSON format:
```js
{
    "testName" : {
        "testName": "Short description of the test",
        "passed" : true/false,
        "data": { /* optional data describing the results found */ }
    }
}
```

The `data` property will vary depending on the test, but will generally provide further detail about any issues found.

## Code of Conduct
This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
