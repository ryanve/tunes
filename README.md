# [cue](http://cuejs.com)
## native `<audio>` and `<video>` playlists

[**cue**](http://cuejs.com) is an opensource [jQuery](http://jquery.com/) plugin that uses [JSON](http://en.wikipedia.org/wiki/JSON) and [data attributes](http://dev.opera.com/articles/view/an-introduction-to-datasets/) to provide playlist capabilities to native HTML5 audio and video.

**[CDN](http://airve.github.com)**: [dev](http://airve.github.com/js/cue/cue.js) | [min](http://airve.github.com/js/cue/cue.min.js)

### project goals

1. Provide semantic storage and performant access to playlist data.
2. Provide succinct semantic controls that can be styled in [CSS](https://github.com/ryanve/cue/blob/master/cue.css).
3. Be minimal, but very extendable.

### types

Filetypes dictate compatibility. The more types you provide, the better. View the [compatibility grid](https://developer.mozilla.org/en-US/docs/Media_formats_supported_by_the_audio_and_video_elements#Browser_compatibility) to see possible types. To cover all modern browsers you need at least 2 types: 

- **audio** - use `.mp3` and `.ogg`  - converters: [media.io](http://media.io)
- **video** - use `.mp4` and `.webm` - converters: [ffmpeg](http://ffmpeg.org) | [Miro](http://mirovideoconverter.com) ([issues](http://stackoverflow.com/a/13449719/770127))

[cue](http://cuejs.com) does not deal with Flash fallbacks for pre-HTML5 browsers. However fallbacks and graceful degradation are possible through smart use of `[data-cue-insert]` and `[data-cue-attr]`. A [vanilla diet](http://coding.smashingmagazine.com/2012/11/13/the-vanilla-web-diet/) approach is recommended.

### URIs

- To simplify the examples here, most of the file URIs shown are relative. In production you probably want to use full URIs.
- AJAX-loaded .json files must be on the same domain due to cross-domain restrictions.

### [data-cue]

`[data-cue]` is the data attribute in which the JSON playlist is stored. It is designed to be placed on a container element that holds the media element and related informational elements such as credits or captions. It can contain inline JSON **or** the filename of a .json file to load via AJAX. Inline JSON is more performant and more stable than loading AJAX requests. 

```html
<div data-cue="playlist.json">
    <video controls>
        <source src="default.mp4" type="video/mp4">
        <source src="default.webm" type="video/webm">
    </video>
</div>
```

### [data-cue-insert]

`[data-cue-insert]` makes it possible to insert values from the properties in your media object into your HTML.

```html
<figure data-cue="playlist.json">
    <video controls>
        <source src="default.mp4">
        <source src="default.webm">
    </video>
    <figcaption data-cue-insert="caption">
        Caption for the default video. The value of the "caption"
        property gets inserted here when the video changes.
    </figcaption>
</figure>
```

### [data-cue-attr]

`[data-cue-attr]` makes it possible to update arbitrary HTML attributes based on the properties in your media object. It takes a JSON object that maps attribute names to the property names from the media object that should fill them.

```html
<figure data-cue="playlist.json">
    <video controls>
        <source src="default.mp4">
        <source src="default.webm">
        <p>
            To watch this video please <a href="http://browsehappy.com">updgrade your browser</a>
            or <a href="default.mp4" data-cue-attr='{"href": "mp4"}'>download the .mp4</a>
        </p>
    </video>
</figure>
```

### JSON

The format for the JSON playlist data is an array of "media objects" containing data about each media file. Please [validate your JSON](http://jsonlint.com) to prevent syntax errors. The media objects provide several capabilities. A simple `<video>` example would look something like this:

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

**Alternate syntax:** You can achieve the same as above by setting the `src` property to an array of URIs. If you mix the 2 syntaxes, the named extension props take precedence over the `src` prop. In either case **cue** will choose the most appropriate file based on the feature detection.

```json
[{
    "src": ["identity.mp4", "identity.webm"]
 },{
    "src": ["supremacy.mp4", "supremacy.webm"]
 },{
    "src": ["ultimatum.mp4", "ultimatum.webm"]
}]
```

In your media objects, you can include whatever extra properties you want for use with `[data-cue-insert]` and/or `[data-cue-attr]`. The purpose of these attributes is to enable you to include relavent credits, captions, or links.

```json
[{
    "mp4": "identity.mp4"
  , "webm": "identity.webm"
  , "title": "The Bourne Identity"
  , "imbd": "http://www.imdb.com/title/tt0258463/"
 },{
    "mp4": "supremacy.mp4"
  , "webm": "supremacy.webm"
  , "title": "The Bourne Supremacy"
  , "imdb": "http://www.imdb.com/title/tt0372183/"
 },{
    "mp4": "ultimatum.mp4"
  , "webm": "ultimatum.webm"
  , "title": "The Bourne Ultimatum"
  , "imdb": "http://www.imdb.com/title/tt0440963/"
}]
```

## MIME types

In order for media files to play your media server must be configured to serve the correct MIME types as described by [html5doctor.com](http://html5doctor.com/html5-audio-the-state-of-play/). The easiest way to do this is to use the [H5BP](https://github.com/h5bp/html5-boilerplate/)'s [.htaccess](https://github.com/h5bp/html5-boilerplate/blob/master/.htaccess). The needed rules in `.htaccess` are:

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
5. Is your server configured to serve the correct MIME types? See section above.
6. Are your URIs correct? AJAX-loaded playlists must be on the same server.
7. Ask [@ryanve](http://twitter.com/ryanve) or [submit an issue](https://github.com/ryanve/cue/issues).

## dependencies

[cue](http://cuejs.com) requires [jQuery](http://jquery.com/) 1.7+ or an [ender](http://ender.jit.su/) build that implements compatible versions of:

- $()
- $.ajax() (needed only if using AJAX-loaded playlists)
- $.contains()
- $.each()
- $.get()  (needed only if using AJAX-loaded playlists)
- $.fn.on()
- $.fn.addClass()
- $.fn.attr()
- $.fn.children()
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