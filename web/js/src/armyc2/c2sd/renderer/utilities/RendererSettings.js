var armyc2 = armyc2 || {};
/** namespace */
armyc2.c2sd = armyc2.c2sd || {};
armyc2.c2sd.renderer = armyc2.c2sd.renderer || {};
armyc2.c2sd.renderer.utilities = armyc2.c2sd.renderer.utilities || {};
/** @class */
armyc2.c2sd.renderer.utilities.RendererSettings = (function () {
	
//outline approach.  none, filled rectangle, outline (default),
    //outline quick (outline will not exceed 1 pixels).
    var _TextBackgroundMethod = 0,
    _SymbologyStandard = 0,
    _UseLineInterpolation = true,
    /**
     * Value from 0 to 255. The closer to 0 the lighter the text color has to be
     * to have the outline be black. Default value is 160.
     */
    _TextBackgroundAutoColorThreshold = 160,

    //if TextBackgroundMethod_OUTLINE is set, This value determnies the width of that outline.
    //if you want an outline width of 1 pixel: ((1pixel*2) + 1)
    _TextOutlineWidth = 3,
    
    //label foreground color, uses line color of symbol if null.
    _ColorLabelForeground = null;//armyc2.c2sd.renderer.utilities.Color.BLACK;//"000000", //Color.BLACK;
    //label background color, used if TextBackGroundMethod = TextBackgroundMethod_COLORFILL && not null
    _ColorLabelBackground = null;//armyc2.c2sd.renderer.utilities.Color.BLACK;//null,//"#FFFFFF",
       
    _SymbolOutlineWidth = 3,
    
    /**
     * If true (default), when HQ Staff is present, location will be indicated by the free
     * end of the staff
     */
    _CenterOnHQStaff = true,
    
    _scaleEchelon = false,
    _DrawAffiliationModifierAsLabel = true,
    
    _ModifierFontName = "Arial",
    _ModifierFontSize = 10,
    _ModifierFontStyle = "bold",
    _ModifierFont = "bold 10pt Arial",
    
    _scaleEchelon = false,
    _DrawAffiliationModifierAsLabel = true,
    _SPFontSize = 60,
    _UnitFontSize = 50;

return{
    
    
    /**
     * There will be no background for text
     */
    TextBackgroundMethod_NONE : 0,

    /**
     * There will be a colored box behind the text
     */
    TextBackgroundMethod_COLORFILL : 1,

    /**
     * There will be an adjustable outline around the text (expensive)
     * Outline width of 4 is recommended.
     */
    TextBackgroundMethod_OUTLINE : 2,


    /**
     * 2525Bch2 and USAS 13/14 symbology
     */
    Symbology_2525Bch2_USAS_13_14 : 0,
    /**
     * 2525C, which includes 2525Bch2 & USAS 13/14
     */
    Symbology_2525C : 1,
    
    /**
     * Controls what symbols are supported.
     * Set this before loading the renderer.
     * @param {Number} standard like RendererSettings.Symbology_2525Bch2_USAS_13_14
     * @returns {undefined}
     */
    setSymbologyStandard: function (standard){
        _SymbologyStandard = standard;
    },
    /**
     * Current symbology standard
     * @returns {Number}
     */
    getSymbologyStandard: function (){
        return _SymbologyStandard;
    },
    /**
     * For lines symbols with "decorations" like FLOT or LOC, when points are 
     * too close together, we will start dropping points until we get enough 
     * space between 2 points to draw the decoration.  Without this, when points
     * are too close together, you run the chance that the decorated line will
     * look like a plain line because there was no room between points to
     * draw the decoration.
     * @param {Boolean} value
     * @returns {undefined}
     */        
    setUseLineInterpolation: function (value){
        _UseLineInterpolation = value;
    },
    /**
     * Returns the current setting for Line Interpolation.
     * @returns {Boolean}
     */
    getUseLineInterpolation: function (){
        return _UseLineInterpolation;
    },
    /**
     * if true (default), when HQ Staff is present, location will be indicated by the free
     * end of the staff.
     * @param {Boolean} value
     * @returns {undefined}
     */
    setCenterOnHQStaff: function (value){
        _CenterOnHQStaff = value;
    },
    getCenterOnHQStaff: function (){
        return _CenterOnHQStaff;
    },
    /**
     * if RenderSettings.TextBackgroundMethod_OUTLINE is used,
     * the outline will be this many pixels wide.
     * @param {Number} width
     * @returns {undefined}
     */
    setTextOutlineWidth: function (width){
        if(width > 0)
            _TextOutlineWidth = (width*2) + 1;
        else
            _TextOutlineWidth = 0;
    },
    /**
     * if RenderSettings.TextBackgroundMethod_OUTLINE is used,
     * the outline will be this many pixels wide.
     * @returns {unresolved}
     */
    getTextOutlineWidth: function (){
        return _TextOutlineWidth;
    },
    /**
     * Refers to text color of modifier labels
     * Default Color is Black.  If NULL, uses line color of symbol
     * @param {String} value like #FFFFFF
     * @returns {undefined}
     */
    setLabelForegroundColor: function (value){
        _ColorLabelForeground = value;
    },
    /**
     * Refers to text color of modifier labels
     * @returns {String} like #FFFFFF
     */
    getLabelForegroundColor: function (){
        return _ColorLabelForeground;
    },
    /**
     * Refers to text color of modifier labels
     * Default Color is White.
     * Null value means the optimal background color (black or white)
     * will be chose based on the color of the text.
     * @param {String} value like #FFFFFF
     * @returns {undefined}
     */
    setLabelBackgroundColor: function (value){
        _ColorLabelBackground= value;
    },
    /**
     * Refers to background color of modifier labels
     * @returns {String} like #FFFFFF
     */
    getLabelBackgroundColor: function (){
        return _ColorLabelBackground;
    },
    /**
     * Value from 0 to 255. The closer to 0 the lighter the text color has to be
     * to have the outline be black. Default value is 160.
     * @param {Number} value
     * @returns {undefined}
     */
    setTextBackgroundAutoColorThreshold: function (value){
        _TextBackgroundAutoColorThreshold = value;
    },
    /**
     * Value from 0 to 255. The closer to 0 the lighter the text color has to be
     * to have the outline be black. Default value is 160.
     * @returns {Number}
     */
    getTextBackgroundAutoColorThreshold: function (){
        return _TextBackgroundAutoColorThreshold;
    },
    setTextBackgroundMethod: function(value)
    {
        _TextBackgroundMethod = value;
    },
    getTextBackgroundMethod: function()
    {
        return _TextBackgroundMethod;
    },
    /**
     * This applies to Single Point Tactical Graphics.
     * Setting this will determine the default value for milStdSymbols when created.
     * 0 for no outline,
     * 1 for outline thickness of 1 pixel, 
     * 2 for outline thickness of 2 pixels,
     * greater than 2 is not currently recommended.
     * @param {type} width
     * @returns {undefined}
     */
    setSinglePointSymbolOutlineWidth: function (width){
        _SymbolOutlineWidth = width;
        
        if(width > 0)
            _SymbolOutlineWidth = (width*2) + 1;
        else
            _SymbolOutlineWidth = 0;
    },
    /**
     * This only applies to single point tactical graphics.
     * @returns {unresolved}
     */
    getSinglePointSymbolOutlineWidth: function (){
        return _SymbolOutlineWidth;
    },
    /**
     * false to use label font size
     * true to scale it using symbolPixelBounds / 3.5
     * @param {Boolean} value
     * @returns {undefined}
     */
    setScaleEchelon: function (value){
        _scaleEchelon = value;
    },
    /**
     * Returns the value determining if we scale the echelon font size or
     * just match the font size specified by the label font.
     * @returns {Boolean}
     */
    getScaleEchelon: function (){
        return _scaleEchelon;
    },
    /**
     * Determines how to draw the Affiliation modifier.
     * True to draw as modifier label in the "E/F" location.
     * False to draw at the top right corner of the symbol
     * @param {Boolean} value
     * @returns {undefined}
     */
    setDrawAffiliationModifierAsLabel: function (value){
            _DrawAffiliationModifierAsLabel = value;
    },
    /**
     * True to draw as modifier label in the "E/F" location.
     * False to draw at the top right corner of the symbol
     * @returns {unresolved}
     */
    getDrawAffiliationModifierAsLabel: function (){
            return _DrawAffiliationModifierAsLabel;
    },
    /**
     * 
     * @param {String} name like "Arial"
     * @param {Number} size like 12
     * @param {String} style like "bold"
     * @returns {undefined}
     */
    setModifierFont: function(name, size, style){
        _ModifierFontName = name;
        _ModifierFontSize = size;
        if(style !== 'bold' || style !== 'normal')
        {
            _ModifierFontStyle = style;
        }
        else
        {
            _ModifierFontStyle = 'bold';
        }
        _ModifierFont = style + " " + 
                        size + "pt " + name;
    },
    /**
     * 
     * @returns {String} like "bold 12pt Arial"
     */
    getModifierFont: function(){
        return _ModifierFont;
    },
    /**
     * 
     * @returns {String}
     */
    getModifierFontName: function(){
        return _ModifierFontName;
    },
    /**
     * 
     * @returns {Number}
     */
    getModifierFontSize: function(){
        return _ModifierFontSize;
    },
    /**
     * 
     * @returns {String}
     */
    getModifierFontStyle: function(){
        return _ModifierFontStyle;
    },
	
    getInstance: function(){
            return armyc2.c2sd.renderer.utilities.RendererSettings;
    }
    
};
}());
