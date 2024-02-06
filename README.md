<h1>Better Canvas</h1>

Contact me at ksucpea@gmail.com or you can open an issue here

<h2>Manual Installation</h2>

- Download this repo

- Go to chrome://extensions in the browser and enable developer mode

- Press load unpacked and select the extension folder

<h2>Update 5.10</h2>

- Card customization now shows preview of image
- New sidebar options
- Dark mode buttons preview their appearance
- "Remove sidebar logo" feature
- Added new themes
- Menu redesign
- Fixed card assignment bug
- Card assignment efficiency improvements
- Dark mode rework
- Dark mode now syncs
- Option to use device dark mode settings

<h2>Links</h2>

[Chrome version](https://chrome.google.com/webstore/detail/better-canvas/cndibmoanboadcifjkjbdpjgfedanolh)

[Firefox version](https://addons.mozilla.org/addon/better-canvas/)

<h2>Contribute</h2>

<h3>Adding a new feature:</h3>

<h4>Identifier</h4>

- Should be a unqiue one/two word storage identifier to indicate it's status. (ie "dark_mode" or "dashboard_grades")
- If it has sub options (options that are specific to the main feature) these will also each need a unique identifier.
- All options are synced and have a 8kb storage limit, so if your feature needs more than this please contact me.

<h4>Changes to html/popup.html</h4>

- Add the appropriate HTML into this file. The corresponding id and name (see below) should be the identifier.
- If it has no sub options, it should be put in the same container as the other options with no sub options:<br />

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

- If it does have sub options it becomes it's own container:

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

<h4>Changes to js/popup.js</h4>

- Add the main identifier into the ```syncedSwitches``` array.
- If you have sub-options:
    - Add these identifiers to the array found under the comment that says ```//checkboxes```. 

<h4>Changes to js/background.js</h4>

- Add all identifiers into the ```syncedOptions``` array.
- Add a default value for your option to the ```default_options``` array. 
    - Preferably this value should be ```false``` for booleans or ``` ""``` for strings (```null``` can also be used if Canvas has a default for this option already)

<h4>Changes to js/content.js</h4>

- There should be a function(s) included in the this file that does the work. The name should clearly indicate it's purpose.
- Under ```applyOptionsChanges()```, add a switch case to call this function when the menu toggle is changed.
- Depending on what your feature does, it needs to be told when to fire.    
    - If the function changes any aspect of the dashboard, it should be put inside ```checkDashboardReady()```.
    - If the function only adds css, it should be added to ```applyAestheticChanges()```, and in this case should not be a separate function, instead add the css to the existing styles found in this function.
    - Anything else should be put under ```startExtension()``` and should be placed no higher than the ```checkDashboardReady``` function found here.

<h3>Adding a theme:</h3>
You can export a theme using the export tool in the menu and sending an email to me, or you can merge it here after doing the following:

<h4>Exporting</h4>

- Go to the Themes tab and export dark mode, card images, card colors, and custom font.
    - The only on/off toggles that need be included are ```disable_color_overlay``` and ```gradient_cards```. 
Any other toggles aren't necessary, so you should manually add these keys and the appropriate values in with the export code.
- Pick a unique id for the theme, doesn't matter how long this is.

<h4>Changes to js/popup.js</h4>

- Add the export code under ```getTheme()```.
    - Make sure it follows this format: ```"theme-<id>: { "exports": {"..."}, "preview": "..." }```
- For the preivew, try to pick the smallest image size from the card images (under ~50kb is perfect), or you can find a smaller display image that isn't included in the card images.

<h4>Changes to html/popup.html</h4>

- Add the following under all the other theme buttons:
```
<button id="theme-<id>" class="theme-button customization-button"><theme name> by <you></button>
```

- The theme name should be one/two words so it doesn't take up too much space.
