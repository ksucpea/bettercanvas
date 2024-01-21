const domain = window.location.origin;
const current_page = window.location.pathname;
let assignments = null;
let grades = null;
let announcements = [];
let options = {};
let timeCheck = null;
let assignmentData = null;

/* 
SVGs 
*/
const discussion_svg = '<svg name="IconDiscussion" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_dIzR cGqzL_owrh" ><g role="presentation"><path d="M677.647059,16 L677.647059,354.936471 L790.588235,354.936471 L790.588235,129.054118 L1807.05882,129.054118 L1807.05882,919.529412 L1581.06353,919.529412 L1581.06353,1179.29412 L1321.41176,919.529412 L1242.24,919.529412 L1242.24,467.877647 L677.647059,467.877647 L0,467.877647 L0,1484.34824 L338.710588,1484.34824 L338.710588,1903.24706 L756.705882,1484.34824 L1242.24,1484.34824 L1242.24,1032.47059 L1274.99294,1032.47059 L1694.11765,1451.59529 L1694.11765,1032.47059 L1920,1032.47059 L1920,16 L677.647059,16 Z M338.789647,919.563294 L903.495529,919.563294 L903.495529,806.622118 L338.789647,806.622118 L338.789647,919.563294 Z M338.789647,1145.44565 L677.726118,1145.44565 L677.726118,1032.39153 L338.789647,1032.39153 L338.789647,1145.44565 Z M112.941176,580.705882 L1129.41176,580.705882 L1129.41176,1371.40706 L710.4,1371.40706 L451.651765,1631.05882 L451.651765,1371.40706 L112.941176,1371.40706 L112.941176,580.705882 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
const quiz_svg = '<svg label="Quiz" name="IconQuiz" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_owrh ToDoSidebarItem__Icon" ><g role="presentation"><g fill-rule="evenodd" stroke="none" stroke-width="1"><path d="M746.255375,1466.76417 L826.739372,1547.47616 L577.99138,1796.11015 L497.507383,1715.51216 L746.255375,1466.76417 Z M580.35118,1300.92837 L660.949178,1381.52637 L329.323189,1713.15236 L248.725192,1632.55436 L580.35118,1300.92837 Z M414.503986,1135.20658 L495.101983,1215.80457 L80.5979973,1630.30856 L0,1549.71056 L414.503986,1135.20658 Z M1119.32036,264.600006 C1475.79835,-91.8779816 1844.58834,86.3040124 1848.35034,88.1280123 L1848.35034,88.1280123 L1865.45034,96.564012 L1873.88634,113.664011 C1875.71034,117.312011 2053.89233,486.101999 1697.30034,842.693987 L1697.30034,842.693987 L1550.69635,989.297982 L1548.07435,1655.17196 L1325.43235,1877.81395 L993.806366,1546.30196 L415.712386,968.207982 L84.0863971,636.467994 L306.72839,413.826001 L972.602367,411.318001 Z M1436.24035,1103.75398 L1074.40436,1465.70397 L1325.43235,1716.61796 L1434.30235,1607.74796 L1436.24035,1103.75398 Z M1779.26634,182.406009 C1710.18234,156.41401 1457.90035,87.1020124 1199.91836,345.198004 L1199.91836,345.198004 L576.90838,968.207982 L993.806366,1385.10597 L1616.70235,762.095989 C1873.65834,505.139998 1804.68834,250.920007 1779.26634,182.406009 Z M858.146371,525.773997 L354.152388,527.597997 L245.282392,636.467994 L496.310383,887.609985 L858.146371,525.773997 Z"></path><path d="M1534.98715,372.558003 C1483.91515,371.190003 1403.31715,385.326002 1321.69316,466.949999 L1281.22316,507.305998 L1454.61715,680.585992 L1494.97315,640.343994 C1577.16715,558.035996 1591.87315,479.033999 1589.82115,427.164001 L1587.65515,374.610003 L1534.98715,372.558003 Z"></path></g></g></svg>';
const announcement_svg = '<svg label="Announcement" name="IconAnnouncement" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_owrh ToDoSidebarItem__Icon"><g role="presentation"><path d="M1587.16235,31.2784941 C1598.68235,7.78672942 1624.43294,-4.41091764 1650.63529,1.46202354 C1676.16,7.56084707 1694.11765,30.2620235 1694.11765,56.4643765 L1694.11765,56.4643765 L1694.11765,570.459671 C1822.87059,596.662024 1920,710.732612 1920,847.052612 C1920,983.372612 1822.87059,1097.55614 1694.11765,1123.75849 L1694.11765,1123.75849 L1694.11765,1637.64085 C1694.11765,1663.8432 1676.16,1686.65732 1650.63529,1692.6432 C1646.23059,1693.65967 1641.93882,1694.11144 1637.64706,1694.11144 C1616.52706,1694.11144 1596.87529,1682.36555 1587.16235,1662.93967 C1379.23765,1247.2032 964.178824,1242.34673 960,1242.34673 L960,1242.34673 L564.705882,1242.34673 L564.705882,1807.05261 L652.461176,1807.05261 C640.602353,1716.92555 634.955294,1560.05026 715.934118,1456.37026 C768.338824,1389.2832 845.590588,1355.28791 945.882353,1355.28791 L945.882353,1355.28791 L945.882353,1468.22908 C881.392941,1468.22908 835.312941,1487.09026 805.044706,1525.71614 C736.263529,1613.58438 759.981176,1789.54673 774.776471,1849.97026 C778.955294,1866.79849 775.115294,1884.6432 764.498824,1898.30908 C753.769412,1911.97496 737.28,1919.99379 720,1919.99379 L720,1919.99379 L508.235294,1919.99379 C477.063529,1919.99379 451.764706,1894.80791 451.764706,1863.5232 L451.764706,1863.5232 L451.764706,1242.34673 L395.294118,1242.34673 C239.548235,1242.34673 112.941176,1115.73967 112.941176,959.993788 L112.941176,959.993788 L112.941176,903.5232 L56.4705882,903.5232 C25.2988235,903.5232 0,878.337318 0,847.052612 C0,815.880847 25.2988235,790.582024 56.4705882,790.582024 L56.4705882,790.582024 L112.941176,790.582024 L112.941176,734.111435 C112.941176,578.478494 239.548235,451.758494 395.294118,451.758494 L395.294118,451.758494 L959.887059,451.758494 C976.828235,451.645553 1380.36706,444.756141 1587.16235,31.2784941 Z M1581.17647,249.706729 C1386.46588,492.078494 1128.96,547.871435 1016.47059,560.746729 L1016.47059,560.746729 L1016.47059,1133.47144 C1128.96,1146.34673 1386.46588,1202.02673 1581.17647,1444.51144 L1581.17647,1444.51144 Z M903.529412,564.699671 L395.294118,564.699671 C301.891765,564.699671 225.882353,640.709082 225.882353,734.111435 L225.882353,734.111435 L225.882353,959.993788 C225.882353,1053.39614 301.891765,1129.40555 395.294118,1129.40555 L395.294118,1129.40555 L903.529412,1129.40555 L903.529412,564.699671 Z M1694.11765,688.144376 L1694.11765,1006.07379 C1759.73647,982.694965 1807.05882,920.577318 1807.05882,847.052612 C1807.05882,773.527906 1759.73647,711.5232 1694.11765,688.144376 L1694.11765,688.144376 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
const assignment_svg = '<svg label="Assignment" name="IconAssignment" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_owrh ToDoSidebarItem__Icon"><g role="presentation"><path d="M1468.2137,0 L1468.2137,564.697578 L1355.27419,564.697578 L1355.27419,112.939516 L112.939516,112.939516 L112.939516,1807.03225 L1355.27419,1807.03225 L1355.27419,1581.15322 L1468.2137,1581.15322 L1468.2137,1919.97177 L2.5243549e-29,1919.97177 L2.5243549e-29,0 L1468.2137,0 Z M1597.64239,581.310981 C1619.77853,559.174836 1655.46742,559.174836 1677.60356,581.310981 L1677.60356,581.310981 L1903.4826,807.190012 C1925.5058,829.213217 1925.5058,864.902104 1903.4826,887.038249 L1903.4826,887.038249 L1225.8455,1564.67534 C1215.22919,1575.17872 1200.88587,1581.16451 1185.86491,1581.16451 L1185.86491,1581.16451 L959.985883,1581.16451 C928.814576,1581.16451 903.516125,1555.86606 903.516125,1524.69475 L903.516125,1524.69475 L903.516125,1298.81572 C903.516125,1283.79477 909.501919,1269.45145 920.005294,1258.94807 L920.005294,1258.94807 Z M1442.35055,896.29929 L1016.45564,1322.1942 L1016.45564,1468.225 L1162.48643,1468.225 L1588.38135,1042.33008 L1442.35055,896.29929 Z M677.637094,1242.34597 L677.637094,1355.28548 L338.818547,1355.28548 L338.818547,1242.34597 L677.637094,1242.34597 Z M903.516125,1016.46693 L903.516125,1129.40645 L338.818547,1129.40645 L338.818547,1016.46693 L903.516125,1016.46693 Z M1637.62298,701.026867 L1522.19879,816.451052 L1668.22958,962.481846 L1783.65377,847.057661 L1637.62298,701.026867 Z M1129.39516,338.829841 L1129.39516,790.587903 L338.818547,790.587903 L338.818547,338.829841 L1129.39516,338.829841 Z M1016.45564,451.769356 L451.758062,451.769356 L451.758062,677.648388 L1016.45564,677.648388 L1016.45564,451.769356 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';

