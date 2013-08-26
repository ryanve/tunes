/*!
 * cue.js     Native HTML5 <audio> and <video> playlists via JSON and data attributes.
 * @author    Ryan Van Etten <@ryanve>
 * @link      github.com/ryanve/cue
 * @license   MIT 
 * @version   0.5.9
 * @requires  jQuery or ender
 */

/*jshint expr:true, sub:true, supernew:true, debug:true, node:true, boss:true, devel:true, evil:true, 
  laxcomma:true, eqnull:true, undef:true, unused:true, browser:true, jquery:true, maxerr:100 */

(function(root, window, document) {
    // developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement
    // developer.mozilla.org/en-US/docs/DOM/Media_events

    var $controls
      , require = root['require']
      , $ = root['jQuery'] || require && require('jquery') || root['ender'] || require && require('ender')
      , trim = $['trim'] || function(s) {
            return s.replace(/^\s+|\s+$/, '');
        }
      , JSON = window['JSON']
      , parser = $['parseJson'] || JSON && JSON['parse']
      , parseJson = function(s) {
            return typeof s == 'string' && (s = trim(s)) ? parser(s) : null;
        }
      , singleDigits = /(^|\D)(\d\D|\d$)/g
      , audio = 'audio'
      , video = 'video'
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
      , controls = 'controls'
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
      , support = deduce([audio, video], function(name, i) {
            // developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement
            // developer.mozilla.org/en-US/docs/Media_formats_supported_by_the_audio_and_video_elements
            // github.com/Modernizr/Modernizr/blob/master/feature-detects/audio.js
            // github.com/Modernizr/Modernizr/blob/master/feature-detects/video.js
            var ext
              , arr = this[name] = []
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
            if (el.canPlayType) {
                name += '/';
                for (ext in types) {
                    types.hasOwnProperty(ext) && deduce(types[ext], function(type) {
                        var can = el.canPlayType(name + type);
                        if (arr[ext] = 'no' !== can && can || false) // Assign string|false.
                            return arr['maybe' === can ? 'push' : 'unshift'](ext); // Stop loop.
                    });
                }
            }
            return i && this;
        }, {});

    /**
     * hybrid iterator blends _.some, _.detect, and _.reduce
     * @param  {Object|Array|NodeList} ob
     * @param  {Function}              fn
     * @param  {*=}                    scope
     */    
    function deduce(ob, fn, scope) {
        for (var r, i = 0, l = ob.length; i < l;) {
            if (r = fn.call(scope, ob[i], i++, ob)) return r;
        }
    }
      
    /**
     * Convert seconds to HH:MM:SS:FF
     * @param   {number}           seconds
     * @param   {string|boolean=}  glue
     * @return  {string|Array}
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
        return result.replace(singleDigits, '$10$2'); // Add leading zero to single digits.
    }

    // inline @ minification
    function namespace(eventName) {
        return eventName + '.cue';
    }
    
    // inline @ minification
    function isPaused(media) {
        return media.paused || media.ended;
    }
    
    /**
     * @param  {Node|string} el
     */
    function toTagName(el) {
        return (el.nodeName || el).toLowerCase();
    }

    /**
     * @param {Object}  uris  plain object containing source uris by type
     * @param {string}  name  "audio" or "video"
     */
    function getBestType(uris, name) {
        return deduce(support[name], function(type) {
            return uris[type];
        }) || '';
    }
    
    /**
     * @param  {Array|Object|string|*} list  is an ssv string, array, or arr-like object
     * @return {Array}                       new compact array containing the split values
     */
    function compact(list) {
        var l, i = 0, comp = [];
        if (!list) return comp;
        list = typeof list == 'string' ? list.split(' ') : list;
        for (l = list.length; i < l; i++)
            list[i] && comp.push(list[i]);
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
     */
    function json(raw, fn, scope) {
        var object, ext = 'json';
        raw = typeof raw == 'function' ? raw.call(this) : raw;
        if (!raw) return;
        if (typeof raw != 'string') return raw;
        if (!(raw = trim(raw))) return;
        raw.substr(-5) === ('.' + ext) ? $.get(raw, function(data) {
            // Asynchronous ==> call effinCue when data arrives
            data && fn.call(scope, data);
        }, ext) : (object = parseJson(raw)); 
        return object; // Undefined if using $.get
    }

    /**
     * Insert the custom $controls markup. Corresponding events are added elsewhere.
     */
    function insertControls($container, $media) {
        deduce($media, function(media) {
            if (null == media.getAttribute(controls)) return; // Abort if [controls] is not present.
            if ($container.find('.' + controlsClass).length) return; // Or if we already added them.
            media.removeAttribute(controls); // Remove native [controls] b/c we have custom controls.
            deduce($container.children(), function(kid) {
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
        deduce(nodeList, function(node) {
            var n, atts, insert;
            if (!node || 1 !== node.nodeType) return;
            insert = node.getAttribute(cueInsert);
            atts = node.getAttribute(cueAttr);
            null == insert || (null == (insert = next[insert]) ? $(node).empty() : $(node).html(insert));
            if (atts = atts && typeof atts == 'string' && parseJson(atts)) {
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
     * @this {Object} cue item
     */
    function setExtensionProps(v, x) {
        // Repurpose index `x` to grab extension.
        this[x = v.split('.').pop()] || (this[x] = v);
    }

    /**
     * $.fn.cue()
     * @param {(Object|Function|string)=}  inputData
     */
    function effinCue(inputData) {
        deduce(this, function(container) {
            if (1 !== container.nodeType) return;
            if (typeof inputData == 'function')
                // Ensure that inputData is not a function for JSON, and allow devs to customize
                // data at runtime. (Maybe this would be more useful to add event capabilities.)
                return !effinCue.call([container], inputData.call(container)); // Invert to continue loop.

            var $media, media, nodeList, tagName, i, cue, $container = $(container);
            cue = inputData || $container.attr('data-cue');
            if (!cue) return;
            cue = json(cue, effinCue, $container);
            if (typeof cue != 'object') return; // Async, or junk input
            cue = cue ? [].concat(cue) : [];
            
            // get the first video or audio elem (ensure $media.length === 1)
            media = $container.find(video + ',' + audio)[0];
            if (!media) return;
            tagName = toTagName(media);
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

                    // Check for multiple 'src' values and set props for each unique type. 
                    deduce(compact(cue[i]['src']), setExtensionProps, cue[i]);
                    
                    // Save the best type back to the 'src' prop
                    cue[i]['src'] = getBestType(cue[i], tagName);
                }
                
                // Get live reference to all elements in container
                nodeList = container.getElementsByTagName('*'); 
                
                // Attach the changeTrack handlers
                deduce(['.cue-prev', '.cue-next'], function(selector, i) {
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
}(this, window, document));