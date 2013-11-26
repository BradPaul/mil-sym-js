var armyc2 = armyc2 || {};
/** namespace */
armyc2.c2sd = armyc2.c2sd || {};
armyc2.c2sd.renderer = armyc2.c2sd.renderer || {};
armyc2.c2sd.renderer.utilities = armyc2.c2sd.renderer.utilities || {};
/** @class */
armyc2.c2sd.renderer.utilities.RendererUtilities = {};
/** @class */

    
    /**
     * Do not touch.
     * @type {}
     */
    armyc2.c2sd.renderer.utilities.RendererUtilities.pastTextMeasurements = {};


    /**
     * 
     * @param {String} color like "#FFFFFF"
     * @returns {String}
     */
    armyc2.c2sd.renderer.utilities.RendererUtilities.getIdealOutlineColor = function(color){
        var idealColor = null;
        if(color !== null && color !==""){
		
			
			var tempColor = color;
			if(tempColor.length === 9)
				tempColor = "#" + tempColor.substring(3);
            var threshold = armyc2.c2sd.renderer.utilities.RendererSettings.getTextBackgroundAutoColorThreshold();
            
            //hex to rgb
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(tempColor);
            
            var r = parseInt(result[1],16),
                g = parseInt(result[2],16),
                b = parseInt(result[3],16);
        
            var delta = ((r * 0.299) + (g * 0.587) + (b * 0.114));
            
            if((255- delta < threshold))
            {
                idealColor = "#000000";
            }
            else
            {
                idealColor = "#FFFFFF";
            }
        }
        return idealColor;
    };
    /**
     * 
     * @param {String} fontName
     * @param {Number} fontSize
     * @param {String} fontStyle
     * @param {String} text
     * @returns {Array{width,height}}
     */
    armyc2.c2sd.renderer.utilities.RendererUtilities.measureText = function(fontName, fontSize, fontStyle, text){
                
        var div = document.createElement('DIV');
            div.innerHTML = text;
            div.style.position = 'absolute';
            div.style.top = '-100px';
            div.style.left = '-100px';
            div.style.fontFamily = fontName;
            div.style.fontWeight = fontStyle ? 'bold' : 'normal';
            div.style.fontSize = fontSize + 'pt';
            document.body.appendChild(div);
            var size = [div.offsetWidth, div.offsetHeight];
            
            document.body.removeChild(div);
            div = null;
            return size;
    };
    
    armyc2.c2sd.renderer.utilities.RendererUtilities.measureTextHeight = function(fontName, fontSize, fontStyle)
    {
        var fontString = fontStyle + " " + fontSize + "pt " + fontName;
        if(armyc2.c2sd.renderer.utilities.RendererUtilities.pastTextMeasurements[fontString] !== undefined)
        {
            return armyc2.c2sd.renderer.utilities.RendererUtilities.pastTextMeasurements[fontString];
        }
        
        var size = this.measureText(fontName, fontSize, fontStyle, "Hj");
        armyc2.c2sd.renderer.utilities.RendererUtilities.pastTextMeasurements[fontString] = size[1];
        return size[1];
    };
    
    armyc2.c2sd.renderer.utilities.RendererUtilities.measureTextHeightWithFontString = function(fontString){
        var arrFont = fontString.split(" ");
        var fontStyle = arrFont[0];//style
        var fontSize = arrFont[1].replace("pt","");//size
        var fontName = arrFont[2];//name
        
        if(armyc2.c2sd.renderer.utilities.RendererUtilities.pastTextMeasurements[fontString] !== undefined)
        {
            return armyc2.c2sd.renderer.utilities.RendererUtilities.pastTextMeasurements[fontString];
        }
        
        var size = this.measureText(fontName, fontSize, fontStyle, "Hj");
        armyc2.c2sd.renderer.utilities.RendererUtilities.pastTextMeasurements[fontString] = size[1];
        return size[1];

    };

    armyc2.c2sd.renderer.utilities.RendererUtilities.measureTextWidthWithFontString = function(fontString,text){
        var arrFont = fontString.split(" ");
        var fontStyle = arrFont[0];//style
        var fontSize = arrFont[1].replace("pt","");//size
        var fontName = arrFont[2];//name
        
        return this.measureText(fontName, fontSize, fontStyle,text)[0];

    };
    /**
     * 
     * @param {type} context
     * @param {type} text
     * @param {type} location
     * @returns {unresolved}
     */
    armyc2.c2sd.renderer.utilities.RendererUtilities.getTextBounds = function(context, text, location){

        var font = armyc2.c2sd.renderer.utilities.RendererSettings.getModifierFont();
        
        var height,
            width;
        if(context !== null)
        {
            if(context.font !== font)
            {
                context.font = font;
            }
            width = context.measureText(text).width;
        }       
        else
        {
            width = this.measureTextWidthWithFontString(font, text);
        }
        height = this.measureTextHeightWithFontString(font);

        var bounds = new armyc2.c2sd.renderer.so.Rectangle(location.getX(),location.getY() - height,
                            width, height);       

        return bounds;
    };
    
    armyc2.c2sd.renderer.utilities.RendererUtilities.getTextPlacement = function(textInfo, modifierID, symbolID, symbolBounds, context){
        
    };
    
