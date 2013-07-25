# Modern.ie

The Modern.ie scan analyzes the HTML, CSS, and JavaScript of a site or application to
determine whether it is using good development practices.
It warns about practices such as incomplete specification of CSS properties, invalid or incorrect
doctypes, and obsolete versions of popular JavaScript libraries.

It's easiest to use Modern.ie by going to the [Modern.ie site](http://Modern.ie) 
and entering the URL to scan there. To customize the scan, or to use the scan
to process files behind a firewall, you can clone and build the files from this repo
and run the scan locally.

## How it works

The Modern.ie local scan runs on a system behind your firewall; that system must have
access to the internal web site or application that is to be scanned.
Once the files have been analyzed, the analysis results are sent back to the Modern.ie
site to generate a complete formatted report that includes advice on remediating any issues.
The report generation code and formatted pages from the Modern.IE site are not included in this repo.

Since the local scan generates JSON output, you can alternatively use it as a standalone scanner
or incorporate it into a project's build process by processing the JSON with a local script.

The main service for the scan is in the `lib/service.js` file; it acts as an HTTP server.
It loads the contents of the web page and calls the individual tests, located in `/lib/checks/`.
Once all the checks have completed, it responds with a JSON object representing the results.

## Installation and configuration

* [Install node.js](https://github.com/joyent/node/wiki/Installation). You can use a [pre-compiled Windows executable](https://github.com/joyent/node/wiki/Installation#installing-on-windows) if desired. Version 0.10 or higher is required.
* [Install git](http://git-scm.com/downloads). You can choose [GitHub for Windows](http://windows.github.com/) instead if you prefer.
* Clone this repository.
* Install dependencies. From the Modern.ie subdirectory, type: `npm install`
* If desired, set an environment variable `PORT` to define the port the service will listen on. By default the port number is 1337. The Windows command to set the port to 8181 would be: `set PORT=8181`
* Start the scan service: From the Modern.ie subdirectory, type: `node lib/service.js` and the service should respond with a status message containing the port number it is using.
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
