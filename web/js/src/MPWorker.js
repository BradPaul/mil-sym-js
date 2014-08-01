/*
var e.data = {};
		e.data.id = "ID";
		e.data.name = "Name";
		e.data.description = "description";
		e.data.symbolID = symbolCode4;
		e.data.points = controlPoints4;
		e.data.altMode = "absolute";
		e.data.scale = scale4;
		e.data.bbox = bbox4;
		e.data.modifiers = modifiers;
		e.data.format = format;
		e.data.pHeight = pixelHeight;
		e.data.pWidth = pixelWidth;
*/

importScripts('m-c.js');

var rendererMP = sec.web.renderer.SECWebRenderer;

	armyc2.c2sd.renderer.utilities.ErrorLogger = {};
	armyc2.c2sd.renderer.utilities.ErrorLogger.LogMessage = function(sourceClass, sourceMethod, message){throw {message:(sourceClass + "-" + sourceMethod + ": " + message)}};
	armyc2.c2sd.renderer.utilities.ErrorLogger.LogWarning = function(sourceClass, sourceMethod, message, level){throw {message:(sourceClass + "-" + sourceMethod + ": " + message)}};
	armyc2.c2sd.renderer.utilities.ErrorLogger.LogException = function(sourceClass, sourceMethod, err, level)
	{
		var strMessage = (sourceClass + "." + sourceMethod + "(): " + err.message);
		var myStack = "";
		if(err.stack !== undefined)
		{
			myStack = err.stack;
		}
		
		if(!(myStack))
		{
			if(err.filename && err.lineno)
			{
				myStack = err.filename + " @ line# " + err.lineno;
			}
		}
		strMessage += "\n" + myStack;
		err.message += "\n" + myStack;
		throw strMessage;
		//throw {message:strMessage,error:err, stack:myStack};
	};
	
	
	var window = {};
	var console = {};
	console.log = console.log || function(){};
	console.info = console.info || function(){};
	console.warn = console.warn || function(){};
	console.error = console.error || function(){};
	window.console = console;
	
	var document = {};
	

onmessage = function(e)
{
	var strKml = null;
	
	if(e.data !== null && e.data.altMode !== null)
	{
		try
		{
			strKml = rendererMP.RenderSymbol(e.data.id,e.data.name,e.data.description, e.data.symbolID, e.data.points, e.data.altMode,e.data.scale, e.data.bbox, e.data.modifiers,e.data.format, e.data.symstd);
		}
		catch(err)
		{
			 var myStack = "";
			 if(err.stack !== undefined)
			 myStack = err.stack;
			postMessage({kml:err.message,format:"ERROR", stack:myStack});
		}
	}
	else
	{
		try
		{
			strKml = rendererMP.RenderSymbol2D(e.data.id,e.data.name,e.data.description, e.data.symbolID, e.data.points, e.data.pixelWidth,e.data.pixelHeight, e.data.bbox, e.data.modifiers,e.data.format, e.data.symstd);
		}
		catch(error)
		{
			var myStack = "";
			 if(err.stack !== undefined)
			 myStack = err.stack;
			postMessage({kml:err.message,format:"ERROR", stack:myStack});
			throw error;
		}
	}
	
	
	if(strKml !== null)
	{
		postMessage({kml:strKml,format:e.data.format});
	}
}

