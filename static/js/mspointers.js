// Original code from http://msdn.microsoft.com/en-us/library/ie/hh673557(v=vs.85).aspx
window.addEventListener('load', function () {
    var canvas = document.getElementById("drawSurface"),
        context = canvas.getContext("2d");
    if (window.navigator.msPointerEnabled) {
        canvas.addEventListener("MSPointerMove", paint, false);
    }
    else {
        canvas.addEventListener("mousemove", paint, false);
    }
    function paint(event) {
        // paint a small rectangle every time the event fires.
        context.fillRect(event.clientX, event.clientY, 5, 5);
    }
});