
(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    // Load an image url or an array of image urls
    function load(urlOrArr,type) {
        if(urlOrArr instanceof Array) {
            urlOrArr.forEach(function(url) {
                _load(url,type);
            });
        }
        else {
            _load(urlOrArr,type);
        }
    }

    function _load(url,type) {


        var resource;

        type = type || matchFileType(url);

        if(resourceCache[url]) {
            return resourceCache[url];
        }
        else {

            switch(type) {
                case 'audio': 
                    resource = new Audio(url);
                    resourceCache[url] = resource;
                    break;
                case 'image':
                default:
                    resource = new Image();
                    
                    resourceCache[url] = false;
                    
                    resource.onload = function() {
                        resourceCache[url] = resource;
                        
                        if(isReady()) {
                            readyCallbacks.forEach(function(func) { func(); });
                        }
                    };

                    resource.src = url;

                    break;
            }

            if(isReady()) {
                readyCallbacks.forEach(function(func) { func(); });
            }

           

           
        }
    }

    function get(url) {
        return resourceCache[url];
    }

    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    function onReady(func) {
        readyCallbacks.push(func);
    }

    function matchFileType(url){
        url = url.toLowerCase();
        if(/\.(jpg|jpeg|png|gif|bmp)/.test(url)) return 'image';
        if(/\.(wav|mp3)/.test(url)) return 'audio';
    }

    window.resources = { 
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };
})();