const darkmode_css = "#announcementWrapper>div>div,#breadcrumbs,#calendar-app .fc-agendaWeek-view .fc-body,#calendar-app .fc-event,#calendar-app .fc-month-view .fc-body,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-body,#calendar-drag-and-drop-container .fc-event,#calendar-drag-and-drop-container .fc-month-view .fc-body,#content-wrapper .user_content.not_design_tools h3,#context-list-holder,.bettercanvas-course-credit,#kl_banner,#kl_banner_left,#kl_banner_right,#kl_content_block_0,#kl_custom_block_0,#kl_custom_block_1,#kl_custom_block_2,#kl_readings p,#kl_wrapper_3,#kl_wrapper_3 .ic-Table,#kl_wrapper_3 .table,#kl_wrapper_3.kl_colored_headings #kl_banner #kl_banner_left,#kl_wrapper_3.kl_colored_headings #kl_banner .kl_subtitle,#kl_wrapper_3.kl_colored_headings>div,#kl_wrapper_3.kl_colored_headings_box_left>div,#media_comment_maybe,#minical,#nav-tray-portal>span>span,#questions .group_top,#questions.assessing,#syllabus tr.date.date_passed td,#syllabus tr.date.date_passed th,#undated-events,#undated-events .event,.Day-styles__root,.EmptyDays-styles__root,.Grouping-styles__title,.Grouping-styles__title::after,.PlannerHeader-styles__root,.ac-result-container,.agenda-wrapper,.al-options,.bettercanvas-assignment-container,.bjXfh_daKB,.bjXfh_daKB span,.bottom-reply-with-box,.canvas-rce__skins--root,.ccWIh_bGBk,.closed-for-comments-discussions-v2__wrapper,.conversations .panel,.dCppM_ddES,.discussion-section h4,.discussion-section p,.discussion-section ul,.discussion_entry,.discussions-v2__container-image,.discussions-v2__placeholder,.dpCPB_caGd,.dropdown-menu,.dropdown-menu .divider,.entry-content span,.even .slick-cell,.event-details,.fLzZc_bGBk,.form,.form-dialog .form-controls,.header-bar,.ic-Dashboard-header__layout,.ic-Dashboard-header__title,.ic-DashboardCard,.ic-DashboardCard__header_content,.ic-discussion-row,.ic-notification__content,.ig-list .ig-row.ig-row-empty,.instructure_file_link,.item-group-condensed .ig-header,.item-group-condensed .ig-row,.item-group-condensed .item-group-expandable,.item-group-container,.item-group-expandable .emptyMessage,.kl_image_round_white_border,.kl_image_white_border,.kl_mod_text,.message-list .messages>li,.module-sequence-footer .module-sequence-footer-content,.nav-icon,.outcomes-browser .outcomes-content,.outcomes-browser .outcomes-main,.outcomes-browser .outcomes-sidebar,.pages.show .page-title,.pagination ul>li>a,.pagination ul>li>span,.pinned-discussions-v2__wrapper,.popover,.question,.question_editing,.quiz-submission,.rubric_container .rubric_title,.submission-details-comments .comments,.submission-late-pill span,.submission-missing-pill span,.toolbarView .headerBar,.tox .tox-menubar,.tox .tox-split-button .tox-tbtn.tox-split-button__chevron,.tox .tox-toolbar,.tox .tox-toolbar__overflow,.tox .tox-toolbar__primary,.tox:not(.tox-tinymce-inline) .tox-editor-header,.ui-datepicker .ui-datepicker-time,.ui-datepicker .ui-dialog .ui-datepicker-time,.ui-datepicker .ui-dialog .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-datepicker .ui-datepicker-time,.ui-dialog .ui-datepicker .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-dialog-buttonpane,.ui-dialog .ui-dialog-titlebar.ui-widget-header,.ui-kyle-menu,.ui-tabs .ui-tabs-nav .kl_panel_heading.ui-state-default:not(.ui-tabs-active),.ui-tabs .ui-tabs-nav li.ui-state-hover,.ui-tabs .ui-tabs-nav li.ui-tabs-active,.ui-tabs .ui-tabs-nav li:hover,.ui-tabs .ui-tabs-panel,.ui-widget-content,.unpinned-discussions-v2__wrapper,.unpublished_courses_redesign .ic-DashboardCard__box__header,body,code,img.kl_image_round_white_border,img.kl_image_white_border,.bettercanvas-course-percent,pre,table.summary tbody th,table.summary td,.erWSf_bGBk,.fdyuz_bGBk,.eHzxc_bGBk,.dNoYT_bGBk,.fOyUs_fZwI, .fOyUs_kXoP,.tox .tox-edit-area__iframe,.dLyYq_bGBk,.quiz_comment,.discussion-entries .entry,.file-upload-submission,.ftPBL_bGBk:not(.ftPBL_bGiS),.ColorPicker__Container,#right_side .content_box,.jumbotron,.card,.ac-token,.error_box .error_text,table.seas-homepage-table,.with-left-side #left-side, .assignment-student-header,#calendar-list-holder, #other-calendars-list-holder, #undated-events,#left-side,.ic-app-course-menu.with-left-side #left-side.XOwIb_eLeB:not([aria-selected]):not([aria-disabled]):hover, .XOwIb_eLeB[aria-selected],span.fOyUs_bGBk.fOyUs_desw.bDzpk_bGBk.bDzpk_busO.bDzpk_cQFX.bDzpk_bZNM,.bettercanvas-todo-complete-btn,.bettercanvas-card-grade,div[style*='background-color: #fff'],div[style*='background: #fff'],div[style*='background-color: #ffffff'],div[style*='background: #ffffff'],span[style*='background-color: #fff'],span[style*='background: #fff'],#right_side div.comment,.fOyUs_dUgE, .fOyUs_bvKN,.css-1fwux0x-view--block,.css-1v8v5q1-optionItem,#comments-tray,.css-vxe90h-view--inlineBlock{background:var(--bcbackground-0)!important}#minical .fc-widget-content{border:1px solid var(--bcbackground-0)!important}#kl_wrapper_3.kl_colored_headings #kl_banner .kl_subtitle{border-top:3px solid var(--bcbackground-0)!important;border-bottom:3px solid var(--bcbackground-0)!important}#submit_file_button,span[style*='background-color: #fbeeb8']{color:var(--bcbackground-0)!important}.eHQDY_dTxv{stroke:var(--bcbackground-0)!important}#calendar-app .fc-agendaWeek-view .fc-event,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-event,#context-list .context_list_context:hover,#google_docs_tree li.file:hover,#planner-today-btn,#questions.assessment_results .question .header,#syllabus tr.date.related td,#syllabus tr.date.related th,#syllabus tr.date.selected td,#syllabus tr.date.selected th,.Button,.ac-input-box,.agenda-day.agenda-today,.bettercanvas-assignment-container:hover,.btn,.discussion-reply-box,.discussions-v2__wrapper>span>span>span>span>button>span,.dropdown-menu li>a:focus,.dropdown-menu li>a:hover,.dropdown-submenu:hover>a,.ef-item-row:hover,.extension-linkpreview,.fOyUs_bGBk.fOyUs_desw.bDzpk_bGBk.bDzpk_busO.bDzpk_fZWR.bDzpk_qOas,.fc-event .fc-bg,.hypodivcalc,.ic-Table.ic-Table--striped tbody tr:nth-child(odd),.mini_calendar .day.has_event,.odd .slick-cell,.outcomes-browser .outcomes-toolbar,.question .header,.slick-header-column,.stream-details tr:hover,.stream_header:hover,.submission_attachment button>span,.tox .tox-menu,.tray-with-space-for-global-nav>div>span>form>button>span,.ui-button,.ui-tabs .ui-tabs-nav li.ui-tabs-active,.uneditable-input,.yyQPt_cSXm,div.checkbox,input[type=color],input[type=date],input[type=datetime-local],input[type=datetime],input[type=email],input[type=month],input[type=number],input[type=password],input[type=search],input[type=tel],input[type=text],input[type=time],input[type=url],input[type=week],select,textarea,thead th,ul.outcome-level li.selected a,.eMdva_bgqc,.fQfxa_dqAF.fQfxa_buuG,div.form-column-right label:hover, div.overrides-column-right label:hover,.ic-tokeninput-input,.ic-tokens,.ic-tokeninput-list,.DyQTK_ddES,#gradebook_header,table.seas-homepage-table tr:nth-child(odd),#assignments-student-footer,.muted-notice,.kl_panels_wrapper .ui-accordion-header, .kl_wrapper .ui-accordion-header,.list-view a.active,#calendars-context-list .context_list_context:hover, #other-calendars-context-list .context_list_context:hover,.bettercanvas-todo-complete-btn:hover,.bettercanvas-custom-btn,.bettercanvas-skeleton-text,.bettercanvas-hover-preview,.bettercanvas-gpa-edit-btn,div[style*='background-color: rgb(229, 242, 248)'],div[style*='background-color: rgb(245, 245, 245)'],.css-7naoe-textInp,.css-7naoe-textInput__facade,#assignment_sort_order_select_menu,#course_select_menu,.css-1dn3ise-textInput__facade,.css-1veueey-textInput__facade{background:var(--bcbackground-1)!important}.ic-DashboardCard__placeholder-svg .ic-DashboardCard__placeholder-animates>*{fill:var(--bcbackground-1)!important}.bettercanvas-hover-preview::after{background:linear-gradient(0deg, var(--bcbackground-1) 50%, transparent)}#calendar-app .fc-month-view .fc-today,#calendar-drag-and-drop-container .fc-month-view .fc-today,#content-wrapper .user_content.not_design_tools table tbody tr:nth-child(even) td,#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1) i,.ajas-search-widget__btn--search,.alert-info,.discussion-section.alert .discussion-points,.discussion-section.alert .discussion-title,.extension-linkpreview:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-alert:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-danger:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-neutral:hover,.ic-Table.ic-Table--hover-row tbody tr.ic-Table__row--bg-success:hover,.ic-Table.ic-Table--hover-row tbody tr:hover,.ic-flash-error,.ic-flash-info,.ic-flash-success,.ic-flash-warning,.ig-list .ig-row:hover,.context_module_item.context_module_item_hover,.tox .tox-mbtn--active,.tox .tox-mbtn:hover:not(:disabled):not(.tox-mbtn--active),.tox .tox-split-button .tox-tbtn.tox-split-button__chevron:hover,.tox .tox-split-button:hover,.tox .tox-tbtn.tox-tbtn--enabled:hover,.tox .tox-tbtn:hover,.ui-menu .ui-menu-item .ui-progressbar a.ui-widget-header,.ui-menu .ui-menu-item a.ui-state-active,.ui-menu .ui-menu-item a.ui-state-focus,.ui-menu .ui-menu-item a.ui-state-hover,.ui-progressbar .ui-menu .ui-menu-item a.ui-widget-header,::-webkit-scrollbar-track,div.checkbox:hover,.gradebook-cell.grayed-out,.baylor-table tr:nth-of-type(2n + 1){background:var(--bcbuttons)!important}#kl_content_block_0 h3:nth-child(1),#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1),#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1),#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1),#kl_custom_block_2 h3:nth-child(1) i,#kl_wrapper_3.kl_colored_headings #kl_modules h3,#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_emta h3:not(.ui-state-default),.ic-app-header__menu-list-link:focus,.kl_flex_column h4,.tox .tox-collection--list .tox-collection__item--enabled,ul.outcome-level li:focus,ul.outcome-level li:hover{background-color:var(--bcbuttons)!important}.eHQDY_dTxv{stroke:var(--bcbuttons)}.no-touch .ic-DashboardCard:hover{box-shadow:0 4px 10px rgb(0 0 0)!important}#calendar-drag-and-drop-container .fc-row .fc-content-skeleton td,#calendar-drag-and-drop-container .fc-row .fc-helper-skeleton td,.bettercanvas-course-credit,#kl_content_block_0,#kl_custom_block_0,#kl_custom_block_1,#kl_custom_block_2,#kl_wrapper_3.kl_colored_headings>div,#kl_wrapper_3.kl_colored_headings_box_left>div,#minical,#questions .group_bottom,#questions .group_top,#quiz_edit_wrapper #quiz_tabs #quiz_options_form .option-group,#quiz_show .description.teacher-version,.Button,.Container__DueDateRow,.CourseImageSelector,.ac-input-box,.ac-result-container,.ajas-search-widget__form input,.btn,.calendar .fc-row .fc-content-skeleton td,.calendar .fc-row .fc-helper-skeleton td,.closed-for-comments-discussions-v2__wrapper,.discussion-entries .entry,.discussion-reply-box,.discussion_entry>.discussion-entry-reply-area,.discussions-v2__wrapper>span>span>span>span>button>span,.form-actions,.ic-flash-error,.ic-flash-info,.ic-flash-success,.ic-flash-warning,.ig-list .ig-row,.item-group-condensed .ig-header,.item-group-condensed .item-group-expandable,.mini-cal-header,.mini_calendar,.outcomes-browser .outcomes-main,.outcomes-browser .outcomes-toolbar,.panel-border,.pinned-discussions-v2__wrapper,.question,.question .header,.question_editing,.quiz-submission,.rubric_container td,.rubric_container th,.submission-details-container,.submission_attachment button>span,.table-bordered,.toolbarView .headerBar,.tray-with-space-for-global-nav>div>span>form>button>span,.ui-button,.uneditable-input,.unpinned-discussions-v2__wrapper,form.question_form .form_answers .answer,.bettercanvas-course-percent,input[type=color],input[type=date],input[type=datetime-local],input[type=datetime],input[type=email],input[type=month],input[type=number],input[type=password],input[type=search],input[type=tel],input[type=text],input[type=time],input[type=url],input[type=week],select,textarea,.fdyuz_bGBk,.tox .tox-edit-area,.quiz_comment,.ic-tokens,.ic-tokeninput-list,.DyQTK_ddES,.ac-token,.muted-notice,.ui-state-default, .ui-widget-header .ui-state-default,.ui-widget-content,.bettercanvas-custom-btn,.bettercanvas-gpa-edit-btn,.css-26xxi8-view--block,.css-9fqfm7-view--block{border:1px solid var(--bcborders)!important}#content-wrapper .user_content.not_design_tools table td,#content-wrapper .user_content.not_design_tools table th,table.seas-homepage-table,.avatar,.css-7naoe-textInput__facade,.css-1dn3ise-textInput__facade{border:2px solid var(--bcborders)!important}#course_select_menu,#assignment_sort_order_select_menu,#TextInput_0{border:none!important}#assignment_show .student-assignment-overview,#grades_summary th.title,#kl_wrapper_3.kl_colored_headings h4,#kl_wrapper_3.kl_colored_headings_box_left h4,#minical .fc-toolbar,#quiz_show ul#quiz_student_details,#right-side .h2,#right-side h2,.CompletedItemsFacade-styles__root,.Container__DueDateRow-item,.EmptyDays-styles__root,.PlannerItem-styles__root,.agenda-day,.blnAQ_kWwi,.container_0 .slick-cell,.container_1 .slick-cell,.conversations .panel,.course_details td,.dropdown-menu .divider,.ef-directory-header,.ef-header,.event-details-content,.event-details-footer,.event-details-header,.header-bar,.hr,.ic-Action-header.ic-Action-header--before-item-groups,.ic-Dashboard-header__layout,.ic-Table td,.ic-Table th,.ic-app-nav-toggle-and-crumbs,.item-group-condensed .ig-row,.message-detail.conversations__message-detail .message-content>li,.message-detail.conversations__message-detail .message-header,.message-detail.span8 .message-content>li,.message-detail.span8 .message-header,.message-list .messages>li,.nav_list li.disabled,.page-action-list a,.page-header,.quiz-header,.recent-activity-header,.recent_activity>li,.slick-header-column.ui-state-default,.submission-details-header__heading-and-grades,.ui-datepicker .ui-dialog .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-datepicker .ui-widget-header.ui-datepicker-header,.ui-dialog .ui-dialog-titlebar.ui-widget-header,.unpublished_courses_redesign .ic-DashboardCard__box__header,legend,table.summary caption,table.summary tbody th,table.summary td,table.summary thead th,.communication_message,.file-upload-submission,.submission-details-header__heading-and-grades,#right_side .content_box,.assignment-student-header,.bettercanvas-gpa-course{border-bottom:1px solid var(--bcborders)!important}#planner-today-btn,.al-options,.border,.dpCPB_caGd,.fc-unthemed .fc-divider,.fc-unthemed .fc-popover,.fc-unthemed .fc-row,.fc-unthemed tbody,.fc-unthemed td,.fc-unthemed th,.fc-unthemed thead,.qBMHb_cSXm,.tox .tox-collection--list .tox-collection__group,.tox .tox-menu,.ui-tabs .ui-tabs-nav li.ui-tabs-active,.ui-tabs .ui-tabs-nav li.ui-tabs-active.ui-state-hover,.ui-tabs .ui-tabs-nav li.ui-tabs-active:hover,.ui-tabs .ui-tabs-nav li:hover,.ui-tabs .ui-tabs-panel,.fOyUs_dsNY, .fOyUs_tIxX,.fQfxa_dqAF.fQfxa_buuG,.question .question_comment.question_neutral_comment,#assignments-student-footer,.MyTable,#inbox-conversation-holder *{border-color:var(--bcborders)!important}.discussion-section.message_wrapper table{border:4px solid var(--bcborders)!important}.nav_list li.navitem{border:solid var(--bcborders)!important;border-width:0 1px 1px!important}#questions .assessment_question_bank,#questions .insufficient_count_warning,#questions .question_holder.group,.container_0 .slick-cell,.container_1 .slick-cell,.ef-main .ef-folder-content,.rubric_container .rubric_title,.slick-header-column.ui-state-default,.topic .entry-content,body.responsive_awareness .message-list-scroller,ul.outcome-level{border-right:1px solid var(--bcborders)!important}#questions .assessment_question_bank,#questions .insufficient_count_warning,#questions .question_holder.group,.container_0 .slick-cell:first-child,.container_0 .slick-header-column:first-child,.outcomes-browser .outcomes-content,.rubric_container .rubric_title,.table-bordered td,.table-bordered th,.topic .entry-content,.submission-details-comments .comments{border-left:1px solid var(--bcborders)!important}#assignment_show .student-assignment-overview,#grades_summary tr.final_grade,#quiz_show ul#quiz_student_details,.discussion-entries .entry .entry,.ef-footer,.entry>.bottom-reply-with-box .discussion-entry-reply-area,.form-dialog .form-controls,.ic-app-footer,.module-sequence-footer .module-sequence-footer-content,.question.matching_question .answer,.question.multiple_answers_question .answer,.question.multiple_choice_question .answer,.question.true_false_question .answer,.rubric_container .rubric_title,.slick-header-column.ui-state-default,.table td,.table th,.dNoYT_bGBk{border-top:1px solid var(--bcborders)!important}.discussions-v2__container-image{border:.125rem dashed var(--bcborders)!important}.Button--active.ui-button,.Button.Button--active,.Button.active,.active.ui-button,.btn.Button--active,.btn.active,.btn.ui-button.ui-state-active,.message-list .message-count,.mini_calendar .day.today,.ui-button.ui-state-active,.ui-button.ui-state-active.ui-state-hover,.ui-button.ui-state-active:hover,.ui-progressbar .btn.ui-button.ui-widget-header,.ui-progressbar .ui-button.ui-widget-header,::-webkit-scrollbar-thumb,.ic-unread-badge__total-count{background:var(--bcborders)!important}.discussion-entries .entry .entry,.kl_image_white_border{border:0!important}.ac-result-wrapper:before{border-bottom:10px solid var(--bcborders)}.eIQkd_bGBk,.ui-tabs .ui-tabs-nav,.eHzxc_bGBk,.quiz_comment:after,.quiz_comment:before{border-bottom-color:var(--bcborders)!important}.ic-item-row{box-shadow:0 -1px var(--bcborders),inset 0 -1px var(--bcborders)!important}#GradeSummarySelectMenuGroup span,#kl_content_block_0 h3:nth-child(1),#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1),#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1),#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1),#kl_custom_block_2 h3:nth-child(1) i,#kl_wrapper_3.kl_colored_headings #kl_modules h3,#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3:not(.ui-state-default),#kl_wrapper_3.kl_emta h3:not(.ui-state-default),.bettercanvas-card-grade,.bettercanvas-card-header,.discussion-fyi,.ic-DashboardCard__action-badge,.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active .menu-item__text,.ig-list .ig-row,.kl_flex_column h4,.menu-item__badge,.mini_calendar .day.other_month,.ui-tabs .ui-tabs-nav li.ui-tabs-active a,.bettercanvas-course-percent,.bettercanvas-todo-container,.bettercanvas-todo-container:hover,.MlJlv_ebWM,.bettercanvas-todo-item,.bettercanvas-todo-item:hover,.bettercanvas-hover-preview,.baylorMainContainer,.baylor-table td,.fOyUs_dUgE, .fOyUs_bvKN,.muted,h1 small,h2 small,h3 small,h4 small,h5 small,h6 small,blockquote small,.css-1v8v5q1-optionItem,.Button,button,.btn,h1,h2,h3,h4,h5,h6{color:var(--bctext-0)!important}.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active svg,.ToDoSidebarItem__Icon{fill:var(--bctext-0)!important}.ic-avatar{border:2px solid var(--bctext-0)!important}#breadcrumbs>ul>li+li:last-of-type a,#calendar-app .fc-agendaWeek-view .fc-axis,#calendar-app .fc-agendaWeek-view .fc-widget-header,#calendar-app .fc-month-view .fc-widget-header,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-axis,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-widget-header,#calendar-drag-and-drop-container .fc-month-view .fc-widget-header,#content-wrapper .user_content.not_design_tools h3,.bettercanvas-course-credit,#kl_banner,#kl_banner h2,#kl_banner_left,#kl_banner_right,#kl_custom_block_0,#kl_readings p,#kl_wrapper_3.kl_colored_headings #kl_banner #kl_banner_left,#kl_wrapper_3.kl_colored_headings #kl_banner .kl_subtitle,#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings h4,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left h4,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i,#kl_wrapper_3.kl_emta,#minical .fc-toolbar .h2,#minical .fc-toolbar h2,#minical .fc-widget-content,#nav-tray-portal>span>span>div>div>.navigation-tray-container.courses-tray>.tray-with-space-for-global-nav>div>ul>li>div,#right-side .details .header,#right-side .right-side-list li em,#right-side .right-side-list li p,.Day-styles__root h2,.EmptyDays-styles__root,.HwBsD_blJt,.HwBsD_fqzO,.MlJlv_dnnz,.PlannerItem-styles__due,.PlannerItem-styles__score,.ToDoSidebarItem__Info,.ToDoSidebarItem__Info li,.ac-input-box,.accessible-toggler,.bettercanvas-assignment-container,.bettercanvas-assignment-container:hover,.bjXfh_daKB,.bjXfh_daKB span,.cWmNi_bGBk,.ccWIh_bGBk,.close,.comment_list .comment,.discussion-points,.discussion-pubdate,.discussion-rate-action,.discussion-reply-action,.discussion-section h4,.discussion-section p,.discussion-section ul,.discussion-tododate,.discussions-v2__container-image>span>div,.dropdown-menu li>a,.ef-plain-link,.ef-plain-link:hover,.enRcg_bGBk.enRcg_qFsi,.entry-content span,.esvoZ_drOs,.event-details-timestring,.extension-ac a:hover,.extension-linkpreview,.fCrpb_egrg,.fCrpb_egrg.fCrpb_fVUh,.fNHEA_blJt,.fQfxa_bCUx.fQfxa_buuG,.fc-agendaWeek-view .fc-event-container a[class*=group_] .fc-content .fc-time,.fc-event,.fc-event:hover,.fwfoD_fsuY,.header-row a.sort-field-active i,.hypodivcalc,.ic-Dashboard-header__title,.ic-DashboardCard__header-subtitle,.ic-DashboardCard__header-term,.ic-discussion-content-container,.ig-header .name,.ig-list .ig-row a.ig-title,.ig-type-icon,.item-group-condensed .ig-header,.item-group-expandable .emptyMessage,.jpyTq_bGBk,.kl_mod_text,.kl_readings span,.list-view a.active,.message-detail.conversations__message-detail .no-messages,.message-detail.span8 .no-messages,.message-list .author,.message-list .subject,.message.user_content div,.mini-cal-header,.mini_calendar .day,.nav-icon,.nav_list li.navitem,.ofhgV_ddES,.pages.show .page-title,.planner-day,.standalone-icon:before,.submission_attachment button>span,.tox .tox-collection__item,.tox .tox-insert-table-picker__label,.tray-with-space-for-global-nav>div>span>form>button>span,.tree i[class*=icon-],.tree i[class^=icon-],.ui-button,.ui-state-default,.ui-tabs .ui-tabs-nav li a,.ui-widget .fc-event,.ui-widget-content,.ui-widget-header .ui-state-default,.uneditable-input,.user_content.enhanced,.user_content,.user_content.enhanced p,body,code,input.enRcg_bGBk[type].enRcg_qFsi,input[type=color],input[type=date],input[type=datetime-local],input[type=datetime],input[type=email],input[type=month],input[type=number],input[type=password],input[type=search],input[type=tel],input[type=text],input[type=time],input[type=url],input[type=week],label.fCrpb_egrg,legend,pre,select,textarea,ul#question_list li i, .enRcg_bGBk.enRcg_bLsb, input.enRcg_bGBk[type].enRcg_bLsb,.erWSf_bGBk,.faJyW_blJt,.eMdva_bgqc,#right-side p.email_channel,.dpCPB_caGd,.XOwIb_ddES,.fdyuz_bGBk,.fOyUs_fZwI, .fOyUs_kXoP,.fQfxa_dqAF.fQfxa_buuG,.communication_message .header .header_title .title,.communication_message .header .header_title .sub_title,.ic-tokens,ic-tokeninput-input,.ftPBL_cuDj,.dUOHu_eCSh,.blnAQ_eCSh,#gradebook_header,.bettercanvas-assignment-link,.bettercanvas-assignment-link:hover,.jumbotron,.card,.ac-token,span[style='color: #000000;'],.bettercanvas-gpa-edit-btn{color:var(--bctext-1)!important}.list-view a.active{border-left:2px solid var(--bclinks)!important}.ToDoSidebarItem svg,.discussions-v2__wrapper>span>span>span>span>button>span>span>svg,.ic-DashboardCard__action-layout svg,.tox .tox-split-button__chevron svg,.tox .tox-tbtn svg,.tox .tox-tbtn svg g,.tox .tox-tbtn svg path{fill:var(--bctext-1)!important}.caret{border-top:4px solid var(--bctext-1)!important}#last_saved_indicator,#minical .fc-other-month,#nav_disabled_list li.navitem,.ToDoSidebarItem__Info>span,.extension-aldue,.ic-item-row__meta-content-timestamp p,.ig-list .icon-drag-handle,.ig-list .ig-row .ig-empty-msg,.message-detail.conversations__message-detail .date,.message-detail.conversations__message-detail .user-info .context,.message-detail.span8 .date,.message-detail.span8 .user-info .context,.message-list .summary,.profile_table .data_description,.question .header .question_points_holder,.student_assignment .context,.tox .tox-collection__item-accessory,.yyQPt_blJt,ul#question_list.read_only li.seen,ul#question_list li.current_question{color:var(--bctext-2)!important}#content-wrapper .user_content.not_design_tools a,#media_comment_maybe,#nav-tray-portal a,.ToDoSidebarItem__Title a,.message-list .date,a,a:focus,a:hover,.fQfxa_bCUx.fQfxa_eCSh,.fake-link,.no-touch .ic-DashboardCard__action:hover,.enRcg_bGBk.enRcg_fpfC, input.enRcg_bGBk[type].enRcg_fpfC{color:var(--bclinks)!important}#minical .fc-bg .fc-state-highlight,#submit_file_button,.StickyButton-styles__root,.ic-DashboardCard__action-badge,.menu-item__badge,ul.outcome-level li.selected a::before,.eMdva_pypk .eMdva_dnnz,.ic-notification__icon,.fQfxa_dqAF.fQfxa_eCSh,.recent_activity>li .unread-count,.recent_activity>li .unread.message-list .read-state:before,.eMdva_pypk .eMdva_dnnz,.tox .tox-collection--list .tox-collection__item--active:not(.tox-collection__item--state-disabled),.nav-badge,.message-list .read-state:before,.ic-unread-badge,.cECYn_bXiG,.unread-grade{background:var(--bclinks)!important}.eHQDY_ddES .eHQDY_eWAY{stroke:var(--bclinks)!important}.message-list .messages>li:hover{box-shadow:inset -4px 0 0 var(--bclinks)!important}.agenda-event__item-container:focus,.agenda-event__item-container:hover{box-shadow:inset 3px 0 0 var(--bclinks)}#calendar-app .fc-agendaWeek-view .fc-day-grid .fc-today,#calendar-drag-and-drop-container .fc-agendaWeek-view .fc-day-grid .fc-today{box-shadow:.5px -6px 0 0 var(--bclinks)}.message-list .read-state.read:before{box-shadow:0 0 0 1px var(--bclinks)}#minical .event::after{border:1px solid var(--bclinks)}.ic-notification{border:2px solid var(--bclinks)!important}.eMdva_pypk,.tox .tox-edit-area.active, .tox .tox-edit-area.active iframe,.emSEn_QUBp:hover{border-color:var(--bclinks)!important}.eHQDY_ddES .eHQDY_eWAY{stroke:var(--bclinks)}.ui-dialog .ui-dialog-titlebar-close.ui-state-hover, .ui-dialog .ui-dialog-titlebar-close.ui-state-focus{box-shadow:0 0 0 2px var(--bclinks)}select.ic-Input:focus, textarea.ic-Input:focus, input[type=text].ic-Input:focus, input[type=password].ic-Input:focus, input[type=datetime].ic-Input:focus, input[type=datetime-local].ic-Input:focus, input[type=date].ic-Input:focus, input[type=month].ic-Input:focus, input[type=time].ic-Input:focus, input[type=week].ic-Input:focus, input[type=number].ic-Input:focus, input[type=email].ic-Input:focus, input[type=url].ic-Input:focus, input[type=search].ic-Input:focus, input[type=tel].ic-Input:focus, input[type=color].ic-Input:focus, .uneditable-input.ic-Input:focus{outline-color:var(--bclinks)}.discussion-section.message_wrapper table{border:4px solid red!important}.extension-linkpreview,.hypodivcalc,.kl_shadow_2,.kl_shadow_b2,.tox .tox-split-button:hover{box-shadow:none!important}#kl_wrapper_3.kl_colored_headings #kl_modules h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings>div>h3:not(.ui-state-default) i,#kl_wrapper_3.kl_colored_headings_box_left #kl_modules h3 i,#kl_wrapper_3.kl_colored_headings_box_left>div>h3 i{border:none!important}.extension-aldue:hover,.ic-DashboardCard,.navigation-tray-container,.bettercanvas-gpa-card{box-shadow:0 2px 5px #00000080!important}::-webkit-scrollbar{width:15px}.ui-datepicker .ui-datepicker-time,.ui-datepicker .ui-dialog .ui-datepicker-time,.ui-dialog .ui-datepicker .ui-datepicker-time,.ui-dialog .ui-dialog-buttonpane,hr{border-top:none!important}#right-side .shared-space h2{border-bottom-style:none!important}#kl_content_block_0 h3:nth-child(1) i,#kl_custom_block_0 h3:nth-child(1) i,#kl_custom_block_1 h3:nth-child(1) i,#kl_custom_block_2 h3:nth-child(1) i{border:0!important}.ig-header .name{text-shadow:none!important}#right-side .events_list .event-details:after,#right-side .events_list .todo-details:after,#right-side .to-do-list .event-details:after,#right-side .to-do-list .todo-details:after{display:none!important},.muted-notice{background-image:none!important}.message-list .read-state.read:before{background:none!important}.ic-DashboardCard__header-button,.ic-app-header__secondary-navigation{background:none!important;border:none!important}.published-status.published .icon-publish::before{color:#0b874b!important}.ic-app-header{background:var(--bcsidebar)!important}.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active .ic-app-header__menu-list-link, .ic-app-header__menu-list-link:hover{background:#0000004f!important}.ic-app-header__logomark-container{background:none!important}.ic-app-header__menu-list-link svg,.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active svg{fill:var(--bcsidebar-text)!important}.menu-item-icon-container,.ic-app-header__menu-list-link .menu-item__text,.ic-app-header__menu-list-item.ic-app-header__menu-list-item--active .menu-item__text{color:var(--bcsidebar-text)!important}";

