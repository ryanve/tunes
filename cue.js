/*!
 * cue.js
 * @author   Ryan Van Etten <@ryanve>
 * @license  MIT 
 * @version  2012-10-24
 */
(function ($) {
    $(function ($) {
        $('[data-cue]').each(function () {
        
            var $container = $(this), $video, cue;
            cue = $container.attr('data-cue');
            cue = cue && $.parseJSON(cue);
            if ( !cue ) { return; }
            
            cue = $.isArray(cue) ? cue : [cue];
            $video = $container.find('video');
            $caption = $container.find('.caption');
            if ( !cue.length || !$video.length ) { return; }
            
            $container.find('.prev, .next').click(function (eventData) {
            
                var curr = $video.attr('src')
                  , fwd = $(this).hasClass('next')
                  , idx = 0, next;

                curr && $.each(cue, function (i, v) {
                    if ( v && curr === v['src'] ) {
                        idx = i;
                        fwd ? idx++ : idx--;
                        return false;
                    }
                });

                next = cue[idx];
                next = next || ( fwd ? cue[0] : cue[cue.length - 1] );
                next['src'] && $video.attr('src', next['src']);
                $video[0] && $video[0].play();

            });
        });
    });
}(jQuery));