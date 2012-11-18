# [cue](http://cuejs.com)
## native `<audio>` and `<video>` playlists

[cue](http://cuejs.com) is an opensource jQuery plugin that uses [JSON](http://en.wikipedia.org/wiki/JSON) and [data attributes](http://dev.opera.com/articles/view/an-introduction-to-datasets/) to provide playlist capabilities to native HTML5 audio and video. 


### [data-cue]

`[data-cue]` is a custom attribute in which the JSON playlist is stored. It can contain raw JSON **or** the filename of a .json file to load via AJAX. `[data-cue]` is designed to be placed on a container element that holds the media element and related informational elements such as credits or captions.

```html
<div data-cue="playlist.json">
    <video controls>
        <source src="default.mp4" type="video/mp4">
        <source src="default.webm" type="video/webm">
    </video>
</div>
```

### [data-cue-insert]

[data-cue-insert] makes it possible to insert values from the properties in your JSON object.

```html
<figure data-cue="playlist.json">
    <video controls>
        <source src="default.mp4">
        <source src="default.webm">
    </video>
    <figcaption data-cue-insert="caption">
        Caption for the default video.
    </figcaption>
</figure>
```

### JSON

The format for the JSON playlist data is an array of "media objects" containing data about each media file. A simple video example would look something like this:

```json
[{
    "mp4": "identity.mp4"
  , "webm": "identity.webm"
 },{
    "mp4": "supremacy.mp4"
  , "webm": "supremacy.webm"
 },{
    "mp4": "ultimatum.mp4"
  , "webm": "ultimatum.webm"
}]
```

Make sure you [JSON validates](http://jsonlint.com).



## MIME types

In order for media files to play your media server must be configured to serve the correct MIME types as described by [html5doctor.com](http://html5doctor.com/html5-audio-the-state-of-play/) and [html5rocks.com](http://www.html5rocks.com/en/tutorials/video/basics/). The easiest way to do this is to use the [H5BP](https://github.com/h5bp/html5-boilerplate/)'s [.htaccess](https://github.com/h5bp/html5-boilerplate/blob/master/.htaccess). The needed rules in `.htaccess` are:

```
# MIME types for audio and video files ( via h5bp.com )
AddType audio/mp4                      m4a f4a f4b
AddType audio/ogg                      oga ogg
AddType video/mp4                      mp4 m4v f4v f4p
AddType video/ogg                      ogv
AddType video/webm                     webm
AddType video/x-flv                    flv
```

## troubleshooting

1. Does your JSON validate? Use: [jsonlint.com](http://jsonlint.com)
2. Does your HTML validate? Use: [html5.validator.nu](http://html5.validator.nu)
3. Did jQuery load? Is it version 1.7 or higher? jQuery must run *before* cue.
4. Are there any JavaScript errors in the console?
5. Is your server is configured to serve the correct MIME types? See above.
6. Are your URIs correct? AJAX-loaded playlists must be on the same server.
7. Ask [@ryanve](http://twitter.com/ryanve) or [submit an issue](https://github.com/ryanve/cue/issues).

## dependencies

**cue** requires jQuery 1.7+ or an ender build that implements compatible versions of:

- $()
- $.ajax() (needed only if using AJAX-loaded playlists)
- $.contains()
- $.each()
- $.get()  (needed only if using AJAX-loaded playlists)
- $.fn.on()
- $.fn.addClass()
- $.fn.attr()
- $.fn.each()
- $.fn.empty()
- $.fn.find()
- $.fn.html()
- $.fn.insertAfter()
- $.fn.ready()
- $.fn.removeAttr()
- $.fn.removeClass()

## resources

- [html5rocks.com: HTML5 Video](http://www.html5rocks.com/en/tutorials/video/basics/)
- [dev.opera.com: HTML5 Video and Audio](http://dev.opera.com/articles/view/everything-you-need-to-know-about-html5-video-and-audio/)
- [MDN: Media Formats](https://developer.mozilla.org/en-US/docs/Media_formats_supported_by_the_audio_and_video_elements#Browser_compatibility)
- [MDN: Media Events](https://developer.mozilla.org/en-US/docs/DOM/Media_events)
- [MDN: HTMLMediaElement](https://developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement)

## license

### [cue](http://github.com/ryanve/cue) is available under the [MIT license](http://en.wikipedia.org/wiki/MIT_License)

Copyright (C) 2012 by [Ryan Van Etten](https://github.com/ryanve)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.