/* 
Start
*/

isDomainCanvasPage();

function isDomainCanvasPage() {
    chrome.storage.sync.get(['custom_domain', 'dark_mode', 'dark_preset', 'device_dark'], result => {
        options = result;
        if (result.custom_domain.length && result.custom_domain[0] !== "") {
            for (let i = 0; i < result.custom_domain.length; i++) {
                if (domain.includes(result.custom_domain[i])) {
                    startExtension();
                    return;
                }
            }
        } else {
            setupCustomURL();
        }
    });
}

/*
function isDomainCanvasPage() {
    chrome.storage.local.get(['custom_domain', 'dark_css', 'dark_mode'], result => {
        options = result;
        if (result.custom_domain.length && result.custom_domain[0] !== "") {
            try {
                for (let i = 0; i < result.custom_domain.length; i++) {
                    if (domain.includes(result.custom_domain[i])) {
                        startExtension();
                        return;
                    }
                }
            } catch (e) {
                try { // for users who set a url using an older version
                    if (domain.includes(result.custom_domain)) {
                        startExtension();
                        chrome.storage.local.set({ "custom_domain": [result.custom_domain] });
                        return;
                    }
                } catch (e) {
                    console.log(e);
                    console.log("custom url is having issues - contact ksucpea@gmail.com");
                }
            }
        } else {
            setupCustomURL();
        }
    });
}
*/

