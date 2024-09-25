# Contributing to Better Canvas

## Table of Contents

- [File Structure](#file-structure)
- [Adding a new feature](#adding-a-new-feature)
  - [Identifier](#identifier)
  - [Changes to html/popup.html](#changes-to-htmlpopuphtml)
  - [Changes to js/popup.js](#changes-to-jspopupjs)
  - [Changes to js/background.js](#changes-to-jsbackgroundjs)
  - [Changes to js/content.js](#changes-to-jscontentjs)
- [Adding a new theme](#adding-a-new-theme)
  - [Exporting](#exporting)
  - [Changes to js/popup.js](#changes-to-jspopupjs-1)
  - [Changes to html/popup.html](#changes-to-htmlpopuphtml-1)


## File structure

Below is an overview of the file structure of this project. The contributions should be edits to the files in the html and js directories.
```
.
├── README.md
├── \_locales
│ ├── en
│ │ └── messages.json
│ └── es
│ └── messages.json
├── css
│ ├── content.css
│ ├── options.css
│ └── popup.css
├── html
│ ├── options.html
│ └── popup.html
├── icon
│ ├── icon-16.png
│ ├── icon-19.png
│ ├── icon-32.png
│ ├── icon-38.png
│ ├── icon-48.png
│ ├── icon-128.png
│ ├── icon-wide.png
│ ├── iconwpadding.png
│ └── oldicon-128.png
├── js
│ ├── background.js
│ ├── content.js
│ └── popup.js
├── manifest.json
├── contributing.md
├── CODE_OF_CONDUCT.md
├── LICENSE
```

## Adding a new feature

To add a new feature, please follow these guidelines.

Note: I will probably make this automated in the future but it's a bit of work right now.

### Identifier

- Should be a unique one/two word storage identifier to indicate its status (ie "dark_mode" or "dashboard_grades").
- If the feature has sub options (options that are specific to the main feature),these will also each need a unique identifier.
- All options are synced and have a 8kb storage limit, so if your feature needs more than this please contact me.

### Changes to html/popup.html

- Add the appropriate HTML into this file. The corresponding id and name (see below) should be the identifier.
- If it has no sub options, it should be put in the same container as the other options with no sub options:

```
<div class="option" id="<identifier>">
    <input type="radio" id="off" name="<identifier>">
    <input type="radio" id="on" name="<identifier>">
    <div class="slider">
        <div class="sliderknob"></div>
        <div class="sliderbg"></div>
    </div>
    <span class="option-name"><option name></span>
</div>
```

- If it does have sub options, it becomes it's own container:

```
<div class="option-container">
  <div class="option" id="<identifier>">
    <input type="radio" id="off" name="<identifier>">
    <input type="radio" id="on" name="<identifier>">
    <div class="slider">
      <div class="sliderknob"></div>
      <div class="sliderbg"></div>
    </div>
    <span class="option-name"><option name></span>
  </div>
  <div class="sub-options">
    <div class="sub-option">
      <input type="checkbox" id="<sub identifier>" name="<sub identifier>">
      <label for="<sub identifier>" class="sub-text"><option name></label>
    </div>
  </div>
</div>
```

### Changes to js/popup.js

- Add the main identifier into the `syncedSwitches` array.
- If you have sub-options:
  - Add these identifiers to the array found under the comment that says `//checkboxes`.

### Changes to js/background.js

- Add all identifiers into the `syncedOptions` array.
- Add a default value for your option to the `default_options` array.
  - Preferably this value should be `false` for booleans or ` ""` for strings (`null` can also be used if Canvas has a default for this option already)

### Changes to js/content.js

- There should be a function(s) included in the this file that does the work. The name should clearly indicate its purpose.
- Under `applyOptionsChanges()`, add a switch case to call this function when the menu toggle is changed.
- Depending on what your feature does, it needs to be told when to fire.
  - If the function changes any aspect of the dashboard, it should be put inside `checkDashboardReady()`.
  - If the function only adds css, it should be added to `applyAestheticChanges()`, and in this case should not be a separate function, instead add the css to the existing styles found in this function.
  - Anything else should be put under `startExtension()` and should be placed no higher than the `checkDashboardReady` function found here.


## Adding a new theme

To add a new theme, please follow these guidelines.

Use the following instructions to create a new theme. Elements that you can customize are the card images, card colors, fonts, and dark mode. (Note that your theme MUST have card images and a unique dark mode to be considered).

Once your theme is ready, navigate to the export section under the themes tabs. Select the checkboxes to generate an output and send this to [ksucpea@gmail.com](mailto:ksucpea@gmail.com). In this email, include the name of the the theme and your name for credit. At this point, your theme will be reviewed.

### Exporting

- Go to the Themes tab and export dark mode, card images, card colors, and custom font. - The only on/off toggles that need be included are `disable_color_overlay` and `gradient_cards`.
  Any other toggles aren't necessary, so you should manually add these keys and the appropriate values in with the export code.
- Pick a unique id for the theme, doesn't matter how long this is.

### Changes to js/popup.js

- Add the export code under `getTheme()`.
  - Make sure it follows this format: `"theme-<id>: { "exports": {"..."}, "preview": "..." }`
- For the preivew, try to pick the smallest image size from the card images (under ~50kb is perfect), or you can find a smaller display image that isn't included in the card images.

### Changes to html/popup.html

- Add the following under all the other theme buttons:

```
<button id="theme-<id>" class="theme-button customization-button"><theme name> by <you></button>
```

- The theme name should be one/two words so it doesn't take up too much space.

