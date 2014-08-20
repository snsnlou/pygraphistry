"use strict";

var $            = require("jquery"),
    renderConfig = require("render-config"),
    renderer     = require("./renderer.js"),
    Cameras      = require("../../../../superconductorjs/src/Camera.js"),
    interaction  = require("./interaction.js"),
    ui           = require("./ui.js"),
    debug        = require("debug")("StreamGL:main");

/*
Enable debuging output in the console by running:
    localStorage.debug = "StreamGL:*";
in the console. Disable debug output by running:
    localStorage.removeItem('debug');
*/

console.warn("%cWarning: having the console open can slow down execution significantly!",
    "font-size: 18pt; font-weight: bold; font-family: \"Helvetica Neue\", Helvetica, sans-serif; background-color: rgb(255, 242, 0);");


var QUERY_PARAMS = Object.freeze(ui.getQueryParams());
var DEBUG_MODE = (QUERY_PARAMS.hasOwnProperty("debug") && QUERY_PARAMS.debug !== "false" &&
        QUERY_PARAMS.debug !== "0");


function init (canvas, meter) {
    // If no meter passed in, create a stub object with methods mapped to noops
    meter = (typeof meter === "object") ? meter : {tick: function(){}, pause: function(){}};

    var socket = io.connect("http://localhost", {reconnection: false, transports: ["websocket"]});
    socket.io.engine.binaryType = "arraybuffer";

    var gl = renderer.createContext(canvas);
    renderer.setGlOptions(gl, renderConfig.options);
    var programs = renderer.createPrograms(gl, renderConfig.programs);
    var buffers = renderer.createBuffers(gl, renderConfig.models);

    var camera = new Cameras.Camera2d(renderConfig.camera.init[0]);
    renderer.setCamera(renderConfig, gl, programs, camera);

    interaction.setupDrag($(".sim-container"), camera)
        .merge(interaction.setupScroll($(".sim-container"), camera))
        .subscribe(function(newCamera) {
            renderer.setCamera(renderConfig, gl, programs, newCamera);
            renderer.render(renderConfig, gl, programs, buffers);
        });


    var lastHandshake = Date.now();

    socket.on("vbo_update", function (data, handshake) {
        debug("VBO update");

        renderer.loadBuffers(gl, buffers, data.buffers);
        renderer.setNumElements(data.elements);
        renderer.render(renderConfig, gl, programs, buffers);

        handshake(Date.now() - lastHandshake);
        lastHandshake = Date.now();
    });


    socket.on("error", function(reason) {
        meter.pause();
        ui.error("Connection error (reason:", reason, ")");
    });
    socket.on("disconnect", function(reason){
        meter.pause();
        ui.error("Disconnected (reason:", reason, ")");
    });
}


window.addEventListener("load", function(){
    var meter = DEBUG_MODE ? new FPSMeter($("body")[0]) : undefined;

    init($("#simulation")[0], meter);
});