function startExtension() {
    toggleDarkMode();

    chrome.storage.sync.get(null, result => {
        options = { ...options, ...result };
        toggleAutoDarkMode();
        getApiData();
        checkDashboardReady();
        loadCustomFont();
        removeSidebarLogo();
    });

    chrome.runtime.onMessage.addListener(recieveMessage);

    chrome.storage.onChanged.addListener(applyOptionsChanges);

    console.log("Better Canvas - running");
}

function applyOptionsChanges(changes) {
    let rewrite = {};
    Object.keys(changes).forEach(key => {
        rewrite[key] = changes[key].newValue;
    });
    options = { ...options, ...rewrite };

    // when an option is updated it will call the necessary functions again
    // so any changes made in the menu no longer require a refresh to apply

    Object.keys(changes).forEach(key => {
        console.log(key + " changed");
        switch (key) {
            case ("dark_mode"):
            case ("dark_preset"):
            case ("device_dark"):
                toggleDarkMode();
                break;
            case ("auto_dark"):
            case ("auto_dark_start"):
            case ("auto_dark_end"):
                toggleAutoDarkMode();
                break;
            case ("gradient_cards"):
                changeGradientCards();
                break;
            case ("condensed_cards"):
                condenseCards();
                break;
            case ("disable_color_overlay"):
                changeOpacityCards();
                break;
            case ("dashboard_notes"):
                loadDashboardNotes();
                break;
            case ("dashboard_grades"):
            case ("grade_hover"):
                if (!grades) getGrades();
                insertGrades();
                break;
            case ("assignments_due"):
            case ("num_assignments"):
            case ("assignment_date_format"):
            case ("card_overdues"):
            case ("relative_dues"):
                if (!assignments) getAssignments();
                if (document.querySelectorAll(".bettercanvas-card-assignment").length === 0) setupCardAssignments();
                loadCardAssignments();
                break;
            case ("custom_assignments"):
                cardAssignments = preloadAssignmentEls();
                break;
            case ("custom_cards"):
            case ("custom_cards_2"):
            case ("custom_cards_3"):
                customizeCards();
                break;
            case ("todo_hr24"):
            case ("num_todo_items"):
            case ("hover_preview"):
            case ("todo_overdues"):
                loadBetterTodo();
                break;
            case ("gpa_calc"):
            case ("gpa_calc_prepend"):
                if (!grades) getGrades();
                setupGPACalc();
                break;
            case ("gpa_calc_bounds"):
                calculateGPA2();
                break;
            case ("full_width"):
                changeFullWidth();
                break;
            case ("custom_font"):
                loadCustomFont();
                break;
            case ("remlogo"):
                removeSidebarLogo();
                break;
        }
    });
}

let insertTimer;
function resetTimer() {
    clearTimeout(insertTimer);
    insertTimer = setTimeout(() => {
        if (document.querySelectorAll(".ic-DashboardCard__link").length > 0) {
            loadCardAssignments();
            loadBetterTodo();
        } else {
            resetTimer();
        }
    }, 1);
}

function checkDashboardReady() {
    if (current_page !== "/" && current_page !== "") return;
    const callback = (mutationList) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                if (mutation.target == document.querySelector("#DashboardCard_Container")) {
                    let cards = document.querySelectorAll('.ic-DashboardCard');
                    changeGradientCards();
                    setupCardAssignments();
                    loadCardAssignments();
                    customizeCards(cards);
                    insertGrades();
                    loadDashboardNotes();
                    condenseCards();
                    changeOpacityCards();
                    setupGPACalc();
                    changeFullWidth();
                } else if (mutation.target == document.querySelector('#right-side')) {
                    if (!mutation.target.querySelector(".bettercanvas-todosidebar")) {
                        setupBetterTodo();
                        loadBetterTodo();
                    }
                }
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(document.querySelector('html'), { childList: true, subtree: true });
}

function recieveMessage(request, sender, sendResponse) {
    switch (request.message) {
        case ("getCards"): getCards(); sendResponse(true); break;
        case ("setcolors"): changeColorPreset(request.options); sendResponse(true); break;
        case ("getcolors"): sendResponse(getCardColors()); break;
        default: sendResponse(true);
    }
}

function getCardColors() {
    let cards = document.querySelectorAll(".ic-DashboardCard__header");
    let colors = [];
    cards.forEach(card => {
        let rgbColor = card.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor;
        colors.push({ "href": card.querySelector(".ic-DashboardCard__link").href, "color": rgbToHex(rgbColor) });
    });
    colors.sort((a, b) => a.href > b.href ? 1 : -1);
    colors = colors.map(x => x.color);
    return colors;
}

async function getCards(api = null) {
    let dashboard_cards = api ? api : await getData(`${domain}/api/v1/courses?enrollment_state=active&per_page=100`);
    chrome.storage.sync.get(["custom_cards", "custom_cards_2", "custom_cards_3"], storage => {
        let cards = storage["custom_cards"] || {};
        let cards_2 = storage["custom_cards_2"] || {};
        let cards_3 = storage["custom_cards_3"] || {};
        let newCards = false;
        let count = 0;
        // sort cards by enrollment id (i think the higher the id, the more recent it is)
        dashboard_cards.sort((a, b) => (b?.enrollment_term_id || 0) - (a?.enrollment_term_id || 0));
        try {
            dashboard_cards.forEach(card => {
                if (!card.course_code || count >= 25) return;
                let id = card.id;
                if (!cards || !cards[id]) {
                    newCards = true;
                    cards[id] = { "default": card.course_code.substring(0, 20), "name": "", "code": "", "img": "", "hidden": false, "weight": "regular", "credits": 1, "eid": card.enrollment_term_id || 0, "gr": null };
                } else if (cards && cards[id]) {
                    newCards = true;
                    cards[id].default = card.course_code.substring(0, 20);
                    cards[id].eid = card.enrollment_term_id || 0;
                    if (!cards[id].code) cards[id].code = "";
                }
                if (!cards_2 || !cards_2[id]) {
                    newCards = true;
                    let links = [];

                    for (let i = 0; i < 4; i++) {
                        links.push({ "path": "default", "is_default": true });
                    }

                    cards_2[id] = { "links": links };
                }

                if (!cards_3 || !cards_3[id]) {
                    newCards = true;
                    cards_3[id] = { "url": domain };
                }
                count++;

            });

            //delete cards that aren't on the dashboard anymore
            Object.keys(cards).forEach(key => {
                let found = false;
                // ignore cards that are not for the current url
                if (cards_3[key] && cards_3[key].url !== domain) {
                    found = true;
                } else {
                    dashboard_cards.forEach(card => {
                        if (parseInt(key) === card.id) found = true;
                    });
                }

                if (found === false) {
                    console.log("Deleting " + key + " from custom_cards...", cards[key]);
                    cards[key] && delete cards[key];
                    cards_2[key] && delete cards_2[key];
                    cards_3[key] && delete cards_3[key];
                    newCards = true;
                }

            });

        } catch (e) {
            console.log(e);
        } finally {
            return chrome.storage.sync.set(newCards ? { "custom_cards": cards, "custom_cards_2": cards_2, "custom_cards_3": cards_3 } : {});
        }
    });
}

/* 
Better todo list
*/

function createTodoCreateBtn(location) {
    let confirmButton = makeElement("button", "bettercanvas-custom-btn", location, "Create");
    confirmButton.addEventListener("click", () => {
        chrome.storage.sync.get("custom_assignments_overflow", overflow => {
            chrome.storage.sync.get(overflow["custom_assignments_overflow"], storage => {
                let course_id = parseInt(location.querySelector("#bettercanvas-custom-course").value);

                const assignment = {
                    "plannable_id": new Date().getTime(),
                    "context_name": options.custom_cards[location.querySelector("#bettercanvas-custom-course").value].default,
                    "plannable": { "title": location.querySelector("#bettercanvas-custom-name").value },
                    "plannable_date": location.querySelector("#bettercanvas-custom-date").value + "T" + location.querySelector("#bettercanvas-custom-time").value + ":00",
                    "planner_override": { "marked_complete": false, "custom": true },
                    "plannable_type": "assignment",
                    "submissions": { "submitted": false },
                    "course_id": course_id,
                    "html_url": `/courses/${course_id}/assignments`
                };

                /* handling overflow since the limit is 8kb per key */

                let found = false;
                let reload = () => {
                    location.classList.toggle("bettercanvas-custom-open");
                    loadBetterTodo();
                    loadCardAssignments();
                }

                /* find the first available overflow with space */
                /* or create a new one if all are full */
                let findOpenOverflow = (num) => {
                    let current_overflow = overflow["custom_assignments_overflow"][num];
                    storage[current_overflow].push(assignment);
                    chrome.storage.sync.set({ [current_overflow]: storage[current_overflow] }, () => {
                        /* assuming any error is because the limit is exceeded */
                        if (chrome.runtime.lastError) {
                            if (num === overflow["custom_assignments_overflow"].length - 1) {
                                console.log("all overflows are full! creating new overflow " + (overflow["custom_assignments_overflow"].length + 1));
                                let new_overflow = "custom_assignments_" + (overflow["custom_assignments_overflow"].length + 1);
                                overflow["custom_assignments_overflow"].push(new_overflow);
                                chrome.storage.sync.set({ [new_overflow]: [assignment], "custom_assignments_overflow": overflow["custom_assignments_overflow"] }).then(reload);
                            } else {
                                console.log("overflow " + (num + 1) + " full...");
                                findOpenOverflow(num + 1);
                            }
                        } else {
                            console.log("overflow " + (num + 1) + " has space!");
                            reload();
                        }
                    });
                }

                findOpenOverflow(0);

            });
        })
    });
}

