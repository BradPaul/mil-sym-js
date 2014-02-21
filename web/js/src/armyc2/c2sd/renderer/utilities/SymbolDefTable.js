var armyc2 = armyc2 || {};
/** namespace */
armyc2.c2sd = armyc2.c2sd || {};
armyc2.c2sd.renderer = armyc2.c2sd.renderer || {};
armyc2.c2sd.renderer.utilities = armyc2.c2sd.renderer.utilities || {};
/** @class */
armyc2.c2sd.renderer.utilities.SymbolDefTable = (function () {

    var symbolMapB = null,
        symbolMapC = null,
        RendererSettings = armyc2.c2sd.renderer.utilities.RendererSettings,
        SymbolUtilities = armyc2.c2sd.renderer.utilities.SymbolUtilities,
        parser;


    return {
    /**
    * Just a category in the milstd hierarchy.
    * Not something we draw.
    * WILL NOT RENDER
    */
    DRAW_CATEGORY_DONOTDRAW: 0,
    /**
    * A polyline, a line with n number of points.
    * 0 control points
    */
    DRAW_CATEGORY_LINE: 1,
    /**
    * An animated shape, uses the animate function to draw.
    * 0 control points (every point shapes symbol)
    */
    DRAW_CATEGORY_AUTOSHAPE: 2,
    /**
    * An enclosed polygon with n points
    * 0 control points
    */
    DRAW_CATEGORY_POLYGON: 3,
    /**
    * A polyline with n points (entered in reverse order)
    * 0 control points
    */
    DRAW_CATEGORY_ARROW: 4,
    /**
    * A graphic with n points whose last point defines the width of the graphic.
    * 1 control point
    */
    DRAW_CATEGORY_ROUTE: 5,
    /**
    * A line defined only by 2 points, and cannot have more.
    * 0 control points
    */
    DRAW_CATEGORY_TWOPOINTLINE: 6,
    /**
    * Shape is defined by a single point
    * 0 control points
    */
    DRAW_CATEGORY_POINT: 8,
    /**
    * A polyline with 2 points (entered in reverse order).
    * 0 control points
    */
    DRAW_CATEGORY_TWOPOINTARROW: 9,
    /**
    * An animated shape, uses the animate function to draw. Super Autoshape draw
    * in 2 phases, usually one to define length, and one to define width.
    * 0 control points (every point shapes symbol)
    *
    */
    DRAW_CATEGORY_SUPERAUTOSHAPE: 15,
    /**
     * Circle that requires 1 AM modifier value.
     * See ModifiersTG.js for modifier descriptions and constant key strings.
     */
    DRAW_CATEGORY_CIRCULAR_PARAMETERED_AUTOSHAPE: 16,
    /**
     * Rectangle that requires 2 AM modifier values and 1 AN value.";
     * See ModifiersTG.js for modifier descriptions and constant key strings.
     */
    DRAW_CATEGORY_RECTANGULAR_PARAMETERED_AUTOSHAPE: 17,
    /**
     * Requires 2 AM values and 2 AN values per sector.  
     * The first sector can have just one AM value although it is recommended 
     * to always use 2 values for each sector.  X values are not required
     * as our rendering is only 2D for the Sector Range Fan symbol.
     * See ModifiersTG.js for modifier descriptions and constant key strings.
     */
    DRAW_CATEGORY_SECTOR_PARAMETERED_AUTOSHAPE: 18,
    /**
     *  Requires at least 1 distance/AM value"
     *  See ModifiersTG.js for modifier descriptions and constant key strings.
     */
    DRAW_CATEGORY_CIRCULAR_RANGEFAN_AUTOSHAPE: 19,
    /**
     * Requires 1 AM value.
     * See ModifiersTG.js for modifier descriptions and constant key strings.
     */
    DRAW_CATEGORY_TWO_POINT_RECT_PARAMETERED_AUTOSHAPE: 20,
    /**
    * UNKNOWN.
    */
    DRAW_CATEGORY_UNKNOWN: 99,
        xmlDoc: null,
        /**
         * 
         * @returns {undefined}
         */
        init: function ()
        {
            var i,
            data = null,
            symbol = null,
            symbols,
            count;
            
            
            //symbolDefTable
            if(symbolMapB===null  && armyc2.c2sd.renderer.xml.SymbolConstantsB !== undefined)
            {
                symbols = armyc2.c2sd.renderer.xml.SymbolConstantsB.SYMBOLCONSTANTS.SYMBOL;
                armyc2.c2sd.renderer.xml.SymbolConstantsB = null;
                symbolMapB = {};
                count = symbols.length;
                for (i = 0; i < count; i += 1) {
                    symbol = symbols[i];
                    
                    if (symbol !== null) {

                        data = {};
                        data.symbolID = symbol["SYMBOLID"] || ""; //SYMBOLID
                        data.geometry = symbol["GEOMETRY"] || ""; //GEOMETRY
                        data.minPoints = parseInt(symbol["MINPOINTS"] || "", 10); //MINPOINTS
                        data.maxPoints = parseInt(symbol["MAXPOINTS"] || "", 10); //MAXPOINTS
                        data.drawCategory = parseInt(symbol["DRAWCATEGORY"] || "", 10); //DRAWCATEGORY
                        data.modifiers = symbol["MODIFIERS"] || ""; //MODIFIERS
                    } 
                    if((data.symbolID in symbolMapB)===false)
                    {
                        symbolMapB[data.symbolID] = data;
                    }
                }
            }
            
            if(symbolMapC===null  && armyc2.c2sd.renderer.xml.SymbolConstantsC !== undefined)
            {
                symbols = armyc2.c2sd.renderer.xml.SymbolConstantsC.SYMBOLCONSTANTS.SYMBOL;
                armyc2.c2sd.renderer.xml.SymbolConstantsC = null;
                symbolMapC = {};
                count = symbols.length;
                for (i = 0; i < count; i += 1) {
                    symbol = symbols[i];
                    //Firefox and IE parsers handle things differently
                    if (symbol !== null) {

                        data = {};
                        data.symbolID = symbol["SYMBOLID"] || ""; //SYMBOLID
                        data.geometry = symbol["GEOMETRY"] || ""; //GEOMETRY
                        data.minPoints = parseInt(symbol["MINPOINTS"] || "", 10); //MINPOINTS
                        data.maxPoints = parseInt(symbol["MAXPOINTS"] || "", 10); //MAXPOINTS
                        data.drawCategory = parseInt(symbol["DRAWCATEGORY"] || "", 10); //DRAWCATEGORY
                        data.modifiers = symbol["MODIFIERS"] || ""; //MODIFIERS
                    } 
                    if((data.symbolID in symbolMapC)===false)
                    {
                        symbolMapC[data.symbolID] = data;
                    }
                }
            }
            
        },
        
        /**
         * 
         * @param {Number} symStd 2525b=0,2525c=1
         * @returns {Boolean}
         */
        hasSymbolMap: function(symStd)
        {
            if(symStd === 0 && symbolMapB !== null)//2525B
            {
                return true;
            }
            else if(symStd === 1 && symbolMapC !== null)//2525C
            {
                return true;
            }
            else
                return false;
        },
        
        /**
         * 
         * @param {type} symbolID
         * @param {Number} symStd 2525b=0,2525c=1
         * @returns {SymbolDef} has symbolID, minPoints, maxPoints, 
         * drawCategory, hasWidth, modifiers.  drawCategory is a number, the
         * rest are strings
         */
        getSymbolDef: function (symbolID, symStd) {
            
            if(!(symStd))
                symStd = RendererSettings.getSymbologyStandard();
            var symbolMap = null;
            
            if(symStd === RendererSettings.Symbology_2525Bch2_USAS_13_14)
                symbolMap = symbolMapB;
            else
                symbolMap = symbolMapC;
            
            if(symbolMap[symbolID] !== undefined)
            {
                return symbolMap[symbolID];
            }
            else
            {
                return null;
            }
            
        },
        /**
         * 
         * @param {String} symbolID
         * @returns {Boolean}
         */
        hasSymbolDef: function (symbolID, symStd) {
            
            if(symStd === undefined)
                symStd = RendererSettings.getSymbologyStandard();
            var symbolMap = null;
            
            if(symStd === RendererSettings.Symbology_2525Bch2_USAS_13_14)
                symbolMap = symbolMapB;
            else
                symbolMap = symbolMapC;
            
            if(symbolMap[symbolID] !== undefined)
            {
                return true;
            }
            else
            {
                return false;
            }
            
            
        },
        /**
         * 
         * @param {String} symbolID
         * @returns {Boolean}
         */
        isMultiPoint: function (symbolID) {
            if (symbolID.charAt(0) === 'G' || symbolID.charAt(0) === 'W') {
                var sd = this.getSymbolDef(SymbolUtilities.getBasicSymbolID(symbolID));
                if (sd !== undefined && sd !== null) {
                    if (sd.maxPoints > 1 || sd.drawCategory !== this.DRAW_CATEGORY_POINT) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

    };
}());