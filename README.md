![Better Canvas](/icon/icon-wide.png)

# Better Canvas

Enhancements to Canvas like dark mode, better todo list, GPA calculator, and more!

### Supported on

![Google Chrome](https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)

![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=Firefox-Browser&logoColor=white)

## Inquiries

To contact me, please email ksucpea@gmail.com, or you can open an issue within the "Issues" tab on GitHub.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Version Notes](#version-notes)
- [Color Reference](#color-reference)
- [File Structure](#file-structure)
- [Authors](#authors)

## Features

Better Canvas introduces improvements to the Canvas user interface:

- Customizable color themes (including dark mode) and fonts
- Automatic scheduling for color modes (including dark mode)
- Customizable dashboard
  - Preview assingments and announcments
  - View grades
  - Add user notes
- Improved todo and assignments lists
- GPA calculator (college and highschool)

## Installation

To install, run, and build with this repository,

- Clone the repository locally with

```bash
  git clone https://github.com/ksucpea/bettercanvas.git
```

- Visit `chrome://extensions` in your browser.
- Enable developer mode by toggling the switch in the upper right corner of the viewport.
- Click the "Load upacked" button in the header.
- When prompted to open a file, select the root directory of this repository.

## Usage

To use Better Canvas, select your browser below to install the extension.

[Chrome](https://chrome.google.com/webstore/detail/better-canvas/cndibmoanboadcifjkjbdpjgfedanolh)

[Firefox](https://addons.mozilla.org/addon/better-canvas/)

### How to use

- Once the extension is installed, navigate to your institution's Canvas homepage.
- To edit the available options, click on the "Extensions" button in the upper right corner of the viewport.
- When the menu opens, click on the Better Canvas extension.
  - A menu will appear with configuration options for your Canvas homepage.

## Version Notes

#### Update 5.10

- Bug Fixes
  - Fixed dark mode bugs in discussion text boxes.
  - Fixed card assignment bug.

- New Features
  - New themes, fonts, and sidebar options
  - "Remove sidebar logo" option
  - "Hide recent feedback" option
  - "Color coded tab icons" option

- Improved Features
  - Dark mode: syncs with device settings, preview buttons, and a "dark mode fixer" feature.
  - Cards: instant color changes, image previews, and improved assignment efficiency.
  - To-do list: redesign, use card colors for list
  - Menu: redesign


## Color Reference

| Color      | Hex                                                              |
| ---------- | ---------------------------------------------------------------- |
| Background | ![#161616](https://via.placeholder.com/10/0a192f?text=+) #161616 |
| Text       | ![#ffffff](https://via.placeholder.com/10/ffffff?text=+) #ffffff |
| Accent 01  | ![#ff002e](https://via.placeholder.com/10/ff002e?text=+) #ff002e |
| Accent 02  | ![#ff5200](https://via.placeholder.com/10/ff5200?text=+) #ff5200 |
| Accent 03  | ![#ff47ad](https://via.placeholder.com/10/ff47ad?text=+) #ff47ad |


## File structure

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
│ ├── icon-128.png
│ ├── icon-16.png
│ ├── icon-19.png
│ ├── icon-32.png
│ ├── icon-38.png
│ ├── icon-48.png
│ ├── icon-wide.png
│ ├── iconwpadding.png
│ └── oldicon-128.png
├── js
│ ├── background.js
│ ├── content.js
│ └── popup.js
└── manifest.json
```

### Update the file structure

#### Use the tree command

- Linux/Unix
  - Install [tree command line tool](https://www.geeksforgeeks.org/tree-command-unixlinux/)
  - Use the tree command to generate file structure:
  ```
  tree
  ```

Learn more about tree commands for Linux/Unix [here](https://www.geeksforgeeks.org/tree-command-unixlinux/).

- Windows
  - Use the tree command to generate file structure:
  ```
  tree /
  ```

Learn more about tree commands for Windows [here](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tree).

## Authors

#### Owner

- [ksucpea](https://github.com/ksucpea)

#### Contributors

- [fudgeu](https://github.com/fudgeu)
- [Tibo Geeraerts](https://github.com/tibogeeraerts)
- [Jacob Mungle](https://github.com/Jelgnum)
- [FireIsGood](https://github.com/FireIsGood)

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Better Canvas](/icon/icon-48.png)
