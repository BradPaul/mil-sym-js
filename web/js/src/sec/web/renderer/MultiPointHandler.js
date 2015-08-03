var sec = sec || {};
/** namespace */
sec.web = sec.web || {};
sec.web.renderer = sec.web.renderer || {};
/** @class */
sec.web.renderer.MultiPointHandler = (function () {
    //private vars
    var ErrorLogger = armyc2.c2sd.renderer.utilities.ErrorLogger;
    var SymbolUtilities = armyc2.c2sd.renderer.utilities.SymbolUtilities;
    var ModifiersTG = armyc2.c2sd.renderer.utilities.ModifiersTG;
    var MilStdAttributes = armyc2.c2sd.renderer.utilities.MilStdAttributes;
    var SymbolDefTable = armyc2.c2sd.renderer.utilities.SymbolDefTable;
    var RendererSettings = armyc2.c2sd.renderer.utilities.RendererSettings;
    var RendererUtilities = armyc2.c2sd.renderer.utilities.RendererUtilities;
    var _appletChecked = false;
    var _appletUrl = null;
    var _buffer = null;

    var textInfoBuffer = null,
            textInfoContext = null,
            textInfoContextFont = null,
            tempMPBuffer = null,
            tempMPContext = null;

    var baseURL = "http:" + "//" + location.hostname + ":8080/", //base http url for milstd icon symbology
            baseSURL = location.protocol + "//" + location.host + "/"; //base https url for milstd icon symbology

    //decimal lat/lon accuracy by decimal place
    //7DP ~= 11.132mm (en.wikipedia.org/wiki/Decimal_degrees)
    var _decimalAccuracy = 7;

    var _maxWidthInPixels = 1000;
    var _minWidthInPixels = 100;

    //constructor code

    //private functions
    /**\
     * 
     * @param {String} symbolID
     * @param {Number} dc draw category
     * @param {Array} AM contains distance values
     * @param {Array} AN contains azimuth values
     * @returns {Object} {hasRequireModifiers:Boolean,message:""} 
     * message will be set to "" if any required values are present.  
     * Otherwise, it will be populated with a message explaining what values 
     * may be missing.
     */
    function hasRequiredModifiers(symbolID, dc, AM, AN)
    {
        var message = "";

        if ((dc >= 16 && dc <= 20))
        {
            if (dc === SymbolDefTable.DRAW_CATEGORY_CIRCULAR_PARAMETERED_AUTOSHAPE)//16
            {
                if (AM !== null && AM.length > 0)
                    return {hasRequiredModifiers: true, message: true};
                else
                {
                    message += symbolID + " requires a modifiers object that has 1 distance/AM value.";
                    return {hasRequiredModifiers: false, message: message};
                }
            }
            else if (dc === SymbolDefTable.DRAW_CATEGORY_RECTANGULAR_PARAMETERED_AUTOSHAPE)//17
            {
                if (AM !== null && AM.length >= 2 &&
                        AN !== null && AN.length >= 1)
                    return {hasRequiredModifiers: true, message: true};
                else
                {
                    message += symbolID + " requires a modifiers object that has 2 distance/AM values and 1 azimuth/AN value.";
                    return {hasRequiredModifiers: false, message: message};
                }
            }
            else if (dc === SymbolDefTable.DRAW_CATEGORY_SECTOR_PARAMETERED_AUTOSHAPE)//18
            {
                if (AM !== null && AM.length >= 2 &&
                        AN !== null && AN.length >= 2)
                    return {hasRequiredModifiers: true, message: true};
                else
                {
                    message += symbolID + " requires a modifiers object that has 2 distance/AM values and 2 azimuth/AN values per sector.  The first sector can have just one AM value although it is recommended to always use 2 values for each sector.";
                    return {hasRequiredModifiers: false, message: message};
                }
            }
            else if (dc === SymbolDefTable.DRAW_CATEGORY_CIRCULAR_RANGEFAN_AUTOSHAPE)//19
            {
                if (AM !== null && AM.length > 0)
                    return {hasRequiredModifiers: true, message: true};
                else
                {
                    message += symbolID + " requires a modifiers object that has at least 1 distance/AM value";
                    return {hasRequiredModifiers: false, message: message};
                }
            }
            else if (dc === SymbolDefTable.DRAW_CATEGORY_TWO_POINT_RECT_PARAMETERED_AUTOSHAPE)//20
            {
                if (AM !== null && AM.length > 0)
                    return {hasRequiredModifiers: true, message: true};
                else
                {
                    message += symbolID + " requires a modifiers object that has 1 distance/AM value.";
                    return {hasRequiredModifiers: false, message: message};
                }
            }
            else
            {
                //should never get here
                return {hasRequiredModifiers: true, message: true};
            }
        }
        /*else if(dc === SymbolDefTable.DRAW_CATEGORY_LINE  && (symbolID.substring(4,6) === ("AL")))
         {
         if(AM !== null && AM.length > 0)
         return {hasRequiredModifiers:true,message:true};
         else
         {
         message += symbolID + " should have, but does not require, a modifiers object that has 1 distance/AM value in meters.";
         return {hasRequiredModifiers:true,message:message};
         }
         }//*/
        else
        {
            //no required parameters
            return {hasRequiredModifiers: true, message: true};
        }
    }
    ;

    return{
        //public vars
        MODIFIER_HEADER: "modifiers",
        QUANTITY: "quantity", //C
        REINFORCE_OR_REDUCED: "reinforcedOrReduced",
        STAFF_COMMENTS: "staffComments",
        ADDITIONAL_INFO_1: "additionalInfo1", //H
        ADDITIONAL_INFO_2: "additionalInfo2", //H1
        ADDITIONAL_INFO_3: "additionalInfo3", //H2
        EVALUATION_RATION: "evaluationRating",
        COMBAT_EFFECTIVENESS: "combatEffectiveness",
        SIGNATURE_EQUIPMENT: "signatureEquipment",
        HIGHER_FORMATION: "higherFormation",
        HOSTILE: "hostile", //N
        IFFSIFF: "iffSif",
        DIRECTION_OF_MOVEMENT: "directionOfMovement", //Q
        UNIQUE_DESIGNATION_1: "uniqueDesignation1", //T
        UNIQUE_DESIGNATION_2: "uniqueDesignation2", //T1
        EQUIPMENT_TYPE: "equipmentType", //V
        DATE_TIME_GROUP_1: "dateTimeGroup1", //W
        DATE_TIME_GROUP_2: "dateTimeGroup2", //W1
        DATE_TIME_GROUP_3: "dateTimeGroup3", //W2
        ALTITUDE_DEPTH: "altitudeDepth", //X
        LOCATION: "location", //Y
        SPEED: "speed",
        SPECIAL_C2_HQ: "specialC2Headquarters",
        DISTANCE: "distance", //AM
        AZIMUTH: "azimuth", //AN
        FILL_COLOR: "fillColor",
        LINE_COLOR: "lineColor",
        TEXT_COLOR: "textColor",
        TEXT_BACKGROUND_COLOR: "textBackgroundColor",
        LINE_THICKNESS: "lineThickness",
        SYMBOL_FILL_ICON_SIZE: "symbolFillIconSize",
        SYMBOL_FILL_IDS: "symbolFillIds",
        SYMBOL_LINE_IDS: "symbolLineIds",
        /**
         * 2525Bch2 and USAS 13/14 symbology
         */
        Symbology_2525Bch2_USAS_13_14: 0,
        /**
         * 2525C, which includes 2525Bch2 & USAS 13/14
         */
        Symbology_2525C: 1,
        //public functions
        /**
         * GE has the unusual distinction of being an application with coordinates outside its own extents.
         * It appears to only be a problem when lines cross the IDL
         * @param {Number} leftLongitude
         * @param {Number} rightLongitude
         * @param {Array} pts2d the client points (armyc2.c2sd.graphics2d.Point2D)
         */
        NormalizeGECoordsToGEExtents: function (leftLongitude,
                rightLongitude, pts2d)
        {
            try
            {
                var j = 0;
                var x = 0, y = 0;
                var pt2d = null;
                for (j = 0; j < pts2d.length; j++)
                {
                    pt2d = pts2d[j];
                    x = pt2d.getX();
                    y = pt2d.getY();
                    while (x < leftLongitude)
                        x += 360;
                    while (x > rightLongitude)
                        x -= 360;

                    pt2d = new armyc2.c2sd.graphics2d.Point2D(x, y);
                    pts2d[j] = pt2d;
                }
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "NormalizeGECoordsToGEExtents", err);
            }
        },
        /**
         * GE recognizes coordinates in the range of -180 to +180
         * @param {armyc2.c2sd.graphics2d.Point2D} pt2d
         */
        NormalizeCoordToGECoord: function (pt2d)
        {
            var ptGeo = null;
            try
            {
                var x = pt2d.getX(), y = pt2d.getY();
                while (x < - 180)
                    x += 360;
                while (x > 180)
                    x -= 360;

                ptGeo = new armyc2.c2sd.graphics2d.Point2D(x, y);
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "NormalizeCoordToGECoord", err);
            }
            return ptGeo;
        },
        /**
         * We have to ensure the bounding rectangle at least includes the symbol or
         * there are problems rendering, especially when the symbol crosses the IDL
         * @param {String} controlPoints the client symbol anchor points
         * @param {String} bbox the original bounding box
         * @returns {String} the modified bounding box
         */
        getBoundingRectangle: function (controlPoints, bbox)
        {
            var bbox2 = "";
            try
            {

                var left = 0,
                        right = 0,
                        top = 0,
                        bottom = 0;

                var coordinates = controlPoints.split(" ");
                //ArrayList<Point2D.Double> geoCoords = new ArrayList();
                var len = coordinates.length;
                var i = 0;
                left = Number.MAX_VALUE;
                right = Number.MIN_VALUE;
                top = Number.MIN_VALUE;
                bottom = Number.MAX_VALUE;
                for (i = 0; i < len; i++)
                {
                    var coordPair = coordinates[i].split(",");
                    var latitude = coordPair[1].trim();
                    var longitude = coordPair[0].trim();
                    //geoCoords.add(new Point2D.Double(longitude, latitude));
                    if (longitude < left)
                        left = longitude;
                    if (longitude > right)
                        right = longitude;
                    if (latitude > top)
                        top = latitude;
                    if (latitude < bottom)
                        bottom = latitude;
                }
                bbox2 = left.toString() + "," + bottom.toString() + "," + right.toString() + "," + top.toString();
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "getBoundingRectangle", err);
            }
            return bbox2;
        },
        /**
         * need to use the symbol to get the upper left control point
         * in order to produce a valid PointConverter
         * @param {Array} geoCoords the client points (armyc2.c2sd.graphics2d.Point2D)
         */
        getControlPoint: function (geoCoords)
        {
            var pt2d = null;
            try
            {
                var left = Number.MAX_VALUE;
                var right = Number.MIN_VALUE;
                var top = Number.MIN_VALUE;
                var bottom = Number.MAX_VALUE;
                var ptTemp = null;
                for (var j = 0; j < geoCoords.length; j++)
                {
                    ptTemp = geoCoords[j];
                    if (ptTemp.getX() < left)
                        left = ptTemp.getX();
                    if (ptTemp.getX() > right)
                        right = ptTemp.getX();
                    if (ptTemp.getY() > top)
                        top = ptTemp.getY();
                    if (ptTemp.getY() < bottom)
                        bottom = ptTemp.getY();
                }
                pt2d = new armyc2.c2sd.graphics2d.Point2D(left, top);
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "getControlPoint", err);
            }
            return pt2d;
        },
        /**
         * Assumes a reference in which the north pole is on top.
         * @param {Array} geoCoords the client points 
         * (armyc2.c2sd.graphics2d.Point2D)
         * @return {armyc2.c2sd.graphics2d.Point2D} the upper left corner of the MBR
         *  containing the geographic coordinates
         */
        getGeoUL: function (geoCoords)
        {
            var ptGeo = null;
            try
            {
                var j = 0;
                var pt = null;
                var left = geoCoords[0].x;
                var top = geoCoords[0].y;
                var right = geoCoords[0].x;
                var bottom = geoCoords[0].y;
                for (j = 1; j < geoCoords.length; j++)
                {
                    pt = geoCoords[j];
                    if (pt.getX() < left)
                        left = pt.getX();
                    if (pt.getX() > right)
                        right = pt.getX();
                    if (pt.getY() > top)
                        top = pt.getY();
                    if (pt.getY() < bottom)
                        bottom = pt.getY();
                }
                //if geoCoords crosses the IDL
                if (right - left > 180)
                {
                    //There must be at least one x value on either side of +/-180. Also, there is at least
                    //one positive value to the left of +/-180 and negative x value to the right of +/-180.
                    //We are using the orientation with the north pole on top so we can keep
                    //the existing value for top. Then the left value will be the least positive x value
                    left = geoCoords[0].x;
                    for (j = 1; j < geoCoords.length; j++)
                    {
                        pt = geoCoords[0];
                        if (pt.getX() > 0 && pt.getX() < left)
                            left = pt.getX();
                    }
                }
                ptGeo = new armyc2.c2sd.graphics2d.Point2D(left, top);
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "getGeoUL", err);
            }
            return ptGeo;
        },
        /**
         * 
         * @param {Array} geoCoords the client points 
         * (armyc2.c2sd.graphics2d.Point2D)
         * @return {Boolean} 
         */
        crossesIDL: function (geoCoords)
        {
            var result = false;
            var pt2d = sec.web.renderer.MultiPointHandler.getControlPoint(geoCoords);
            var left = pt2d.getX();
            var ptTemp = null;
            for (var j = 0; j < geoCoords.length; j++) {
                ptTemp = geoCoords[j];
                if (Math.abs(ptTemp.getX() - left) > 180)
                    return true;
            }
            return result;
        },
        ShouldClipSymbol: function (symbolID)
        {
            var status = armyc2.c2sd.renderer.utilities.SymbolUtilities.getStatus(symbolID);
            if (symbolID.charAt(0) === ("G") && status === ("A")) {
                return true;
            }
            if (armyc2.c2sd.renderer.utilities.SymbolUtilities.isWeather(symbolID))
                return true;
            var id = armyc2.c2sd.renderer.utilities.SymbolUtilities.getBasicSymbolID(symbolID);
            if (id === ("G*T*F-----****X") || id === ("G*F*LCC---****X") || id === ("G*G*GLB---****X") ||
                    id === ("G*G*GLF---****X") || id === ("G*G*GLC---****X") || id === ("G*G*GAF---****X") ||
                    id === ("G*G*AAW---****X") || id === ("G*G*DABP--****X") || id === ("G*G*OLP---****X") ||
                    id === ("G*G*PY----****X") || id === ("G*G*PM----****X") || id === ("G*G*ALL---****X") ||
                    id === ("G*G*ALU---****X") || id === ("G*G*ALM---****X") || id === ("G*G*ALC---****X") ||
                    id === ("G*G*SLB---****X") || id === ("G*G*SLH---****X") || id === ("G*G*GAY---****X") ||
                    id === ("G*G*ALS---****X") || id === ("G*M*OFA---****X") || id === ("G*M*OGB---****X") ||
                    id === ("G*M*OGL---****X") || id === ("G*M*OGZ---****X") || id === ("G*M*OGF---****X") ||
                    id === ("G*M*OGR---****X") || id === ("G*M*OADU--****X") || id === ("G*M*OADC--****X") ||
                    id === ("G*M*OAR---****X") || id === ("G*M*OAW---****X") || id === ("G*M*OEF---****X") ||
                    id === ("G*M*OMC---****X") || id === ("G*M*OWU---****X") || id === ("G*M*OWS---****X") ||
                    id === ("G*M*OWD---****X") || id === ("G*M*OWA---****X") || id === ("G*M*OWL---****X") ||
                    id === ("G*M*OWH---****X") || id === ("G*M*OWCS--****X") || id === ("G*M*OWCD--****X") ||
                    id === ("G*M*OWCT--****X") || id === ("G*M*OHO---****X") || id === ("G*M*BDD---****X") ||
                    id === ("G*M*BCD---****X") || id === ("G*M*BCE---****X") || id === ("G*M*SL----****X") ||
                    id === ("G*M*SP----****X") || id === ("G*M*NR----****X") || id === ("G*M*NB----****X") ||
                    id === ("G*M*NC----****X") || id === ("G*F*ACNI--****X") || id === ("G*F*ACNR--****X") ||
                    id === ("G*F*ACNC--****X") || id === ("G*F*AKBC--****X") || id === ("G*F*AKBI--****X") ||
                    id === ("G*F*AKBR--****X") || id === ("G*F*AKPC--****X") || id === ("G*F*AKPI--****X") ||
                    id === ("G*F*AKPR--****X") || id === ("G*F*LT----****X") || id === ("G*F*LTS---****X") ||
                    id === ("G*G*SAE---****X") || id === ("G*S*LRA---****X") || id === ("G*S*LRM---****X") ||
                    id === ("G*S*LRO---****X") || id === ("G*S*LRT---****X") || id === ("G*S*LRW---****X") ||
                    id === ("G*T*Q-----****X") || id === ("G*T*E-----****X") || id === ("G*T*F-----****X") ||
                    id === ("G*T*K-----****X") || id === ("G*T*KF----****X") || id === ("G*T*A-----****X") ||
                    id === ("G*G*PA----****X") || id === ("G*M*ORP---****X") || id === ("G*M*ORS---****X"))
            {
                return true;
            }
            else
                return false;
        },
        getReasonableScale: function (bbox, origScale)
        {
            var scale = origScale;
            try
            {
                var bounds = bbox.split(",");
                var left = bounds[0];
                var right = bounds[2];
                var top = bounds[3];
                var bottom = bounds[1];
                if (left.equalsIgnoreCase("-180") && right.equalsIgnoreCase("180"))
                    return origScale;
                else if (left.equalsIgnoreCase("180") && right.equalsIgnoreCase("-180"))
                    return origScale;
                var ul = new armyc2.c2sd.JavaLineArray.POINT2(left, top);
                var ur = new armyc2.c2sd.JavaLineArray.POINT2(right, top);
                //var ptLeft=new armyc2.c2sd.JavaLineArray.POINT2(left,top);
                //POINT2 ll=new POINT2(left,bottom);
                var widthInMeters = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_distance(ul, ur, null, null);
                //double metersHigh=mdlGeodesic.geodesic_distance(ul, ll, null, null);
                var maxWidthInPixels = _maxWidthInPixels;   //this should be RendererSettings.getMaxPixels
                var minScale = (maxWidthInPixels / widthInMeters) * (1.0 / 96.0) * (1.0 / 39.37);
                minScale = 1.0 / minScale;
                if (origScale < minScale) {
                    return minScale;
                }

                var minWidthInPixels = _minWidthInPixels;
                var maxScale = (minWidthInPixels / widthInMeters) * (1.0 / 96.0) * (1.0 / 39.37);
                maxScale = 1.0 / maxScale;
                if (origScale > maxScale) {
                    return maxScale;
                }
            }
            catch (err) {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "getGeoUL", err);
            }
            return scale;
        },
        /**
         * Renders all multi-point symbols, creating KML that can be used to draw
         * it on a Google map.  Multipoint symbols cannot be draw the same 
         * at different scales. For instance, graphics with arrow heads will need to 
         * redraw arrowheads when you zoom in on it.  Similarly, graphics like a 
         * Forward Line of Troops drawn with half circles can improve performance if 
         * clipped when the parts of the graphic that aren't on the screen.  To help 
         * readjust graphics and increase performance, this function requires the 
         * scale and bounding box to help calculate the new locations.
         * @param {String} id A unique identifier used to identify the symbol by Google map. 
         * The id will be the folder name that contains the graphic.
         * @param {String} name a string used to display to the user as the name of the 
         * graphic being created.
         * @param {String} description a brief description about the graphic being made and 
         * what it represents.
         * @param {String} symbolCode A 15 character symbolID corresponding to one of the
         * graphics in the MIL-STD-2525C
         * @param {String} controlPoints The vertices of the graphics that make up the
         * graphic.  Passed in the format of a string, using decimal degrees 
         * separating lat and lon by a comma, separating coordinates by a space.  
         * The following format shall be used "x1,y1[,z1] [xn,yn[,zn]]..."
         * @param {Number} scale A number corresponding to how many meters one meter of our 
         * map represents. A value "50000" would mean 1:50K which means for every 
         * meter of our map it represents 50000 meters of real world distance.
         * @param {String} bbox The viewable area of the map.  Passed in the format of a
         * string "lowerLeftX,lowerLeftY,upperRightX,upperRightY." Not required
         * but can speed up rendering in some cases.
         * example: "-50.4,23.6,-42.2,24.2"
         * @param {Object} symbolModifiers An Object representing all the possible symbol 
         * modifiers represented in the MIL-STD-2525C.  Key values come from
         * MilStdAttributes, ModifiersTG and ModifiersUnits 
         * example: {"C":"4","Z":"300","AN":[100,200]}}
         * @param {Number} format An enumeration: 0 for KML, 1 for JSON.
         * @param {Number} symStd An enumeration: 0 for 2525Bch2, 1 for 2525C.
         * @return A JSON string representation of the graphic.
         */
        RenderSymbol: function (id, name, description, symbolCode, controlPoints, scale, bbox, symbolModifiers, format, symStd)
        {
            if (!symStd)
            {
                symStd = armyc2.c2sd.renderer.utilities.RendererSettings.getSymbologyStandard();
            }
            var normalize = false,
                    controlLat = 0,
                    controlLong = 0,
                    jsonOutput = "",
                    jsonContent = "",
                    rect = null,
                    tgPoints = null,
                    coordinates = null,
                    tgl = new armyc2.c2sd.JavaTacticalRenderer.TGLight(),
                    shapes = new Array(),
                    modifiers = new Array(),
                    geoCoords = new Array(),
                    ipc = null,
                    left = 0,
                    right = 0,
                    top = 0,
                    bottom = 0,
                    temp = null,
                    ptGeoUL = null,
                    width = 0,
                    height = 0,
                    leftX = 0,
                    topY = 0,
                    bottomY = 0,
                    rightX = 0,
                    j = 0,
                    bboxCoords = null;

            var setRectNull = false;  //Deutch 4-15-15

            if (bbox !== null && bbox !== ("")) {
                var bounds = null;
                if (bbox.contains(" ")) //trapezoid
                {
                    bboxCoords = new Array();
                    var x = 0;
                    var y = 0;
                    var coords = bbox.split(" ");
                    var coord;
                    var arrCoord;
                    var tempPt = null;
                    for (var i = 0; i < coords.length; i++)
                    {
                        coord = coords[i];
                        arrCoord = coord.split(",");
                        x = arrCoord[0];
                        y = arrCoord[1];
                        tempPt = new armyc2.c2sd.graphics2d.Point2D();
                        tempPt.setLocation(x, y);
                        bboxCoords.push(tempPt);
                    }
                    //use the upper left corner of the MBR containing geoCoords
                    //to set the converter
                    ptGeoUL = sec.web.renderer.MultiPointHandler.getGeoUL(bboxCoords);
                    left = ptGeoUL.getX();
                    top = ptGeoUL.getY();
                    ipc = new sec.web.renderer.PointConverter(left, top, scale);
                    var ptPixels = null;
                    var ptGeo = null;
                    for (j = 0; j < bboxCoords.length; j++) {
                        ptGeo = bboxCoords[j];
                        ptPixels = ipc.GeoToPixels(ptGeo);
                        x = ptPixels.getX();
                        y = ptPixels.getY();
                        if (x < 20)
                            x = 20;
                        if (y < 20)
                            y = 20;
                        ptPixels.setLocation(x, y);
                        bboxCoords[j] = ptPixels;
                    }
                }
                else //rectangle
                {
                    bounds = bbox.split(",");
                    left = bounds[0];
                    right = bounds[2];
                    top = bounds[3];
                    bottom = bounds[1];

                    //Deutch 4-15-15
                    if (left.equalsIgnoreCase("-180") && right.equalsIgnoreCase("180"))
                        setRectNull = true;
                    //end section

                    scale = sec.web.renderer.MultiPointHandler.getReasonableScale(bbox, scale);

                    ipc = new sec.web.renderer.PointConverter(left, top, scale);
                }

                //sanity check
                //when spanning the IDL sometimes they send a bad bbox with 0 width
                //this check assumes a valid left, top, and valid scale
                if (left === right)
                {
                    //try for a theoretical 1000x1000 pixels bounding area
                    //so for metric width or height:
                    //distance in meters=1000 pixels * 1 inch/96 pixels * 1 meter/39.37 inch *scale(meters/meters)
                    var dist = 1000.0 * (1.0 / 96.0) * (1.0 / 39.37) * scale;
                    var ptLeft = new armyc2.c2sd.JavaLineArray.POINT2(left, top);
                    var ptRight = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate(ptLeft, dist, 90.0);
                    right = ptRight.x;
                    if (right > 180)
                        right -= 360;
                    else
                    if (right < -180)
                        right += 360;
                }
                if (top === bottom)
                {
                    dist = 1000.0 * (1.0 / 96.0) * (1.0 / 39.37) * scale;
                    var ptTop = new armyc2.c2sd.JavaLineArray.POINT2(left, top);
                    var ptBottom = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate(ptTop, dist, 180.0);
                    bottom = ptBottom.y;
                }
                //end section

                var pt2d = null;
                if (bboxCoords === undefined || bboxCoords === null)
                {
                    pt2d = new armyc2.c2sd.graphics2d.Point2D();
                    pt2d.setLocation(left, top);
                    temp = ipc.GeoToPixels(pt2d);
                    leftX = Math.round(temp.getX());
                    topY = Math.round(temp.getY());
                    pt2d = new armyc2.c2sd.graphics2d.Point2D();
                    pt2d.setLocation(right, bottom);
                    temp = ipc.GeoToPixels(pt2d);
                    bottomY = Math.round(temp.getY());
                    rightX = Math.round(temp.getX());
                    if (scale > 1e7)
                    {
                        //get widest point in the AOI
                        var midLat = 0;
                        if (bottom < 0 && top > 0)
                            midLat = 0;
                        else if (bottom < 0 && top < 0)
                            midLat = top;
                        else if (bottom > 0 && top > 0)
                            midLat = bottom;

                        temp = ipc.GeoToPixels(new armyc2.c2sd.graphics2d.Point2D(right, midLat));
                        rightX = temp.getX();
                        //alert(rightX);
                    }
                    width = Math.abs(rightX - leftX);
                    height = Math.abs(bottomY - topY);
                    rect = new armyc2.c2sd.graphics2d.Rectangle(leftX, topY, width, height);
                }
            }
            else
            {
                rect = null;
            }
            if (setRectNull) //Deutcvh 4-15-15
                rect = null;

            var tempPt = null;
            coordinates = controlPoints.trim();
            coordinates = coordinates.split(" ");
            var len = coordinates.length;

            for (var i = 0; i < len; i++) {
                var coordPair = coordinates[i].split(",");
                var latitude = coordPair[1];//.trim();
                var longitude = coordPair[0];//.trim();
                tempPt = new armyc2.c2sd.graphics2d.Point2D();
                tempPt.setLocation(longitude, latitude);
                geoCoords.push(tempPt);
            }
            if (ipc === null) {
                var ptCoordsUL = sec.web.renderer.MultiPointHandler.getGeoUL(geoCoords);
                ipc = new sec.web.renderer.PointConverter(ptCoordsUL.getX(), ptCoordsUL.getY(), scale);
            }
            //if (sec.web.renderer.MultiPointHandler.crossesIDL(geoCoords) === true)
            if (Math.abs(right - left) > 180)
            {
                normalize = true;
                ipc.set_normalize(true);
            }
            else
            {
                normalize = false;
                ipc.set_normalize(false);
            }
            if (sec.web.renderer.MultiPointHandler.crossesIDL(geoCoords) === true)
            {
                normalize = true;
                ipc.set_normalize(true);
            }

            //check if symbolID is valid, if not, turn it into something renderable.
            if (armyc2.c2sd.renderer.utilities.SymbolDefTable.hasSymbolDef(SymbolUtilities.getBasicSymbolID(symbolCode), symStd) === false)
                symbolCode = SymbolUtilities.reconcileSymbolID(symbolCode, true);

            //disable clipping if necessary
            if ((sec.web.renderer.MultiPointHandler.ShouldClipSymbol(symbolCode)) === false)
                if (sec.web.renderer.MultiPointHandler.crossesIDL(geoCoords) === false)
                    rect = null;

            tgl.set_SymbolId(symbolCode);//like "GFGPSLA---****X" AMBUSH symbol code
            tgl.set_Pixels(null);
            try {

                var mSymbol = new armyc2.c2sd.renderer.utilities.MilStdSymbol(symbolCode, null, geoCoords, null);
                mSymbol.setSymbologyStandard(symStd);
                if (format === 3 || format === 4)
                {
                    symbolModifiers[MilStdAttributes.UseDashArray] = true;
                }
                if (symbolModifiers !== null && symbolModifiers !== (""))
                {
                    sec.web.renderer.MultiPointHandler.populateModifiers(symbolModifiers, mSymbol);
                }
                else
                    mSymbol.setFillColor(null);

                //check for required points & parameters
                var symbolIsValid = this.canRenderMultiPoint(mSymbol);
                if (symbolIsValid.canRender === false)
                {
                    jsonOutput = "";
                    jsonOutput += ("{\"type\":\"error\",\"error\":\"There was an error creating the MilStdSymbol " + symbolCode + ": " + "- ");
                    jsonOutput += (symbolIsValid.message + " - ");
                    jsonOutput += ("\"}");
                    ErrorLogger.LogWarning("MultiPointHandler", "RenderSymbol", symbolIsValid.message);
                    return jsonOutput;
                }//*/

                //Switch arrays to ArrayLists
                mSymbol = sec.web.renderer.utilities.JavaRendererUtilities.MilStdSymbolArraysToArrayLists(mSymbol);

                if (mSymbol.getModifierMap()["symbolFillIds"] !== undefined || mSymbol.getModifierMap()["symbolLineIds"] !== undefined)
                {
                    tgl = armyc2.c2sd.JavaRendererServer.RenderMultipoints.clsRenderer.createTGLightFromMilStdSymbol(mSymbol, ipc);
                    //var tgPoints = tgl.get_Pixels();//java.util.ArrayList
                    armyc2.c2sd.JavaRendererServer.RenderMultipoints.clsClipPolygon2.ClipPolygon(tgl,rect);
                    var tgPoints = tgl.get_Pixels();//java.util.ArrayList
                }//*/
                if (bboxCoords === null)
                    armyc2.c2sd.JavaRendererServer.RenderMultipoints.clsRenderer.renderWithPolylines(mSymbol, ipc, rect);
                else
                    armyc2.c2sd.JavaRendererServer.RenderMultipoints.clsRenderer.renderWithPolylines(mSymbol, ipc, bboxCoords);
                shapes = mSymbol.getSymbolShapes();
                modifiers = mSymbol.getModifierShapes();

                var textColor = mSymbol.getTextColor();
                var textBackgroundColor = mSymbol.getTextBackgroundColor();
                var hexTextColor = null;
                var hexTextBackgroundColor = null;

                if (format === 0) //KML
                {
                    if (textColor !== null)
                    {
                        hexTextColor = textColor.toKMLHexString();
                    }
                    else
                    {
                        hexTextColor = "#FF000000";
                    }
                    jsonContent = sec.web.renderer.MultiPointHandler.KMLize(id, name, description, symbolCode, shapes, modifiers, ipc, normalize, hexTextColor);

                    //generate image fill kml if we have symbolfillids or symbollineids
                    if (mSymbol.getModifierMap()["symbolFillIds"] !== undefined || mSymbol.getModifierMap()["symbolLineIds"] !== undefined)
                    {
                        var fillKML = this.AddImageFillToKML(tgPoints, jsonContent, mSymbol, ipc, normalize);
                        if (fillKML !== null && fillKML !== "")
                        {
                            jsonContent = fillKML;
                        }
                    }//*/

                    //add <LookAt> tag//////////////////////////////////////////////

                    var doLookAt = false;
                    var LookAtTag = null;
                    if (symbolModifiers[MilStdAttributes.LookAtTag] === true)//(doLookAt)
                    {
                        LookAtTag = sec.web.renderer.utilities.JavaRendererUtilities.generateLookAtTag(geoCoords, symbolModifiers["AM"]);
                        if (LookAtTag)
                        {
                            var idx = jsonContent.indexOf("<visibility>");
                            jsonContent = jsonContent.substring(0, idx) + LookAtTag + jsonContent.substring(idx);
                        }
                    }
                    //add <LookAt> tag//////////////////////////////////////////////

                    jsonOutput = jsonContent;
                }
                else if (format === 2) //GeoJSON
                {
                    if (textColor)
                        hexTextColor = textColor.toHexString(false);
                    if (textBackgroundColor)
                        hexTextBackgroundColor = textBackgroundColor.toHexString(false);

                    jsonContent = sec.web.renderer.MultiPointHandler.GeoJSONize(shapes, modifiers, ipc, normalize, hexTextColor, hexTextBackgroundColor);
                    jsonContent.properties.id = id;
                    jsonContent.properties.name = name;
                    jsonContent.properties.description = description;
                    jsonContent.properties.symbolID = symbolCode;
                    //set id and any other properties
                    jsonOutput = JSON.stringify(jsonContent);
                }
                else if (format === 3 || format === 4)//render to canvas/dataURL
                {
                    if (textColor)
                        hexTextColor = textColor.toHexString(false);
                    if (textBackgroundColor)
                        hexTextBackgroundColor = textBackgroundColor.toHexString(false);

                    //returns a canvas with a geoTL and geoBR value to use to place the canvas on the map.
                    jsonOutput = sec.web.renderer.MultiPointHandler.GeoCanvasize(shapes, modifiers, ipc, normalize, format, hexTextColor, hexTextBackgroundColor);
                }
                else if (format === 1) //deprecated
                {
                    jsonOutput = "{\"type\":\"symbol\",";
                    jsonContent = sec.web.renderer.MultiPointHandler.JSONize(shapes, modifiers, ipc, normalize);
                    jsonOutput += jsonContent;
                    jsonOutput += "}";
                }
            }
            catch (exc)
            {

                jsonOutput = "";
                jsonOutput += ("{\"type\":\"error\",\"error\":\"There was an error creating the MilStdSymbol " + symbolCode + ": " + "- ");
                jsonOutput += (exc.message + " - ");
                jsonOutput += ("\"}");
                ErrorLogger.LogException("MultiPointHandler", "RenderSymbol", exc);

            }
            var debug = false;
            if (debug === true) {
                console.info("Symbol Code: " + symbolCode);
                console.info("Scale: " + scale);
                console.info("BBOX: " + bbox);
                if (controlPoints !== null) {
                    console.info("Geo Points: " + controlPoints);
                }
                if (tgl !== null && tgl.get_Pixels() !== null) {
                    console.info("Pixel: " + tgl.get_Pixels().toString());
                }
                if (bbox !== null) {
                    console.info("geo bounds: " + bbox);
                }
                if (rect !== null) {
                    console.info("pixel bounds: " + rect.toString());
                }
                if (jsonOutput !== null) {
                    console.info(jsonOutput);
                }
            }
            return jsonOutput;

        },
        /**
         * @param {Array} polylines Array<Array<Point2D>>
         * @param {type} ipc description
         * @param {Boolean} normalize description
         * 
         */
        ConvertPolylinePixelsToCoords: function (polylines, ipc, normalize)
        {
            var newPolylines = new Array();
            var latitude = 0;
            var longitude = 0;
            var newLine = null;
            var tempPt = null;
            var pt = null;
            var geoCoord = null;

            try
            {
                for (var i = 0; i < polylines.length; i++)
                {
                    newLine = new Array();
                    for (var j = 0; j < newLine.length; j++)
                    {
                        pt = newLine[j];
                        geoCoord = ipc.PixelsToGeo(pt);

                        if (normalize)
                        {
                            geoCoord = this.NormalizeCoordToGECoord(geoCoord);
                        }

                        latitude = geoCoord.getY();
                        longitude = geoCoord.getX();
                        newLine.add(new armyc2.c2sd.graphics2d.Point2D(longitude, latitude));
                    }
                    newPolylines.push(newLine);
                }
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "ConvertPolylinePixelsToCoords", err);
            }
            return newPolylines;
        },
        /**
         * Multipoint Rendering on flat 2D maps
         * @param {String} id A unique ID for the symbol.  only used in KML currently
         * @param {String} name description
         * @param {String} description description
         * @param {String} symbolCode
         * @param {String} controlPoints
         * @param {Number} pixelWidth pixel dimensions of the viewable map area
         * @param {Number} pixelHeight pixel dimensions of the viewable map area
         * @param {String} bbox The viewable area of the map.  Passed in the format of a
         * string "lowerLeftX,lowerLeftY,upperRightX,upperRightY."
         * example: "-50.4,23.6,-42.2,24.2"
         * @param {Object} symbolModifiers An Object representing all the possible symbol 
         * modifiers represented in the MIL-STD-2525C.  Key values come from
         * MilStdAttributes, ModifiersTG and ModifiersUnits 
         * example: {"C":"4","Z":"300","AN":[100,200]}}
         * @param {Number} format An enumeration: 0 for KML, 1 for JSON.
         * @param {Number} symStd An enumeration: 0 for 2525Bch2, 1 for 2525C.
         * @return {String} A JSON or KML string representation of the graphic.
         */
        RenderSymbol2D: function (id, name, description, symbolCode, controlPoints, pixelWidth, pixelHeight, bbox, symbolModifiers, format, symStd)
        {
            if (!symStd)
            {
                symStd = armyc2.c2sd.renderer.utilities.RendererSettings.getSymbologyStandard();
            }

            var jsonOutput = "",
                    jsonContent = "",
                    rect = null,
                    tgPoints = null,
                    coordinates = null,
                    tgl = new armyc2.c2sd.JavaTacticalRenderer.TGLight(),
                    shapes = new Array(),
                    modifiers = new Array(),
                    geoCoords = new Array(),
                    ipc = null,
                    left = 0,
                    right = 0,
                    top = 0,
                    bottom = 0;

            //process coordinates
            var tempPt = null;
            coordinates = controlPoints.trim();
            coordinates = coordinates.split(" ");
            var len = coordinates.length;

            for (var i = 0; i < len; i++)
            {
                var coordPair = coordinates[i].split(",");
                var latitude = coordPair[1];//.trim();
                var longitude = coordPair[0];//.trim();
                tempPt = new armyc2.c2sd.graphics2d.Point2D();
                tempPt.setLocation(longitude, latitude);
                geoCoords.push(tempPt);
            }

            //get bounding box
            if (bbox !== null && bbox !== (""))
            {
                var bounds = bbox.split(",");
                left = bounds[0];
                right = bounds[2];
                top = bounds[3];
                bottom = bounds[1];

                if (top !== bottom && left != right)
                {
                    ipc = new armyc2.c2sd.renderer.utilities.PointConversion(pixelWidth, pixelHeight, (top), (left), (bottom), (right));
                }
                else
                {
                    var rbb = this.GetBboxFromCoordinates(symbolCode, geoCoords, symbolModifiers, symStd);
                    ipc = new armyc2.c2sd.renderer.utilities.PointConversion(pixelWidth, pixelHeight, (rbb.top), (rbb.left), (rbb.bottom), (rbb.right));
                }
            }
            else
            {
                var rbb = this.GetBboxFromCoordinates(symbolCode, geoCoords, symbolModifiers, symStd);
                ipc = new armyc2.c2sd.renderer.utilities.PointConversion(pixelWidth, pixelHeight, (rbb.top), (rbb.left), (rbb.bottom), (rbb.right));
            }



            try
            {
                var mSymbol = new armyc2.c2sd.renderer.utilities.MilStdSymbol(symbolCode, null, geoCoords, null);
                mSymbol.setSymbologyStandard(symStd);
                if (format === 3 || format === 4)
                {
                    symbolModifiers[MilStdAttributes.UseDashArray] = true;
                }
                if (symbolModifiers !== null && symbolModifiers !== (""))
                {
                    sec.web.renderer.MultiPointHandler.populateModifiers(symbolModifiers, mSymbol);
                }
                else
                    mSymbol.setFillColor(null);
                var temp = null;
                var leftX;
                var topY;
                var bottomY;
                var rightX;
                var width;
                var height;
                var pt2d = null;
                var normalize = false;
                if (Math.abs(right - left) > 180)
                {
                    ipc.set_normalize(true);
                    normalize = true;
                }
                else
                {
                    ipc.set_normalize(false);
                }
                if(sec.web.renderer.MultiPointHandler.crossesIDL(geoCoords) === true)
                {
                    ipc.set_normalize(true);
                    normalize = true;                    
                }
                if ((sec.web.renderer.MultiPointHandler.ShouldClipSymbol(symbolCode)) === true || sec.web.renderer.MultiPointHandler.crossesIDL(geoCoords) === true)
                {
                    pt2d = new armyc2.c2sd.graphics2d.Point2D();
                    pt2d.setLocation(left, top);
                    temp = ipc.GeoToPixels(pt2d);
                    leftX = Math.round(temp.getX());
                    topY = Math.round(temp.getY());
                    pt2d = new armyc2.c2sd.graphics2d.Point2D();
                    pt2d.setLocation(right, bottom);
                    temp = ipc.GeoToPixels(pt2d);
                    bottomY = Math.round(temp.getY());
                    rightX = Math.round(temp.getX());
                    width = Math.abs(rightX - leftX);
                    height = Math.abs(bottomY - topY);
                    rect = new armyc2.c2sd.graphics2d.Rectangle(leftX, topY, width, height);
                }

                //check for required points & parameters
                var symbolIsValid = this.canRenderMultiPoint(mSymbol);
                if (symbolIsValid.canRender === false)
                {
                    jsonOutput = "";
                    jsonOutput += ("{\"type\":\"error\",\"error\":\"There was an error creating the MilStdSymbol " + symbolCode + ": " + "- ");
                    jsonOutput += (symbolIsValid.message + " - ");
                    jsonOutput += ("\"}");
                    ErrorLogger.LogWarning("MultiPointHandler", "RenderSymbol", symbolIsValid.message);
                    return jsonOutput;
                }//*/

                //Switch arrays to ArrayLists
                mSymbol = sec.web.renderer.utilities.JavaRendererUtilities.MilStdSymbolArraysToArrayLists(mSymbol);

                if (mSymbol.getModifierMap()["symbolFillIds"] || mSymbol.getModifierMap["symbolLineIds"])
                {
                    tgl = armyc2.c2sd.JavaRendererServer.RenderMultipoints.clsRenderer.createTGLightFromMilStdSymbol(mSymbol, ipc);
                    armyc2.c2sd.JavaRendererServer.RenderMultipoints.clsClipPolygon2.ClipPolygon(tgl,rect);
                    tgPoints = tgl.get_Pixels();
                }
                armyc2.c2sd.JavaRendererServer.RenderMultipoints.clsRenderer.renderWithPolylines(mSymbol, ipc, rect);
                shapes = mSymbol.getSymbolShapes();
                modifiers = mSymbol.getModifierShapes();
                //var normalize = false;

                var textColor = mSymbol.getTextColor();
                var textBackgroundColor = mSymbol.getTextBackgroundColor();
                var hexTextColor = null;
                var hexTextBackgroundColor = null;


                if (format === 0) //KML
                {
                    if (textColor !== null)
                    {
                        hexTextColor = textColor.toKMLHexString();
                    }
                    else
                    {
                        hexTextColor = "#FF000000";
                    }
                    jsonContent = sec.web.renderer.MultiPointHandler.KMLize(id, name, description, symbolCode, shapes, modifiers, ipc, normalize, hexTextColor);

                    if (mSymbol.getModifierMap()["symbolFillIds"] || mSymbol.getModifierMap["symbolLineIds"])
                    {
                        var fillKML = this.AddImageFillToKML(tgPoints, jsonContent, mSymbol, ipc, normalize);
                        if (fillKML !== null && fillKML !== "")
                        {
                            jsonContent = fillKML;
                        }
                    }//*/
                    jsonOutput = jsonContent;
                }
                else if (format === 2) //GeoJSON
                {
                    if (textColor)
                        hexTextColor = textColor.toHexString(false);
                    if (textBackgroundColor)
                        hexTextBackgroundColor = textBackgroundColor.toHexString(false);

                    jsonContent = sec.web.renderer.MultiPointHandler.GeoJSONize(shapes, modifiers, ipc, normalize, hexTextColor, hexTextBackgroundColor);
                    //set id and any other properties
                    jsonContent.properties.id = id;
                    jsonContent.properties.name = name;
                    jsonContent.properties.description = description;
                    jsonContent.properties.symbolID = symbolCode;
                    jsonOutput = JSON.stringify(jsonContent);
                }
                else if (format === 3 || format === 4)//render to canvas/dataURL
                {

                    if (textColor)
                        hexTextColor = textColor.toHexString(false);
                    if (textBackgroundColor)
                        hexTextBackgroundColor = textBackgroundColor.toHexString(false);

                    //returns a canvas with a geoTL and geoBR value to use to place the canvas on the map.
                    jsonOutput = sec.web.renderer.MultiPointHandler.GeoCanvasize(shapes, modifiers, ipc, normalize, format, hexTextColor, hexTextBackgroundColor);
                }
                else if (format === 1) //deprecated
                {
                    jsonOutput = ("{\"type\":\"symbol\",");
                    jsonContent = sec.web.renderer.MultiPointHandler.JSONize(shapes, modifiers, ipc, normalize);
                    jsonOutput += (jsonContent);
                    jsonOutput += ("}");
                }

            } catch (err) {
                jsonOutput = "";
                jsonOutput += ("{\"type\":\"MultiPointHandler\",\"RenderSymbol2D\":\"There was an error creating the MilStdSymbol " + symbolCode + ": " + "- ");
                jsonOutput += (err.message + " - ");
                jsonOutput += ("\"}");
                ErrorLogger.LogException("MultiPointHandler", "RenderSymbol2D", err);
            }

            var debug = false;
            if (debug === true)
            {
                console.info("Symbol Code: " + symbolCode);
                console.info("BBOX: " + bbox);
                if (controlPoints !== null) {
                    console.info("Geo Points: " + controlPoints);
                }
                if (tgl !== null && tgl.get_Pixels() !== null) {
                    console.info("Pixel: " + tgl.get_Pixels().toString());
                }
                if (bbox !== null) {
                    console.info("geo bounds: " + bbox);
                }
                if (rect !== null) {
                    console.info("pixel bounds: " + rect.toString());
                }
                if (jsonOutput !== null) {
                    console.info(jsonOutput);
                }
            }
            return jsonOutput;
        },
        /**
         * 
         * @param {armyc2.c2sd.renderer.utilities.MilStdSymbol} symbol 
         * @returns {Object} {canRender:Boolean,message:"reason why can't render"}
         */
        canRenderMultiPoint: function (symbol)
        {
            var symStd = symbol.getSymbologyStandard();
            var symbolID = symbol.getSymbolID();
            var basicID = SymbolUtilities.getBasicSymbolID(symbolID);
            var sd = null;
            var dc = 99;
            var coordCount = symbol.getCoordinates().length;

            if (SymbolDefTable.hasSymbolDef(basicID, symStd))
            {
                sd = SymbolDefTable.getSymbolDef(basicID, symStd);
            }

            if (sd !== null)
            {
                dc = sd.drawCategory;
                if (coordCount < sd.minPoints)
                {
                    return {canRender: false, message: "symbolID: \"" + symbolID + "\" requires a minimum of " + sd.minPoints + " points. " + coordCount + " are present."};
                }
                //now check for required modifiers
                var AM = symbol.getModifiers_AM_AN_X(ModifiersTG.AM_DISTANCE);
                var AN = symbol.getModifiers_AM_AN_X(ModifiersTG.AN_AZIMUTH);
                var result = hasRequiredModifiers(symbolID, dc, AM, AN);

                if (result.hasRequiredModifiers === false)
                {
                    return {canRender: false, message: result.message};
                }
                else
                {
                    return {canRender: true, message: ""};
                }
            }
            else if (symbolID.indexOf("BS_") === 0)
            {
                //Will need to be updated to do a more thorough check for
                //basic shapes and buffered basic shapes.
                //Return true for now.
                return {canRender: true, message: ""};
            }
            else if (symbolID.indexOf("BBS_") === 0)
            {
                var AM = symbol.getModifiers_AM_AN_X(ModifiersTG.AM_DISTANCE);

                if (AM && AM.length > 0)
                {
                    return {canRender: true, message: ""};
                }
                else
                {
                    return {canRender: false, message: "Buffered Basic Shapes require a width (AM)"};
                }
            }
            else
            {
                return {canRender: false, message: "symbolID: \"" + symbolID + "\" not recognized."};
          }
        },
        /**
         * 
         * @param {String:Object} modifiers json string or an object
         * @param {type} symbol
         * @returns {Boolean}
         */
        populateModifiers: function (modifiers, symbol)
        {
            var modifierMap = {}, //new java.util.HashMap();
                    altitudes = null,
                    azimuths = null,
                    distances = null,
                    fillColor = null,
                    lineColor = null,
                    lineWidth = 0,
                    textColor = null,
                    textBackgroundColor = null,
                    symbolFillIDs = null,
                    symbolFillIconSize = null,
                    altMode = null;
            useDashArray = symbol.getUseDashArray();

            //alert(jsonString);
            try {
                if (typeof (modifiers) === 'string')
                {
                    modifiers = JSON.parse(modifiers);

                    if (modifiers.modifiers)
                        modifiers = modifiers.modifiers;
                }

                if (modifiers[ModifiersTG.C_QUANTITY])
                    modifierMap[ModifiersTG.C_QUANTITY] = modifiers[ModifiersTG.C_QUANTITY];
                else if (modifiers.quantity)
                    modifierMap[ModifiersTG.C_QUANTITY] = modifiers.quantity;

                if (modifiers[ModifiersTG.H_ADDITIONAL_INFO_1])
                    modifierMap[ModifiersTG.H_ADDITIONAL_INFO_1] = modifiers[ModifiersTG.H_ADDITIONAL_INFO_1];
                else if (modifiers.additionalInfo1)
                    modifierMap[ModifiersTG.H_ADDITIONAL_INFO_1] = modifiers.additionalInfo1;

                if (modifiers[ModifiersTG.H1_ADDITIONAL_INFO_2])
                    modifierMap[ModifiersTG.H1_ADDITIONAL_INFO_2] = modifiers[ModifiersTG.H1_ADDITIONAL_INFO_2];
                else if (modifiers.additionalInfo2)
                    modifierMap[ModifiersTG.H1_ADDITIONAL_INFO_2] = modifiers.additionalInfo2;

                if (modifiers[ModifiersTG.H2_ADDITIONAL_INFO_3])
                    modifierMap[ModifiersTG.H2_ADDITIONAL_INFO_3] = modifiers[ModifiersTG.H2_ADDITIONAL_INFO_3];
                else if (modifiers.additionalInfo3)
                    modifierMap[ModifiersTG.H2_ADDITIONAL_INFO_3] = modifiers.additionalInfo3;

                if (modifiers[ModifiersTG.N_HOSTILE])
                    modifierMap[ModifiersTG.N_HOSTILE] = modifiers[ModifiersTG.N_HOSTILE];
                else if (modifiers.hostile)
                    modifierMap[ModifiersTG.N_HOSTILE] = modifiers.hostile;

                if (modifiers[ModifiersTG.T_UNIQUE_DESIGNATION_1])
                    modifierMap[ModifiersTG.T_UNIQUE_DESIGNATION_1] = modifiers[ModifiersTG.T_UNIQUE_DESIGNATION_1];
                else if (modifiers.uniqueDesignation1)
                    modifierMap[ModifiersTG.T_UNIQUE_DESIGNATION_1] = modifiers.uniqueDesignation1;

                if (modifiers[ModifiersTG.T1_UNIQUE_DESIGNATION_2])
                    modifierMap[ModifiersTG.T1_UNIQUE_DESIGNATION_2] = modifiers[ModifiersTG.T1_UNIQUE_DESIGNATION_2];
                else if (modifiers.uniqueDesignation2)
                    modifierMap[ModifiersTG.T1_UNIQUE_DESIGNATION_2] = modifiers.uniqueDesignation2;

                if (modifiers[ModifiersTG.W_DTG_1])
                    modifierMap[ModifiersTG.W_DTG_1] = modifiers[ModifiersTG.W_DTG_1];
                else if (modifiers.dateTimeGroup1)
                    modifierMap[ModifiersTG.W_DTG_1] = modifiers.dateTimeGroup1;

                if (modifiers[ModifiersTG.W1_DTG_2])
                    modifierMap[ModifiersTG.W1_DTG_2] = modifiers[ModifiersTG.W1_DTG_2];
                else if (modifiers.dateTimeGroup2)
                    modifierMap[ModifiersTG.W1_DTG_2] = modifiers.dateTimeGroup2;

                var i = 0;

                if (modifiers[ModifiersTG.X_ALTITUDE_DEPTH] && modifiers[ModifiersTG.X_ALTITUDE_DEPTH] instanceof Array)
                {
                    var XN = modifiers[ModifiersTG.X_ALTITUDE_DEPTH];
                    altitudes = new Array();
                    for (i = 0; i < XN.length; i++) {
                        altitudes.push(XN[i]);
                    }
                }
                else if (modifiers.altitudeDepth && modifiers.altitudeDepth instanceof Array)
                {
                    altitudes = new Array();
                    for (i = 0; i < modifiers.altitudeDepth.length; i++) {
                        altitudes.push(modifiers.altitudeDepth[i]);
                    }
                }
                else if (modifiers.X && modifiers.X instanceof Array)
                {
                    altitudes = new Array();
                    if (modifiers.X.length)
                    {
                        for (i = 0; i < modifiers.X.length; i++) {
                            altitudes.push(modifiers.X[i]);
                        }
                    }
                }

                if (modifiers[ModifiersTG.AM_DISTANCE] && modifiers[ModifiersTG.AM_DISTANCE] instanceof Array)
                {
                    var AM = modifiers[ModifiersTG.AM_DISTANCE];
                    distances = new Array();
                    for (i = 0; i < AM.length; i++) {
                        distances.push(AM[i]);
                    }
                }
                else if (modifiers.distance && modifiers.distance instanceof Array)
                {
                    distances = new Array();
                    for (i = 0; i < modifiers.distance.length; i++) {
                        distances.push(modifiers.distance[i]);
                    }
                }


                if (modifiers[ModifiersTG.AN_AZIMUTH] && modifiers[ModifiersTG.AN_AZIMUTH] instanceof Array)
                {
                    var AN = modifiers[ModifiersTG.AN_AZIMUTH];
                    azimuths = new Array();
                    for (i = 0; i < AN.length; i++) {
                        azimuths.push(AN[i]);
                    }
                }
                else if (modifiers.azimuth && modifiers.azimuth instanceof Array)
                {
                    azimuths = new Array();
                    for (i = 0; i < modifiers.azimuth.length; i++) {
                        azimuths.push(modifiers.azimuth[i]);
                    }
                }


                if (modifiers[MilStdAttributes.FillColor])
                    fillColor = modifiers[MilStdAttributes.FillColor];
                else if (modifiers.fillColor)
                    fillColor = modifiers.fillColor;

                if (modifiers[MilStdAttributes.LineColor])
                    lineColor = modifiers[MilStdAttributes.LineColor];
                else if (modifiers.lineColor)
                    lineColor = modifiers.lineColor;

                if (modifiers[MilStdAttributes.TextColor])
                    textColor = modifiers[MilStdAttributes.TextColor];
                else if (modifiers.textColor)
                    textColor = modifiers.textColor;

                if (modifiers[MilStdAttributes.TextBackgroundColor])
                    textBackgroundColor = modifiers[MilStdAttributes.TextBackgroundColor];
                else if (modifiers.textBackgroundColor)
                    textBackgroundColor = modifiers.textBackgroundColor;

                if (modifiers[MilStdAttributes.LineWidth])
                    lineWidth = modifiers[MilStdAttributes.LineWidth];
                else if (modifiers.lineThickness)
                    lineWidth = modifiers.lineThickness;

                if (modifiers[MilStdAttributes.UseDashArray])
                    useDashArray = modifiers[MilStdAttributes.UseDashArray];
                else if (modifiers.useDashArray)
                    useDashArray = modifiers.useDashArray;

                if (modifiers[MilStdAttributes.AltitudeMode])
                    altMode = modifiers[MilStdAttributes.AltitudeMode];

                // These are for when we create a area fill that is comprised of symbols//////////
                if (modifiers.symbolFillIds !== undefined && modifiers.symbolFillIds !== null)
                {
                    modifierMap[this.SYMBOL_FILL_IDS] = modifiers.symbolFillIds;
                }
                else if (modifiers.symbolLineIds !== undefined && modifiers.symbolLineIds !== null) {
                    modifierMap[this.SYMBOL_LINE_IDS] = modifiers.symbolLineIds;
                }
                if (modifiers.symbolFillIconSize !== undefined && modifiers.symbolFillIconSize !== null) {
                    modifierMap[this.SYMBOL_FILL_ICON_SIZE] = modifiers.symbolFillIconSize;
                }

            }
            catch (je)
            {

                //System.out.println("Failed to parse modifier string in MultiPointHandler.RenderSymbol. Continuing processing the drawing of the graphic");
                //System.out.println("Json String: " + String.valueOf(jsonString));
                //System.out.println(je.getMessage());
                //System.out.println(sec.web.renderer.utilities.JavaRendererUtilities.getStackTrace(je));
                return false;
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "populateModifiers", je);
                //throw je;
            }
            try {
                symbol.setModifierMap(modifierMap);
                symbol.setUseDashArray(useDashArray);
                if (fillColor !== null) {
                    symbol.setFillColor(armyc2.c2sd.renderer.utilities.SymbolUtilities.getColorFromHexString(fillColor));
                }
                else
                {
                    symbol.setFillColor(null);
                }
                if (lineColor !== null) {
                    symbol.setLineColor(SymbolUtilities.getColorFromHexString(lineColor));
                }
                if (textColor !== null) {
                    symbol.setTextColor(SymbolUtilities.getColorFromHexString(textColor));
                }
                else
                {
                    symbol.setTextColor(symbol.getLineColor());
                    textColor = symbol.getLineColor().toHexString(false);
                }
                if (textBackgroundColor !== null) {
                    symbol.setTextBackgroundColor(SymbolUtilities.getColorFromHexString(textBackgroundColor));
                }
                else
                {
                    textBackgroundColor = RendererUtilities.getIdealOutlineColor(textColor);
                    symbol.setTextBackgroundColor(SymbolUtilities.getColorFromHexString(textBackgroundColor));
                }
                if (lineWidth > 0) {
                    symbol.setLineWidth(lineWidth);
                }
                if (altMode !== null) {
                    symbol.setAltitudeMode(altMode);
                }
                if (altitudes !== null) {
                    symbol.setModifiers_AM_AN_X(ModifiersTG.X_ALTITUDE_DEPTH, altitudes);
                }
                if (distances !== null) {
                    symbol.setModifiers_AM_AN_X(ModifiersTG.AM_DISTANCE, distances);
                }
                if (azimuths !== null) {
                    symbol.setModifiers_AM_AN_X(ModifiersTG.AN_AZIMUTH, azimuths);
                }
                if (armyc2.c2sd.renderer.utilities.SymbolUtilities.getBasicSymbolID(symbol.getSymbolID()) === ("G*F*AXS---****X")) {
                    if (symbol.getModifiers_AM_AN_X(ModifiersTG.AN_AZIMUTH) !== null && symbol.getModifiers_AM_AN_X(ModifiersTG.AM_DISTANCE) !== null) {
                        var anCount = symbol.getModifiers_AM_AN_X(ModifiersTG.AN_AZIMUTH).length;
                        var amCount = symbol.getModifiers_AM_AN_X(ModifiersTG.AM_DISTANCE).length;
                        var am = null;
                        if (amCount < ((Math.floor(anCount / 2)) + 1)) {
                            am = symbol.getModifiers_AM_AN_X(ModifiersTG.AM_DISTANCE);
                            if (am[0] !== 0)
                            {
                                am.splice(0, 0, 0);//insert 0 value into 0 location
                            }
                        }
                    }
                }
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "populateModifiers", err);
            }
            return true;
        },
        KMLize: function (id, name, description, symbolCode, shapes, modifiers, ipc, normalize, textColor)
        {
            /*
             if(shapes instanceof java.util.ArrayList)
             shapes = shapes.toArray();
             if(modifiers instanceof java.util.ArrayList)
             modifiers = modifiers.toArray();*/
            var kml = "";
            var tempModifier = null;

            var cdataStart = "<![CDATA[";
            var cdataEnd = "]]>";
            kml += ("<Folder id=\"" + id + "\">");
            kml += ("<name>" + cdataStart + name + cdataEnd + "</name>");
            kml += ("<visibility>1</visibility>");

            try
            {
                var len = shapes.size();
                for (var i = 0; i < len; i++) {
                    var shapesToAdd = sec.web.renderer.MultiPointHandler.ShapeToKMLString(description, symbolCode, shapes.get(i), ipc, normalize);
                    kml += shapesToAdd;
                }
                //var len2 = modifiers.length;
                var len2 = modifiers.size();
                for (var j = 0; j < len2; j++) {
                    //tempModifier = modifiers[j];
                    tempModifier = modifiers.get(j);

                    //assume kml labels will be centered on coordinate (as per google earth)
                    //sec.web.renderer.MultiPointHandler.AdjustModifierPointToCenter(tempModifier);

                    var labelsToAdd = sec.web.renderer.MultiPointHandler.LabelToKMLString(tempModifier, ipc, normalize, textColor);
                    kml += labelsToAdd;
                }
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "KMLize", err);
            }
            kml += "</Folder>";
            return kml;
        },
        JSONize: function (shapes, modifiers, ipc, normalize)
        {
            /*if(shapes instanceof java.util.ArrayList)
             shapes = shapes.toArray();
             if(modifiers instanceof java.util.ArrayList)
             modifiers = modifiers.toArray();*/

            var polygons = "",
                    lines = "",
                    labels = "",
                    jstr = "",
                    tempModifier = null;

            try
            {
                var len = shapes.size();
                for (var i = 0; i < len; i++)
                {
                    if (jstr.length > 0)
                    {
                        jstr += ",";
                    }
                    var shapesToAdd = sec.web.renderer.MultiPointHandler.ShapeToJSONString(shapes.get(i), ipc, normalize);
                    if (shapesToAdd.length > 0) {
                        if (shapesToAdd.substring(2, 6) === "line") //(shapesToAdd.startsWith("line", 2)) 
                        {
                            if (lines.length > 0)
                            {
                                lines += ",";
                            }
                            lines += shapesToAdd;
                        }
                        else if (shapesToAdd.substring(2, 6) === "poly")//(shapesToAdd.startsWith("polygon", 2)) 
                        {
                            if (polygons.length > 0)
                            {
                                polygons += ",";
                            }
                            polygons += shapesToAdd;
                        }
                    }
                }
                jstr += "\"polygons\": [" + polygons + "]," + "\"lines\": [" + lines + "],";
                var len2 = modifiers.size();
                labels = "";
                for (var j = 0; j < len2; j++) {
                    tempModifier = modifiers.get(j);

                    var labelsToAdd = sec.web.renderer.MultiPointHandler.LabelToJSONString(tempModifier, ipc, normalize);
                    if (labelsToAdd.length > 0) {
                        if (labels.length > 0) {
                            labels += ",";
                        }
                        labels += labelsToAdd;
                    }
                }
                jstr += "\"labels\": [" + labels + "]";
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "JSONize", err);
            }
            return jstr;
        },
        GeoJSONize: function (shapes, modifiers, ipc, normalize, textColor, textBackgroundColor)
        {
            var featureCollection = {"type": "FeatureCollection", "features": [], "properties": {}};
            try
            {
                var len = shapes.size();
                for (var i = 0; i < len; i++)
                {
                    var shapesToAdd = sec.web.renderer.MultiPointHandler.ShapeToGeoJSONString(shapes.get(i), ipc, normalize);
                    featureCollection.features.push(shapesToAdd);
                }

                var tempModifier, len2 = modifiers.size();
                for (var j = 0; j < len2; j++) {
                    tempModifier = modifiers.get(j);

                    //assume kml labels will be centered on coordinate (as per google earth)
                    //sec.web.renderer.MultiPointHandler.AdjustModifierPointToCenter(tempModifier);

                    var labelsToAdd = sec.web.renderer.MultiPointHandler.LabelToGeoJSONString(tempModifier, ipc, normalize, textColor, textBackgroundColor);
                    if (labelsToAdd)
                    {
                        featureCollection.features.push(labelsToAdd);
                    }

                }//*/
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "JSONize", err);
            }
            return featureCollection;
        },
        GeoCanvasize: function (shapes, modifiers, ipc, normalize, format, hexTextColor, hexTextBackgroundColor)
        {
            if (textInfoBuffer === null)
            {
                textInfoBuffer = document.createElement('canvas');
                textInfoBuffer.width = 1;
                textInfoBuffer.height = 1;
            }
            if (textInfoContext === null && textInfoBuffer.getContext !== undefined)
            {
                textInfoContext = textInfoBuffer.getContext('2d');
                textInfoContext.lineCap = "butt";
                textInfoContext.lineJoin = "miter";
                textInfoContext.miterLimit = 3;
                textInfoContextFont = RendererSettings.getModifierFont();
                textInfoContext.font = textInfoContextFont;
            }

            var height = RendererUtilities.measureTextWithFontString(textInfoContext.font, "Tj", textInfoContext).height;

            var tempBounds = null;
            var paths = [];
            var pathBounds = null;
            var labels = [];
            var labelBounds = null;
            var unionBounds = null;
            var rotatedBounds = null;
            try
            {

                var len = shapes.size();
                for (var i = 0; i < len; i++)
                {
                    //var shapesToAdd = sec.web.renderer.MultiPointHandler.ShapeToGeoJSONString(shapes.get(i), ipc, normalize);
                    var pathInfo = sec.web.renderer.MultiPointHandler.ShapesToGeoCanvas(shapes.get(i), ipc, normalize, _buffer);
                    tempBounds = pathInfo.path.getBounds();
                    tempBounds.grow(Math.round(pathInfo.lineWidth / 2));//adjust for line width so nothing gets clipped.
                    if (pathBounds === null)
                        pathBounds = tempBounds.clone();
                    else
                        pathBounds.union(tempBounds);
                    paths.push(pathInfo);
                }

                var tempModifier, len2 = modifiers.size();
                var tiTemp = null;
                for (var j = 0; j < len2; j++) {
                    tempModifier = modifiers.get(j);

                    var labelInfo = tempModifier;
                    var tempLocation = tempModifier.getModifierStringPosition();
                    //multipoint renderer is assuming text is centered vertically 
                    //so we add half height to location as text is drawn cetered at 
                    //the bottom.
                    var justify=tempModifier.getTextJustify() || "";
                    var strJustify="left";
                    if(justify===0)
                        strJustify="left";
                    else if(justify===1)
                        strJustify="center";
                    else if(justify===2)
                        strJustify="right";

                    textInfoContext.textAlign=strJustify;
                    //textInfoContext.textBaseline = "middle";
                    textInfoContext.textBaseline = "alphabetic";
                    tiTemp = new armyc2.c2sd.renderer.utilities.TextInfo(tempModifier.getModifierString(), tempLocation.x, tempLocation.y + (height / 2), textInfoContext, null);
                    tiTemp.textAlign=strJustify;
                    //tiTemp.textBaseline = "middle";
                    tiTemp.textBaseline = "alphabetic";
                    var bounds = tiTemp.getTextBounds();
                    var degrees = parseFloat(tempModifier.getModifierStringAngle());
                    if (degrees !== 0)
                    {
                        bounds = this.GetRotatedRectangleBounds(bounds, tiTemp.getLocation(), degrees);
                        rotatedBounds = bounds;
                        tiTemp.angle = degrees;
                    }

                    if (tiTemp)
                    {
                        labels.push(tiTemp);
                        if (labelBounds)
                        {
                            if(rotatedBounds)
                                labelBounds.union(rotatedBounds);
                            else if(bounds)
                                labelBounds.union(bounds);
                        }
                        else
                        {
                            if(rotatedBounds)
                                labelBounds = rotatedBounds;
                            else if(bounds)
                                labelBounds = bounds;
                        }
                    }


                }//*/
                unionBounds = pathBounds.clone();
                if (labelBounds)
                {
                    unionBounds.union(labelBounds);
                }

                //get geo bounds for canvas
                var coordTL = new armyc2.c2sd.graphics2d.Point2D();
                coordTL.setLocation(unionBounds.getX(), unionBounds.getY());
                var coordBR = new armyc2.c2sd.graphics2d.Point2D();
                coordBR.setLocation(unionBounds.getX() + unionBounds.getWidth(), unionBounds.getY() + unionBounds.getHeight());

                var geoCoordTL = ipc.PixelsToGeo(coordTL);
                var geoCoordBR = ipc.PixelsToGeo(coordBR);
                if (normalize)
                {
                    geoCoordTL = this.NormalizeCoordToGECoord(geoCoordTL);
                    geoCoordBR = this.NormalizeCoordToGECoord(geoCoordBR);
                }
                geoCoordTL.setLocation(geoCoordTL.getX().toFixed(_decimalAccuracy), geoCoordTL.getY().toFixed(_decimalAccuracy));
                geoCoordBR.setLocation(geoCoordBR.getX().toFixed(_decimalAccuracy), geoCoordBR.getY().toFixed(_decimalAccuracy));
            }
            catch (err)
            {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "GeoJSONize", err);
            }
            //if(renderToCanvas)
            //{
            var geoCanvas = this.RenderShapeInfoToCanvas(paths, labels, unionBounds, geoCoordTL, geoCoordBR, format, hexTextColor, hexTextBackgroundColor);
            return geoCanvas;
            //}
            //else
            //  return {paths:paths,textInfos:labels,bounds:unionBounds,geoTL:geoCoordTL,geoBR:geoCoordBR};
        },
        /**
         * 
         * @param {type} paths
         * @param {type} textInfos
         * @param {type} bounds
         * @param {type} geoTL
         * @param {type} geoBR
         * @param {type} format 3 for canvas, 4 for image as dataurl
         * @param {String} hexTextColor "#FFFFFF"
         * @param {String} hexTextBackgroundColor "#FFFFFF"
         * @returns {image:buffer, geoTL:geoTL, geoBR:geoBR} OR
         *          {dataURL:buffer.toDataURL(), geoTL:geoTL, geoBR:geoBR}
         */
        RenderShapeInfoToCanvas: function (paths, textInfos, bounds, geoTL, geoBR, format, hexTextColor, hexTextBackgroundColor)
        {
            var buffer = null;
            if (format === 4)
            {
                if (tempMPBuffer === null)
                {
                    tempMPBuffer = document.createElement('canvas');
                }
                if (tempMPContext === null)
                {
                    tempMPContext = tempMPBuffer.getContext('2d');
                }
                buffer = tempMPBuffer;
                ctx = tempMPContext;
            }
            else
            {
                buffer = document.createElement('canvas');
            }

            var pathSize = paths.length;
            var textSize = textInfos.length;
            var pathInfo = paths;
            var pi = null;
            var bounds = bounds;
            buffer.width = bounds.getWidth();
            buffer.height = bounds.getHeight();

            if (format === 4)//recycling buffer so we need to make sure it's clean.
            {
                ctx.clearRect(0, 0, bounds.getWidth(), bounds.getHeight());
            }

            var lineColor = "#000000";
            var ctx = buffer.getContext('2d');

            /*//TEST/////////////////////////
             ctx.setTransform(1,0,0,1,0,0);
             ctx.lineWidth = 5;
             ctx.beginPath();
             ctx.strokeStyle = "#0000FF";
             ctx.moveTo(10,10);
             ctx.lineTo(50,50);
             ctx.stroke();
             ////////////////////////////////*/

            ctx.translate(bounds.getX() * -1, bounds.getY() * -1);
            for (var i = 0; i < pathSize; i++)
            {
                pi = pathInfo[i];
                if (pi.lineColor !== null)
                    lineColor = pi.lineColor;
                if (pi.lineWidth)
                    ctx.lineWidth = pi.lineWidth;
                if (pi.lineColor !== null)
                {
                    ctx.strokeStyle = pi.lineColor;
                    ctx.globalAlpha = 1;
                    pi.path.stroke(ctx);
                }
                if (pi.fillColor !== null)
                {
                    ctx.fillStyle = pi.fillColor;
                    ctx.globalAlpha = pi.alpha;
                    pi.path.fill(ctx);
                }
            }


            ctx.setTransform(1, 0, 0, 1, 0, 0);
            if (textInfos.length > 0)
            {
                //apply mpmodfier font
                //loop and render text
                var tis = textInfos;
                var ti = null;
                var angle = 0;
                var tbm = RendererSettings.getTextBackgroundMethod();
                var outlineWidth = RendererSettings.getTextOutlineWidth();
                var mpFont = RendererSettings.getModifierFont();

                //set text color and outline/fill color
                var htbc = hexTextBackgroundColor || RendererUtilities.getIdealOutlineColor(hexTextColor || lineColor);
                var htc = hexTextColor || lineColor;
                ctx.fillStyle = htc;
                var outlineStyle = htbc;

                ctx.globalAlpha = 1;
                ctx.lineCap = "butt";
                ctx.lineJoin = "miter";
                ctx.miterLimit = 3;
                ctx.font = mpFont;
                //ctx.textBaseline = "top";
                //ctx.textBaseline = "Alphabetic";
                //ctx.textBaseline = "middle";
                //ctx.textAlign="left";
                if (outlineWidth > 0)
                    ctx.lineWidth = (outlineWidth * 2) + 1;
                ctx.strokeStyle = outlineStyle;
                var offsetX = bounds.getX();
                var offsetY = bounds.getY();
                var tX = 0;
                var tY = 0;
                //362,422
                var height = RendererUtilities.measureTextWithFontString(mpFont, "Tj", ctx).height;
                //ctx.fillText("test",10,height + 80);
                for (var j = 0; j < textSize; j++)
                {
                    
                    ti = tis[j];

                    if(ti.textAlign)
                        ctx.textAlign=ti.textAlign;
                    if(ti.textBaseline)
                        ctx.textBaseline=ti.textBaseline;
                    
                    //ti.getTextOutlineBounds().stroke(ctx);
                    ////TEST: stroke to see bounds (before transform)
                    //ctx.translate(bounds.getX() * - 1, bounds.getY() * - 1);
                    angle = ti.angle;

                    tX = ((ti.getLocation().getX()) - offsetX);
                    tY = ((ti.getLocation().getY()) - offsetY);
                    ctx.translate(tX, tY);

                    //TEST
                    /*
                     ctx.save();
                     ctx.setTransform(1,0,0,1,0,0);
                     
                     ctx.strokeStyle="#00FF00";
                     var tiRect = ti.getTextOutlineBounds();
                     ctx.translate(tiRect.x - offsetX, tiRect.y - offsetY);
                     
                     //TEST: stroke to see bounds
                     ctx.strokeRect(0,0,tiRect.getWidth(),tiRect.getHeight());
                     
                     ctx.restore();
                     ctx.setTransform(1,0,0,1,0,0);
                     ctx.translate(tX, tY);
                     //*/

                    if (angle !== 0)
                    {
                        ctx.rotate(angle * Math.PI / 180);
                    }

                    switch (tbm)
                    {
                        case RendererSettings.TextBackgroundMethod_OUTLINE:
                        case RendererSettings.TextBackgroundMethod_OUTLINE_QUICK:
                            if (outlineWidth > 0)
                            {
                                ctx.strokeText(ti.text, 0, 0);
                                ctx.fillText(ti.text, 0, 0);
                            }
                            break;
                        case RendererSettings.TextBackgroundMethod_COLORFILL:
                            ctx.fillStyle = htbc;
                            var rectFill = ti.getTextOutlineBounds();
                            rectFill.setLocation(0 - outlineWidth, 0 - Math.round(rectFill.getHeight() / 2));
                            rectFill.fill(ctx);
                            ctx.fillStyle = htc;
                            ctx.fillText(ti.text, 0, 0);
                            break;
                        default:
                            ctx.fillText(ti.text, 0, 0);
                            break;

                    }



                    //TEST: stroke to see draw point of text
                    //ctx.strokeRect(0,0,1,1);

                    //ti.fillText(ctx);



                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                }



            }
            //test

            /*ctx.translate(bounds.getX() * - 1, bounds.getY() * - 1);
             ctx.strokeStyle = "#000000";
             ctx.strokeRect(bounds.getX(), bounds.getY(),buffer.width,buffer.height);//*/

            /*ctx.setTransform(1,0,0,1,0,0);
             ctx.translate((bounds.getX()+100),(bounds.getY() + 100));
             ctx.rotate(45*Math.PI/180);
             ctx.fillText("test",0,0);//*/
            //ctx.fillText("test",362,422);
            //georeference buffer

            if (format === 3)
            {
                //return object with canvas and geo points
                return {image: buffer, geoTL: geoTL, geoBR: geoBR, width: buffer.width, height: buffer.height};
            }
            else if (format === 4)
            {
                //return object with dataurl and geo points
                return {dataURL: buffer.toDataURL(), geoTL: geoTL, geoBR: geoBR, width: buffer.width, height: buffer.height};
            }
            else
            {//should never get here:
                //just return the canvas
                buffer.geoTL = geoTL;
                buffer.geoBR = geoBR;
                return buffer;
            }




        },
        IsOnePointSymbolCode: function (symbolCode)
        {
            var symStd = armyc2.c2sd.renderer.utilities.RendererSettings.getSymbologyStandard();
            var basicCode = SymbolUtilities.getBasicSymbolID(symbolCode);
            var sd = null;
            if (SymbolDefTable.hasSymbolDef(basicCode, symStd))
            {
                sd = SymbolDefTable.getSymbolDef(basicCode, symStd);

                if (symbolCode.charAt(0) === 'G' && sd.maxPoints === 1)
                    return true;
            }

            //some airspaces affected
            if (symbolCode.equals("CAKE-----------"))
                return true;
            else if (symbolCode.equals("CYLINDER-------"))
                return true;
            else if (symbolCode.equals("RADARC---------"))
                return true;

            return false;
        },
        normalizePoints: function (shape, ipc)
        {
            var geoCoords = new Array();
            for (var j = 0; j < shape.size(); j++)
            {
                var coord = shape.get(j);
                var geoCoord = ipc.PixelsToGeo(coord);
                geoCoord = this.NormalizeCoordToGECoord(geoCoord);
                var latitude = geoCoord.getY();
                var longitude = geoCoord.getX();
                var pt = new armyc2.c2sd.graphics2d.Point2D();
                pt.setLocation(longitude, latitude);
                geoCoords[j] = pt;
            }
            var normalize = sec.web.renderer.MultiPointHandler.crossesIDL(geoCoords);
            return normalize;
        },
        ShapeToKMLString: function (description, symbolCode, shapeInfo, ipc, normalize)
        {
            var kml = "",
                    lineColor = null,
                    fillColor = null,
                    googleLineColor = null,
                    googleFillColor = null,
                    lineStyleId = "lineColor",
                    stroke = null,
                    lineWidth = 4;
            var cdataStart = "<![CDATA[";
            var cdataEnd = "]]>";
            symbolCode = sec.web.renderer.utilities.JavaRendererUtilities.normalizeSymbolCode(symbolCode);
            kml += ("<Placemark>");//("<Placemark id=\"" + id + "_mg" + "\">");
            if (description)
            {
                kml += ("<description>" + cdataStart + description + cdataEnd + "</description>");
            }
            kml += ("<Style id=\"" + lineStyleId + "\">");
            lineColor = shapeInfo.getLineColor();
            if (lineColor !== null) {
                googleLineColor = shapeInfo.getLineColor().toKMLHexString();
                stroke = shapeInfo.getStroke();
                if (stroke !== null) {
                    lineWidth = Math.round(stroke.getLineWidth());
                    //lineWidth++;
                }
                kml += ("<LineStyle>");
                kml += ("<color>" + googleLineColor + "</color>");
                kml += ("<colorMode>normal</colorMode>");
                kml += ("<width>" + lineWidth + "</width>");
                kml += ("</LineStyle>");
            }
            fillColor = shapeInfo.getFillColor();
            if (fillColor !== null) {
                googleFillColor = shapeInfo.getFillColor().toKMLHexString();
                kml += ("<PolyStyle>");
                kml += ("<color>" + googleFillColor + "</color>");
                kml += ("<colorMode>normal</colorMode>");
                kml += ("<fill>1</fill>");
                if (lineColor !== null)
                    kml += ("<outline>1</outline>");
                else
                    kml += ("<outline>0</outline>");
                kml += ("</PolyStyle>");
            }
            kml += ("</Style>");
            var shapesArray = shapeInfo.getPolylines();
            var len = shapesArray.size();
            var len2 = 0;
            //var len = shapesArray.length;
            kml += ("<MultiGeometry>");
            for (var i = 0; i < len; i++) {
                var shape = shapesArray.get(i);
                normalize = sec.web.renderer.MultiPointHandler.normalizePoints(shape, ipc);
                if (lineColor !== null && fillColor === null) {
                    kml += ("<LineString>");
                    kml += ("<tessellate>1</tessellate>");
                    kml += ("<altitudeMode>clampToGround</altitudeMode>");
                    kml += ("<coordinates>");
                    //for (var j = 0; j < shape.length; j++)
                    len2 = shape.size();
                    for (var j = 0; j < len2; j++)
                    {
                        var coord = shape.get(j);
                        //var coord = shape[j];
                        var geoCoord = ipc.PixelsToGeo(coord);
                        if (normalize)
                            geoCoord = this.NormalizeCoordToGECoord(geoCoord);
                        var latitude = geoCoord.getY().toFixed(_decimalAccuracy);
                        var longitude = geoCoord.getX().toFixed(_decimalAccuracy);
                        kml += (longitude);
                        kml += (",");
                        kml += (latitude);
                        kml += (" ");
                    }
                    kml += ("</coordinates>");
                    kml += ("</LineString>");
                }

                if (fillColor !== null) {
                    if (i === 0)
                        kml += ("<Polygon>");
                    if (i === 1 && len > 1)
                        kml += ("<innerBoundaryIs>");
                    else
                        kml += ("<outerBoundaryIs>");
                    kml += ("<LinearRing>");
                    kml += ("<altitudeMode>clampToGround</altitudeMode>");
                    kml += ("<tessellate>1</tessellate>");
                    kml += ("<coordinates>");

                    //this section is a workaround for a google earth bug. Issue 417 was closed
                    //for linestrings but they did not fix the smae issue for fills. If Google fixes the issue
                    //for fills then this section will need to be commented or it will induce an error.
                    var lastLongitude = null;
                    if (normalize === false && this.IsOnePointSymbolCode(symbolCode))
                    {
                        for (var j = 0; j < shape.size(); j++)
                        {
                            var coord = shape.get(j);
                            var geoCoord = ipc.PixelsToGeo(coord);
                            var longitude = geoCoord.getX().toFixed(_decimalAccuracy);
                            if (lastLongitude !== null)
                            {
                                if (Math.abs(longitude - lastLongitude) > 180)
                                {
                                    normalize = true;
                                    break;
                                }
                            }
                            lastLongitude = longitude;
                        }
                    }
                    //end section
                    for (var j = 0; j < shape.size(); j++)
                    {
                        var coord = shape.get(j);
                        //var coord = shape[j];
                        var geoCoord = ipc.PixelsToGeo(coord);
                        var latitude = geoCoord.getY().toFixed(_decimalAccuracy);
                        var longitude = geoCoord.getX().toFixed(_decimalAccuracy);
                        //fix for fill crossing DTL   
                        if (normalize)
                        {
                            if (longitude > 0)
                            {
                                longitude -= 360;
                            }
                        }
                        kml += (longitude);
                        kml += (",");
                        kml += (latitude);
                        kml += (" ");
                    }
                    kml += ("</coordinates>");
                    kml += ("</LinearRing>");
                    if (i === 1 && len > 1)
                        kml += ("</innerBoundaryIs>");
                    else
                        kml += ("</outerBoundaryIs>");
                    if (i === len - 1)
                        kml += ("</Polygon>");
                }
            }
            kml += ("</MultiGeometry>");
            kml += ("</Placemark>");
            return kml;
        },
        AdjustModifierPointToCenter: function (modifier)
        {
            try {

                var degrees = parseFloat(modifier.getModifierStringAngle());
                var text = modifier.getModifierString();
                var location = modifier.getGlyphPosition();
                var font = RendererSettings.getMPModifierFont();
                //armyc2.c2sd.renderer.so.Point
                var bounds = armyc2.c2sd.renderer.utilities.RendererUtilities.getTextBounds(null, text, location, font);

                var offsetX = 0;
                var offsetY = 0;

                if (degrees !== 0)
                {

                    //angle in radians
                    var theta = degrees * (Math.PI / 180);
                    //4 corners before rotation
                    var tl = {x: (0), y: (bounds.height)};
                    var bl = {x: 0, y: 0};
                    var tr = {x: bounds.width, y: bounds.height};
                    var br = {x: bounds.width, y: 0};//*/

                    //new bounding box
                    var bb = {};

                    var offsetX = 0;
                    var offsetY = 0;
                    //TODO: do some math to adjust the point based on the angle
                    //where x0,y0 is the center around which you are rotating.
                    //x2 = x0+(x-x0)*cos(theta)+(y-y0)*sin(theta)
                    //y2 = y0+(x-x0)*sin(theta)+(y-y0)*cos(theta)
                    var x0 = 0;
                    var y0 = 0;

                    tl.x = (x0 + (tl.x - x0) * Math.cos(theta) - (tl.y - y0) * Math.sin(theta));
                    tl.y = (y0 + (tl.x - x0) * Math.sin(theta) + (tl.y - y0) * Math.cos(theta));

                    tr.x = (x0 + (tr.x - x0) * Math.cos(theta) - (tr.y - y0) * Math.sin(theta));
                    tr.y = (y0 + (tr.x - x0) * Math.sin(theta) + (tr.y - y0) * Math.cos(theta));

                    br.x = (x0 + (br.x - x0) * Math.cos(theta) - (br.y - y0) * Math.sin(theta));
                    br.y = (y0 + (br.x - x0) * Math.sin(theta) + (br.y - y0) * Math.cos(theta));

                    bb.x = Math.min(0, tl.x, tr.x, br.x);
                    bb.y = Math.max(0, tl.y, tr.y, br.y);

                    bb.width = Math.max(0, tl.x, tr.x, br.x) - bb.x;
                    bb.height = bb.y - Math.min(0, tl.y, tr.y, br.y);

                    offsetX += bb.width / 2;
                    offsetY += bb.height / 2;
                }
                else
                {
                    offsetX += bounds.width / 2;
                    offsetY += bounds.height / 2;
                }

                var point = modifier.getGlyphPosition();//modifier.getModifierStringPosition();
                point.x += offsetX;
                point.y += offsetY;
                modifier.setGlyphPosition(point);//modifier.setModifierStringPosition(point);


            } catch (err) {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "AdjustModifierPointToCenter", err);
            }//*/
        },
        /**
         * 
         * @param {armyc2.c2sd.renderer.so.Rectangle} rectangle
         * @param {armyc2.c2sd.renderer.so.Point} pointOfRotation
         * @param {Number} angle
         * @returns {armyc2.c2sd.renderer.so.Rectangle}
         */
        GetRotatedRectangleBounds: function (rectangle, pointOfRotation, angle)
        {
            try {

                var degrees = angle;

                var location = pointOfRotation;

                //armyc2.c2sd.renderer.so.Point
                var bounds = rectangle;

                //slacker math until I get real math working
                //produces extra large bounds but ensures space is alloted no matter what the text angle.
                var radius = bounds.width + bounds.height;
                bounds = new armyc2.c2sd.renderer.so.Rectangle(location.x - radius, location.y - radius, radius * 2, radius * 2);
                return bounds;//end slacker math

//            if(degrees !== 0)
//            {
//                //NOTE: flipping y sign because 2d drawing positive y goes down instead of up.
//                //angle in radians
//                var theta = -(degrees * (Math.PI / 180));
//                //4 corners before rotation
//                /*var tl = {x:(bounds.x),y:(bounds.y)};
//                var bl = {x:bounds.x,y:(bounds.y + bounds.height)};
//                var tr = {x:(bounds.x + bounds.width),y:bounds.y};
//                var br = {x:(bounds.x + bounds.width),y:(bounds.y + bounds.height)};//*/
//                
//                /*var tl = {x:(bounds.x),y:-(bounds.y)};
//                var bl = {x:bounds.x,y:-(bounds.y + bounds.height)};
//                var tr = {x:(bounds.x + bounds.width),y:-bounds.y};
//                var br = {x:(bounds.x + bounds.width),y:-(bounds.y + bounds.height)};//*/
//                
//               var tl = {x:(bounds.x),y:-(bounds.y + bounds.height)};
//                var bl = {x:bounds.x,y:-(bounds.y)};
//                var tr = {x:(bounds.x + bounds.width),y:-(bounds.y + bounds.height)};
//                var br = {x:(bounds.x + bounds.width),y:-(bounds.y)};//*/
//
//                //new bounding box
//                var bb = {};
//
//                /*
//                //TODO: do some math to adjust the point based on the angle
//                //where x0,y0 is the center around which you are rotating.
//                //x2 = x0+(x-x0)*cos(theta)+(y-y0)*sin(theta)
//                //y2 = y0+(x-x0)*sin(theta)+(y-y0)*cos(theta)
//                var x0 = location.x;
//                var y0 = location.y;
//
//                bl.x = (x0 + (bl.x - x0) * Math.cos(theta) - (bl.y - y0) * Math.sin(theta));
//                bl.y = (y0 + (bl.x - x0) * Math.sin(theta) + (bl.y - y0) * Math.cos(theta));
//
//                tl.x = (x0 + (tl.x - x0) * Math.cos(theta) - (tl.y - y0) * Math.sin(theta));
//                tl.y = (y0 + (tl.x - x0) * Math.sin(theta) + (tl.y - y0) * Math.cos(theta));
//
//                tr.x = (x0 + (tr.x - x0) * Math.cos(theta) - (tr.y - y0) * Math.sin(theta));
//                tr.y = (y0 + (tr.x - x0) * Math.sin(theta) + (tr.y - y0) * Math.cos(theta));
//
//                br.x = (x0 + (br.x - x0) * Math.cos(theta) - (br.y - y0) * Math.sin(theta));
//                br.y = (y0 + (br.x - x0) * Math.sin(theta) + (br.y - y0) * Math.cos(theta));//*/
//                
//                
//                //TODO: do some math to adjust the point based on the angle
//                //where x0,y0 is the center around which you are rotating.
//                //x2 = x0+(x-x0)*cos(theta)+(y-y0)*sin(theta)
//                //y2 = y0+(x-x0)*sin(theta)+(y-y0)*cos(theta)
//                var x0 = location.x;
//                var y0 = location.y;
//
//                bl.x = Math.cos(theta) * (bl.x - x0) - Math.sin(theta) * (bl.y - y0) + x0;
//                bl.y = Math.sin(theta) * (bl.x - x0) + Math.cos(theta) * (bl.y - y0) + y0;
//
//                tl.x = Math.cos(theta) * (tl.x - x0) - Math.sin(theta) * (tl.y - y0) + x0;
//                tl.y = Math.sin(theta) * (tl.x - x0) + Math.cos(theta) * (tl.y - y0) + y0;
//
//                tr.x = Math.cos(theta) * (tr.x - x0) - Math.sin(theta) * (tr.y - y0) + x0;
//                tr.y = Math.sin(theta) * (tr.x - x0) + Math.cos(theta) * (tr.y - y0) + y0;
//
//                br.x = Math.cos(theta) * (br.x - x0) - Math.sin(theta) * (br.y - y0) + x0;
//                br.y = Math.sin(theta) * (br.x - x0) + Math.cos(theta) * (br.y - y0) + y0;//*/
//                
//                //new equation
//                //var rotatedX = Math.cos(angle) * (point.x - center.x) - Math.sin(angle) * (point.y - center.y) + center.y;
//                //var rotatedy = Math.sin(angle) * (point.x - center.x) + Math.cos(angle) * (point.y - center.y) + center.y;
//
//                bb.x = Math.min(bl.x,tl.x,tr.x,br.x);
//                bb.y = Math.min(bl.y,tl.y,tr.y,br.y);
//                
//                bb.width = Math.max(bl.x,tl.x,tr.x,br.x) - bb.x;
//                bb.height = bb.y - Math.max(bl.y,tl.y,tr.y,br.y);
//                
//                //flip y back.
//                bb.y = -bb.y + bb.height;
//                bb.height = -bb.height;
//
//                return new armyc2.c2sd.renderer.so.Rectangle(bb.x,bb.y,bb.width,bb.height);
//            }
//            else
//            {
//                return bounds;
//            }

            } catch (err) {
                armyc2.c2sd.renderer.utilities.ErrorLogger.LogException("MultiPointHandler", "AdjustModifierPointToCenter", err);
                return null;
            }//*/
        },
        ShapeToJSONString: function (shapeInfo, ipc, normalize)
        {
            var JSONed = "";
            var fillColor = null;
            var lineColor = null;
            if (shapeInfo.getLineColor() !== null) {
                lineColor = shapeInfo.getLineColor().toHexString();
            }
            if (shapeInfo.getFillColor() !== null) {
                fillColor = shapeInfo.getFillColor().toHexString();
            }
            var stroke = null;
            stroke = shapeInfo.getStroke();
            var lineWidth = 4;
            if (stroke !== null) {
                lineWidth = Math.round(stroke.getLineWidth());
            }
            var shapesArray = shapeInfo.getPolylines();
            for (var i = 0; i < shapesArray.size(); i++) {
                var shape = shapesArray.get(i);

                normalize = this.normalizePoints(shape, ipc);

                if (fillColor !== null) {
                    JSONed += ("{\"polygon\":[");
                } else {
                    JSONed += ("{\"line\":[");
                }
                for (var j = 0; j < shape.size(); j++) {
                    var coord = shape.get(j);
                    var geoCoord = ipc.PixelsToGeo(coord);
                    if (normalize)
                        geoCoord = this.NormalizeCoordToGECoord(geoCoord);
                    var latitude = geoCoord.getY().toFixed(_decimalAccuracy);
                    var longitude = geoCoord.getX().toFixed(_decimalAccuracy);
                    coord = new armyc2.c2sd.graphics2d.Point2D();

                    //fix for fill crossing DTL
                    if (normalize && fillColor !== null)
                    {
                        if (longitude > 0)
                        {
                            longitude -= 360;
                        }
                    }

                    coord.setLocation(longitude, latitude);
                    shape[j] = coord;
                    JSONed += ("[");
                    JSONed += (longitude);
                    JSONed += (",");
                    JSONed += (latitude);
                    JSONed += ("]");
                    if (j < (shape.size() - 1)) {
                        JSONed += (",");
                    }
                }
                JSONed += ("]");
                if (lineColor !== null) {
                    JSONed += (",\"lineColor\":\"");
                    JSONed += (lineColor);
                    JSONed += ("\"");
                }
                if (fillColor !== null) {
                    JSONed += (",\"fillColor\":\"");
                    JSONed += (fillColor);
                    JSONed += ("\"");
                }
                JSONed += (",\"lineWidth\":\"");
                JSONed += (lineWidth);
                JSONed += ("\"");
                JSONed += ("}");
                if (i < (shapesArray.size() - 1)) {
                    JSONed += (",");
                }
            }
            return JSONed;
        },
        ShapeToGeoJSONString: function (shapeInfo, ipc, normalize)
        {
            var JSONed = "";
            var fillColor = null;
            var lineColor = null;
            var alpha = 255;

            var feature = {};
            feature.type = "Feature";
            feature.properties = {};
            feature.properties.label = "";
            var geometry = {};
            if (shapeInfo.getLineColor() !== null) {
                lineColor = shapeInfo.getLineColor();
                feature.properties.strokeColor = lineColor.toHexString(false);
                alpha = lineColor.getAlpha();
                /*if(alpha === 0)
                 feature.properties.lineOpacity = 0;
                 else
                 feature.properties.lineOpacity = alpha / 255;//*/
                feature.properties.lineOpacity = alpha / 255;
                geometry["type"] = "MultiLineString";
            }
            if (shapeInfo.getFillColor() !== null) {
                fillColor = shapeInfo.getFillColor();
                feature.properties.fillColor = fillColor.toHexString(false);
                alpha = fillColor.getAlpha();
                /*if(alpha === 0)
                 feature.properties.fillOpacity = 0;
                 else
                 feature.properties.fillOpacity = alpha / 255;//*/
                feature.properties.fillOpacity = alpha / 255;
                geometry["type"] = "Polygon";
            }

            var stroke = null;
            stroke = shapeInfo.getStroke();
            var lineWidth = 4;
            if (stroke !== null) {
                lineWidth = Math.round(stroke.getLineWidth());
            }
            feature.properties.strokeWidth = lineWidth;
            feature.properties.strokeWeight = lineWidth;


            //geometry["coordinates"] = [[x,y],[xn,yn]];
            var coords = [];
            var line;
            var shapesArray = shapeInfo.getPolylines();
            for (var i = 0; i < shapesArray.size(); i++)
            {
                var shape = shapesArray.get(i);

                normalize = this.normalizePoints(shape, ipc);

                line = [];
                for (var j = 0; j < shape.size(); j++) {
                    var coord = shape.get(j);
                    var geoCoord = ipc.PixelsToGeo(coord);
                    if (normalize)
                        geoCoord = this.NormalizeCoordToGECoord(geoCoord);
                    var latitude = geoCoord.getY().toFixed(_decimalAccuracy);
                    var longitude = geoCoord.getX().toFixed(_decimalAccuracy);

                    latitude = parseFloat(latitude);
                    longitude = parseFloat(longitude);

                    //fix for fill crossing DTL
                    if (normalize && fillColor !== null)
                    {
                        if (longitude > 0)
                        {
                            longitude -= 360;
                        }
                    }

                    line.push([longitude, latitude]);
                }
                coords.push(line);
            }
            geometry["coordinates"] = coords;
            feature["geometry"] = geometry;
            return feature;
        },
        /**
         * 
         * @param {type} shapeInfos
         * @param {type} ipc
         * @param {type} normalize
         * @returns {feature} {path, lineColor, fillColor, lineWidth, bounds}
         */
        ShapesToGeoCanvas: function (shapeInfo, ipc, normalize)
        {

            var pathInfo = null;
            var path = null;
            var fillColor = null;
            var lineColor = null;
            var lineWidth = null;
            var alpha = null;
            var dashArray = null;


            var feature = {};
            feature.type = "Feature";
            feature.properties = {};
            feature.properties.label = "";
            var geometry = {};
            if (shapeInfo.getLineColor() !== null) {
                lineColor = shapeInfo.getLineColor();
                alpha = lineColor.getAlpha() / 255;
                lineColor = lineColor.toHexString(false);
            }
            if (shapeInfo.getFillColor() !== null) {
                fillColor = shapeInfo.getFillColor();
                alpha = fillColor.getAlpha() / 255;
                fillColor = fillColor.toHexString(false);
            }

            var stroke = null;
            stroke = shapeInfo.getStroke();
            lineWidth = 4;
            if (stroke !== null) {
                lineWidth = Math.round(stroke.getLineWidth());
                dashArray = stroke.getDashArray();
            }

            var shapesArray = shapeInfo.getPolylines();
            path = new armyc2.c2sd.renderer.so.Path();
            for (var i = 0; i < shapesArray.size(); i++)
            {

                var shape = shapesArray.get(i);

                for (var j = 0; j < shape.size(); j++) {
                    var coord = shape.get(j);
                    if (j === 0)
                    {
                        path.moveTo(coord.x, coord.y);
                    }
                    else if (dashArray)
                    {
                        path.dashedLineTo(coord.x, coord.y, dashArray);
                    }//*/
                    else
                    {
                        path.lineTo(coord.x, coord.y);
                    }

                }

            }
            pathInfo = {path: path, lineWidth: lineWidth, lineColor: lineColor, fillColor: fillColor, dashArray: dashArray, alpha: alpha};
            return pathInfo;
        },
        LabelToKMLString: function (shapeInfo, ipc, normalize, textColor)
        {
            var cdataStart = "<![CDATA[";
            var cdataEnd = "]]>";
            var kml = "";
            var coord = new armyc2.c2sd.graphics2d.Point2D();
            //coord.setLocation(shapeInfo.getGlyphPosition().getX(), shapeInfo.getGlyphPosition().getY());
            coord.setLocation(shapeInfo.getModifierStringPosition().getX(), shapeInfo.getModifierStringPosition().getY());
            var geoCoord = ipc.PixelsToGeo(coord);
            if (normalize)
                geoCoord = this.NormalizeCoordToGECoord(geoCoord);
            var latitude = geoCoord.getY().toFixed(_decimalAccuracy);
            var longitude = geoCoord.getX().toFixed(_decimalAccuracy);
            var angle = Math.round(shapeInfo.getModifierStringAngle());
            var text = shapeInfo.getModifierString();
            var kmlScale = RendererSettings.getKMLLabelScale();
            if (kmlScale > 0 && text !== null && text !== ("")) {
                kml += ("<Placemark>");//("<Placemark id=\"" + id + "_lp" + i + "\">");
                kml += ("<name>" + cdataStart + text + cdataEnd + "</name>");
                kml += ("<Style>");
                kml += ("<IconStyle>");
                kml += ("<scale>.7</scale>");
                kml += ("<heading>" + angle + "</heading>");
                kml += ("<Icon>");
                kml += ("<href></href>");
                kml += ("</Icon>");
                kml += ("</IconStyle>");
                kml += ("<LabelStyle>");
                if (textColor)
                    kml += ("<color>" + textColor + "</color>");
                kml += ("<scale>" + kmlScale + "</scale>");
                kml += ("</LabelStyle>");
                kml += ("</Style>");
                kml += ("<Point>");
                kml += ("<extrude>1</extrude>");
                kml += ("<altitudeMode>relativeToGround</altitudeMode>");
                kml += ("<coordinates>");
                kml += (longitude);
                kml += (",");
                kml += (latitude);
                kml += ("</coordinates>");
                kml += ("</Point>");
                kml += ("</Placemark>");
            } else {
                return "";
            }
            return kml;
        },
        LabelToJSONString: function (shapeInfo, ipc, normalize)
        {
            var JSONed = ("{\"label\":");
            var coord = new armyc2.c2sd.graphics2d.Point2D();
            coord.setLocation(shapeInfo.getGlyphPosition().getX(), shapeInfo.getGlyphPosition().getY());
            var geoCoord = ipc.PixelsToGeo(coord);
            if (normalize)
                geoCoord = this.NormalizeCoordToGECoord(geoCoord);
            var latitude = geoCoord.getY().toFixed(_decimalAccuracy);
            var longitude = geoCoord.getX().toFixed(_decimalAccuracy);
            var angle = shapeInfo.getModifierStringAngle();
            coord.setLocation(longitude, latitude);
            shapeInfo.setGlyphPosition(coord);
            var text = shapeInfo.getModifierString();
            if (text !== null && text !== ("")) {
                JSONed += ("[");
                JSONed += (longitude);
                JSONed += (",");
                JSONed += (latitude);
                JSONed += ("]");
                JSONed += (",\"text\":\"");
                JSONed += (text);
                JSONed += ("\"");
                JSONed += (",\"angle\":\"");
                JSONed += (angle);
                JSONed += ("\"}");
            } else {
                return "";
            }
            return JSONed;
        },
        LabelToGeoJSONString: function (shapeInfo, ipc, normalize, textColor, textBackgroundColor)
        {
            var JSONed = "";
            var fillColor = null;
            var lineColor = null;
            var alpha = 255;


            var feature = {};
            feature.type = "Feature";
            feature.properties = {};
            var geometry = {};

            var RS = armyc2.c2sd.renderer.utilities.RendererSettings;
            var RU = armyc2.c2sd.renderer.utilities.RendererUtilities;
            var coord = new armyc2.c2sd.graphics2d.Point2D();
            //coord.setLocation(shapeInfo.getGlyphPosition().getX(), shapeInfo.getGlyphPosition().getY());
            coord.setLocation(shapeInfo.getModifierStringPosition().getX(), shapeInfo.getModifierStringPosition().getY());
            var geoCoord = ipc.PixelsToGeo(coord);
            if (normalize)
                geoCoord = this.NormalizeCoordToGECoord(geoCoord);
            var latitude = geoCoord.getY().toFixed(_decimalAccuracy);
            var longitude = geoCoord.getX().toFixed(_decimalAccuracy);
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);
            var angle = shapeInfo.getModifierStringAngle();
            coord.setLocation(longitude, latitude);
            shapeInfo.setGlyphPosition(coord);
            
            var justify=shapeInfo.getTextJustify();
            var strJustify="left";
            if(justify===0)
                strJustify="left";
            else if(justify===1)
                strJustify="center";
            else if(justify===2)
                strJustify="right";
            
            var text = shapeInfo.getModifierString();
            if (text !== null && text !== ("")) {
                feature = {};
                feature.type = "Feature";
                feature.properties = {};
                geometry = {};
                //feature.properties.name = "text";//rt,cm,lb
                feature.properties.label = text;//rt,cm,lb
                feature.properties.pointRadius = 0;
                feature.properties.fontSize = RS.getMPModifierFontSize() + "pt";//"12pt";
                feature.properties.fontFamily = RS.getMPModifierFontName();//"Arial, sans-serif";
                feature.properties.fontWeight = RS.getMPModifierFontStyle();
                //feature.properties.fontColor = shapeInfo.getFillColor().toHexString(false);//"#FFFFFF";
                feature.properties.fontColor = textColor || shapeInfo.getFillColor().toHexString(false);
                feature.properties.labelOutlineColor = textBackgroundColor || RU.getIdealOutlineColor(feature.properties.fontColor);//"#000000";//label.getLineColor().toHexString(false);
                feature.properties.labelOutlineWidth = RS.getTextOutlineWidth() * 2 + 1;//3;//rt,cm
                //feature.properties.labelAlign = "lm";// "cm";//rt,cm,lb //old openlayers 2 format
                feature.properties.labelAlign = strJustify;// "left" "center" "right"
                feature.properties.labelBaseline = "alphabetic";// alphabetic, middle, top, bottom
                feature.properties.labelXOffset = 0;
                feature.properties.labelYOffset = 0;

                feature.properties.rotation = angle;//rt,cm
                feature.properties.angle = angle;//rt,cm

                geometry["type"] = "Point";


                geometry["coordinates"] = [longitude, latitude];
                feature["geometry"] = geometry;

            } else {
                return null;
            }
            return feature;
        },
        /**
         * Basically renders the symbol with the 2d renderer than pulls out
         * just the label placemarks.  Altitudes are then added so that will place
         * with the 3d symbol they are being added to.
         * @param id string
         * @param name string 
         * @param description string
         * @param symbolCode string 
         * @param controlPoints string
         * @param scale Number
         * @param bbox string
         * @param symbolModifiers string
         * @param format Number
         * @param symStd Number
         * @return string
         */
        getModifierKML: function (id,
                name,
                description,
                symbolCode,
                controlPoints,
                scale,
                bbox,
                symbolModifiers,
                format, symStd)
        {
            var output = "";
            var placemarks = new Array();

            try
            {
                var maxAlt = 0;
                var minAlt = 0;

                output = this.RenderSymbol(id, name, description, symbolCode, controlPoints, scale, bbox, symbolModifiers, format, symStd);
                var pmiStart = output.indexOf("<Placemark");
                var pmiEnd = 0;
                var curr = 0;
                var count = 0;
                var tempPlacemark = "";

                var max = 0;
                var min = 0;

                //grab max altitude so labels are in the air with the symbol.
                if (symbolModifiers[ModifiersTG.X_ALTITUDE_DEPTH] && symbolModifiers[ModifiersTG.X_ALTITUDE_DEPTH] instanceof Array)
                {
                    var XN = symbolModifiers[ModifiersTG.X_ALTITUDE_DEPTH];
                    altitudes = new Array();
                    for (i = 0; i < XN.length; i++) {
                        if (XN[i] > max)
                            max = XN[i];
                    }
                }
                else if (symbolModifiers.altitudeDepth && symbolModifiers.altitudeDepth instanceof Array)
                {
                    altitudes = new Array();
                    for (i = 0; i < symbolModifiers.altitudeDepth.length; i++) {
                        if (symbolModifiers.altitudeDepth[i] > max)
                            max = symbolModifiers.altitudeDepth[i];
                    }
                }



                while (pmiStart > 0)
                {
                    if (count > 0)
                    {
                        pmiEnd = output.indexOf("</Placemark>", pmiStart) + 12;
                        tempPlacemark = output.substring(pmiStart, pmiEnd);
                        if (tempPlacemark.contains("</Point>"))
                        {

                            //TODO - set extrude to false
                            var outputSubstring = output.substring(pmiStart, pmiEnd);
                            //add altitude to modifier
                            outputSubstring = outputSubstring.replace(/<\/coordinates>/gi, "," + max + "<\/coordinates>");
                            //disable extrude so you don't see a line going from the ground to the modifier
                            outputSubstring = outputSubstring.replace(/<extrude>1<\/extrude>/gi, "<extrude>0<\/extrude>");
                            placemarks.push(outputSubstring);
                        }
                        //System.out.println(placemarks.get(count));
                        //end, check for more
                        pmiStart = output.indexOf("<Placemark", pmiEnd - 2);
                    }
                    count++;
                }


                var sb = "";
                for (var k = 0; k < placemarks.length; k++)
                {
                    sb += (placemarks[k]);
                }
//            System.out.println("placemarks: ");
//            System.out.println(sb.toString());
                return sb;
            }
            catch (err)
            {
                ErrorLogger.LogException("MultiPointHandler", "getModifierKML", err);
            }

            return output;
        },
        // <editor-fold defaultstate="collapsed" desc="Image Fill & Line Pattern Functions">
        /**
         * Put this here rather than in multipointhandler so that I could get the
         * port info from the single point server.
         * @param modifiers Map<String,String> modifiers
         * @param pixels ArrayList<Point2D>
         * @param clip Rectangle2D
         * @return 
         */
        GenerateSymbolLineFillUrl: function (modifiers, pixels, clip)
        {
            var shapeType = 0;
            var url = "";
            var symbolFillIDs = null;
            var symbolLineIDs = null;
            var strClip = null;
            var symbolSize = 25;//AreaSymbolFill.DEFAULT_SYMBOL_SIZE;
            var imageoffset = 0;
            //ArrayList<ArrayList<Point2D>>
            var lines = null;
            //ArrayList<Point2D> 
            var points = null;
            var point = null;

            var shape = null;
            //PathIterator itr = null;
            var height = 0;
            var width = 0;
            var offsetX = 0;
            var offsetY = 0;
            var x = 0;
            var y = 0;
            //Rectangle2D 
            var bounds = null;
            try
            {
                //Path2D 
                var path = new armyc2.c2sd.graphics2d.GeneralPath();
                //Point2D
                var temp = null;
                //Get bounds of the polygon/polyline path
                for (var i = 0; i < pixels.size(); i++)
                {
                    temp = pixels.get(i);
                    if (i > 0)
                    {
                        path.lineTo(temp.getX(), temp.getY());
                    }
                    else if (i === 0)
                    {
                        path.moveTo(temp.getX(), temp.getY());
                    }
                }

                bounds = path.getBounds();
                height = bounds.getHeight();
                width = bounds.getWidth();

//            System.out.println("bounds: "+ bounds.toString());
//                    System.out.println("height: "+ String.valueOf(height));
//            System.out.println("width: "+ String.valueOf(width));

                //pixels may be in negative space so get offsets to put everything
                //in the positive
                if (bounds.getX() < 0)
                {
                    offsetX = Math.round(bounds.getX() * -1);
                }
                else if ((bounds.getX() + bounds.getWidth()) > width)
                {
                    offsetX = Math.round((bounds.getX() + bounds.getWidth()) - width) * -1;
                }

                if (bounds.getY() < 0)
                {
                    offsetY = Math.round(bounds.getY() * -1);
                }
                else if ((bounds.getY() + bounds.getHeight()) > height)
                {
                    offsetY = Math.round((bounds.getY() + bounds.getHeight()) - height) * -1;
                }

                //build clip string
                if (clip !== null)
                {
                    var sbClip = "";
                    sbClip += ("&clip=");
                    sbClip += (clip.getX());
                    sbClip += (",");
                    sbClip += (clip.getY());
                    sbClip += (",");
                    sbClip += (clip.getWidth());
                    sbClip += (",");
                    sbClip += (clip.getHeight());
                    strClip = sbClip;//.toString();
                }


                //itr = shape.getPathIterator(new AffineTransform());
                var sbCoords = "";
                var sbUrl = "";
                sbCoords += ("coords=");
                //itr.next();

                //get parameters
                if (modifiers["symbolFillIds"] !== undefined)
                {
                    symbolFillIDs = modifiers["symbolFillIds"];
                }
                if (modifiers["symbolLineIds"] !== undefined)
                {
                    symbolLineIDs = modifiers["symbolLineIds"];
                }
                if (modifiers["symbolFillIconSize"] !== undefined)
                {
                    symbolSize = ["symbolFillIconSize"];
                }
                if (modifiers["clip"])
                {
                    strClip = ["clip"];
                }

                /*if(symbolLineIDs != null && symbolSize > 0)
                 {
                 //icons drawn on line, need to extend bounds
                 //so that they don't get clipped.
                 //System.out.println(String.valueOf(height));
                 //                height += symbolSize;
                 //                width += symbolSize;
                 imageoffset = symbolSize/2;
                 //                offsetX += imageoffset;
                 //                offsetY += imageoffset;
                 }//*/

                //build coordinate string
                for (var i = 0; i < pixels.size(); i++)
                {
                    if (i > 0)
                    {
                        sbCoords += (",");
                    }
                    point = pixels.get(i);
                    x = Math.round(point.getX() + offsetX);
                    y = Math.round(point.getY() + offsetY);
                    sbCoords += (x);
                    sbCoords += (",");
                    sbCoords += (y);
                }

                //get the base url for the applet image server if available,
                //otherwise uses the web service.
                sbUrl = this.GetImageServerURL();

                sbUrl += ("AREASYMBOLFILL?");
                sbUrl += ("renderer=AreaSymbolFillRenderer&");
                sbUrl += sbCoords;//.toString());
                if (symbolFillIDs !== null)
                {
                    sbUrl += ("&symbolFillIds=");
                    sbUrl += (symbolFillIDs);
                }
                if (symbolLineIDs !== null)
                {
                    sbUrl += ("&symbolLineIds=");
                    sbUrl += (symbolLineIDs);
                }
                if (symbolSize > 0)
                {
                    sbUrl += ("&symbolFillIconSize=");
                    sbUrl += (symbolSize);
                }
                if (strClip !== null)
                {
                    sbUrl += (strClip);
                }



                sbUrl += ("&height=");
                sbUrl += parseInt(height);
                sbUrl += ("&width=");
                sbUrl += parseInt(width);

                url = sbUrl;//.toString();

                if (height < symbolSize || width < symbolSize)
                {
                    //image not large enough to show symbol
                    //don't bother making image request.
                    url = null;
                }

            }
            catch (exc)
            {
                ErrorLogger.LogException("MPH", "GenerateSymbolLineFillUrl", exc);
            }
            return url;
    },
        AddImageFillToKML: function (tgPoints, jsonContent, mSymbol, ipc, normalize)
        {
            if(tgPoints===null || tgPoints.size()===0)
                return null;
            //get original point values in pixel form                    
            var pixelPoints = new java.util.ArrayList();
            var path = new armyc2.c2sd.graphics2d.GeneralPath();

            //for(JavaLineArray.POINT2 pt : tgPoints)
            var kcount = tgPoints.size();
            var tpTemp = null;
            for (var k = 0; k < kcount; k++)
            {
                tpTemp = tgPoints.get(k);
                pixelPoints.add(new armyc2.c2sd.graphics2d.Point2D(tpTemp.x, tpTemp.y));
                if (k > 0)
                {
                    path.lineTo(tpTemp.x, tpTemp.y);
                }
                else
                {
                    path.moveTo(tpTemp.x, tpTemp.y);
                }
            }
            var rect = path.getBounds();
            //get url for the fill or line pattern PNG
            //TODO: create functoin to generalte symbol line fill url
            var goImageUrl = this.GenerateSymbolLineFillUrl(mSymbol.getModifierMap(), pixelPoints, rect);
            //generate the extra KML needed to insert the image
            var goKML = "";
            if (goImageUrl !== null)
            {
                goKML = this.GenerateGroundOverlayKML(goImageUrl, ipc, rect, normalize);
            }
            goKML += "</Folder>";


            jsonContent = jsonContent.replace("</Folder>", goKML);

            return jsonContent;
        },
        GenerateGroundOverlayKML: function (
                urlImage, ipc,
                symbolBounds,
                normalize)//, ArrayList<ShapeInfo> shapes)
        {
            //int shapeType = -1;
            var x = 0;
            var y = 0;
            var height = 0;
            var width = 0;
            //ShapeInfo siTemp = null;
            //int shapeCount = shapes.size();
            var sb = "";
            var lineFill = false;
            var params = {};
            var symbolSize = 0;
            var imageOffset = 0;


            try
            {
                //if it's a line pattern, we need to know how big the symbols
                //are so we can increase the size of the image.
                var index = -1;
                index = urlImage.indexOf(this.SYMBOL_LINE_IDS);

                if (index > 0)//if(urlImage contains SYMBOL_LINE_IDS)
                {
                    lineFill = true;
                    //TODO: create url parameter processing function
                    //params = SinglePointRendererService.getInstance().processParams(urlImage);
                    if (params[this.SYMBOL_FILL_ICON_SIZE] !== undefined)
                    {
                        var size = params[this.SYMBOL_FILL_ICON_SIZE];
                        symbolSize = parseInt(size);//Integer.decode(size);// getInteger(size);
                    }
                    else
                    {
                        symbolSize = 25;//AreaSymbolFill.DEFAULT_SYMBOL_SIZE;
                    }
                    imageOffset = (symbolSize / 2) + 3;//+3 to make room for rotation
                }

                //get the bounds of the image
                var bounds = null;

                bounds = symbolBounds;

                height = bounds.getHeight() + (imageOffset * 2);
                width = bounds.getWidth() + (imageOffset * 2);
                x = bounds.getX() - imageOffset;
                y = bounds.getY() - imageOffset;


//            Point2D coord = (Point2D) new Point2D.Double(x, y);
//            Point2D topLeft = ipc.PixelsToGeo(coord);
//            coord = (Point2D) new Point2D.Double(x+width,y+height);
//            Point2D bottomRight = ipc.PixelsToGeo(coord);

                var coord = new armyc2.c2sd.graphics2d.Point2D(x, y);
                var topLeft = ipc.PixelsToGeo(coord);
                coord = new armyc2.c2sd.graphics2d.Point2D(x + width, y + height);
                var bottomRight = ipc.PixelsToGeo(coord);



                if (normalize)
                {
                    topLeft = this.NormalizeCoordToGECoord(topLeft);
                    bottomRight = this.NormalizeCoordToGECoord(bottomRight);

                    if (topLeft.getX() > 0)
                    {
                        topLeft.x -= 360;
                    }
                }

                var cdataStart = "<![CDATA[";
                var cdataEnd = "]]>";
                //build kml
                sb += ("<GroundOverlay>");
                sb += ("<name>symbol fill</name>");
                //sb += ("<visibility>0</visibility>");
                sb += ("<description>symbol fill</description>");
                sb += ("<Icon>");
                sb += ("<href>");
                sb += (cdataStart);
                sb += (urlImage);
                sb += (cdataEnd);
                sb += ("</href>");
                sb += ("</Icon>");
                sb += ("<LatLonBox>");
                sb += ("<north>");
                sb += topLeft.getY();
                sb += ("</north>");
                sb += ("<south>");
                sb += bottomRight.getY();
                sb += ("</south>");
                sb += ("<east>");
                sb += bottomRight.getX();
                sb += ("</east>");
                sb += ("<west>");
                sb += topLeft.getX();
                sb += ("</west>");
                sb += ("<rotation>");
                sb += ("0");
                sb += ("</rotation>");
                sb += ("</LatLonBox>");
                sb += ("</GroundOverlay>");
            }
            catch (exc)
            {
                ErrorLogger.LogException("MultiPointHandler", "GenerateGroundOverlayKML", exc);
            }
            var kml = sb;
            return kml;
        },
        /**
         * Get the base url for the applet image server if available.
         * Otherwise, uses the web service.
         * @returns {String}
         */
        GetImageServerURL: function ()
        {
            if (_appletUrl === null)
            {
                _appletUrl = baseURL;
                //_appletUrl = baseSURL;
                //_appletUrl = location.protocol + "//" + location.hostname + (location.port && ":" + location.port) + "/";
                _appletUrl += "mil-sym-service/renderer/image/";
            }

            return _appletUrl;
        },
        SetImageServerURL: function (hostURL)
        {
            _appletUrl = hostURL;
            _appletUrl += "mil-sym-service/renderer/image/";
        },
        GetBboxFromCoordinates: function (symbolID, geoCoords, modifiers, symStd)
        {
            var basicID = SymbolUtilities.getBasicSymbolID(symbolID);
            //check points and come up with a bbox
            var len = geoCoords.length;
            if (len >= 2)
            {
                rbb = new armyc2.c2sd.renderer.so.Rect(geoCoords[0].getX(), geoCoords[0].getY(), 0, 0);
                for (var i = 1; i < len; i++)
                {
                    rbb.unionPoint(geoCoords[i]);
                }
                return {top: rbb.getY(), left: rbb.getX(), bottom: rbb.getBottom(), right: rbb.getRight()};
            }
            else if (len == 1 && modifiers[ModifiersTG.AM_DISTANCE])
            {
                var arrAM,
                        pTL,
                        pBR,
                        aTL = 315,
                        aBR = 135;
                var sd = SymbolDefTable.getSymbolDef(basicID, symStd);
                if (sd.drawCategory === SymbolDefTable.DRAW_CATEGORY_CIRCULAR_PARAMETERED_AUTOSHAPE)
                {
                    //1 AM value representing radius
                    arrAM = modifiers[ModifiersTG.AM_DISTANCE];
                    var dAM = parseFloat(arrAM[0]);
                    var pTL = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: geoCoords[0].getX(), y: geoCoords[0].getY()}, dAM, aTL);//start, distance, azimuth
                    var pBR = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: geoCoords[0].getX(), y: geoCoords[0].getY()}, dAM, aBR);//start, distance, azimuth

                    var a12 = null,
                            a21 = null;
                    var dst = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_distance(pTL, pBR, a12, a21);

                    return {top: pTL.y, left: pTL.x, bottom: pBR.y, right: pBR.x};
                }
                else if (sd.drawCategory === SymbolDefTable.DRAW_CATEGORY_RECTANGULAR_PARAMETERED_AUTOSHAPE)
                {
                    //2 AM values representing width and length
                    arrAM = modifiers[ModifiersTG.AM_DISTANCE];
                    var dAM1 = parseFloat(arrAM[0]);
                    var dAM2 = parseFloat(arrAM[0]);
                    var dAMmax = dAM1 / 2;
                    if (dAM2 > dAM1)
                        dAMmax = dAM2 / 2;

                    pTL = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: geoCoords[0].getX(), y: geoCoords[0].getY()}, dAMmax, aTL);//start, distance, azimuth
                    pBR = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: geoCoords[0].getX(), y: geoCoords[0].getY()}, dAMmax, aBR);//start, distance, azimuth

                    return {top: pTL.y, left: pTL.x, bottom: pBR.y, right: pBR.x};
                }
                else if (sd.drawCategory === SymbolDefTable.DRAW_CATEGORY_CIRCULAR_RANGEFAN_AUTOSHAPE ||
                        sd.drawCategory === SymbolDefTable.DRAW_CATEGORY_SECTOR_PARAMETERED_AUTOSHAPE)
                {
                    //1 AM value representing radius
                    arrAM = modifiers[ModifiersTG.AM_DISTANCE];
                    var dAM = parseFloat(arrAM[len - 1]);
                    var pTL = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: geoCoords[0].getX(), y: geoCoords[0].getY()}, dAM, aTL);//start, distance, azimuth
                    var pBR = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: geoCoords[0].getX(), y: geoCoords[0].getY()}, dAM, aBR);//start, distance, azimuth

                    return {top: pTL.y, left: pTL.x, bottom: pBR.y, right: pBR.x};
                }
                else if (sd.drawCategory === SymbolDefTable.DRAW_CATEGORY_TWO_POINT_RECT_PARAMETERED_AUTOSHAPE)
                {
                    //union 2 points
                    rbb = new armyc2.c2sd.renderer.so.Rect(geoCoords[0].getX(), geoCoords[0].getY(), 0, 0);
                    for (var i = 1; i < len; i++)
                    {
                        rbb.unionPoint(geoCoords[i]);
                    }
                    //should calculate 4 points based on the two and the width. Doing quick way for right now.
                    arrAM = modifiers[ModifiersTG.AM_DISTANCE];
                    var dAM = parseFloat(arrAM[0]) / 2;
                    var top = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: rbb.getX(), y: rbb.getY()}, dAM, 0);//start, distance, azimuth
                    var right = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: rbb.getRight(), y: rbb.getY()}, dAM, 90);//start, distance, azimuth
                    var bottom = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: rbb.hryX(), y: rbb.getBottom()}, dAM, 180);//start, distance, azimuth
                    var left = armyc2.c2sd.JavaTacticalRenderer.mdlGeodesic.geodesic_coordinate({x: rbb.getX(), y: rbb.getY()}, dAM, 270);//start, distance, azimuth
                    return {top: top, left: left, bottom: bottom, right: right};
                }
            }
            else
            {
                return null;
            }
        }



        // </editor-fold>
    };
}());