function createTodoHeader(location) {
    let todoHeader = makeElement("h2", "todo-list-header", location, "To Do");
    todoHeader.style = "display: flex; align-items:center; justify-content:space-between;";
    if (!options.custom_cards || Object.keys(options.custom_cards).length === 0) return;
    let addFillout = makeElement("div", "bettercanvas-add-assignment", location);
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    addFillout.innerHTML = '<input type="text" placeholder="Name" id="bettercanvas-custom-name" class="bettercanvas-custom-input"></input><select id="bettercanvas-custom-course" class="bettercanvas-custom-input"><option value="" disabled selected>Select course</option></select><div style="display: flex;gap:5px"><input type="date" id="bettercanvas-custom-date"  class="bettercanvas-custom-input"></input><input type="time" id="bettercanvas-custom-time"  class="bettercanvas-custom-input" value="23:59"></input></div>';
    addFillout.querySelector("#bettercanvas-custom-date").value = year + "-" + month + "-" + day;
    let selectCourse = document.querySelector("#bettercanvas-custom-course");
    Object.keys(options.custom_cards).forEach(id => {
        let card = options.custom_cards[id];
        let courseName = makeElement("option", "bettercanvas-select-course-option", selectCourse, card.default);
        courseName.value = id;
    });

    createTodoCreateBtn(addFillout);

    let addButton = makeElement("button", "bettercanvas-custom-btn", todoHeader, "+ Add");
    addButton.addEventListener("click", () => {
        addFillout.classList.toggle("bettercanvas-custom-open");
    });
}

function createTodoSections(location) {
    let todoAssignments = document.createElement("ul");
    todoAssignments.id = "bettercanvas-todo-list";
    location.appendChild(todoAssignments);
    makeElement("h2", "todo-list-header", location, "Announcements");
    let todoAnnouncements = document.createElement("ul");
    todoAnnouncements.id = "bettercanvas-announcement-list";
    location.appendChild(todoAnnouncements);
    for (let i = 0; i < options.num_todo_items; i++) {
        let loader = '<div class="bettercanvas-todo-item-loader"><div style="width: 100px" class="bettercanvas-skeleton-text"></div><div style="width: 200px" class="bettercanvas-skeleton-text"></div><div class="bettercanvas-skeleton-text"></div></div>';
        todoAssignments.innerHTML += loader;
        todoAnnouncements.innerHTML += loader;
    }
}

function setupBetterTodo() {
    if (options.better_todo !== true) return;
    if (document.querySelector('#bettercanvas-todo-list')) return;
    let list = document.querySelector("#right-side");
    if (!list) return;
    //if (!list || list.childElementCount === 0 || list.children[0].id === "bettercanvas-todo-list") return;
    try {
        /* save the feedback to append it later */
        const feedback = list.querySelector(".events_list.recent_feedback");

        list.textContent = "";
        list = makeElement("div", "bettercanvas-todosidebar", list);
        createTodoHeader(list);
        createTodoSections(list);

        if (feedback) list.append(feedback);


    } catch (e) {
        logError(e);
    }
}

let delay;
function loadBetterTodo() {
    if (options.better_todo !== true) return;
    try {
        const maxItemCount = options.num_todo_items;
        const hr24 = options.todo_hr24;
        const now = new Date();
        const csrfToken = CSRFtoken();
        let todoAnnouncements = document.querySelector("#bettercanvas-announcement-list");
        let todoAssignments = document.querySelector("#bettercanvas-todo-list");
        let assignmentsToInsert = [];
        let announcementsToInsert = [];

        assignments.then(data => {
            chrome.storage.sync.get(options.custom_assignments_overflow, storage => {
                //assignmentData = assignmentData === null ? data : assignmentData;
                let items = combineAssignments(data);
                items.forEach((item, index) => {
                    let date = new Date(item.plannable_date);

                    // trying to remove insane nested conditions
                    // for announcements:
                    // 1. announcements list isn't full 
                    // for todos:
                    // 1. haven't exceeded item limit
                    // 2. assignment hasn't been submitted (if hide completed option is on)
                    // 3. disallow overdue and item not past due/allow overdue and item hasn't been submitted
                    // 4. correct item type
                    // for both:
                    // 1. user has not marked it complete
                    if (item.plannable_type === "announcement") {
                        //if (announcementsToInsert.length >= maxItemCount) return;
                    } else {
                        if (assignmentsToInsert.length >= maxItemCount) return;
                        if (options.hide_completed === true && item.submissions.submitted === true) return;
                        if ((options.todo_overdues !== true && now >= date) || (options.todo_overdues === true && item.submissions.submitted === true)) return;
                        if (item.plannable_type !== "assignment" && item.plannable_type !== "quiz" && item.plannable_type !== "discussion_topic") return;
                    }
                    if (item.planner_override && item.planner_override.marked_complete === true) return;

                    let listItemContainer = document.createElement("div");
                    listItemContainer.classList.add("bettercanvas-todo-container");
                    listItemContainer.innerHTML = '<div class="bettercanvas-hover-preview"><p class="bettercanvas-preview-text"></p></div><div class="bettercanvas-todo-icon"></div><a class="bettercanvas-todo-item"></a><button class="bettercanvas-todo-complete-btn"><svg name="IconX" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk" style="width: 1em; height: 1em;"><g role="presentation"><path d="M797.319865 985.881673L344.771525 1438.43001 533.333333 1626.99182 985.881673 1174.44348 1438.43001 1626.99182 1626.99182 1438.43001 1174.44348 985.881673 1626.99182 533.333333 1438.43001 344.771525 985.881673 797.319865 533.333333 344.771525 344.771525 533.333333z" fill-rule="nonzero" stroke="none" stroke-width="1"></path></g></svg></button>';
                    listItemContainer.querySelector(".bettercanvas-todo-item").href = item.html_url;
                    listItemContainer.dataset.id = item.plannable_id;
                    let svg = assignment_svg;
                    switch (item.plannable_type) {
                        case 'discussion_topic':
                            svg = discussion_svg; break;
                        case 'quiz':
                            svg = quiz_svg; break;
                        case 'announcement':
                            svg = announcement_svg; break;
                    }
                    listItemContainer.querySelector('.bettercanvas-todo-icon').innerHTML += svg;
                    let listItem = listItemContainer.querySelector(".bettercanvas-todo-item");
                    makeElement("a", "bettercanvas-todoitem-title", listItem, item.plannable.title);
                    makeElement("p", "bettercanvas-todoitem-course", listItem, item.context_name);
                    let format = formatTodoDate(date, item.submissions, hr24);
                    let todoDate = makeElement("p", "bettercanvas-todoitem-date", listItem, format.date);
                    if (format.dueSoon) todoDate.classList.add("bettercanvas-due-soon");

                    if (options.hover_preview === true) {
                        const customItem = item.planner_override && item.planner_override.custom && item.planner_override.custom === true;
                        listItem.addEventListener("mouseover", () => {
                            listItem.classList.add("bettercanvas-todo-hover");
                            let preview = listItemContainer.querySelector(".bettercanvas-hover-preview");
                            let previewText = preview.querySelector(".bettercanvas-preview-text");
                            clearTimeout(delay);
                            delay = setTimeout(async () => {
                                if (listItem.classList.contains("bettercanvas-todo-hover")) {
                                    // custom assignment
                                    if (customItem) {
                                        previewText.textContent = "Custom assignment";

                                    } else {
                                        let found = false;
                                        let searchCount = 1;
                                        while (searchCount < 5 && found === false) {
                                            for (let i = 0; i < announcements.length; i++) {
                                                if (announcements[i].id === item.plannable_id) {
                                                    found = true;
                                                    if (previewText.textContent === "") {
                                                        let description = item.plannable_type === "announcement" ? announcements[i].message : announcements[i].description;
                                                        previewText.textContent = description === "" ? "No details given" : description.replace(/<\/?[^>]+(>|$)/g, " ");
                                                    }
                                                    break;
                                                }
                                            }
                                            if (found === false) {
                                                let apiLink = domain + "/api/v1/";
                                                if (item.plannable_type === "assignment") {
                                                    apiLink += `courses/${item.course_id}/assignments/${item.plannable_id}`;
                                                } else if (item.plannable_type === "announcement") {
                                                    apiLink += `announcements?context_codes[]=course_${item.course_id}&per_page=3&page=${searchCount}`;
                                                }
                                                let data = await getData(apiLink);
                                                item.plannable_type === "announcement" ? announcements.push(...data) : announcements.push(data);
                                                searchCount++;
                                            }
                                        }
                                        if (found === false) {
                                            previewText.textContent = "Couldn't load preview";
                                        }
                                    }
                                    preview.style.display = "block";
                                }
                            }, 250);
                        });

                        listItem.addEventListener("mouseleave", () => {
                            listItem.classList.remove("bettercanvas-todo-hover");
                            listItemContainer.querySelector(".bettercanvas-hover-preview").style.display = "none";
                        });
                    }

                    // remove item button
                    listItemContainer.querySelector(".bettercanvas-todo-complete-btn").addEventListener('click', function () {
                        if (item.planner_override && item.planner_override.custom && item.planner_override.custom === true) {
                            /* set item as complete locally */
                            chrome.storage.sync.get("custom_assignments_overflow", overflow => {
                                chrome.storage.sync.get(overflow["custom_assignments_overflow"], storage => {
                                    overflow["custom_assignments_overflow"].forEach(overflow => {
                                        for (let i = 0; i < storage[overflow].length; i++) {
                                            if (storage[overflow][i].plannable_id === item.plannable_id) {
                                                storage[overflow].splice(i, 1);
                                                chrome.storage.sync.set({ [overflow]: storage[overflow] }).then(() => {
                                                    let container = listItemContainer.parentElement;
                                                    container.removeChild(listItemContainer);
                                                    loadBetterTodo();
                                                    loadCardAssignments();
                                                });
                                                break;
                                            }
                                        }
                                    });
                                });
                            });
                        } else {
                            /* set the item as complete through api */
                            fetch(domain + '/api/v1/planner/overrides' + (item.planner_override ? "/" + item.planner_override.id : ""),
                                {
                                    method: item.planner_override ? "PUT" : "POST",
                                    headers: {
                                        "content-type": "application/json",
                                        'accept': 'application/json',
                                        'X-CSRF-Token': csrfToken,
                                    },
                                    body: JSON.stringify({ id: item.planner_override ? item.planner_override.id : null, marked_complete: true, plannable_id: item.plannable_id, plannable_type: item.plannable_type })
                                }).then(resp => {
                                    if (resp.status === 200 || resp.status === 201) {
                                        let container = listItemContainer.parentElement;
                                        container.removeChild(listItemContainer);
                                        assignmentData.forEach(assignment => {
                                            if (assignment.plannable_id === item.plannable_id) {
                                                item.planner_override = { "marked_complete": true };
                                            }
                                        });
                                        loadBetterTodo();
                                        loadCardAssignments();
                                    }
                                });
                        }
                    });

                    if (item.plannable_type === "announcement") {
                        announcementsToInsert.push(listItemContainer);
                    } else {
                        assignmentsToInsert.push(listItemContainer);
                        if (item.submissions && item.submissions.submitted) {
                            listItemContainer.classList.add("bettercanvas-todo-item-completed");
                        }
                    }
                    //}
                    //}


                });

                // appending assignments all at once
                todoAssignments.textContent = "";
                if (assignmentsToInsert.length > 0) {
                    for (let i = 0; i < (assignmentsToInsert.length > 5 ? maxItemCount : assignmentsToInsert.length); i++) {
                        todoAssignments.append(assignmentsToInsert[i]);
                    }
                } else {
                    makeElement("p", "bettercanvas-none-due", todoAssignments, "None");
                }

                // appending announcements all at once
                todoAnnouncements.textContent = "";
                if (announcementsToInsert.length > 0) {
                    for (let i = announcementsToInsert.length - 1; i >= (announcementsToInsert.length - maxItemCount < 0 ? 0 : announcementsToInsert.length - maxItemCount); i--) {
                        todoAnnouncements.append(announcementsToInsert[i]);
                    }
                } else {
                    makeElement("p", "bettercanvas-none-due", todoAnnouncements, "None");
                }

                cleanCustomAssignments();
            });
        });

    } catch (e) {
        logError(e);
    }
}

