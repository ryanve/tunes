# [Tunes](../../)
### HTML5 `<audio>` and `<video>` playlists
#### <b>Tunes</b> (formerly <b>cue</b>) is an opensource [jQuery](#dependencies) plugin that uses [JSON](http://en.wikipedia.org/wiki/JSON) and [data attributes](http://dev.opera.com/articles/view/an-introduction-to-datasets/) to make HTML5 audio and video playlists possible.

## Goals

1. Provide semantic storage and performant access to playlist data.
2. Provide succinct semantic controls that can be styled in [CSS](tunes.css).
3. Be minimal, but extensible.

## Types

### [Compatibility](https://developer.mozilla.org/en-US/docs/Media_formats_supported_by_the_audio_and_video_elements#Browser_compatibility): the more filetypes, the better
#### Full coverage in modern browsers requires <b>2+</b> types

- <b>audio</b>: Use `.mp3` and `.ogg`  (Converters: [media.io](http://media.io))
- <b>video</b>: Use `.mp4` and `.webm` (Converters: [ffmpeg](http://ffmpeg.org), [Miro](http://mirovideoconverter.com) ([issues](http://stackoverflow.com/a/13449719/770127)))

## URIs

- To simplify the examples, most of the file URIs shown are relative. In production you probably want to use full URIs.
- AJAX-loaded `.json` files must be on the same domain due to cross-domain restrictions.

## API ([0.6](../../releases))

### `[data-tunes]`

`[data-tunes]` is the data attribute in which the JSON playlist is stored. It is designed to be placed on a container element that holds the media element and related informational elements such as credits or captions. It can contain inline JSON **or** the filename of a `.json` file to load via AJAX. Inline JSON is more performant and more stable than loading AJAX requests. 

```html
<div data-tunes="playlist.json">
    <video controls>
        <source src="default.mp4" type="video/mp4">
        <source src="default.webm" type="video/webm">
    </video>
</div>
```

### `[data-tunes-insert]`

`[data-tunes-insert]` makes it possible to insert values from the properties in your media object into your HTML.

```html
<figure data-tunes="playlist.json">
    <video controls>
        <source src="default.mp4">
        <source src="default.webm">
    </video>
    <figcaption data-tunes-insert="caption">
        Caption for the default video. The value of the "caption"
        property gets inserted here when the video changes.
    </figcaption>
</figure>
```

### `[data-tunes-attr]`

`[data-tunes-attr]` makes it possible to update arbitrary HTML attributes based on the properties in your media object. It takes a JSON object that maps attribute names to the property names from the media object that should fill them.

```html
<figure data-tunes="playlist.json">
    <video controls>
        <source src="default.mp4">
        <source src="default.webm">
        <p>
            To watch this video please <a href="http://browsehappy.com">updgrade your browser</a>
            or <a href="default.mp4" data-tunes-attr='{"href": "mp4"}'>download the .mp4</a>
        </p>
    </video>
</figure>
```

### JSON

The format for the JSON playlist data is an array of <em>media objects</em> containing data about each media file. Please [validate your JSON](http://jsonlint.com) to prevent syntax errors. The media objects provide several capabilities. A simple `<video>` example would look something like this:

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

**Alternate syntax:** You can achieve the same as above by setting the `src` property to an array of URIs. If you mix the 2 syntaxes, the named extension props take precedence over the `src` prop. In either case **tunes** will choose the most appropriate file based on the feature detection.

```json
[{
    "src": ["identity.mp4", "identity.webm"]
 },{
    "src": ["supremacy.mp4", "supremacy.webm"]
 },{
    "src": ["ultimatum.mp4", "ultimatum.webm"]
}]
```

In your media objects, you can include whatever extra properties you want for use with `[data-tunes-insert]` and/or `[data-tunes-attr]`. The purpose of these attributes is to enable you to include relavent credits, captions, or links.

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

To play media files, your server must recognize the correct MIME types. 

##### Make sure your `.htaccess` includes these rules (via [H5BP](https://github.com/h5bp/html5-boilerplate/blob/master/.htaccess))

```apache
# MIME types for audio and video files
AddType audio/mp4                      m4a f4a f4b
AddType audio/ogg                      oga ogg
AddType video/mp4                      mp4 m4v f4v f4p
AddType video/ogg                      ogv
AddType video/webm                     webm
AddType video/x-flv                    flv
```

## Fallbacks

Fallbacks and graceful degradation for pre-HTML5 browsers are possible through smart use of `[data-tunes-insert]` and `[data-tunes-attr]`. It's a [vanilla diet approach](http://coding.smashingmagazine.com/2012/11/13/the-vanilla-web-diet/) and <b>no</b> Flash is used.

## Troubleshoot

1. Does your JSON validate? Use: [jsonlint.com](http://jsonlint.com)
2. Does your HTML validate? Use: [html5.validator.nu](http://html5.validator.nu)
3. Did jQuery load? Is it version 1.7 or higher? jQuery must run *before* tunes.
4. Are there any JavaScript errors in the console?
5. Is your server configured to serve the correct MIME types? See section above.
6. Are your URIs correct? AJAX-loaded playlists must be on the same server.
7. Ask [@ryanve](http://twitter.com/ryanve) or [submit an issue](../../issues).

## Dependencies

Requires [jQuery](http://jquery.com/) 1.7+ or an [ender](http://ender.jit.su/) build that implements compatible versions of:

- `$()`
- `$.ajax()` *needed only for AJAX playlists
- `$.contains()`
- `$.get()`  *needed only for AJAX playlists
- `$.fn.on()`
- `$.fn.addClass()`
- `$.fn.attr()`
- `$.fn.children()`
- `$.fn.empty()`
- `$.fn.find()`
- `$.fn.html()`
- `$.fn.insertAfter()`
- `$.fn.ready()`
- `$.fn.removeAttr()`
- `$.fn.removeClass()`

## Resources

- [html5rocks.com: HTML5 Video](http://www.html5rocks.com/en/tutorials/video/basics/)
- [dev.opera.com: HTML5 Video and Audio](http://dev.opera.com/articles/view/everything-you-need-to-know-about-html5-video-and-audio/)
- [MDN: Media Formats](https://developer.mozilla.org/en-US/docs/Media_formats_supported_by_the_audio_and_video_elements#Browser_compatibility)
- [MDN: Media Events](https://developer.mozilla.org/en-US/docs/DOM/Media_events)
- [MDN: HTMLMediaElement](https://developer.mozilla.org/en-US/docs/DOM/HTMLMediaElement)

## License: [MIT](http://opensource.org/licenses/MIT)

Copyright (C) 2013 by [Ryan Van Etten](https://github.com/ryanve)