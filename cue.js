/*!
 * cue.js
 * @author   Ryan Van Etten <@ryanve>
 * @license  MIT 
 * @version  2012-11-11
 */
 
/*jslint browser: true, devel: true, node: true, passfail: false, bitwise: true, continue: true
, debug: true, eqeq: true, es5: true, forin: true, newcap: true, nomen: true, plusplus: true
, regexp: true, undef: true, sloppy: true, stupid: true, sub: true, vars: true, white: true
, indent: 4, maxerr: 180 */

(function ( root, document ) {

    var require = root['require']
      , jQuery = root['jQuery'] || ( !!require && require('jquery') )
      , $ = jQuery || root['ender'] || ( !!require && require('ender') ) // ender.no.de
      , isArray  = $['isArray'] || ( !!$['is'] && $['is']['Array'] )
      
      , OP = Object.prototype
      , owns = OP.hasOwnProperty
      
      , audio    = 'audio'
      , video    = 'video'
      , controls = 'controls'
      , seekable = 'data-cued'
      
        // shapes
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
              , keys = [ audio, video ] // outer
              , types = {
                    'audio': {
                        'mp3' : [ 'audio/mpeg;' ]
                      , 'ogg' : [ 'audio/ogg; codecs="vorbis"' ]
                      , 'wav' : [ 'audio/mpeg;' ]
                      , 'm4a' : [ 'audio/x-m4a;', 'audio/aac;' ]
                     }
                  , 'video': {
                        'mp4' : [ 'video/mp4; codecs="avc1.42E01E"' ]
                      , 'webm': [ 'video/webm; codecs="vp8, vorbis"' ]
                      , 'ogg' : [ 'video/ogg; codecs="theora"' ]
                    }
                }

              , name
              , type
              , test
              , el
              , o
              , i;
    
            while ( name = keys.pop() ) {
                el = document.createElement(name);
                supported[name] = [];
                if ( el[canPlayType] ) {
                    o = types[name];
                    for ( type in o ) {
                        if ( !o.hasOwnProperty(type) ) { break; }
                        i = o[type].length;
                        while ( i-- ) {
                            test = el[canPlayType]( o[type][i] );
                            if ( test && test !== 'no' ) {
                                supported[name]['maybe' === test ? 'push' : 'unshift'](type);
                                break;
                            }
                        }
                    }
                }
            }
            
            return supported;
      
        }())
      
        /**
         * @param {Object}  uris     object containing source uris by type
         * @param {Object}  tagName  "audio" or "video"
         */
      , getBestType = function ( uris, tagName ) {
      
            var uri
              , types = supported[ tagName.toLowerCase() ]
              , l = types.length
              , i = 0;

            while ( i < l ) {
                if ( uri = uris[ types[i++] ] ) {
                    return uri;
                }
            }

            // default to generic src
            return uris['src'] || '';

        }
    
      , controlsClass = 'cue-' + controls

        // wrap shapes in spans so that css image replacement is possible
      , controlsHtml = '<div class=' + controlsClass + '>' +
            '<button class=cue-prev title=previous accesskey=j><span>' + lseek + '</span></button>' + 
            '<button class=cue-play title=play/pause><span>' + play + '</span><span>' + pause + '</span></button>' + 
            '<button class=cue-next title=next accesskey=k><span>' + rseek + '</span></button>' + 
            //'<input class=cue-level type=range min=0 max step=0.01 value=0.00>'   + 
            //'<output class=cue-time></output>'                                    + 
            //'<input class=cue-needle type=range min=0 max=100 step=1 value=100>'  + 
        '</div>'
        
      , $controls;

    /**
     * Parse JSON from a file or a string
     * @param  {string|*}  source    JSON or filename of JSON file
     * @return {Object|undefined}
     */
    function json ( source ) {
        if ( !source || !( source = $.trim(source) ) ) { return; }
        return $[ (source.substr(-5) === '.json' ? 'get' : 'parse') + 'JSON' ](source);
    }
    
    function addControls ( $container, media ) {
    
        var currControls;
        
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
            
    }
    
    function seek ( container, media, playlist, amount ) {
            
        amount = amount || 1;

        var curr = media.getAttribute('src')
          , fwd = amount > 0
          , idx = 0, next, i = playlist.length;

        if ( curr ) {
            while ( i-- ) {
                if ( playlist[i] && playlist[i]['src'] === curr ) {
                    idx = i + amount;
                    break;
                }
            }
        }

        next = playlist[idx];
        next = next || ( fwd ? playlist[0] : playlist[playlist.length - 1] );
        media.setAttribute( 'src', getBestType( next, media.tagName ) );
        media.play();

        // Update fields. - for example:  `<p data-cue-id="caption"></p>`
        // gets the current json caption value inserted into it
        // Use a live selector to allow for elems to be added later.
        // Use getElementsByTagName('*') rather than find('[data-cue-id]') 
        // since we need to lookup the attr anyway. Better performance.
        $.each( container.getElementsByTagName('*'), function () {
            var meta = this.getAttribute('data-cue-id');
            if ( null == meta ) { return; }
            meta = next[meta]; 
            $(this)[null == meta ? 'empty' : 'html'](meta);
        });

    }
    
    function addEvent ( $container, sel, type, fn ) {
        // Use [data-cue-event] to keep track of whether we added an event to an elem
        // and prevent adding it again if $.fn.cue is called twice on the same elem.
        return $container.find(sel).not('[data-cue-event]').on( type + '.cue', fn ).attr('data-cue-event', '');
    }

    // provide a way to do async initialization
    $['fn']['cue'] = function () {
    
        return this.each(function () {
            
            var $container = $(this)
              , media
              , cue;

            cue = json( $container.attr('data-cue') );
            cue = !cue ? [] : isArray(cue) ? cue : [cue];
            media = $container.find(video)[0];
            
            if ( !media ) {
                media = $container.find(audio)[0];
                if ( !media ) { return; }
            }
            
            addControls( $container, media );
            
            addEvent( $container, '.cue-play', 'click', function (eventData) {
                var paused = media.paused || media.ended
                  , remove = 'removeClass'
                  , add = 'addClass';
                media[ paused ? 'play' : 'pause' ]();
                this.className = 'cue-' + (paused ? 'pause' : 'play');
                $container[ paused ? add : remove ]('cue-playing');
                $container[ paused ? remove : add ]('cue-paused');
            });

            if ( cue.length ) {
                // Attach the seek handlers
                // Use eventSel/eventKey to track whether the event was added and 
                // prevent adding it twice if $.fn.cue is twice on the same elem.
                addEvent( $container, '.cue-next', 'click', function (eventData) {
                    seek( $container[0], media, cue, 1 );
                });
                addEvent( $container, '.cue-prev', 'click', function (eventData) {
                    seek( $container[0], media, cue, -1 );
                });
            } else {
                // Ensure that the attr is exactly empty for css purposes
                // using [data-cue=""] to dim or hide the prev/next buttons
                $container.attr('data-cue', '');
            }

        });
    };
    
    // initialize
    $(document).ready(function () {
        $('[data-cue]').cue();
    });
    
}( this, document ));