/*
Card color palettes
*/

let changeColorInterval = null;
let colorChanges = [];
async function changeColorPreset(colors) {

    if (colors.length === 0) return;

    // reset everything
    let res = await getData(`${domain}/api/v1/users/self/colors`);
    clearInterval(changeColorInterval);
    const csrfToken = CSRFtoken();
    const delay = 250;
    previous = []
    colorChanges = [];

    // sort cards
    let cards = document.querySelectorAll(".ic-DashboardCard__header");
    let sortedCards = [];
    cards.forEach(card => {
        sortedCards.push({ "href": card.querySelector(".ic-DashboardCard__link").href, "el": card });
    });
    sortedCards.sort((a, b) => a.href > b.href ? 1 : -1);

    // push each color change into a queue
    try {
        sortedCards.forEach((card, i) => {
            let previousColor = rgbToHex(card.el.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor);
            previous.push(previousColor);

            Object.keys(res.custom_colors).forEach(item => {
                let item_id = item.split("_")[1];
                if (card.href.includes(item_id)) {
                    let cnum = i % colors.length;

                    let changeCardColor = () => {
                        fetch(domain + "/api/v1/users/self/colors/" + item,
                            {
                                method: "PUT",
                                headers: {
                                    "content-type": "application/json",
                                    'accept': 'application/json',
                                    'X-CSRF-Token': csrfToken,
                                },
                                body: JSON.stringify({ "hexcode": colors[cnum] })
                            }).then(() => {
                                card.el.querySelector(".ic-DashboardCard__header_hero").style.backgroundColor = colors[cnum];
                                card.el.querySelector(".ic-DashboardCard__header-title span").style.color = colors[cnum];
                                card.el.querySelector(".ic-DashboardCard__header-button-bg").style.backgroundColor = colors[cnum];
                            });
                    }

                    colorChanges.push(changeCardColor);
                }
            });
        });
    } catch (e) {
        logError(e);
        colorChanges = [];
    }

    // go through the queue until empty
    changeColorInterval = setInterval(() => {
        if (colorChanges.length > 0) {
            let current = colorChanges.shift();
            current();
        } else {
            clearInterval(changeColorInterval);
            changeGradientCards();
        }
    }, delay);

    // set colors to revert back to
    chrome.storage.local.get("previous_colors", local => {
        const now = Date.now();
        if (local["previous_colors"] === null || now >= local["previous_colors"].expire) {
            chrome.storage.local.set({ "previous_colors": { "colors": previous, "expire": now + 86400000 } });
        }
    });
}

/*
Dark mode
*/

let darkStyleInserted = false;
function toggleDarkMode() {
    let css = (options.device_dark === true ? "@media (prefers-color-scheme: dark) {" : "") + ":root{";
    Object.keys(options.dark_preset).forEach(key => {
        css += "--bc" + key + ":" + options.dark_preset[key] + ";";
    });
    css += "}" + darkmode_css +  (options.device_dark === true ? "}" : "");
    if ((options.dark_mode === true || options.device_dark === true) && !darkStyleInserted) {
        let style = document.createElement('style');
        style.textContent = css;
        document.documentElement.prepend(style);
        style.id = 'darkcss';
        darkStyleInserted = true;
    } else if (darkStyleInserted) {
        let style = document.querySelector("#darkcss");
        style.textContent = options.dark_mode === true || options.device_dark ? css : "";
    }
    iframeChecker(options.dark_mode);
}

/*
let styleElementCreated = false;
function toggleDarkMode() {
    options.device_dark = false;
    let text = (options.device_dark === true ? "@media (prefers-color-scheme: dark) {" : "") + options.dark_css + (options.device_dark === true ? "}" : "");
    if ((options.dark_mode === true || options.device_dark === true) && styleElementCreated === false) {
        let style = document.createElement('style');
        style.textContent = options.dark_css;
        document.documentElement.prepend(style);
        style.id = 'darkcss';
        styleElementCreated = true;
    } else if (styleElementCreated === true) {
        let css = document.getElementById("darkcss").childNodes[0];
        css.textContent = options.dark_mode === true || options.device_dark === true ? text : "";
    }
    iframeChecker(options.dark_mode);
}
*/

function autoDarkModeCheck() {
    let date = new Date();
    let currentHour = date.getHours();
    let currentMinute = date.getMinutes();
    let status = false;
    if (options.auto_dark === false) return;
    let startHour = parseInt(options.auto_dark_start["hour"]);
    let startMinute = parseInt(options.auto_dark_start["minute"]);
    let endHour = parseInt(options.auto_dark_end["hour"]);
    let endMinute = parseInt(options.auto_dark_end["minute"]);
    if (currentHour === startHour) {
        status = currentMinute >= startMinute;
    } else if (currentHour === endHour) {
        status = currentMinute <= endMinute;
    } else if (startHour > endHour) {
        status = currentHour > startHour || currentHour < endHour;
    } else if (startHour < endHour) {
        status = currentHour > startHour && currentHour < endHour;
    }
    if (options.auto_dark === true) {
        options.dark_mode = status;
        chrome.storage.sync.set({ "dark_mode": status }, toggleDarkMode);
    }
}

function toggleAutoDarkMode() {
    clearInterval(timeCheck);
    if (options.auto_dark && options.auto_dark === false) return;
    autoDarkModeCheck();
    timeCheck = setInterval(autoDarkModeCheck, 60000);
}

let iframeObserver;
function iframeChecker(enabled) {
    if (current_page === "/" || current_page === "") return;

    if (enabled === false) {
        if (iframeObserver) iframeObserver.disconnect();
        document.querySelectorAll('iframe').forEach((frame) => {
            if (frame.contentDocument && frame.contentDocument.documentElement && frame.contentDocument.documentElement.querySelector('#darkcss')) {
                frame.contentDocument.documentElement.querySelector('#darkcss').textContent = '';
            }
        });
        return;
    }

    const callback = (mutationList) => {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName == "IFRAME") {
                const frame = mutation.addedNodes[0];
                const new_style_element = document.createElement("style");
                new_style_element.textContent = options.dark_css;
                new_style_element.id = "darkcss";
                frame.contentDocument.documentElement.prepend(new_style_element);
            }
        }
    };

    iframeObserver = new MutationObserver(callback);
    iframeObserver.observe(document.querySelector('html'), { childList: true, subtree: true });
}

/* 
Dashboard grades 
*/

function insertGrades() {
    if (options.dashboard_grades === true) {
        grades.then(data => {
            try {
                let cards = document.querySelectorAll('.ic-DashboardCard');
                if (cards.length === 0 || cards[0].querySelectorAll(".ic-DashboardCard__link").length === 0) return;
                for (let i = 0; i < cards.length; i++) {
                    let course_id = parseInt(cards[i].querySelector(".ic-DashboardCard__link").href.split("courses/")[1]);
                    data.forEach(grade => {
                        if (course_id === grade.id) {
                            let gradepercent = grade.enrollments[0].has_grading_periods === true ? grade.enrollments[0].current_period_computed_current_score : grade.enrollments[0].computed_current_score;
                            let percent = (gradepercent || "--") + "%";
                            let gradeContainer = cards[i].querySelector(".bettercanvas-card-grade") || makeElement("a", "bettercanvas-card-grade", cards[i].querySelector(".ic-DashboardCard__header"), percent);
                            if (options.grade_hover === true) {
                                gradeContainer.classList.add("bettercanvas-hover-only");
                            } else {
                                gradeContainer.classList.remove("bettercanvas-hover-only");
                            }
                            gradeContainer.setAttribute("href", `${domain}/courses/${course_id}/grades`);
                            gradeContainer.style.display = "block";
                        }
                    });

                }
            } catch (e) {
                logError(e);
            }
        });
    } else {
        document.querySelectorAll('.bettercanvas-card-grade').forEach(grade => {
            grade.style.display = "none";
        });
    }
}

/*
Card assignments
*/

function setAssignmentStatus(id, status, assignments_done = []) {
    if (assignments_done.length > 50) assignments_done = [];
    if (status === true) {
        assignments_done.push(id);
    } else {
        const pos = assignments_done.indexOf(id);
        if (pos > -1) assignments_done.splice(pos, 1);
    }
    chrome.storage.sync.set({ assignments_done: assignments_done });
}

function createCardAssignment(assignment) {
    let assignmentContainer = document.createElement("div");
    assignmentContainer.className = "bettercanvas-assignment-container";
    //let assignmentContainer = makeElement("div", "bettercanvas-assignment-container", location);
    let assignmentName = makeElement("a", "bettercanvas-assignment-link", assignmentContainer, assignment.plannable.title)
    let assignmentDueAt = makeElement("span", "bettercanvas-assignment-dueat", assignmentContainer, "");
    assignmentDueAt.setAttribute("data-asgmtid", assignment.plannable_id);
    if (assignment.overdue === true) assignmentDueAt.classList.add("bettercanvas-assignment-overdue");
    if (assignment?.submissions?.submitted === true) {
        assignmentContainer.classList.add("bettercanvas-completed");
    } else {
        options.assignments_done.forEach(function (done) {
            if (parseInt(done) === assignment.plannable_id) assignmentContainer.classList.add("bettercanvas-completed");
        });
    }
    assignmentDueAt.addEventListener('mouseup', function () {
        assignmentContainer.classList.toggle("bettercanvas-completed");
        const status = assignmentContainer.classList.contains("bettercanvas-completed");
        setAssignmentStatus(this.dataset.asgmtid, status, options.assignments_done);
    });
    assignmentName.setAttribute("href", assignment.html_url);
    return assignmentContainer;
}

let cardAssignments;

function preloadAssignmentEls() {
    return new Promise((resolve, reject) => {
        let assignmentEls = {};
        const now = new Date();
        assignments.then((data) => {
            data = combineAssignments(data);
            data.forEach(item => {
                let due = new Date(item.plannable_date);
                item.overdue = now >= due;
                let o = {
                    "submitted": item.submissions && item.submissions.submitted === true,
                    "override": item.planner_override && item.planner_override.marked_complete,
                    "type": item.plannable_type,
                    "due": due,
                    "el": createCardAssignment(item)
                }
                if (assignmentEls[item.course_id]) {
                    assignmentEls[item.course_id].push(o);
                } else {
                    assignmentEls[item.course_id] = [o];
                }
            });
            resolve(assignmentEls);
        });
    });
}

function loadCardAssignments() {
    if (options.assignments_due !== true) {
        document.querySelectorAll(".bettercanvas-card-assignment").forEach(card => {
            card.style.display = "none";
        });
        return;
    }
    cardAssignments.then(els => {
        try {
            let cards = document.querySelectorAll('.ic-DashboardCard');
            if (cards.length === 0) return;
            const now = new Date();

            cards.forEach(card => {
                let count = 0;
                let link = card.querySelector(".ic-DashboardCard__link");
                if (!link) return;
                let course_id = link.href.split("courses/")[1];
                let cardContainer = card.querySelector('.bettercanvas-card-container');
                cardContainer.textContent = "";
                cardContainer.parentElement.style.display = "block";

                if (els[course_id]) {
                    els[course_id].forEach(assignment => {
                        if (count >= options.num_assignments) return;
                        if (options.hide_completed === true && assignment.submitted === true) return;
                        if ((options.card_overdues !== true && now >= assignment.due) || (options.card_overdues === true && assignment.submitted === true)) return;
                        if (assignment.type !== "assignment" && assignment.type !== "quiz" && assignment.type !== "discussion_topic") return;
                        if (assignment.override === true) return;
                        assignment.el.querySelector(".bettercanvas-assignment-dueat").textContent = formatCardDue(assignment.due);
                        cardContainer.appendChild(assignment.el);
                        count++;
                    });
                }

                if (count === 0) {
                    let assignmentContainer = makeElement("div", "bettercanvas-assignment-container", cardContainer);
                    let assignmentDivLink = makeElement("a", "bettercanvas-assignment-link", assignmentContainer, "None");
                }
            });
        } catch (e) {
            logError(e);
        }
    });
}

