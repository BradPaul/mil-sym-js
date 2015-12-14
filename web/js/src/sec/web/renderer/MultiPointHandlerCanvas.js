var sec = sec || {};
/** namespace */
sec.web = sec.web || {};
sec.web.renderer = sec.web.renderer || {};
/** @class */
sec.web.renderer.MultiPointHandlerCanvas = (function () {
    //private vars
    var ErrorLogger = armyc2.c2sd.renderer.utilities.ErrorLogger;
    var RendererSettings = armyc2.c2sd.renderer.utilities.RendererSettings;
    var RendererUtilities = armyc2.c2sd.renderer.utilities.RendererUtilities;
    var _buffer = null;
    var _blankCanvas = null;

    var textInfoBuffer = null,
        textInfoContext = null,
        textInfoContextFont = null,
        tempMPBuffer = null,
        tempMPContext = null;
        
    //decimal lat/lon accuracy by decimal place
    //7DP ~= 11.132mm (en.wikipedia.org/wiki/Decimal_degrees)
    var _decimalAccuracy = 7;
            
    //constructor code
    _blankCanvas = document.createElement('canvas');
    _blankCanvas.width=2;
    _blankCanvas.height=2;
    
    //private functions
            
    return{
        //public vars
        
        //public functions
        GeoCanvasize: function (shapes, modifiers, ipc, normalize, format, hexTextColor, hexTextBackgroundColor, wasClipped)
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
                    var pathInfo = this.ShapesToGeoCanvas(shapes.get(i), ipc, normalize, _buffer);
                    if(pathInfo.path && pathInfo.path.getBounds())
                    {
                        tempBounds = pathInfo.path.getBounds();
                        tempBounds.grow(Math.round(pathInfo.lineWidth / 2));//adjust for line width so nothing gets clipped.
                        if (pathBounds === null)
                            pathBounds = tempBounds.clone();
                        else
                            pathBounds.union(tempBounds);
                        paths.push(pathInfo);
                    }
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
                if(pathBounds)
                {
                    unionBounds = pathBounds.clone();
                }
                if (labelBounds)
                {
                    if(unionBounds)
                    {
                        unionBounds.union(labelBounds);
                    }
                    else
                    {
                        unionBounds = labelBounds;
                    }
                }

                //get geo bounds for canvas
                var geoCoordTL = null;
                var geoCoordBR = null;
                if(unionBounds)
                {
                    var coordTL = new armyc2.c2sd.graphics2d.Point2D();
                    coordTL.setLocation(unionBounds.getX(), unionBounds.getY());
                    var coordBR = new armyc2.c2sd.graphics2d.Point2D();
                    coordBR.setLocation(unionBounds.getX() + unionBounds.getWidth(), unionBounds.getY() + unionBounds.getHeight());8
                    
                    geoCoordTL = ipc.PixelsToGeo(coordTL);
                    geoCoordBR = ipc.PixelsToGeo(coordBR);
                    if (normalize)
                    {
                        geoCoordTL = this.NormalizeCoordToGECoord(geoCoordTL);
                        geoCoordBR = this.NormalizeCoordToGECoord(geoCoordBR);
                    }
                    geoCoordTL.setLocation(geoCoordTL.getX().toFixed(_decimalAccuracy), geoCoordTL.getY().toFixed(_decimalAccuracy));
                    geoCoordBR.setLocation(geoCoordBR.getX().toFixed(_decimalAccuracy), geoCoordBR.getY().toFixed(_decimalAccuracy));
                }
                else//nothing to draw
                {
                    geoCoordTL = new armyc2.c2sd.graphics2d.Point2D();
                    geoCoordBR = new armyc2.c2sd.graphics2d.Point2D();
                    geoCoordTL.setLocation(0,0);
                    geoCoordBR.setLocation(0,0);
                }

                
            }
            catch (err)
            {
                ErrorLogger.LogException("MultiPointHandler", "GeoJSONize", err);
            }
            //if(renderToCanvas)
            //{
            if(paths && len > 0 && unionBounds)
            {
                var geoCanvas = this.RenderShapeInfoToCanvas(paths, labels, unionBounds, geoCoordTL, geoCoordBR, format, hexTextColor, hexTextBackgroundColor, wasClipped);
                return geoCanvas;
            }
            else
            {
                //{image:buffer, geoTL:geoTL, geoBR:geoBR} OR {dataURL:buffer.toDataURL(), geoTL:geoTL, geoBR:geoBR}
                return {image:_blankCanvas,geoTL:geoCoordTL, geoBR:geoCoordBR, wasClipped:wasclipped};
            }
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
        RenderShapeInfoToCanvas: function (paths, textInfos, bounds, geoTL, geoBR, format, hexTextColor, hexTextBackgroundColor, wasClipped)
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
                if(pi.fillPattern !== null && pi.fillPattern.src)
                {
                    pi.path.fillPattern(ctx, pi.fillPattern);
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
                return {image: buffer, geoTL: geoTL, geoBR: geoBR, width: buffer.width, height: buffer.height, wasClipped:wasClipped};
            }
            else if (format === 4)
            {
                //return object with dataurl and geo points
                return {dataURL: buffer.toDataURL(), geoTL: geoTL, geoBR: geoBR, width: buffer.width, height: buffer.height, wasClipped:wasClipped};
            }
            else
            {//should never get here:
                //just return the canvas
                buffer.geoTL = geoTL;
                buffer.geoBR = geoBR;
                return buffer;
            }

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
            var fillPattern = null;


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
            if(shapeInfo.getTexturePaint() !== null)
            {
                fillPattern = shapeInfo.getTexturePaint();
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
            pathInfo = {path: path, lineWidth: lineWidth, lineColor: lineColor, fillColor: fillColor, dashArray: dashArray, alpha: alpha, fillPattern: fillPattern};
            return pathInfo;
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
                ErrorLogger.LogException("MultiPointHandler", "AdjustModifierPointToCenter", err);
                return null;
            }//*/
        }
    };
}());