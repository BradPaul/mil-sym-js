//Singleton template, unfortunately, cannot be parsed by netbeans//////////////
var armyc2 = armyc2 || {};
/** namespace */
armyc2.c2sd = armyc2.c2sd || {};
armyc2.c2sd.renderer = armyc2.c2sd.renderer || {};
armyc2.c2sd.renderer.utilities = armyc2.c2sd.renderer.utilities || {};

armyc2.c2sd.renderer.utilities.ErrorLogger = (function () {
    //private vars
    var _level = "800";
    
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    
    //constructor code
    //for IE8
    if(typeof String.prototype.trim !== 'function')
    {
        String.prototype.trim = function()
        {
           return this.replace(/^\s+|\s+$/g, '');
        };
    }
    
    //private functions
    function stacktrace()
    {
        function st2(f)
        {
                return !f ? [] : st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + Array.prototype.slice.call(f.arguments).join(',') + ')']);
                //return !f ? [] : st2(f.caller).concat([f.toString().split('(')[0].substring(9) + '(' + stack + ')']);
        }
        var stack = new String(st2(arguments.callee.caller));
        //console.log(stack);
        var temp = stack.split("),");
        stack = "";
        for(var i=temp.length-2; i > -1; i--)
        {
                        stack += "\tat " + temp[i].trim() + ")\n";
        }
        return stack;
    };
    
    function getDateString(date)
    {
        var strDate = "";
        
        try
        {
            strDate += months[date.getMonth()] + " " +
                        date.getDate() + ", " +
                        date.getFullYear() + " " +
                        date.getHours() + ":" +
                        date.getMinutes() + ":" +
                        date.getSeconds() + "." +
                        date.getMilliseconds();
        }
        catch(err)
        {
            strDate = date.toString();
        }
        
        return strDate;
    }
    
return{    

    //public vars
    OFF : Number.MAX_VALUE,
    SEVERE : 1000,
    WARNING : 900,
    INFO : 800,
    CONFIG : 700,
    FINE : 500,
    FINER : 400,
    FINEST : 300,
    ALL : Number.MIN_VALUE,
    //publicFunction: function(){return "I'm a public function";}
    
    getLevelName: function(level)
    {
        var name = "unknown";
        switch(level)
        {
            case Number.MAX_VALUE:
                name = "OFF";
                break;
            case 1000:
                name = "Severe";
                break;
            case 900:
                name = "Warning";
                break;
            case 800:
                name = "Info";
                break;
            case 700:
                name = "Config";
                break;
            case 500:
                name = "Fine";
                break;
            case 400:
                name = "Finer";
                break;
            case 300:
                name = "Finest";
                break;
            case Number.MIN_VALUE:
                name = "ALL";
                break;
            default:
                name = "Unknown Error Level";
                break;
        }
        return name;
    },
    /**
     * Logger will only log messages at the set level or higher
     * @param {Number} level like:
     * OFF : Number.MAX_VALUE,
     *  SEVERE : 1000,
     *  WARNING : 900,
     *  INFO : 800,
     *  CONFIG : 700,
     *  FINE : 500,
     *  FINER : 400,
     *  FINEST : 300,
     *  ALL : Number.MIN_VALUE,
     */
    setLevel: function(level)
    {
        _level = level;
    },
    getLevel: function()
    {
        return _level;
    },
    /**
     * 
     * @param {String} sourceClass
     * @param {String} sourceMethod
     * @param {type} param1
     */
    Entering: function(sourceClass, sourceMethod, param1)
    {
        if(_level <= this.FINER)
        {
            if(console !== undefined)
            {
                console.log("Entering: " + sourceClass + "." + sourceMethod + "()");
            }
        }
    },
    /**
     * 
     * @param {String} sourceClass
     * @param {String} sourceMethod
     * @param {type} param1
     */        
    Exiting: function(sourceClass, sourceMethod, param1)
    {
        if(_level <= this.FINER)
        {
            if(console !== undefined)
            {
                console.log("Exiting: " + sourceClass + "." + sourceMethod + "()");
            }
        }
    },
    /**
     * 
     * @param {String} sourceClass
     * @param {String} sourceMethod
     * @param {String} message
     * @param {Number} level optional, default 800 (INFO)
     */        
    LogMessage: function(sourceClass, sourceMethod, message, level)
    {
        if(level === undefined || level === null)
            level = 800;
        if(level >= _level)
        {
            if(console !== undefined)
            {
                message = getDateString(new Date()) + " " + sourceClass + " " + sourceMethod + "\n" +
                        this.getLevelName(level) + ": " + message;
                
                //message = "Info: " + sourceClass + "." + sourceMethod + "()" +
                //            "\n" + this.getLevelName(level) + ": " + message;

                console.info(message);
            }
        }
    },
    /**
     * 
     * @param {String} sourceClass
     * @param {String} sourceMethod
     * @param {String} message
     * @param {Number} level optional, default 900 (WARNING)
     */
    LogWarning: function(sourceClass, sourceMethod, message, level)
    {
        if(level === undefined || level === null)
            level = 900;
        if(level >= _level)
        {
            if(console !== undefined)
            {
                message = getDateString(new Date()) + " " + sourceClass + " " + sourceMethod + "\n" +
                        this.getLevelName(level) + ": " + message;
//                message = "Warning: " + sourceClass + "." + sourceMethod + "()" +
//                        "\n" + message;

                console.warn(message);
            }
        }
    },
    /**
     * 
     * @param {String} sourceClass
     * @param {String} sourceMethod
     * @param {String} err
     * @param {Number} level optional, default 1000 (SEVERE)
     */
    LogException: function(sourceClass, sourceMethod, err, level)
    {
        if(level === undefined || level === null)
            level = 1000;
        if(level >= _level)
        {
            if(console !== undefined)
            {
                var message = getDateString(new Date()) + " " + sourceClass + " " + sourceMethod + "\n" +
                        this.getLevelName(level) + ": ";
//                var message = "Error: " + sourceClass + "." + sourceMethod + "()\n";

                message += err.name + ": " + err.message;
                if(err.stack !== undefined && err.stack !== null)
                {
                    message += "\n" + err.stack;
                }
                else //for IE 9 and below.
                {
                    message += "\n" + stacktrace();
                }

                console.error(message);
            }
        }
    }
            
    
};
}());