function loadCardAssignments2(c = null) {
    if (options.assignments_due === true) {
        try {
            assignments.then(data => {
                //assignmentData = assignmentData === null ? data : assignmentData; ????
                let items = combineAssignments(data);
                let cards = c ? c : document.querySelectorAll('.ic-DashboardCard');
                const now = new Date();

                cards.forEach(card => {
                    let count = 0;
                    let course_id = parseInt(card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1]);
                    let cardContainer = card.querySelector('.bettercanvas-card-container');
                    cardContainer.textContent = "";
                    cardContainer.parentElement.style.display = "block";

                    items.forEach(assignment => {
                        let due = new Date(assignment.plannable_date);
                        // lots of checks to make
                        // 1. item belongs to card
                        // 2. haven't exceeded item limit
                        // 3. assignment hasn't been submitted (if hide completed option is on)
                        // 4. disallow overdue and item not past due/allow overdue and item hasn't been submitted
                        // 5. correct item type
                        // 6. no planner override marking item complete
                        if (course_id !== assignment.course_id) return;
                        if (count >= options.num_assignments) return;
                        if (options.hide_completed === true && assignment.submissions.submitted === true) return;
                        if ((options.card_overdues !== true && now >= due) || (options.card_overdues === true && assignment.submissions.submitted === true)) return;
                        if ((assignment.plannable_type !== "assignment" && assignment.plannable_type !== "quiz" && assignment.plannable_type !== "discussion_topic")) return;
                        if (assignment.planner_override && assignment.planner_override.marked_complete === true) return;

                        createCardAssignment(cardContainer, assignment, now >= due);
                        count++;
                    });

                    if (count === 0) {
                        let assignmentContainer = makeElement("div", "bettercanvas-assignment-container", cardContainer);
                        let assignmentDivLink = makeElement("a", "bettercanvas-assignment-link", assignmentContainer, "None");
                    }
                });
            });
        } catch (e) {
            logError(e);
        }
    } else {
        document.querySelectorAll(".bettercanvas-card-assignment").forEach(card => {
            card.style.display = "none";
        });
    }
}

function setupCardAssignments() {
    if (options.assignments_due !== true) return;
    try {
        if (document.querySelectorAll('.ic-DashboardCard').length > 0 && document.querySelectorAll('.bettercanvas-card-container').length > 0) return;
        let cards = document.querySelectorAll('.ic-DashboardCard');
        cards.forEach(card => {
            let assignmentContainer = card.querySelector(".bettercanvas-card-assignment") || makeElement("div", "bettercanvas-card-assignment", card);
            let assignmentsDueHeader = card.querySelector(".bettercanvas-card-header-container") || makeElement("div", "bettercanvas-card-header-container", assignmentContainer);
            let assignmentsDueLabel = card.querySelector(".bettercanvas-card-header") || makeElement("h3", "bettercanvas-card-header", assignmentsDueHeader, chrome.i18n.getMessage("due"))
            let cardContainer = card.querySelector(".bettercanvas-card-container") || makeElement("div", "bettercanvas-card-container", assignmentContainer);
            let skeletonText = card.querySelector(".bettercanvas-skeleton-text") || makeElement("div", "bettercanvas-skeleton-text", cardContainer);
        });
    } catch (e) {
        logError(e);
    }
}

/*
Card customization
*/

function customizeCards(c = null) {
    if (!options.custom_cards) return;
    try {
        let cards = c ? c : document.querySelectorAll('.ic-DashboardCard');
        if (cards.length && cards.length > 0 && cards[0].querySelectorAll(".ic-DashboardCard__link").length === 0) return;

        cards.forEach(card => {
            const id = card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1].replace("~", "0000000");
            let cardOptions = options["custom_cards"][id] || null;
            let cardOptions_2 = options["custom_cards_2"][id] || null;
            if (cardOptions) {
                // hide card
                card.style.display = cardOptions.hidden === true ? "none" : "inline-block";

                // card image
                if (cardOptions.img === "none") {
                    let currentImg = card.querySelector(".ic-DashboardCard__header_image");
                    if (currentImg) {
                        card.querySelector(".ic-DashboardCard__header_hero").style.opacity = 1;
                    }
                } else if (cardOptions.img !== "") {
                    let topColor = card.querySelector(".ic-DashboardCard__header_hero");
                    let container = card.querySelector(".ic-DashboardCard__header_image") || makeElement("div", "ic-DashboardCard__header_image", card);
                    card.querySelector(".ic-DashboardCard__header").prepend(container);
                    container.appendChild(topColor);
                    container.style.backgroundImage = "url(\"" + cardOptions.img + "\")";
                    topColor.style.opacity = .5;
                }

                // card name
                if (cardOptions.name !== "") {
                    card.querySelector(".ic-DashboardCard__header-title > span").textContent = cardOptions.name;
                }

                // card code
                if (cardOptions.code !== "") {
                    card.querySelector(".ic-DashboardCard__header-subtitle").textContent = cardOptions.code;
                }

                // card links
                let links = card.querySelectorAll(".ic-DashboardCard__action");
                for (let i = links.length; i < 4; i++) {
                    makeElement("a", "ic-DashboardCard__action", card.querySelector(".ic-DashboardCard__action-container"));
                }
                links = card.querySelectorAll(".ic-DashboardCard__action");
                for (let i = 0; i < 4; i++) {
                    let img = links[i].querySelector(".bettercanvas-link-image") || makeElement("img", "bettercanvas-link-image", links[i]);
                    links[i].style.display = "inherit";
                    if (cardOptions_2.links[i].path === "none") {
                        links[i].style.display = "none";
                    } else if (cardOptions_2.links[i].is_default === false) {
                        links[i].href = cardOptions_2.links[i].path;
                        img.src = getCustomLinkImage(cardOptions_2.links[i].path);
                        if (links[i].querySelector(".ic-DashboardCard__action-layout")) links[i].querySelector(".ic-DashboardCard__action-layout").style.display = "none";
                        img.style.display = "block";
                    } else {
                        if (links[i].querySelector(".ic-DashboardCard__action-layout")) links[i].querySelector(".ic-DashboardCard__action-layout").style.display = "inherit";
                        img.style.display = "none";
                    }
                    img.addEventListener("error", () => {
                        img.src = "https://www.instructure.com/favicon.ico";
                    })
                }

            }
        });

    } catch (e) {
        logError(e);
    }
}

function getCustomLinkImage(path) {
    if (path.includes("webassign.net")) {
        return "https://www.cengage.com/favicon.ico";
    } else if (path.includes("docs.google")) {
        return "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico";
    } else {
        let url = { "hostname": "instructure.com/" };
        try {
            url = new URL(path);
        } catch (e) {
            logError(e);
        }
        return "https://" + url.hostname + "/favicon.ico";;
    }
}

/*
GPA calculator
*/

function calculateGPA2() {
    let qualityPoints = 0, numCredits = 0, weightedQualityPoints = 0;
    document.querySelectorAll('.bettercanvas-gpa-course').forEach(course => {
        const weight = course.querySelector('.bettercanvas-course-weight').value;
        const credits = parseFloat(course.querySelector('.bettercanvas-course-credit').value);
        const grade = parseFloat(course.querySelector('.bettercanvas-course-percent').value);
        if (weight === "dnc" || !credits || !grade) return;
        let letter = "--";
        let gpa;
        if (grade >= options.gpa_calc_bounds["A+"].cutoff) {
            gpa = options.gpa_calc_bounds["A+"].gpa;
            letter = "A+";
        } else if (grade >= options.gpa_calc_bounds["A"].cutoff) {
            gpa = options.gpa_calc_bounds["A"].gpa;
            letter = "A";
        } else if (grade >= options.gpa_calc_bounds["A-"].cutoff) {
            gpa = options.gpa_calc_bounds["A-"].gpa;
            letter = "A-";
        } else if (grade >= options.gpa_calc_bounds["B+"].cutoff) {
            gpa = options.gpa_calc_bounds["B+"].gpa;
            letter = "B+";
        } else if (grade >= options.gpa_calc_bounds["B"].cutoff) {
            gpa = options.gpa_calc_bounds["B"].gpa;
            letter = "B";
        } else if (grade >= options.gpa_calc_bounds["B-"].cutoff) {
            gpa = options.gpa_calc_bounds["B-"].gpa;
            letter = "B-"
        } else if (grade >= options.gpa_calc_bounds["C+"].cutoff) {
            gpa = options.gpa_calc_bounds["C+"].gpa;
            letter = "C+";
        } else if (grade >= options.gpa_calc_bounds["C"].cutoff) {
            gpa = options.gpa_calc_bounds["C"].gpa;
            letter = "C";
        } else if (grade >= options.gpa_calc_bounds["C-"].cutoff) {
            gpa = options.gpa_calc_bounds["C-"].gpa;
            letter = "C-";
        } else if (grade >= options.gpa_calc_bounds["D+"].cutoff) {
            gpa = options.gpa_calc_bounds["D+"].gpa;
            letter = "D+";
        } else if (grade >= options.gpa_calc_bounds["D"].cutoff) {
            gpa = options.gpa_calc_bounds["D"].gpa;
            letter = "D";
        } else if (grade >= options.gpa_calc_bounds["D-"].cutoff) {
            gpa = options.gpa_calc_bounds["D-"].gpa;
            letter = "D-";
        } else {
            letter = "F";
            gpa = options.gpa_calc_bounds["F"].gpa;
        }

        let weightMultiplier;
        if (weight === "ap") {
            weightMultiplier = 1;
        } else if (weight === "honors") {
            weightMultiplier = .5;
        } else {
            weightMultiplier = 0;
        }
        qualityPoints += gpa * credits;
        weightedQualityPoints += (gpa + weightMultiplier) * credits;
        numCredits += credits;
        course.querySelector(".bettercanvas-gpa-letter-grade").textContent = letter;
    });
    document.querySelector("#bettercanvas-gpa-unweighted").textContent = (qualityPoints / numCredits).toFixed(2);
    document.querySelector("#bettercanvas-gpa-weighted").textContent = (weightedQualityPoints / numCredits).toFixed(2);
}

function changeGPASettings(course_id, update) {
    calculateGPA2();
    chrome.storage.sync.get(["custom_cards"], storage => {
        chrome.storage.sync.set({ "custom_cards": { ...storage["custom_cards"], [course_id]: { ...storage["custom_cards"][course_id], ...update } } });
    });
}

function createGPACalcCourse(location, course) {
    let customs = options.custom_cards && options.custom_cards[course.id] ? options.custom_cards[course.id] : { "name": course.name, "hidden": false, "weight": "regular", "credits": 1, "gr": null };
    if (customs.hidden === true) return;
    let courseContainer = makeElement("div", "bettercanvas-gpa-course", location);
    courseContainer.innerHTML = '<div class="bettercanvas-gpa-letter-grade"></div>';
    let courseName = makeElement("p", "bettercanvas-gpa-name", courseContainer);
    courseName.textContent = customs.name === "" ? course.course_code : customs.name;
    let changerContainer = makeElement("div", "bettercanvas-gpa-percent-container", courseContainer);
    let percent = makeElement("span", "bettercanvas-course-percent-sign", changerContainer, "%");
    let weightSelections = makeElement("form", "bettercanvas-course-weights", courseContainer);
    weightSelections.innerHTML = '<select name="weight-selection" class="bettercanvas-course-weight"><option value="dnc">Do not count</option><option value="regular">Regular/College</option><option value="honors">Honors</option><option value="ap">AP/IB</option></select>';
    let weightChanger = weightSelections.querySelector(".bettercanvas-course-weight");
    weightChanger.value = customs.weight;
    let credits = makeElement("div", "bettercanvas-course-credits", courseContainer);
    credits.innerHTML = '<input class="bettercanvas-course-credit" value="1"></input><span class="bettercanvas-course-percent-sign">cr</span>';
    let creditsChanger = credits.querySelector(".bettercanvas-course-credit");
    creditsChanger.value = customs.credits;
    let changer = makeElement("input", "bettercanvas-course-percent", changerContainer);
    let courseGrade = course.enrollments[0].has_grading_periods === true ? course.enrollments[0].current_period_computed_current_score : course.enrollments[0].computed_current_score;
    if (customs["gr"] !== null) {
        changer.value = customs["gr"];
    } else if (courseGrade) {
        changer.value = courseGrade;
    } else {
        changer.value = "--";
        weightChanger.value = "dnc";
    }
    let useCustomGr = makeElement("input", "bettercanvas-course-customgr", courseContainer);
    let useCustomGrLabel = makeElement("span", "bettercanvas-course-customgr-label", courseContainer, "Save custom grade");
    useCustomGr.type = "checkbox";
    useCustomGr.checked = customs.gr !== null ? true : false;
    useCustomGr.addEventListener("input", () => {
        if (options["custom_cards"][course.id]) {
            if (options["custom_cards"][course.id]["gr"] !== undefined && options["custom_cards"][course.id]["gr"] !== null) {
                changer.value = courseGrade;
                changeGPASettings(course.id, { "gr": null });
            } else {
                changeGPASettings(course.id, { "gr": changer.value });
            }
        }
    });

    changer.addEventListener('input', (e) => {
        if (options["custom_cards"][course.id]["gr"] !== undefined && options["custom_cards"][course.id]["gr"] !== null) {
            changeGPASettings(course.id, { "gr": e.target.value });
        } else {
            calculateGPA2();
        }
    });
    weightChanger.addEventListener('change', () => changeGPASettings(course.id, { "weight": weightSelections.querySelector(".bettercanvas-course-weight").value }));
    credits.querySelector(".bettercanvas-course-credit").addEventListener('input', () => changeGPASettings(course.id, { "credits": credits.querySelector(".bettercanvas-course-credit").value }));

    /*
    weightChanger.addEventListener('change', () => {
        calculateGPA2();
        chrome.storage.sync.get(["custom_cards"], storage => {
            chrome.storage.sync.set({ "custom_cards": { ...storage["custom_cards"], [course.id]: { ...storage["custom_cards"][course.id], "weight": weightSelections.querySelector(".bettercanvas-course-weight").value } } });
        });
    });

    credits.querySelector(".bettercanvas-course-credit").addEventListener('input', () => {
        calculateGPA2();
        chrome.storage.sync.get(["custom_cards"], storage => {
            chrome.storage.sync.set({ "custom_cards": { ...storage["custom_cards"], [course.id]: { ...storage["custom_cards"][course.id], "credits": credits.querySelector(".bettercanvas-course-credit").value } } });
        });
    });
    */
}

