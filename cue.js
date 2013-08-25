/*!
 * cue.js     Native HTML5 <audio> and <video> playlists via JSON and data attributes.
 * @author    Ryan Van Etten <@ryanve>
 * @link      github.com/ryanve/cue
 * @license   MIT 
 * @version   0.5.4
 * @requires  jQuery or ender
 */

/*jshint expr:true, sub:true, supernew:true, debug:true, node:true, boss:true, devel:true, evil:true, 
  laxcomma:true, eqnull:true, undef:true, unused:true, browser:true, jquery:true, maxerr:100 */

(function(root, document, undefined) {
    // developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement
    // developer.mozilla.org/en-US/docs/DOM/Media_events

    var require = root['require']
      , jQuery = root['jQuery'] || (!!require && require('jquery'))
      , $ = jQuery || root['ender'] || (!!require && require('ender'))
      , trim = $['trim'] || function(s) {
            return s.replace(/^\s+|\s+$/, '');
        }
      , nativeJSONParse = !!root['JSON'] && JSON['parse']
      , parseJSON = $['parseJSON'] || nativeJSONParse && function(s) {
            return typeof s == 'string' && (s = trim(s)) ? nativeJSONParse(s) : null;
        }
      , audio    = 'audio'
      , video    = 'video'
      , controls = 'controls'
      , poster = 'poster'
      , active = 'cue-active'
      , inactive = 'cue-inactive'
      , cuePaused = 'cue-paused'
      , cuePlaying = 'cue-playing'
      , cueInsert = 'data-cue-insert'
      , cueAttr = 'data-cue-attr'
      , play = '&#9658;'
      , pause = '| |'
      , rseek = '&#9658;&#9658;|'
      , lseek = '|&#9668;&#9668;'
      , singleDigits = /(^|\D)(\d\D|\d$)/g
      , supported = (function(supported, tags) {
            // developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement
            // developer.mozilla.org/en-US/docs/Media_formats_supported_by_the_audio_and_video_elements
            // github.com/Modernizr/Modernizr/blob/master/feature-detects/audio.js
            // github.com/Modernizr/Modernizr/blob/master/feature-detects/video.js
            detect(tags, function(name, i) {
                var ext
                  , arr = supported[name] = []
                  , el = document.createElement(name)
                  , types = i ? {
                    'ogg': ['ogg;codecs="theora"']
                  , 'webm': ['webm;codecs="vp8,vorbis"']
                  , 'mp4': ['mp4;codecs="avc1.42E01E"']
                } : {
                    'm4a': ['aac;', 'x-m4a;']
                  , 'wav': ['mpeg;']
                  , 'ogg': ['ogg;codecs="vorbis"']
                  , 'opus': ['ogg;codecs="opus"']
                  , 'mp3': ['mpeg;']
                };
                if (!el.canPlayType) return;
                name += '/';
                for (ext in types) {
                    types.hasOwnProperty(ext) && detect(types[ext], function(type) {
                        var can = el.canPlayType(name + type);
                        if (arr[ext] = 'no' !== can && can || false)
                            return arr['maybe' === can ? 'push' : 'unshift'](ext);
                    });
                }
            });
            return supported;
        }({}, [audio, video]))

      , controlsClass = 'cue-' + controls
      , controlsHtml = '<div class=' + controlsClass + '>' +
            // wrap shapes in spans so that css image replacement is possible
            '<button accesskey=j class=cue-prev title=previous><span>' + lseek + '</span></button>' + 
            '<button accesskey=p class=cue-play title=play/pause><span>' + play + '</span><span>' + pause + '</span></button>' + 
            '<button accesskey=k class=cue-next title=next><span>' + rseek + '</span></button>' + 
            //'<input class=cue-level type=range min=0 max step=0.01 value=0.00>'   + 
            '<output class=cue-time></output>'                         + 
            //'<input class=cue-needle type=range min=0 max=100 step=1 value=100>'  + 
        '</div>'
      , $controls;

    /**
     * @param  {Object|Array|NodeList} ob
     * @param  {Function}              fn
     * @param  {*=}                    scope
     */    
    function detect(ob, fn, scope) {
        for (var v, i = 0, l = ob.length; i < l;)
            if (fn.call(scope, v = ob[i], i++, ob)) return v;
    }
      
    /**
     * Convert seconds to HH:MM:SS:FF
     * @param   {number}           seconds
     * @param   {string|boolean=}  glue
     * @return  {string}
     */
    function formatTime(seconds, glue) {
        seconds = seconds || 0;
        var minutes = seconds / 60
          , hours = minutes / 60
          , frames = 60 * seconds
          , result; 
        
        // bit.ly/arithmetic-operators
        hours   = hours.toFixed();
        minutes = (minutes % 60).toFixed();
        seconds = (seconds % 60).toFixed();
        frames  = (frames % 60).toFixed();
        
        result = [hours, minutes, seconds, frames];
        if (glue === false) return result;
        result = result.join(glue || ' : ');

        // add leading zero to single digits
        return result.replace(singleDigits, '$10$2'); 
    }

    // inlined @ minification
    function namespace(eventName) {
        return eventName + '.cue';
    }
    
    // inlined @ minification
    function isPaused(media) {
        return media.paused || media.ended;
    }

    /**
     * @param {Object}      uris  plain object containing source uris by type
     * @param {Node|string} name  DOM element or tagName "audio" or "video"
     */
    function getBestType(uris, name) {
        return (name = detect(supported[(name.nodeName || name).toLowerCase()], function(type) {
            return uris[type];
        })) ? uris[name] : '';
    }
    
    /**
     * ess     "each separated string" Iterate separated values. Defaults to SSV. Skips falsey values.                                   
     * @param   {Array|Object|string|*} list   is an ssv string, array, or arr-like object to iterate
     * @param   {(Function|*)=}         fn     is the callback - it receives (value, index, array)
     * @param   {(RegExp|string|*)=}    delim  is a delimiter to split strings with (defaults to ssv)
     * @return  {Array}                        new compact array containing the split values
     */
    function ess(list, fn, delim) {// or `ess(list, delim)` or `ess(list)`
        var l, v, j, i = 0, comp = [];
        if (!list) return comp;
        typeof fn != 'function' && null == delim && (delim = fn) && (fn = 0);
        list = typeof list == 'string' ? list.split(delim || ' ') : list;
        for (l = list.length; i < l;) {
            if (v = list[i++]) {
                j = comp.push(v) - 1; // Push the value and grab its index.
                fn && fn.call(v, v, j, comp); // `fn` can mutate `comp`
            }
        }
        return comp;
    }
    
    /**
     * If the value is null, remove the attribute. Otherwise set it.
     * @param  {Object}  node
     * @param  {string}  k
     * @param  {*=}      v
     */
    function updateAttr(node, k, v) {
        null == v ? node.removeAttribute(k) : node.setAttribute(k, v);
    }
    
    /**
     * Parse JSON from a file or a string
     * @param  {string|*}     raw       JSON or filename of JSON file
     * @param  {Function=}    fn        Callback for ajax-loaded data.
     * @param  {Object=}      scope     thisArg passed to `fn`
     * @return {Object|undefined}
     */
    function json(raw, fn, scope) {
        var object, ext = 'json';
        raw = typeof raw == 'function' ? raw.call(this) : raw;
        if (!raw) return;
        if (typeof raw != 'string') return raw;
        if (!(raw = trim(raw))) return;
        raw.substr(-5) === ('.' + ext) ? $.get(raw, function(data) {
            // asynchronous ==> call effinCue when data arrives
            data && fn.call(scope, data);
        }, ext) : (object = parseJSON(raw)); 
        return object; // Undefined if using $.get
    }

    /**
     * Insert the custom $controls markup. Corresponding events are added elsewhere.
     */
    function insertControls($container, $media) {
        detect($media, function(media) {
            if (null == media.getAttribute(controls)) return; // Abort if [controls] is not present.
            if ($container.find('.' + controlsClass).length) return; // Or if we already added them.
            media.removeAttribute(controls); // Remove native [controls] b/c we have custom controls.
            detect($container.children(), function(kid) {
                if (kid === media || $.contains(kid, media)) {
                    $controls = $controls || $(controlsHtml);
                    $controls.insertAfter(kid);
                    return 1;
                }
            });
        });
    }
    
    /**
     *
     */
    function changeTrack(container, nodeList, media, tagName, playlist, amount) {
        amount = amount || 0;
        var next, ext, curr = media.currentSrc, i = 0, idx = 0, l = playlist.length;
        if (curr) {
            for (ext = curr.split('.').pop() || 'src'; i < l; i++) {
                if (playlist[i] && playlist[i][ext] === curr) {
                    next = playlist[idx = i + amount]; 
                    break;
                }
            }
        }

        if (!next) {// no curr OR idx was past either end
            idx = amount < 0 ? l - 1 : 0; // last or first
            next = playlist[idx]; // playlist object
        }
        media['src'] = next[ext] || ''; // set the attr
        container.setAttribute('data-cue-idx', idx);
        video === tagName && updateAttr(media, poster, next[poster]);
        media.play();

        // Update fields. - for example:  `<p data-cue-insert="caption"></p>`
        // gets the current json caption value inserted into it. We want this to
        // be live so that it works for elems added after initialization. Use the 
        // live nodeList created by getElementsByTagName('*') rather than
        // using .find(selector) each time for better performance.
        // <p data-cue-attr='{"title":"title"}'>
        detect(nodeList, function(node) {
            var n, atts, insert;
            if (!node || 1 !== node.nodeType) return;
            insert = node.getAttribute(cueInsert);
            atts = node.getAttribute(cueAttr);
            null == insert || (null == (insert = next[insert]) ? $(node).empty() : $(node).html(insert));
            if (atts = atts && typeof atts == 'string' && parseJSON(atts)) {
                for (n in atts) {
                    if (typeof atts[n] == 'string' || typeof atts[n] == 'number') {
                        updateAttr(node, n, next[atts[n]]);
                    }
                }
            }
        });
        return idx;
    }
    
    function addMarkedEvent($container, sel, type, fn) {
        // Use data attrs to keep track of whether we added an event to an elem
        // and prevent adding it again if $.fn.cue is called twice on the same elem.
        var boolAttr = 'data-' + type + '-cue', object = {};
        object[boolAttr] = '';
        return ($container.find(sel).not('[' + boolAttr + ']')
            .on(namespace(type), fn).attr(object)
            .removeClass(inactive).addClass(active));
    }
    
    function activateTimeUpdate($container, $media) {
        var $time = $container.find('.cue-time');
        $time.length && $media.on(namespace('timeupdate'), function() {
            $time.html(formatTime(this.currentTime));
        }).addClass(active).removeClass(inactive);
    }

    /**
     * $.fn.cue()
     * @param {(Object|string)=}  inputData
     */
    function effinCue(inputData) {
        detect(this, function(container) {
            if (1 !== container.nodeType) return;
            if (typeof inputData == 'function')
                // Ensure that inputData is not a function for JSON, and allow devs to customize
                // data at runtime. (Maybe this would be more useful to add event capabilities.)
                return effinCue.call([container], inputData.call(container));

            var $media, media, nodeList, tagName, srcs, ext, j, i, cue, $container = $(container);
            cue = inputData || $container.attr('data-cue');
            if (!cue) return;
            cue = json(cue, effinCue, $container);
            if (typeof cue != 'object') return; // Async, or junk input
            cue = cue ? [].concat(cue) : [];
            
            // get the first video or audio elem (ensure $media.length === 1)
            media = $container.find(video + ',' + audio)[0];
            if (!media) return;
            tagName = media.tagName.toLowerCase();
            $media = $(media);
            insertControls($container, $media);
            activateTimeUpdate($container, $media);
    
            function playPause() {
                var paused = isPaused(media), rem = 'removeClass', add = 'addClass';
                this.className = 'cue-' + (paused ? 'pause' : 'play');
                $container[paused ? add : rem](cuePlaying)[paused ? rem : add](cuePaused);
            }
            
            addMarkedEvent($container, '.cue-play,.cue-pause', 'click', function() {
                media[isPaused(media) ? 'play' : 'pause']();
            });

            $media.on(namespace('play'), playPause);
            $media.on(namespace('pause'), playPause);

            if (i = cue.length) {
                while (i--) {
                    // Add track number prop for use with [data-cue-insert]
                    cue[i]['track-number'] = i;
                    
                    // Check for multiple src values and set props for each unique type. 
                    // Reset src to ensure it is string|undefined for fallback usage in getBestType.
                    if (srcs = cue[i]['src']) {
                        for (j = (srcs = typeof srcs == 'string' ? srcs.split(' ') : srcs).length; j--;)
                            srcs[j] && (ext = srcs[j].split('.').pop()) && (cue[i][ext] = cue[i][ext] || srcs[j]);
                        srcs = srcs[0];
                    }
                    
                    // If the 'src' is set, organize by type.
                    ess(cue[i]['src'], function(v) {
                        var ext = v.split('.').pop();
                        cue[i][ext] = cue[i][ext] || v;
                    });
                    
                    // Save the best type back to the 'src' prop
                    cue[i]['src'] = getBestType(cue[i], tagName);
                }
                
                // Get live reference to all elements in container
                nodeList = container.getElementsByTagName('*'); 
                
                // Attach the changeTrack handlers
                detect(['.cue-prev', '.cue-next'], function(selector, i) {
                    addMarkedEvent($container, selector, 'click', function() {
                        changeTrack(container, nodeList, media, tagName, cue, i || -1);
                    });
                });
            } else {
                // Ensure that the attr is exactly empty for css purposes
                // using [data-cue=""] to dim or hide the prev/next buttons
                $container.attr('data-cue', '');
            }
        });
        return this;
    }
    $['fn']['cue'] = effinCue; // Public method allows for initialization of AJAX content.
    
    // Initialize
    $(document).ready(function() {
        effinCue.call($('[data-cue]')); // Use local in case public prop changes.
    });
}(this, document));