var sec=sec || {};
sec.geo=sec.geo || {};
sec.geo.shape=sec.geo.shape || {};
sec.geo.shape.Route=function()
{


    //﻿Clazz.declarePackage ("sec.geo.shape");
    //Clazz.load (null, "sec.geo.shape.Route", ["java.util.ArrayList", "sec.geo.GeoBlock2", "$.ShapeObject", "sec.sun.awt.geom.Area"], function () {
    //c$ = Clazz.decorateAsClass (function () {
    this.minAltitudeMeters = 0;
    this.maxAltitudeMeters = 0;
    this.maxDistanceMeters = 0;
    this.flatnessDistanceMeters = 0;
    this.altitudeMode = null;
    this.limit = 0;
    this.leftWidthMeters = 0;
    this.rightWidthMeters = 0;
    this.shape = null;
    this.points = null;
    //Clazz.instantialize (this, arguments);
    //}, sec.geo.shape, "Route");
    //Clazz.makeConstructor (c$, 
    //function () {
    this.maxDistanceMeters = 100000;
    this.flatnessDistanceMeters = 1;
    this.limit = 4;
    this.points =  new java.util.ArrayList ();
    //});
    //Clazz.defineMethod (c$, "addPoint", 
    this.addPoint=function (point) {
        this.points.add (point);
        this.shapeChanged ();
    };//, "sec.geo.GeoPoint");
    //Clazz.defineMethod (c$, "addPoints", 
    this.addPoints=function (points) {
        this.points.addAll (points);
        this.shapeChanged ();
    };//, "java.util.ArrayList");
    //Clazz.defineMethod (c$, "setLeftWidth", 
    this.setLeftWidth=function (widthMeters) {
        this.leftWidthMeters = widthMeters;
        this.shapeChanged ();
    };//, "~N");
    //Clazz.defineMethod (c$, "setRightWidth", 
    this.setRightWidth=function (widthMeters) {
        this.rightWidthMeters = widthMeters;
        this.shapeChanged ();
    };//, "~N");
    //Clazz.defineMethod (c$, "createShape", 
    this.createShape=function () {
        var route =  new sec.sun.awt.geom.Area ();
        var previousPoint = null;
        for (var i = 0; i < this.points.size (); i++) {
            var point = this.points.get (i);
            if (previousPoint !== null) {
                if (previousPoint.equals (point)) continue ;
                var block =  new sec.geo.GeoBlock2 (previousPoint, point, this.leftWidthMeters, this.rightWidthMeters, this.maxDistanceMeters, this.flatnessDistanceMeters, this.limit);
                var area =  new sec.sun.awt.geom.Area ( new sec.geo.ShapeObject (block));
                route.add (area);
            }
            previousPoint = point;
        }
        return route;
    };//);
    //Clazz.defineMethod (c$, "shapeChanged", 
    this.shapeChanged=function () {
        this.shape = null;
    };//);
    //Clazz.defineMethod (c$, "getShape", 
    this.getShape=function () {
        if (this.shape === null) {
            this.shape = this.createShape ();
        }
        return this.shape;
    };//);
    //Clazz.defineMethod (c$, "getMinAltitude", 
    this.getMinAltitude=function () {
        return this.minAltitudeMeters;
    };//);
    //Clazz.defineMethod (c$, "setMinAltitude", 
    this.setMinAltitude=function (minAltitudeMeters) {
        this.minAltitudeMeters = minAltitudeMeters;
        this.shapeChanged ();
    };//, "~N");
    //Clazz.defineMethod (c$, "getMaxAltitude", 
    this.getMaxAltitude=function () {
        return this.maxAltitudeMeters;
    };//);
    //Clazz.defineMethod (c$, "setMaxAltitude", 
    this.setMaxAltitude=function (maxAltitudeMeters) {
        this.maxAltitudeMeters = maxAltitudeMeters;
        this.shapeChanged ();
    };//, "~N");
    //Clazz.defineMethod (c$, "setMaxDistance", 
    this.setMaxDistance=function (maxDistanceMeters) {
        this.maxDistanceMeters = maxDistanceMeters;
        this.shapeChanged ();
    };//, "~N");
    //Clazz.defineMethod (c$, "setFlatness", 
    this.setFlatness=function (flatnessDistanceMeters) {
        this.flatnessDistanceMeters = flatnessDistanceMeters;
        this.shapeChanged ();
    };//, "~N");
    //Clazz.defineMethod (c$, "setLimit", 
    this.setLimit=function (limit) {
        this.limit = limit;
        this.shapeChanged ();
    };//, "~N");
    //Clazz.defineMethod (c$, "getAltitudeMode", 
    this.getAltitudeMode=function () {
        return this.altitudeMode;
    };//);
    //Clazz.defineMethod (c$, "setAltitudeMode", 
    this.setAltitudeMode=function (altitudeMode) {
        this.altitudeMode = altitudeMode;
    };//, "sec.geo.kml.KmlOptions.AltitudeMode");
//});

};