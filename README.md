# WikiTraccs Page Companion

## Summary

This solution applies **legacy image positioning** to SharePoint pages.

In 2023 Microsoft changed the way **adjacent images** are rendered on modern SharePoint pages, in the text editor web part. The culprit is a new CSS selector on the page, that hasn't been there before. Images that were shown next to each other suddenly were shown one below the other.

The new image formatting is activated as soon as an older page is going into **edit mode**. There is no way to prevent that.

This solution allows to roll this formatting change back, on an opt-in per-page basis.

## A tale in 3 screenshots

Before entering edit mode, all is well. The page looks like this:

![image](https://github.com/WikiTransformationProject/wikitraccs-sharepoint-page-companion/assets/3469970/b13feb29-662b-4237-9ffb-25bdce2920fb)

When entering edit mode for the first time, SharePoint upgrades the page and applies new styling. It now looks like this:

![image](https://github.com/WikiTransformationProject/wikitraccs-sharepoint-page-companion/assets/3469970/62909b45-694a-4af2-882b-eae307fa0466)

Note the little toggle button in the lower right corner. It says **Legacy image positioning (by WikiTraccs)**. Toggle this and the images move right where they belong:

![image](https://github.com/WikiTransformationProject/wikitraccs-sharepoint-page-companion/assets/3469970/8a03f4bb-c122-4b59-8726-c6a8a8caa76c)

This SharePoint Framework solution adds the little toggle button to the lower right corner.

_Note that around mid 2023 Microsoft introduced other formatting changes as well, e.g. paragraphs have been played with. Thus the different spacing. But that is [another story](https://answers.microsoft.com/en-us/msoffice/forum/all/no-paragraph-spacing-in-text-web-part-sharepoint/ff9dd2fa-e89c-4f88-9458-93bca4579506)._

## Details

The whole background story can be read here: [Broken inline image positioning in SharePoint.](https://www.wikitransformationproject.com/blog/2023/10/07/broken-inline-image-positioning-in-sharepoint).

Putting images next to each other is a vital feature for authors. So it is not acceptable that this is not possible anymore.

This is the new CSS selector that prevents images from being put next to each other:

```css
    div.containerPlugin, div.imagePlugin {
      clear: both;
    }
```

This SharePoint Framework Solution changes that to:

```css
    div.containerPlugin, div.imagePlugin {
      clear: none;
    }
```

Note: This is a modification to the SharePoint user interface that is not officially supported by Microsoft. So this could break. That's why this solution allows authors to selectively switch this feature on, for pages they edit. An alternative would be to manually restructure the page.

## What is WikiTraccs?

[WikiTraccs](https://www.wikitransformationproject.com/) is a Confluence to SharePoint migration tool. It is used by clients worldwide to migrate hundreds of thousands of pages to SharePoint. Changes in pages directly affect those migration results. And this latest change affects them negatively.

## How to install the WikiTraccs Page Companion app?

1. Download the SPFx solution **wikitraccs-sp-page-companion.sppkg** from [Releases](https://github.com/WikiTransformationProject/wikitraccs-sharepoint-page-companion/releases)
2. Upload **wikitraccs-sp-page-companion.sppkg** to the tenant app catalog, just install, don't activate for all sites
3. Open a site you want to use the solution in
4. Add the app via **New** > **App** > **WikiTraccs Page Companion**

Now, when editing a migrated modern SharePoint page, the toggle button should appear.

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.18.0-green.svg)

## Applies to

- [SharePoint Framework](https://aka.ms/spfx)
- [Microsoft 365 tenant](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-developer-tenant)

> Get your own free development tenant by subscribing to [Microsoft 365 developer program](http://aka.ms/o365devprogram)

## Version history

| Version | Date             | Comments        |
| ------- | ---------------- | --------------- |
| 1.0     | October, 2023 | Initial release |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

---

## Minimal Path to Awesome

- Clone this repository
- Ensure that you are at the solution folder
- in the command-line run:
  - **npm install**
  - **npm run serve**

Note: this solution uses spfx-fast-serve.
