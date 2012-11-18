/*!
 * cue.js     Native HTML5 <audio> and <video> playlists via JSON and data attributes.
 * @author    Ryan Van Etten <@ryanve>
 * @link      github.com/ryanve/cue
 * @license   MIT 
 * @version   0.x
 * @requires  jQuery or ender
 */
 
/*jslint browser: true, devel: true, node: true, passfail: false, bitwise: true, continue: true
, debug: true, eqeq: true, es5: true, forin: true, newcap: true, nomen: true, plusplus: true
, regexp: true, undef: true, sloppy: true, stupid: true, sub: true, vars: true, white: true
, indent: 4, maxerr: 180 */

(function ( root, document, undefined ) {

    // developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement
    // developer.mozilla.org/en-US/docs/DOM/Media_events

    var require = root['require']
      , jQuery = root['jQuery'] || ( !!require && require('jquery') )
      , $ = jQuery || root['ender'] || ( !!require && require('ender') ) // ender.no.de
      , isArray = Array.isArray || $['isArray'] || ( !!$['is'] && $['is']['Array'] ) 
      , each = $['each']
      
      , trimmer = /^\s+|\s+$/
      , trim = $.trim || (''.trim ? function (s) { 
            return s.trim(); 
        } : function (s) {
            return s.replace(trimmer, '');
        })

      , nativeJSONParse = !!root['JSON'] && JSON['parse']
      , parseJSON = $['parseJSON'] || (nativeJSONParse && function (s) {
            if ( typeof s != 'string' || !(s = trim(s)) ) { return null; }
            return nativeJSONParse(s);
        })
        
      , singleDigits = /(^|\D)(\d\D|\d$)/g

      , audio    = 'audio'
      , video    = 'video'
      , controls = 'controls'
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
      
      , supported = (function () {

            // developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement
            // developer.mozilla.org/en-US/docs/Media_formats_supported_by_the_audio_and_video_elements
            // github.com/Modernizr/Modernizr/blob/master/feature-detects/audio.js
            // github.com/Modernizr/Modernizr/blob/master/feature-detects/video.js

            var supported = {}
              , canPlayType = 'canPlayType' 
              , el, name, type, test, i, o
              , keys = [ audio, video ] // outer
              , types = {
                    'audio': {
                        'm4a' : [ 'audio/x-m4a;', 'audio/aac;' ]
                      , 'wav' : [ 'audio/mpeg;' ]
                      , 'ogg' : [ 'audio/ogg;codecs="vorbis"' ]
                      , 'mp3' : [ 'audio/mpeg;' ]
                     }
                  , 'video': {
                        'ogg' : [ 'video/ogg;codecs="theora"' ]
                      , 'webm': [ 'video/webm;codecs="vp8, vorbis"' ]
                      , 'mp4' : [ 'video/mp4;codecs="avc1.42E01E"' ]
                    }
                };
    
            // Make an array for each tagName that contains a prioritized list of 
            // the supported extensions. And add flags on the array for each type.
            // The flag will be "probably"|"maybe"|false and the array will contain
            // only types that are "probably" or "maybe" ( in that order ).
            while ( name = keys.pop() ) {
                el = document.createElement(name);
                supported[name] = [];
                if ( el[canPlayType] ) {
                    o = types[name];
                    for ( type in o ) {
                        if ( !o.hasOwnProperty(type) ) { break; } // owned props enumerate 1st
                        i = o[type].length; // m4a has 2 tests and the rest have 1
                        while ( i-- ) {
                            test = el[canPlayType]( o[type][i] );
                            if ( supported[name][type] = !!test && 'no' !== test && test ) {// <== string|false
                                supported[name]['maybe' === test ? 'push' : 'unshift'](type);
                                break;
                            }
                        }
                    }
                }
            }

            return supported;
      
        }())
    
      , controlsClass = 'cue-' + controls
      , controlsHtml = '<div class=' + controlsClass + '>' +
            // wrap shapes in spans so that css image replacement is possible
            '<button accesskey=j data-cue-off class=cue-prev title=previous><span>' + lseek + '</span></button>' + 
            '<button accesskey=p data-cue-off class=cue-play title=play/pause><span>' + play + '</span><span>' + pause + '</span></button>' + 
            '<button accesskey=k data-cue-off class=cue-next title=next><span>' + rseek + '</span></button>' + 
            //'<input class=cue-level type=range min=0 max step=0.01 value=0.00>'   + 
            '<output data-cue-off class=cue-time></output>'                         + 
            //'<input class=cue-needle type=range min=0 max=100 step=1 value=100>'  + 
        '</div>'
      , $controls;
      
    /**
     * Convert seconds to HH:MM:SS:FF
     * @param   {number}           seconds
     * @param   {string|boolean=}  glue
     * @return  {string}
     */
    function formatTime ( seconds, glue ) {

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
        
        result = [ hours, minutes, seconds, frames ];
        if ( glue === false ) { return result; }
        result = result.join(glue || ' : ');

        // add leading zero to single digits
        return result.replace(singleDigits, '$10$2'); 
    }

    // inlined @ minification
    function namespace (eventName) {
        return eventName + '.cue';
    }
    
    // inlined @ minification
    function isPaused (media) {
        return media.paused || media.ended;
    }

    /**
     * @param {Object}         uris     plain object containing source uris by type
     * @param {Object|string}  elem     DOM element or tagName ("audio" or "video")
     * @uses  the `supported` feature detection object defined above
     */
    function getBestType ( uris, elem ) {
    
        var uri
          , types = supported[ (elem.nodeType ? elem.tagName : elem).toLowerCase() ]
          , l = types.length
          , i = 0;

        while ( i < l ) {
            if ( uri = uris[ types[i++] ] ) {
                return uri;
            }
        }

        // default
        return '';

    }
    
    /**
     * ess     "each separated string"         Designed for iterating separated values. 
     *                                         Defaults to SSV. Skips falsey values.
     * @param   {Array|Object|string|*} list   is an ssv string, array, or arr-like object to iterate
     * @param   {(Function|*)=}         fn     is the callback - it receives (value, index, array)
     * @param   {(RegExp|string|*)=}    delim  is a delimiter to split strings with (defaults to ssv)
     * @return  {Array}                        new compact array containing the split values
     */
    function ess (list, fn, delim) {// or `ess(list, delim)` or `ess(list)`
    
        var l, v, j, i = 0, comp = [];
        if ( !list ) { return comp; }
        typeof fn != 'function' && null == delim && (delim = fn) && (fn = 0);
        list = typeof list == 'string' ? list.split(delim || ' ') : list;
        l = list.length;
        while ( i < l ) {
            if ( v = list[i++] ) {// Skip falsey values.
                // Send j/comp rather than i/list to enaable `fn` to mutate `comp`
                // It's like: `list.filter(function(v){ return !!v; }).forEach(fn)`
                // If you need custom scope then use: `ess(list).forEach(fn, scope)`
                j = comp.push(v) - 1;
                fn && fn.call(v, v, j, comp);
            }
        }
        return comp;
    }
    
    /**
     * Parse JSON from a file or a string
     * @param  {string|*}     raw       JSON or filename of JSON file
     * @param  {Function=}    fn        Callback for ajax-loaded data.
     * @param  {Object=}      scope     thisArg passed to `fn`
     * @return {Object|undefined}
     */
    function json ( raw, fn, scope ) {
    
        var object, ext = 'json';
        raw = typeof raw == 'function' ? raw.call(this) : raw;
        if ( !raw ) { return; }
        if ( typeof raw != 'string' ) { return raw; }
        if ( !(raw = $.trim(raw)) ) { return; }
        
        raw.substr(-5) === ('.' + ext) ? $.get(raw, function (data) {
            // asynchronous ==> call effinCue when data arrives
            data && fn.call( scope, data );
        }, ext) : (object = parseJSON(raw)); 

        return object; // undefined if using $.get
    }
    
    /**
     * Inserts the markup for the custom controls.
     * The corresponding events are added elsewhere.
     */
    function insertControls ( $container, $media ) {
    
        $media.each(function () {
        
            var media = this
              , currControls;
        
            // quasi-respect the behavior of [controls]
            // (only add them if [controls] is present)
            if ( null == media.getAttribute(controls) ) {
                return;
            }
            
            // Abort if there's already a controls element.
            if ( $container.find('.' + controlsClass).length ) { 
                return; 
            }
            
            // Remove native [controls] b/c we have custom controls
            media.removeAttribute(controls);
            
            $container.children().each(function () {
                if ( this === media || $.contains(this, media) ) {
                    $controls = $controls || $(controlsHtml);
                    return ! $controls.insertAfter(this); // break
                }
            });

        });            
    }
    
    /**
     *
     */
    function changeTrack ( container, nodeList, media, playlist, amount ) {
            
        amount = amount || 0;

        var curr = media.currentSrc
          , ext, i = 0, idx = 0
          , next = null
          , l = playlist.length;
          
        if ( curr ) {
            for ( ext = curr.split('.').pop() || 'src'; i < l; i++ ) {
                if ( playlist[i] && playlist[i][ext] === curr ) {
                    next = playlist[ idx = i + amount ]; 
                    break;
                }
            }
        }

        if ( !next ) {// no curr OR idx was past either end
            idx = amount < 0 ? l - 1 : 0; // last or first
            next = playlist[idx]; // playlist object
        }
        
        media['src'] = next[ext] || ''; // set the attr
        container.setAttribute('data-cue-idx', idx);
        media.play();

        // Update fields. - for example:  `<p data-cue-insert="caption"></p>`
        // gets the current json caption value inserted into it. We want this to
        // be live so that it works for elems added after initialization. Use the 
        // live nodeList created by getElementsByTagName('*') rather than
        // using .find( selector ) each time for better performance.
        // <p data-cue-attr='{"title":"title"}'>
        each(nodeList, function () {
        
            var n, key, attrs, insert, node = this;
            if ( !node || 1 !== node.nodeType ) { return; }
            insert = node.getAttribute(cueInsert);
            attrs  = node.getAttribute(cueAttr);
            
            if ( null != insert ) {
                insert = next[insert];
                null == insert ? $(node).empty() : $(node).html(insert);
            }
            
            if ( attrs && typeof attrs == 'string' ) {
                attrs = parseJSON(attrs);
                for ( n in attrs ) {
                    if ( !attrs.hasOwnProperty(n) ) { break; }
                    key = attrs[n];
                    if ( key && typeof key == 'string' ) {
                        null == next[key] ? node.removeAttribute(n) : node.setAttribute(n, next[key]); 
                    }
                }
            }
            
        });
        
        return idx;

    }
    
    function addMarkedEvent ( $container, sel, type, fn ) {
        // Use data attrs to keep track of whether we added an event to an elem
        // and prevent adding it again if $.fn.cue is called twice on the same elem.
        var boolAttr = 'data-' + type + '-cue', object = {};
        object[boolAttr] = '';
        return $container.find(sel).not('[' + boolAttr + ']').on( namespace(type), fn ).attr(object).removeClass(inactive).addClass(active);
    }
    
    function activateTimeUpdate ( $container, $media ) {
        var $time = $container.find('.cue-time');
        $time.length && $media.on( namespace('timeupdate'), function () {
            $time.html( formatTime(this.currentTime) );
        }).addClass(active).removeClass(inactive);
    }

    /**
     * $.fn.cue()
     * @param {(Object|string)=}  inputData
     */
    function effinCue ( inputData ) {
    
        // Use `$.each` rather than `this.each` so that
        // effinCue can be .called w/ a plain array:

        return each(this, function () {
            
            if ( 1 !== this.nodeType ) { return; }

            if ( typeof inputData == 'function' ) {
                // ensures that inputData is not a function below for
                // json and allows devs to customize data at runtime
                // but maybe this would be more useful to add event capabilities
                return effinCue.call( [this], inputData.call(this) );
            }
            
            var $container = $(this)
              , $media, nodeList
              , cue, media, i;

            cue = inputData || $container.attr('data-cue');
            if ( !cue ) { return; }
            cue = json( cue, effinCue, $container );
            if ( typeof cue != 'object' ) { return; } // async OR junk input
            cue = !cue ? [] : isArray(cue) ? cue : [cue];
            
            // get the first video or audio elem ( ensure $media.length === 1 )
            media = $container.find(video + ',' + audio)[0];
            if ( !media ) { return; }
            $media = $(media);
            
            insertControls( $container, $media );
            
            activateTimeUpdate( $container, $media );
    
            function playPause (eventData) {
            
                var paused = isPaused(media)
                  , rem = 'removeClass'
                  , add = 'addClass';

                this.className = 'cue-' + (paused ? 'pause' : 'play');
                $container[ paused ? add : rem ](cuePlaying)[ paused ? rem : add ](cuePaused);

            }
            
            addMarkedEvent( $container, '.cue-play,.cue-pause', 'click', function () {
                media[ isPaused(media) ? 'play' : 'pause' ]();
            });

            $media.on( namespace('play'), playPause );
            $media.on( namespace('pause'), playPause );

            if ( i = cue.length ) {
            
                while ( i-- ) {
                
                    // Add track number prop for use with [data-cue-insert]
                    cue[i]['track-number'] = i;
                    
                    // Check for multiple src values and set props for each 
                    // unique type. Reset src in the process to ensure it 
                    // is string|undefined for fallback usage in getBestType.
                    if ( srcs = cue[i]['src'] ) {
                        srcs = isArray(srcs) ? srcs : srcs.split(' ');
                        j = srcs.length;
                        while ( j-- ) {
                            srcs[j] && ( ext = srcs[j].split('.').pop() ) && ( cue[i][ext] = cue[i][ext] || srcs[j] );
                        }
                        srcs = srcs[0];
                    }
                    
                    // if the 'src' is set then organize by type
                    // 'src' can be an ssv string or an array here
                    ess(cue[i]['src'], function (v) {
                        var ext = v.split('.').pop();
                        cue[i][ext] = cue[i][ext] || v;
                    });
                    
                    // save the best type back to the 'src' prop
                    cue[i]['src'] = getBestType( cue[i], media );
                }
                
                // live reference to all elements in container
                nodeList = this.getElementsByTagName('*'); 
                
                // attach the changeTrack handlers
                addMarkedEvent( $container, '.cue-next', 'click', function (eventData) {
                    changeTrack( $container[0], nodeList, media, cue, 1 );
                });

                addMarkedEvent( $container, '.cue-prev', 'click', function (eventData) {
                    changeTrack( $container[0], nodeList, media, cue, -1 );
                });

            } else {
                // Ensure that the attr is exactly empty for css purposes
                // using [data-cue=""] to dim or hide the prev/next buttons
                $container.attr('data-cue', '');
            }

        });
    }//effinCue
    // public method allows for initialization of ajax content
    $['fn']['cue'] = effinCue;
    
    // initialize
    $(document).ready(function () {
        // same as $('[data-cue]').cue() 
        // but use local in case public prop is overwritten before this is called  
        effinCue.call( $('[data-cue]') );
    });
    
}( this, document ));