function setupGPACalc() {
    if (current_page !== "/" && current_page !== "") return;
    try {
        grades?.then(result => {

            if (!document.querySelector(".ic-DashboardCard__box__container")) return;

            let container2 = document.querySelector(".bettercanvas-gpa-card") || document.createElement("div");
            container2.className = "bettercanvas-gpa-card";
            container2.style.display = options.gpa_calc === true ? "inline-block" : "none";

            container2.innerHTML = '<h3 class="bettercanvas-gpa-header">GPA</h3><div><p id="bettercanvas-gpa-unweighted"></p><p>Unweighted</p><p id="bettercanvas-gpa-weighted"></p><p>Weighted</p></div>';
            let editBtn = makeElement("button", "bettercanvas-gpa-edit-btn", container2, "Edit Calculator");

            let container = document.querySelector(".bettercanvas-gpa") || document.createElement("div");
            container.className = "bettercanvas-gpa";
            container.innerHTML = '<h3 class="bettercanvas-gpa-header">GPA Calculator</h3><div class="bettercanvas-gpa-courses-container"><div class="bettercanvas-gpa-courses"></div></div>';

            if (options.gpa_calc_prepend === true) {
                document.querySelector(".ic-DashboardCard__box__container").prepend(container2);
                document.querySelector(".ic-DashboardCard__box__container").prepend(container);
            } else {
                document.querySelector(".ic-DashboardCard__box__container").appendChild(container2);
                document.querySelector(".ic-DashboardCard__box__container").appendChild(container);
            }

            let location = document.querySelector(".bettercanvas-gpa-courses");
            result.forEach(course => createGPACalcCourse(location, course));

            container.style.display = "none";

            editBtn.addEventListener("click", () => {
                if (container.style.display === "none") {
                    container.style.display = "inline-block";
                    editBtn.textContent = "Close Calculator";
                } else {
                    container.style.display = "none";
                    editBtn.textContent = "Edit Calculator";
                }
            });

            calculateGPA2();
        });
    } catch (e) {
        logError(e);
    }
}

/*
Dashboard notes
*/

let dashboardNotesTimer;
function delayDashboardNotesStorage(text) {
    clearTimeout(dashboardNotesTimer);
    dashboardNotesTimer = setTimeout(() => {
        chrome.storage.sync.set({ dashboard_notes_text: text });
    }, 1000);
}

function loadDashboardNotes() {
    if (options.dashboard_notes === true) {
        let notes = document.querySelector('.bettercanvas-dashboard-notes') || document.createElement("textarea");
        notes.classList.add("bettercanvas-dashboard-notes");
        notes.value = options.dashboard_notes_text;
        notes.placeholder = "Enter notes here";
        notes.style.display = "block";
        if (notes.parentElement === null) document.querySelector("#DashboardCard_Container").prepend(notes);
        notes.style.height = notes.scrollHeight + 5 + "px";
        notes.addEventListener('input', function () {
            delayDashboardNotesStorage(this.value);
            this.style.height = "1px";
            this.style.height = this.scrollHeight + 5 + "px";
        });
    } else {
        let notes = document.querySelector('.bettercanvas-dashboard-notes');
        if (notes) notes.style.display = "none";
    }
}

/*
Custom font
*/

function loadCustomFont() {
    let link = document.querySelector("#custom_font_link");
    let style = document.querySelector("#custom_font");

    let load = () => {
        if (options.custom_font.link !== "") {
            document.head.appendChild(style);
            link.href = `https://fonts.googleapis.com/css2?family=${options.custom_font.link}&display=swap`;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }

        style.textContent = options.custom_font.link === "" ? "" : `*, input, a, button, h1, h2, h3, h4, h5, h6, p, span {font-family: ${options.custom_font.family}!important}`;
    }

    let createEls = () => {
        link = document.createElement("link");
        link.id = "custom_font_link";
        style = document.createElement("style");
        style.id = "custom_font";
        load();
    }

    if (link && style) {
        load();
    } else if (options.custom_font.link !== "") {
        if (document.readyState !== 'loading') {
            createEls();
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                createEls();
            });
        }
    }
}

/*
Smaller features
*/

function removeSidebarLogo() {
    if (options.remlogo === null) return;
    if (options.remlogo === true) {
        let style = document.querySelector("#bettercanvas-remlogo") || document.createElement('style');
        style.id = "bettercanvas-remlogo";
        style.textContent = ".ic-app-header__logomark-container { display: none }";
        document.documentElement.prepend(style);
    } else {
        let style = document.querySelector("#bettercanvas-remlogo");
        if (style) style.textContent = "";
    }
}

function condenseCards() {
    if (options.condensed_cards === true) {
        let style = document.querySelector("#bettercanvas-condense-cards") || document.createElement('style');
        style.id = "bettercanvas-condense-cards";
        style.textContent = ".ic-DashboardCard__header_hero {height:60px!important}.ic-DashboardCard__header-subtitle, .ic-DashboardCard__header-term{display:none}";
        document.documentElement.prepend(style);
    } else {
        let style = document.querySelector("#bettercanvas-condense-cards");
        if (style) style.textContent = "";
    }
}

function changeOpacityCards() {
    if (options.disable_color_overlay === true) {
        let cardcss = document.querySelector("#bettercanvas-opacity") || document.createElement('style');
        cardcss.id = "bettercanvas-opacity";
        cardcss.textContent = ".ic-DashboardCard__header_hero{opacity: 0!important} .ic-DashboardCard__header-button-bg{opacity: 1!important;}";
        document.documentElement.appendChild(cardcss);
    } else {
        let cardcss = document.querySelector("#bettercanvas-opacity");
        if (cardcss) {
            cardcss.textContent = "";
        }
    }
}

function changeFullWidth() {
    if (options.full_width == null) return;
    if (options.full_width === true) {
        document.body.classList.add("full-width");
    } else {
        document.body.classList.remove("full-width");
    }
}

function changeGradientCards() {
    if (options.gradient_cards === true) {
        let cardheads = document.querySelectorAll('.ic-DashboardCard__header_hero');
        let cardcss = document.querySelector("#gradientcss") || document.createElement('style');
        cardcss.id = "gradientcss";
        cardcss.textContent = "";
        document.documentElement.appendChild(cardcss);

        for (let i = 0; i < cardheads.length; i++) {
            let colorone = cardheads[i].style.backgroundColor.split(',');
            let [r, g, b] = [parseInt(colorone[0].split('(')[1]), parseInt(colorone[1]), parseInt(colorone[2])];
            let [h, s, l] = [rgbToHsl(r, g, b)[0], rgbToHsl(r, g, b)[1], rgbToHsl(r, g, b)[2]];
            let degree = ((h % 60) / 60) >= .66 ? 30 : ((h % 60) / 60) <= .33 ? -30 : 15;
            let newh = h > 300 ? (360 - (h + 65)) + (65 + degree) : h + 65 + degree;
            cardcss.textContent += ".ic-DashboardCard:nth-of-type(" + (i + 1) + ") .ic-DashboardCard__header_hero{background: linear-gradient(115deg, hsl(" + h + "deg," + s + "%," + l + "%) 5%, hsl(" + newh + "deg," + s + "%," + l + "%) 100%)!important}";
        }

    } else {
        let cardcss = document.querySelector("#gradientcss");
        if (cardcss) cardcss.textContent = "";
    }
}

/*
Other functions 
*/

function combineAssignments(data) {
    let combined = data;
    try {
        options.custom_assignments_overflow.forEach(overflow => {
            combined = combined.concat(options[overflow]);
        });
    } catch (e) {
        logError(e);
    }
    return combined.sort((a, b) => new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime());
}

function cleanCustomAssignments() {
    chrome.storage.sync.get("custom_assignments_overflow", overflows => {
        chrome.storage.sync.get(overflows["custom_assignments_overflow"], storage => {
            const now = new Date();

            overflows["custom_assignments_overflow"].forEach(overflow => {
                let changed = false;
                for (let i = 0; i < storage[overflow].length; i++) {
                    let assignmentDate = new Date(storage[overflow][i].plannable_date);
                    if (!assignmentDate.getTime() || assignmentDate < now) {
                        storage[overflow].splice(i, 1);
                        changed = true;
                    }
                }
                if (changed) chrome.storage.sync.set({ [overflow]: storage[overflow] });
            });

        });
    });
}

function setupCustomURL() {
    //let test = getData(`${domain}/api/v1/dashboard/dashboard_cards?include[]=concluded&include[]=term`);
    let test = getData(`${domain}/api/v1/courses?enrollment_state=active&per_page=100`);
    test.then(res => {
        if (res.length) {
            getCards(res).then(() => {
                setTimeout(() => {
                    console.log("Better Canvas - setting custom domain to " + domain);
                    chrome.storage.sync.set({ custom_domain: [domain] }).then(location.reload());
                }, 100);
            });
        } else {
            console.log("Better Canvas - this url doesn't seem to be a canvas url (1)");
        }
    }).catch(err => {
        console.log("Better Canvas - this url doesn't seem to be a canvas url (2)");
    });
}

function getGrades() {
    if (options.gpa_calc === true || options.dashboard_grades === true) {
        grades = getData(`${domain}/api/v1/courses?enrollment_state=active&include[]=total_scores&include[]=current_grading_period_scores&per_page=100`);
    }
}


function getAssignments() {
    if (options.assignments_due === true || options.better_todo === true) {
        let weekAgo = new Date(new Date() - 604800000);
        //let weekAgo = new Date(new Date() - (604800000 * 10));
        assignments = getData(`${domain}/api/v1/planner/items?start_date=${weekAgo.toISOString()}&per_page=75`);
        cardAssignments = preloadAssignmentEls();
    }
}

function getApiData() {
    if (current_page === "/" || current_page === "") {
        getAssignments();
        getGrades();
    }
}

function makeElement(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}

async function getData(url) {
    let response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
    let data = await response.json();
    return data
}

function hexToHsl(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return rgbToHsl(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16));
}

function rgbToHex(rgb) {
    let pat = /^rgb\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/;
    let exec = pat.exec(rgb);
    return "#" + parseInt(exec[1]).toString(16).padStart(2, "0") + parseInt(exec[2]).toString(16).padStart(2, "0") + parseInt(exec[3]).toString(16).padStart(2, "0");
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max == min) {
        h = s = 0;
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0); break;
            case g:
                h = (b - r) / d + 2; break;
            case b:
                h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function getRelativeDate(date, short = false) {
    let now = new Date();
    let timeSince = (now.getTime() - date.getTime()) / 60000;
    let time = "min";
    timeSince = Math.abs(timeSince);
    if (timeSince >= 60) {
        timeSince /= 60;
        time = short ? "h" : "hour";
        if (timeSince >= 24) {
            timeSince /= 24;
            time = short ? "d" : "day";
            if (timeSince >= 7) {
                timeSince /= 7;
                time = short ? "w" : "week";
            }
        }
    }
    timeSince = Math.round(timeSince);
    let relative = timeSince + (short ? "" : " ") + time + (timeSince > 1 && !short ? "s" : "");
    return { time: relative, ms: now.getTime() - date.getTime() };
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatTodoDate(date, submissions, hr24) {
    let { time, ms } = getRelativeDate(date);
    let fromNow = ms < 0 ? "in " + time : time + " ago";
    let dueSoon = false;
    if (submissions && submissions.submitted === false && ms >= -21600000) {
        dueSoon = true;
    }
    return { "dueSoon": dueSoon, "date": months[date.getMonth()] + " " + date.getDate() + " at " + (date.getHours() - (hr24 ? "" : date.getHours() > 12 ? 12 : 0)) + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + (hr24 ? "" : date.getHours() >= 12 ? "pm" : "am") + " (" + fromNow + ")" };
}

function formatCardDue(date) {
    let due = new Date(date);
    if (options.relative_dues === true) {
        let relative = getRelativeDate(due, true);
        return relative.ms > 0 ? relative.time + " ago" : "in " + relative.time;
    }
    return options.assignment_date_format ? (due.getDate()) + "/" + (due.getMonth() + 1) : (due.getMonth() + 1) + "/" + (due.getDate());
}

function logError(e) {
    chrome.storage.local.get("errors", storage => {
        if (storage.errors.length > 20) {
            storage["errors"] = [];
        }
        chrome.storage.local.set({ "errors": storage["errors"].concat(e.stack) });

        console.log(e.stack);
        console.log(storage["errors"].concat(e.stack));
    })

}

const CSRFtoken = function () {
    return decodeURIComponent((document.cookie.match('(^|;) *_csrf_token=([^;]*)') || '')[2])
}