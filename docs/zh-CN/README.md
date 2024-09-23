![Better Canvas](/icon/icon-wide.png)

# Better Canvas

增强 Canvas 的浏览器扩展程序。支持深色模式，优化待办列表，GPA计算器等。

### 支持的浏览器

![Google Chrome](https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white)

![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=Firefox-Browser&logoColor=white)

## Inquiries

如需联系我，请发送电子邮件至 ksucpea@gmail.com，或者在GitHub上提交 Issues。

## 目录

- [功能](#功能)
- [安装](#安装)
- [如何使用](#用法)
- [版本信息](#版本信息)
- [颜色样例](#颜色样例)
- [参与开发](#参与开发)
- [作者](#作者)

## 功能

Better Canvas 对 Canvas 界面的修改：

- 完全可定制的深色模式（从预制选项中选择或手动编辑深色模式）
- 暗模式自动调度
- 控制面板卡片颜色调色板
- 用户创建的主题
- 作业截止列表
- 控制面板备忘录
- 更好的待办事项列表
- 自定义字体
- 缩小卡片
- 控制面板显示成绩
- 删除侧边栏 logo
- 自定义卡片链接
- 渐变控制面板卡片
- 高级卡片自定义
- GPA 计算器（大学和高中）
- 从控制面板预览作业和公告

## 安装

安装、运行和构建此存储库。

- 使用以下命令在本地克隆存储库

```bash
  git clone https://github.com/ksucpea/bettercanvas.git
```

- 浏览器中访问 `chrome://extensions` 。
- 右上角启用开发者模式。
- 点击“加载已解压的扩展程序”。
- 选择此存储库的根目录。

## 用法

要使用 Better Canvas，请在下面选择浏览器以安装扩展程序。

[Chrome](https://chrome.google.com/webstore/detail/better-canvas/cndibmoanboadcifjkjbdpjgfedanolh)

[Firefox](https://addons.mozilla.org/addon/better-canvas/)

### 如何使用

- 安装扩展程序后，访问您的 Canvas 主页。
- 要编辑可用选项，请单击窗口右上角的“扩展”按钮。
- 当菜单打开时，单击 Better Canvas 扩展。
  - 将出现一个菜单，其中包含 Canvas 主页的配置选项。

## 版本信息

#### Update 5.10

- 修复了讨论文本框中的深色模式错误
- 添加了新主题+字体
- 卡片颜色现在可以立即更改
- 深色模式修复功能
- 卡片定制现在显示图像预览
- 新的侧边栏选项
- 暗模式按钮预览其外观
- “删除侧边栏logo”功能
- “隐藏最近的反馈”功能
- 菜单重新设计
- 修复了卡片分配错误
- 卡片分配效率提高
- 深色模式重做
- 深色模式现在同步
- 添加使用设备深色模式选项
- 改进的待办事项列表
- “颜色编码标签图标”功能
- 待办事项列表的“使用卡片颜色”选项

## 颜色样例

| Color      | Hex                                                              |
| ---------- | ---------------------------------------------------------------- |
| Background | ![#161616](https://via.placeholder.com/10/0a192f?text=+) #161616 |
| Text       | ![#ffffff](https://via.placeholder.com/10/ffffff?text=+) #ffffff |
| Accent 01  | ![#ff002e](https://via.placeholder.com/10/ff002e?text=+) #ff002e |
| Accent 02  | ![#ff5200](https://via.placeholder.com/10/ff5200?text=+) #ff5200 |
| Accent 03  | ![#ff47ad](https://via.placeholder.com/10/ff47ad?text=+) #ff47ad |

## 参与开发

### 多语言 (i18n)

插件使用浏览器i18n API来支持多语言。更多信息请查看 [chrome.i18n](https://developer.chrome.com/docs/extensions/reference/api/i18n)

#### 添加新语言

- 在 `_locales` 文件夹中新建一个文件夹，使用 [Locale code](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales) 命名。
- 在新文件夹中创建一个 `messages.json` 文件。
- 将 `en/messages.json` 中的内容复制到新文件中。
- 将所有字符串翻译为新语言。

#### 更新现有语言

- 在 `_locales` 文件夹中找到您要更新的语言文件夹。
- 打开 `messages.json` 文件。
- 更新所有字符串。

### 添加新功能

要添加新功能，请遵循这些指南。

注意：我将来可能会把这个流程自动化，但我现在需要工作。

#### 标识符

- 应该是1或2个单词组成的唯一标识符。（如“dark_mode”或“dashboard_grades”）
- 如果它有子选项（特定于主要功能的选项），则每个选项都需要一个唯一的标识符。
- 所有选项均已同步并具有 8kb 存储限制，因此如果您的功能需要超过此限制，请与我联系。

#### 对 html/popup.html 的更改

- 将适当的 HTML 添加到该文件中。相应的 id 和 name（见下文）应该是标识符。
- 如果它没有子选项，则应将其与其他没有子选项的选项放在同一个容器中：

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

- 如果它有子选项，它就会成为它自己的容器：

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

#### 对 js/popup.js 的更改

- 将主标识符添加到 `syncedSwitches` 数组中。
- 如果您有子选项：
  - 将这些标识符添加到 `//checkboxes` 注释下找到的数组中。

#### 对 js/background.js 的更改

- 将所有标识符添加到 `syncedOptions` 数组中。
- 将选项的默认值添加到 `default_options` 数组中。
  - 对于布尔值，该值应该为 `false` ，对于字符串，该值应该为 ` ""` （如果 Canvas 已经有此选项的默认值，也可以使用`null`）

#### 对 js/content.js 的更改

- 该文件中应该包含一个可以完成这项工作的函数。名称应清楚地表明其用途。
- 在 `applyOptionsChanges()` 下，添加一个 switch case 以在菜单切换更改时调用此函数。
- 根据您的功能的用途，需要告知它何时触发。
  - 如果该函数更改了控制面板的任何地方，则应将其放入 `checkDashboardReady()` 内。
  - 如果该函数仅添加 css，则应将其添加到 `applyAestheticChanges()` 中，在这种情况下不应该是一个单独的函数，而是将 css 添加到该函数中找到的现有样式中。
  - 其他任何内容都应放在 `startExtension()` 下，并且不应高于此处找到的 `checkDashboardReady` 函数。

### 添加新主题

要添加新主题，请遵循以下指南。

您可以使用菜单中的导出工具导出主题并向我发送电子邮件，也可以在执行以下操作后将其合并到此处：

#### 导出主题

- 转到“主题”选项卡并导出深色模式、卡片图像、卡片颜色和自定义字体。 - 唯一需要包含的开/关切换是 `disable_color_overlay` 和 `gradient_cards`。不需要任何其他切换，因此您应该在导出代码中手动添加这些键和适当的值。
- 为主题选择一个唯一的 ID，无论它有多长。

#### 对 js/popup.js 的更改

- 在 `getTheme()` 下添加导出代码。
  - 确保它遵循以下格式： `"theme-<id>: { "exports": {"..."}, "preview": "..." }`
- 对于预览，请尝试从卡片图像中选择最小的图像大小（<50kb），或者您可以找到卡片图像中未包含的较小的显示图像。

#### 对 html/popup.html 的更改

- 在所有其他主题按钮下添加以下内容：

```
<button id="theme-<id>" class="theme-button customization-button"><theme name> by <you></button>
```

- 主题名称应该是一两个单词，这样就不会占用太多空间。

## 文件结构

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

### 更新文件结构

#### 使用 ‘Tree’ 命令

- Linux/Unix
  - 安装 [tree command line tool](https://www.geeksforgeeks.org/tree-command-unixlinux/)
  - 使用tree命令生成文件结构：
  ```
  tree
  ```

[此处](https://www.geeksforgeeks.org/tree-command-unixlinux/)了解更多有关 Linux/Unix 树命令的信息。

- Windows
  - 使用tree命令生成文件结构：
  ```
  tree /
  ```

[此处](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tree)了解更多有关 Windows 树命令的信息。

## 作者

#### 所有者

- [ksucpea](https://github.com/ksucpea)

#### 贡献者

- [fudgeu](https://github.com/fudgeu)
- [Tibo Geeraerts](https://github.com/tibogeeraerts)
- [Jacob Mungle](https://github.com/Jelgnum)
- [FireIsGood](https://github.com/FireIsGood)

## License 许可证

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Better Canvas](/icon/icon-48.png)
