### Update to deduction of page titles

MkDocs 1.5 had a change in behavior in deducing the page titles from the first heading. Unfortunately this could cause unescaped HTML tags or entities to appear in edge cases.

Now tags are always fully sanitized from the title. Though it still remains the case that [`Page.title`][mkdocs.structure.pages.Page.title] is expected to contain HTML entities and is passed directly to the themes.

Images (notably, emojis in some extensions) get preserved in the title only through their `alt` attribute's value.

Context: #3564, #3578

### Themes

* Built-in themes now also support Polish language (#3613)

#### "readthedocs" theme

*   Fix: "readthedocs" theme can now correctly handle deeply nested nav configurations (over 2 levels deep), without confusedly expanding all sections and jumping around vertically. (#3464)

*   Fix: "readthedocs" theme now shows a link to the repository (with a generic logo) even when isn't one of the 3 known hosters. (#3435)

*   "readthedocs" theme now also has translation for the word "theme" in the footer that mistakenly always remained in English. (#3613, #3625)

#### "mkdocs" theme

The "mkdocs" theme got a big update to a newer version of Bootstrap, meaning a slight overhaul of styles. Colors (most notably of admonitions) have much better contrast.

The "mkdocs" theme now has support for dark mode - both automatic (based on the OS/browser setting) and with a manual toggle. Both of these options are **not** enabled by default and need to be configured explicitly.  
See `color_mode`, `user_color_mode_toggle` in [**documentation**](../user-guide/choosing-your-theme.md#mkdocs).

> WARNING: **Possible breaking change.**
>
> jQuery is no longer included into the "mkdocs" theme. If you were relying on it in your scripts, you will need to separately add it first (into mkdocs.yml) as an extra script:
>
> ```yaml
> extra_javascript:
>   - https://code.jquery.com/jquery-3.7.1.min.js
> ```
>
> Or even better if the script file is copied and included from your docs dir.

Context: #3493, #3649

### Configuration

#### New "`enabled`" setting for all plugins

You may have seen some plugins take up the convention of having a setting `enabled: false` (or usually controlled through an environment variable) to make the plugin do nothing.

Now *every* plugin has this setting. Plugins can still *choose* to implement this config themselves and decide how it behaves (and unless they drop older versions of MkDocs, they still should for now), but now there's always a fallback for every plugin.

See [**documentation**](../user-guide/configuration.md/#enabled-option). Context: #3395

### Validation

#### Validation of hyperlinks between pages

##### Absolute links

> Historically, within Markdown, MkDocs only recognized **relative** links that lead to another physical `*.md` document (or media file). This is a good convention to follow because then the source pages are also freely browsable without MkDocs, for example on GitHub. Whereas absolute links were left unmodified (making them often not work as expected or, more recently, warned against).

If you dislike having to always use relative links, now you can opt into absolute links and have them work correctly.

If you set the setting `validation.links.absolute_links` to the new value `relative_to_docs`, all Markdown links starting with `/` will be understood as being relative to the `docs_dir` root. The links will then be validated for correctness according to all the other rules that were already working for relative links in prior versions of MkDocs. For the HTML output, these links will still be turned relative so that the site still works reliably.

So, now any document (e.g. "dir1/foo.md") can link to the document "dir2/bar.md" as `[link](/dir2/bar.md)`, in addition to the previously only correct way `[link](../dir2/bar.md)`.

You have to enable the setting, though. The default is still to just skip any processing of such links.

See [**documentation**](../user-guide/configuration.md#validation-of-absolute-links). Context: #3485