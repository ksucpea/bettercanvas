const domain = window.location.origin;
const current_page = window.location.pathname;
let assignments = null;
let grades = null;
let options = {};
let timeCheck = null;
let assignmentData = null;

isDomainCanvasPage();

function startExtension() {
    toggleDarkMode();
    const optionsList = [
        "assignments_due",
        "dashboard_grades",
        "gradient_cards",
        "coloroverlay_cards",
        "auto_dark",
        "auto_dark_start",
        "auto_dark_end",
        'num_assignments',
        'assignments_done',
        "gpa_calc",
        "assignment_date_format",
        "assignments_quizzes",
        "assignments_discussions",
        "dashboard_notes",
        "dashboard_notes_text",
        "improved_todo",
        "todo_hr24",
        "new_install",
        "condensed_cards",
        "custom_cards",
        "custom_assignments",
        "grade_hover",
        "hide_completed"
    ];
    try {
        chrome.storage.local.get(optionsList, result => {
            options = { ...options, ...result };
            toggleAutoDarkMode();
            getAssignmentData();
            checkDashboardReady();
        });
    } catch (e) {
        logError(e);
    }

    chrome.runtime.onMessage.addListener(function (request) {
        if (request.message === "getCards") {
            getCards();
        } else {
            chrome.storage.local.get(["dark_mode", "auto_dark", "dark_css", "auto_dark_start", "auto_dark_end", "custom_cards"], result => {
                options = { ...options, ...result };
                if (request.message === "darkmode") {
                    toggleDarkMode();
                }
                if (request.message === "autodarkmode") {
                    toggleAutoDarkMode();
                }
            })
        }
    });

    console.log("Better Canvas - running");
}

async function getCards(api = null) {
    let dashboard_cards = api ? api : await getData(`${domain}/api/v1/dashboard/dashboard_cards`);
    chrome.storage.local.get(["custom_cards"], storage => {
        let cards = storage["custom_cards"] || {};
        let newCards = false;
        try {
            dashboard_cards.forEach(card => {
                let id = card.id;
                if (!storage["custom_cards"] || !storage["custom_cards"][id]) {
                    newCards = true;
                    cards[id] = { "default": card.longName, "name": "", "img": "", "hidden": false, "weight": "regular", "credits": 1 };
                }
            });
        } finally {
            chrome.storage.local.set(newCards ? { "custom_cards": cards } : {}).then(chrome.runtime.sendMessage("getCardsComplete"));
        }
    });
}

let styleElementCreated = false;
function toggleDarkMode() {
    if (options.dark_mode && styleElementCreated === false) {
        let style = document.createElement('style');
        style.textContent = options.dark_css;
        document.documentElement.prepend(style);
        style.id = 'darkcss';
        styleElementCreated = true;
    } else if (styleElementCreated === true) {
        let css = document.getElementById("darkcss").childNodes[0];
        css.textContent = options.dark_mode ? options.dark_css : "";
    }
    iframeChecker(options.dark_mode);
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
    }, 600);
}

function checkDashboardReady() {
    if (current_page !== "/" && current_page !== "") return;
    const callback = (mutationList) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                if (mutation.target == document.querySelector("#DashboardCard_Container")) {
                    let cards = document.querySelectorAll('.ic-DashboardCard');
                    changeGradientCards(cards);
                    toggleColorOverlayOnCards(cards);
                    setupCardAssignments(cards);
                    setupBetterTodo();
                    customizeCards(cards);
                    insertGrades();
                    setupGPACalc();
                    insertNotes();
                    condenseCards();
                } else if (mutation.target == document.querySelector('#right-side')) {
                    resetTimer();
                    if (!mutation.target.querySelector(".bettercanvas-todosidebar")) {
                        setupBetterTodo();
                        setupCardAssignments();
                    }
                }
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(document.querySelector('html'), { childList: true, subtree: true });
}

/*
async function setupExport() {
    let btn = document.querySelector(".bettercanvas-export") || makeElement("a", "bettercanvas-export", document.querySelector(".Sidebar__TodoListContainer"), "Export Assignments to Google Calendar");
    btn.classList.add("btn");
    btn.addEventListener("click", () => {
        let upcoming = getData(`${domain}/api/v1/planner/items?start_date=${new Date().toISOString()}&per_page=75`);
        upcoming.then(data => {
            let ical = "BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\n";
            data.forEach(asgnmt => {
                let due = new Date(asgnmt.plannable_date);
                let year = due.getFullYear();
                let month = due.getMonth() + 1;
                month = (month < 10 ? "0" : "") + month;
                let day = due.getDate();
                day = (day < 10 ? "0" : "") + day;
                let end = new Date(due.getTime() + 86400000);
                let dayEnd = end.getDate();
                dayEnd = (dayEnd < 10 ? "0" : "") + dayEnd;
                let monthEnd = end.getMonth() + 1;
                monthEnd = (monthEnd < 10 ? "0" : "") + monthEnd;
                ical += `BEGIN:VEVENT\nDTSTART;VALUE=DATE:${year}${month}${day}\nDTEND;VALUE=DATE:${year}${monthEnd}${dayEnd}\nSTATUS:CONFIRMED\nSUMMARY:${asgnmt.plannable.title} for ${asgnmt.context_name}\nTRANSP:TRANSPARENT\nEND:VEVENT\n`;
            });
            ical += "END:VCALENDAR";
            let output = document.querySelector(".bettercanvas-export-output") || makeElement("div", "bettercanvas-export-output", document.body);
            output.style.display = "fixed";
            output.innerHTML = '<div class="bettercanvas-export-output-inner"><div style="display: flex;justify-content:space-between;align-items:center;margin:0 8px;"><p>Copy and paste this output into an .ical file to import into Google Calendar</p><button class="btn" id="bettercanvas-exit">Close</button></div><p class="bettercanvas-export-copy"></p></div>';
            output.querySelector(".bettercanvas-export-copy").textContent = ical;
            document.querySelector("#bettercanvas-exit").addEventListener("click", () => {
                output.style.display = "none";
            });
        });
    });
}
*/

function setupBetterTodo() {
    if (options.improved_todo !== true) return;
    if (document.querySelector('#bettercanvas-todo-list')) return;
    try {
        let list = document.querySelector("#right-side");
        if (list && list.childElementCount > 0 && list.children[0].id != "bettercanvas-todo-list") {
            let feedback = list.querySelector(".events_list.recent_feedback");
            if (feedback) list.before(feedback);
            list.textContent = "";
            list = makeElement("div", "bettercanvas-todosidebar", list);
            let todoHeader = makeElement("h2", "todo-list-header", list, "To Do");

            if (options.custom_cards && Object.keys(options.custom_cards).length > 0) {
                todoHeader.style = "display: flex; align-items:center; justify-content:space-between;";
                let addFillout = makeElement("div", "bettercanvas-add-assignment", list);
                let now = new Date();
                let year = now.getFullYear();
                let month = now.getMonth() + 1;
                month = month < 10 ? "0" + month : month;
                let day = now.getDate();
                day = day < 10 ? "0" + day : day;
                addFillout.innerHTML = '<input type="text" placeholder="Name" id="bettercanvas-custom-name" class="bettercanvas-custom-input"></input><select id="bettercanvas-custom-course" class="bettercanvas-custom-input"><option value="" disabled selected>Select course</option></select><div style="display: flex;gap:5px"><input type="date" id="bettercanvas-custom-date"  class="bettercanvas-custom-input"></input><input type="time" id="bettercanvas-custom-time"  class="bettercanvas-custom-input" value="23:59"></input></div>';
                addFillout.querySelector("#bettercanvas-custom-date").value = year + "-" + month + "-" + day;
                let selectCourse = document.querySelector("#bettercanvas-custom-course");
                Object.keys(options.custom_cards).forEach(id => {
                    let card = options.custom_cards[id];
                    let courseName = makeElement("option", "bettercanvas-select-course-option", selectCourse, card.default);
                    courseName.value = id;
                });
                let confirmButton = makeElement("button", "bettercanvas-custom-btn", addFillout, "Create");
                confirmButton.addEventListener("click", () => {
                    chrome.storage.local.get("custom_assignments", storage => {
                        let course_id = parseInt(addFillout.querySelector("#bettercanvas-custom-course").value);
                        let assignment = {
                            "plannable_id": storage.custom_assignments.length > 0 ? storage.custom_assignments[storage.custom_assignments.length - 1].plannable_id + 1 : 1,
                            "context_name": options.custom_cards[addFillout.querySelector("#bettercanvas-custom-course").value].default,
                            "plannable": { "title": addFillout.querySelector("#bettercanvas-custom-name").value },
                            "plannable_date": addFillout.querySelector("#bettercanvas-custom-date").value + "T" + addFillout.querySelector("#bettercanvas-custom-time").value + ":00",
                            "planner_override": { "marked_complete": false, "custom": true },
                            "plannable_type": "assignment",
                            "submissions": { "submitted": false },
                            "course_id": course_id,
                            "html_url": `/courses/${course_id}/assignments`
                        };
                        chrome.storage.local.set({ "custom_assignments": storage.custom_assignments.concat([assignment]) }).then(() => {
                            addFillout.classList.toggle("bettercanvas-custom-open");
                            loadBetterTodo();
                            loadCardAssignments();
                        });
                    });
                });
                let addButton = makeElement("button", "bettercanvas-custom-btn", todoHeader, "+ Add");
                addButton.addEventListener("click", () => {
                    addFillout.classList.toggle("bettercanvas-custom-open");
                });
            }

            let todoAssignments = document.createElement("ul");
            todoAssignments.id = "bettercanvas-todo-list";
            list.appendChild(todoAssignments);
            makeElement("h2", "todo-list-header", list, "Announcements");
            let todoAnnouncements = document.createElement("ul");
            todoAnnouncements.id = "bettercanvas-announcement-list";
            list.appendChild(todoAnnouncements);
            for (let i = 0; i < 5; i++) {
                let loader = '<div class="bettercanvas-todo-item-loader"><div style="width: 100px" class="bettercanvas-skeleton-text"></div><div style="width: 200px" class="bettercanvas-skeleton-text"></div><div class="bettercanvas-skeleton-text"></div></div>';
                todoAssignments.innerHTML += loader;
                todoAnnouncements.innerHTML += loader;
            }
            if (feedback) list.append(feedback);
        }

    } catch (e) {
        logError(e);
    }
}

function loadBetterTodo() {
    if (options.improved_todo !== true) return;
    try {
        const itemCount = 5;
        let todoAnnouncements = document.querySelector("#bettercanvas-announcement-list");
        let todoAssignments = document.querySelector("#bettercanvas-todo-list");
        const hr24 = options.todo_hr24;
        const now = new Date();
        const csrfToken = CSRFtoken();
        let assignmentsToInsert = [];
        let announcementsToInsert = [];

        assignments.then(data => {
            chrome.storage.local.get("custom_assignments", storage => {
                assignmentData = assignmentData === null ? data : assignmentData;
                let items = storage.custom_assignments ? storage.custom_assignments.concat(assignmentData).sort((a, b) => new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime()) : assignmentData;
                items.forEach(item => {
                    let date = new Date(item.plannable_date);
                    if ((item.plannable_type === "announcement") || ((item.plannable_type === "assignment" || item.plannable_type === "quiz" || item.plannable_type === "discussion_topic") && assignmentsToInsert.length < itemCount && date >= now)) {
                        if (!item.planner_override || item.planner_override.marked_complete === false) {
                            if (options.hide_completed === false || item.plannable_type === "announcement" || (options.hide_completed === true && item.submissions.submitted === false)) {
                                let listItemContainer = document.createElement("div");
                                listItemContainer.classList.add("bettercanvas-todo-container");
                                listItemContainer.innerHTML = '<div class="bettercanvas-todo-icon"></div><a class="bettercanvas-todo-item"></a><button class="bettercanvas-todo-complete-btn"><svg name="IconX" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk" style="width: 1em; height: 1em;"><g role="presentation"><path d="M797.319865 985.881673L344.771525 1438.43001 533.333333 1626.99182 985.881673 1174.44348 1438.43001 1626.99182 1626.99182 1438.43001 1174.44348 985.881673 1626.99182 533.333333 1438.43001 344.771525 985.881673 797.319865 533.333333 344.771525 344.771525 533.333333z" fill-rule="nonzero" stroke="none" stroke-width="1"></path></g></svg></button>';
                                listItemContainer.querySelector(".bettercanvas-todo-item").href = item.html_url;
                                listItemContainer.dataset.id = item.plannable_id;
                                switch (item.plannable_type) {
                                    case 'discussion_topic':
                                        listItemContainer.querySelector('.bettercanvas-todo-icon').innerHTML += '<svg name="IconDiscussion" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_dIzR cGqzL_owrh" ><g role="presentation"><path d="M677.647059,16 L677.647059,354.936471 L790.588235,354.936471 L790.588235,129.054118 L1807.05882,129.054118 L1807.05882,919.529412 L1581.06353,919.529412 L1581.06353,1179.29412 L1321.41176,919.529412 L1242.24,919.529412 L1242.24,467.877647 L677.647059,467.877647 L0,467.877647 L0,1484.34824 L338.710588,1484.34824 L338.710588,1903.24706 L756.705882,1484.34824 L1242.24,1484.34824 L1242.24,1032.47059 L1274.99294,1032.47059 L1694.11765,1451.59529 L1694.11765,1032.47059 L1920,1032.47059 L1920,16 L677.647059,16 Z M338.789647,919.563294 L903.495529,919.563294 L903.495529,806.622118 L338.789647,806.622118 L338.789647,919.563294 Z M338.789647,1145.44565 L677.726118,1145.44565 L677.726118,1032.39153 L338.789647,1032.39153 L338.789647,1145.44565 Z M112.941176,580.705882 L1129.41176,580.705882 L1129.41176,1371.40706 L710.4,1371.40706 L451.651765,1631.05882 L451.651765,1371.40706 L112.941176,1371.40706 L112.941176,580.705882 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
                                        break;
                                    case 'quiz':
                                        listItemContainer.querySelector('.bettercanvas-todo-icon').innerHTML += '<svg label="Quiz" name="IconQuiz" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_owrh ToDoSidebarItem__Icon" ><g role="presentation"><g fill-rule="evenodd" stroke="none" stroke-width="1"><path d="M746.255375,1466.76417 L826.739372,1547.47616 L577.99138,1796.11015 L497.507383,1715.51216 L746.255375,1466.76417 Z M580.35118,1300.92837 L660.949178,1381.52637 L329.323189,1713.15236 L248.725192,1632.55436 L580.35118,1300.92837 Z M414.503986,1135.20658 L495.101983,1215.80457 L80.5979973,1630.30856 L0,1549.71056 L414.503986,1135.20658 Z M1119.32036,264.600006 C1475.79835,-91.8779816 1844.58834,86.3040124 1848.35034,88.1280123 L1848.35034,88.1280123 L1865.45034,96.564012 L1873.88634,113.664011 C1875.71034,117.312011 2053.89233,486.101999 1697.30034,842.693987 L1697.30034,842.693987 L1550.69635,989.297982 L1548.07435,1655.17196 L1325.43235,1877.81395 L993.806366,1546.30196 L415.712386,968.207982 L84.0863971,636.467994 L306.72839,413.826001 L972.602367,411.318001 Z M1436.24035,1103.75398 L1074.40436,1465.70397 L1325.43235,1716.61796 L1434.30235,1607.74796 L1436.24035,1103.75398 Z M1779.26634,182.406009 C1710.18234,156.41401 1457.90035,87.1020124 1199.91836,345.198004 L1199.91836,345.198004 L576.90838,968.207982 L993.806366,1385.10597 L1616.70235,762.095989 C1873.65834,505.139998 1804.68834,250.920007 1779.26634,182.406009 Z M858.146371,525.773997 L354.152388,527.597997 L245.282392,636.467994 L496.310383,887.609985 L858.146371,525.773997 Z"></path><path d="M1534.98715,372.558003 C1483.91515,371.190003 1403.31715,385.326002 1321.69316,466.949999 L1281.22316,507.305998 L1454.61715,680.585992 L1494.97315,640.343994 C1577.16715,558.035996 1591.87315,479.033999 1589.82115,427.164001 L1587.65515,374.610003 L1534.98715,372.558003 Z"></path></g></g></svg>';
                                        break;
                                    case 'announcement':
                                        listItemContainer.querySelector('.bettercanvas-todo-icon').innerHTML += '<svg label="Announcement" name="IconAnnouncement" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_owrh ToDoSidebarItem__Icon"><g role="presentation"><path d="M1587.16235,31.2784941 C1598.68235,7.78672942 1624.43294,-4.41091764 1650.63529,1.46202354 C1676.16,7.56084707 1694.11765,30.2620235 1694.11765,56.4643765 L1694.11765,56.4643765 L1694.11765,570.459671 C1822.87059,596.662024 1920,710.732612 1920,847.052612 C1920,983.372612 1822.87059,1097.55614 1694.11765,1123.75849 L1694.11765,1123.75849 L1694.11765,1637.64085 C1694.11765,1663.8432 1676.16,1686.65732 1650.63529,1692.6432 C1646.23059,1693.65967 1641.93882,1694.11144 1637.64706,1694.11144 C1616.52706,1694.11144 1596.87529,1682.36555 1587.16235,1662.93967 C1379.23765,1247.2032 964.178824,1242.34673 960,1242.34673 L960,1242.34673 L564.705882,1242.34673 L564.705882,1807.05261 L652.461176,1807.05261 C640.602353,1716.92555 634.955294,1560.05026 715.934118,1456.37026 C768.338824,1389.2832 845.590588,1355.28791 945.882353,1355.28791 L945.882353,1355.28791 L945.882353,1468.22908 C881.392941,1468.22908 835.312941,1487.09026 805.044706,1525.71614 C736.263529,1613.58438 759.981176,1789.54673 774.776471,1849.97026 C778.955294,1866.79849 775.115294,1884.6432 764.498824,1898.30908 C753.769412,1911.97496 737.28,1919.99379 720,1919.99379 L720,1919.99379 L508.235294,1919.99379 C477.063529,1919.99379 451.764706,1894.80791 451.764706,1863.5232 L451.764706,1863.5232 L451.764706,1242.34673 L395.294118,1242.34673 C239.548235,1242.34673 112.941176,1115.73967 112.941176,959.993788 L112.941176,959.993788 L112.941176,903.5232 L56.4705882,903.5232 C25.2988235,903.5232 0,878.337318 0,847.052612 C0,815.880847 25.2988235,790.582024 56.4705882,790.582024 L56.4705882,790.582024 L112.941176,790.582024 L112.941176,734.111435 C112.941176,578.478494 239.548235,451.758494 395.294118,451.758494 L395.294118,451.758494 L959.887059,451.758494 C976.828235,451.645553 1380.36706,444.756141 1587.16235,31.2784941 Z M1581.17647,249.706729 C1386.46588,492.078494 1128.96,547.871435 1016.47059,560.746729 L1016.47059,560.746729 L1016.47059,1133.47144 C1128.96,1146.34673 1386.46588,1202.02673 1581.17647,1444.51144 L1581.17647,1444.51144 Z M903.529412,564.699671 L395.294118,564.699671 C301.891765,564.699671 225.882353,640.709082 225.882353,734.111435 L225.882353,734.111435 L225.882353,959.993788 C225.882353,1053.39614 301.891765,1129.40555 395.294118,1129.40555 L395.294118,1129.40555 L903.529412,1129.40555 L903.529412,564.699671 Z M1694.11765,688.144376 L1694.11765,1006.07379 C1759.73647,982.694965 1807.05882,920.577318 1807.05882,847.052612 C1807.05882,773.527906 1759.73647,711.5232 1694.11765,688.144376 L1694.11765,688.144376 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
                                        break;
                                    default:
                                        listItemContainer.querySelector('.bettercanvas-todo-icon').innerHTML += '<svg label="Assignment" name="IconAssignment" viewBox="0 0 1920 1920" rotate="0" aria-hidden="true" role="presentation" focusable="false" class="dUOHu_bGBk dUOHu_drOs dUOHu_eXrk cGqzL_bGBk cGqzL_owrh ToDoSidebarItem__Icon"><g role="presentation"><path d="M1468.2137,0 L1468.2137,564.697578 L1355.27419,564.697578 L1355.27419,112.939516 L112.939516,112.939516 L112.939516,1807.03225 L1355.27419,1807.03225 L1355.27419,1581.15322 L1468.2137,1581.15322 L1468.2137,1919.97177 L2.5243549e-29,1919.97177 L2.5243549e-29,0 L1468.2137,0 Z M1597.64239,581.310981 C1619.77853,559.174836 1655.46742,559.174836 1677.60356,581.310981 L1677.60356,581.310981 L1903.4826,807.190012 C1925.5058,829.213217 1925.5058,864.902104 1903.4826,887.038249 L1903.4826,887.038249 L1225.8455,1564.67534 C1215.22919,1575.17872 1200.88587,1581.16451 1185.86491,1581.16451 L1185.86491,1581.16451 L959.985883,1581.16451 C928.814576,1581.16451 903.516125,1555.86606 903.516125,1524.69475 L903.516125,1524.69475 L903.516125,1298.81572 C903.516125,1283.79477 909.501919,1269.45145 920.005294,1258.94807 L920.005294,1258.94807 Z M1442.35055,896.29929 L1016.45564,1322.1942 L1016.45564,1468.225 L1162.48643,1468.225 L1588.38135,1042.33008 L1442.35055,896.29929 Z M677.637094,1242.34597 L677.637094,1355.28548 L338.818547,1355.28548 L338.818547,1242.34597 L677.637094,1242.34597 Z M903.516125,1016.46693 L903.516125,1129.40645 L338.818547,1129.40645 L338.818547,1016.46693 L903.516125,1016.46693 Z M1637.62298,701.026867 L1522.19879,816.451052 L1668.22958,962.481846 L1783.65377,847.057661 L1637.62298,701.026867 Z M1129.39516,338.829841 L1129.39516,790.587903 L338.818547,790.587903 L338.818547,338.829841 L1129.39516,338.829841 Z M1016.45564,451.769356 L451.758062,451.769356 L451.758062,677.648388 L1016.45564,677.648388 L1016.45564,451.769356 Z" fill-rule="evenodd" stroke="none" stroke-width="1"></path></g></svg>';
                                }
                                let listItem = listItemContainer.querySelector(".bettercanvas-todo-item");
                                makeElement("a", "bettercanvas-todoitem-title", listItem, item.plannable.title);
                                makeElement("p", "bettercanvas-todoitem-course", listItem, item.context_name);
                                let format = formatDate(date, item.submissions, hr24);
                                let todoDate = makeElement("p", "bettercanvas-todoitem-date", listItem, format.date);
                                if (format.dueSoon) todoDate.style.color = "#ff224b";

                                listItemContainer.querySelector(".bettercanvas-todo-complete-btn").addEventListener('click', function () {
                                    if (item.planner_override && item.planner_override.custom && item.planner_override.custom === true) {
                                        chrome.storage.local.get("custom_assignments", storage => {
                                            for (let i = 0; i < storage.custom_assignments.length; i++) {
                                                if (storage.custom_assignments[i].plannable_id === item.plannable_id) {
                                                    storage.custom_assignments.splice(i, 1);
                                                    chrome.storage.local.set({ "custom_assignments": storage.custom_assignments }).then(() => {
                                                        let container = listItemContainer.parentElement;
                                                        container.removeChild(listItemContainer);
                                                        loadBetterTodo();
                                                        loadCardAssignments();
                                                    });
                                                    break;
                                                }
                                            }
                                        });
                                    } else {
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
                            }
                        }
                    }

                });

                todoAssignments.textContent = "";
                if (assignmentsToInsert.length > 0) {
                    for (let i = 0; i < itemCount; i++) {
                        todoAssignments.append(assignmentsToInsert[i]);
                    }
                } else {
                    makeElement("p", "bettercanvas-none-due", todoAssignments, "None");
                }

                todoAnnouncements.textContent = "";
                if (announcementsToInsert.length > 0) {
                    for (let i = announcementsToInsert.length - 1; i >= (announcementsToInsert.length - itemCount < 0 ? 0 : announcementsToInsert.length - itemCount); i--) {
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

function getAssignmentData() {
    if (current_page === "/" || current_page === "") {
        if (options.assignments_due === true || options.improved_todo === true) {
            let weekAgo = new Date(new Date() - (604800000));
            assignments = getData(`${domain}/api/v1/planner/items?start_date=${weekAgo.toISOString()}&per_page=75`);
        }
        if (options.gpa_calc === true || options.dashboard_grades === true) {
            grades = getData(`${domain}/api/v1/courses?enrollment_state=active&include[]=total_scores&include[]=current_grading_period_scores&per_page=30`);
        }
    }
}

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
        chrome.storage.local.set({ "dark_mode": status }, toggleDarkMode);
    }
}

function toggleAutoDarkMode() {
    clearInterval(timeCheck);
    if (options.auto_dark === true) {
        autoDarkModeCheck();
        timeCheck = setInterval(autoDarkModeCheck, 60000);
    }
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

function insertGrades() {
    if (options.dashboard_grades !== true) return;
    grades.then(data => {
        try {
            let cards = document.querySelectorAll('.ic-DashboardCard');
            if (cards.length === 0 || cards[0].querySelectorAll(".ic-DashboardCard__link").length === 0 || document.querySelectorAll('.bettercanvas-card-grade').length > 0) return;
            for (let i = 0; i < cards.length; i++) {
                let course_id = parseInt(cards[i].querySelector(".ic-DashboardCard__link").href.split("courses/")[1]);
                data.forEach(grade => {
                    if (course_id === grade.id) {
                        let gradepercent = grade.enrollments[0].has_grading_periods === true ? grade.enrollments[0].current_period_computed_current_score : grade.enrollments[0].computed_current_score;
                        let percent = (gradepercent || "--") + "%";
                        let gradeContainer = makeElement("a", "bettercanvas-card-grade", cards[i].querySelector(".ic-DashboardCard__header"), percent);
                        if (options.grade_hover === true) gradeContainer.classList.add("bettercanvas-hover-only");
                        gradeContainer.setAttribute("href", `${domain}/courses/${course_id}/grades`);
                    }
                });

            }
        } catch (e) {
            logError(e);
        }
    });
}

function setAssignmentStatus(id, status, assignments_done = []) {
    if (assignments_done.length > 50) assignments_done = [];
    if (status === true) {
        assignments_done.push(id);
    } else {
        const pos = assignments_done.indexOf(id);
        if (pos > -1) assignments_done.splice(pos, 1);
    }
    chrome.storage.local.set({ assignments_done: assignments_done });
}

function loadCardAssignments(c = null) {
    try {
        assignments.then(data => {
            chrome.storage.local.get("custom_assignments", storage => {
                assignmentData = assignmentData === null ? data : assignmentData;
                let items = storage.custom_assignments ? storage.custom_assignments.concat(assignmentData).sort((a, b) => new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime()) : assignmentData;
                let cards = c ? c : document.querySelectorAll('.ic-DashboardCard');
                const now = new Date();
                cards.forEach(card => {
                    let count = 0;
                    let course_id = parseInt(card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1]);
                    let cardContainer = card.querySelector('.bettercanvas-card-container');
                    cardContainer.textContent = "";
                    items.forEach(assignment => {
                        if (course_id !== assignment.course_id || count >= options.num_assignments || now > new Date(assignment.plannable_date) || (assignment.submissions.submitted === true && options.hide_completed === true)) return;
                        if (assignment.plannable_type === "assignment" || assignment.plannable_type === "quiz" || assignment.plannable_type === "discussion_topic") {
                            let assignmentContainer = makeElement("div", "bettercanvas-assignment-container", cardContainer);
                            let assignmentName = makeElement("a", "bettercanvas-assignment-link", assignmentContainer, assignment.plannable.title)
                            let assignmentDueAt = makeElement("span", "bettercanvas-assignment-dueat", assignmentContainer, cleanDue(assignment.plannable_date));
                            assignmentDueAt.setAttribute("data-asgmtid", assignment.plannable_id);
                            if (assignment.submissions.submitted === true) {
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
                            count++;
                        }
                    });
                    if (count === 0) {
                        let assignmentContainer = makeElement("div", "bettercanvas-assignment-container", cardContainer);
                        let assignmentDivLink = makeElement("a", "bettercanvas-assignment-link", assignmentContainer, "None");
                    }
                });
            });
        });
    } catch (e) {
        logError(e);
    }
}

function setupCardAssignments(c = null) {
    if (options.assignments_due !== true) return;
    try {
        if (document.querySelectorAll('.ic-DashboardCard').length > 0 && document.querySelectorAll('.bettercanvas-card-container').length > 0) return;
        let cards = c ? c : document.querySelectorAll('.ic-DashboardCard');
        cards.forEach(card => {
            let assignmentsDueHeader = makeElement("div", "bettercanvas-card-header-container", card);
            let assignmentsDueLabel = makeElement("h3", "bettercanvas-card-header", assignmentsDueHeader, 'Due')
            let cardContainer = makeElement("div", "bettercanvas-card-container", card);
            let skeletonText = makeElement("div", "bettercanvas-skeleton-text", cardContainer);
        });
    } catch (e) {
        logError(e);
    }
}

function customizeCards(c = null) {
    if (!options.custom_cards) return;
    try {
        let cards = c ? c : document.querySelectorAll('.ic-DashboardCard');
        if (cards[0].querySelectorAll(".ic-DashboardCard__link").length === 0) return;
        cards.forEach(card => {
            let cardOptions = options["custom_cards"][card.querySelector(".ic-DashboardCard__link").href.split("courses/")[1]];
            if (cardOptions) {
                if (cardOptions.hidden === true) {
                    card.style.display = "none";
                }
                if (cardOptions.img === "none") {
                    let currentImg = card.querySelector(".ic-DashboardCard__header_image");
                    if (currentImg) {
                        card.querySelector(".ic-DashboardCard__header_hero").style.opacity = 1;
                    }
                } else if (cardOptions.img !== "") {
                    let topColor = card.querySelector(".ic-DashboardCard__header_hero");
                    let container = card.querySelector(".ic-DashboardCard__header_image") || document.createElement("div");
                    container.classList.add("ic-DashboardCard__header_image");
                    card.querySelector(".ic-DashboardCard__header").prepend(container);
                    container.appendChild(topColor);
                    container.style.backgroundImage = "url(" + cardOptions.img + ")";
                    topColor.style.opacity = .5;
                }
                if (cardOptions.name !== "") {
                    card.querySelector(".ic-DashboardCard__header-title > span").textContent = cardOptions.name;
                }
            }
        });
    } catch (e) {
        logError(e);
    }
}

function insertNotes() {
    if (options.dashboard_notes !== true || document.querySelectorAll('.bettercanvas-dashboard-notes').length > 0) return;
    let notes = document.createElement("textarea");
    notes.classList.add("bettercanvas-dashboard-notes");
    notes.value = options.dashboard_notes_text;
    notes.placeholder = "Enter notes here";
    document.querySelector("#DashboardCard_Container").prepend(notes);
    notes.style.height = notes.scrollHeight + 5 + "px";
    notes.addEventListener('input', function () {
        chrome.storage.local.set({ dashboard_notes_text: this.value });
        this.style.height = "1px";
        this.style.height = this.scrollHeight + 5 + "px";
    });
}

function cleanCustomAssignments() {
    chrome.storage.local.get("custom_assignments", storage => {
        const now = new Date();
        for (let i = 0; i < storage.custom_assignments.length; i++) {
            let assignmentDate = new Date(storage.custom_assignments[i].plannable_date);
            if (!assignmentDate.getTime() || assignmentDate < now) {
                storage.custom_assignments.splice(i, 1);
            }
        }
        chrome.storage.local.set({ "custom_assignments": storage.custom_assignments });
    });
}

function isDomainCanvasPage() {
    chrome.storage.local.get(['custom_domain', 'dark_css', 'dark_mode'], result => {
        options = result;
        if (result.custom_domain && result.custom_domain != [""] && result.custom_domain != '') {
            try {
                result.custom_domain.forEach(e => {
                    if (domain.includes(e)) {
                        startExtension();
                        return;
                    }
                })
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

function setupCustomURL() {
    let test = getData(`${domain}/api/v1/dashboard/dashboard_cards`);
    test.then(res => {
        if (res.length) {
            getCards(res);
            console.log("Better Canvas - setting custom domain to " + domain);
            chrome.storage.local.set({ custom_domain: [domain] }).then(location.reload());
        } else {
            console.log("Better Canvas - this url doesn't seem to be a canvas url (1)");
        }
    }).catch(err => {
        console.log("Better Canvas - this url doesn't seem to be a canvas url (2)");
    });
}

function changeGradientCards() {
    if (options.gradient_cards === false) return;
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
}

function toggleColorOverlayOnCards() {
    if (options.coloroverlay_cards === false) return;
    let cardimg = document.querySelectorAll('.ic-DashboardCard__header_hero');
    let cardcss = document.querySelector("#opacitycss") || document.createElement('style');
    cardcss.id = "opacitycss";
    cardcss.textContent = "";
    document.documentElement.appendChild(cardcss);

    for (let i = 0; i < cardimg.length; i++) {
        cardcss.textContent += ".ic-DashboardCard:nth-of-type(" + (i + 1) + ") .ic-DashboardCard__header_hero{opacity: 0 !important}";
        cardcss.textContent += ".ic-DashboardCard:nth-of-type(" + (i + 1) + ") .ic-DashboardCard__header-button-bg{opacity: 1 !important}";
    }
}

function calculateGPA2() {
    let qualityPoints = 0, numCredits = 0, weightedQualityPoints = 0;
    document.querySelectorAll('.bettercanvas-gpa-course').forEach(course => {
        const weight = course.querySelector('.bettercanvas-course-weight').value;
        const credits = parseFloat(course.querySelector('.bettercanvas-course-credit').value);
        let letter = "--";
        if (weight !== "dnc" && credits) {
            const grade = parseFloat(course.querySelector('.bettercanvas-course-percent').value);
            let gpa;
            if (grade >= 97) {
                gpa = 4.3;
                letter = "A+";
            } else if (grade >= 93) {
                gpa = 4.0;
                letter = "A";
            } else if (grade >= 90) {
                gpa = 3.7;
                letter = "A-";
            } else if (grade >= 87) {
                gpa = 3.4;
                letter = "B+";
            } else if (grade >= 83) {
                gpa = 3.0;
                letter = "B";
            } else if (grade >= 80) {
                gpa = 2.7;
                letter = "B-"
            } else if (grade >= 77) {
                gpa = 2.3;
                letter = "C+";
            } else if (grade >= 73) {
                gpa = 2;
                letter = "C";
            } else if (grade >= 70) {
                gpa = 1.7;
                letter = "C-";
            } else if (grade >= 68) {
                gpa = 1.3;
                letter = "D+";
            } else if (grade >= 63) {
                gpa = 1;
                letter = "D";
            } else if (grade >= 60) {
                gpa = .7;
                letter = "D-";
            } else {
                letter = "F";
                gpa = 0;
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
        }
        course.querySelector(".bettercanvas-gpa-letter-grade").textContent = letter;
    });
    document.querySelector("#bettercanvas-gpa-unweighted").textContent = (qualityPoints / numCredits).toFixed(2);
    document.querySelector("#bettercanvas-gpa-weighted").textContent = (weightedQualityPoints / numCredits).toFixed(2);
}

function setupGPACalc() {
    if (options.gpa_calc !== true && (current_page !== "/" || current_page !== "") || document.querySelector(".bettercanvas-gpa")) return;
    try {
        let container = makeElement("div", "bettercanvas-gpa", document.querySelector(".ic-DashboardCard__box__container"));
        container.innerHTML = '<h3 class="bettercanvas-gpa-header">GPA Calculator</h3><div class="bettercanvas-gpa-courses-container"><div class="bettercanvas-gpa-courses"></div><div class="bettercanvas-gpa-output"><p>Unweighted: <span id="bettercanvas-gpa-unweighted"></span></p><p>Weighted: <span id="bettercanvas-gpa-weighted"></span></p></div></div>';
        grades.then(result => {
            result.forEach(course => {
                let customs = options.custom_cards[course.id];
                if (customs) {
                    if (customs.hidden != true) {
                        let courseContainer = makeElement("div", "bettercanvas-gpa-course", document.querySelector(".bettercanvas-gpa-courses"));
                        courseContainer.innerHTML = '<div class="bettercanvas-gpa-course-left"></div><div class="bettercanvas-gpa-course-right"></div><div class="bettercanvas-gpa-letter-grade"></div>';
                        let courseName = makeElement("p", "bettercanvas-gpa-name", courseContainer);
                        courseName.textContent = customs.name === "" ? course.course_code : customs.name;
                        let changerContainer = makeElement("div", "bettercanvas-gpa-percent-container", courseContainer);
                        let changer = makeElement("input", "bettercanvas-course-percent", changerContainer);
                        let courseGrade = course.enrollments[0].has_grading_periods === true ? course.enrollments[0].current_period_computed_current_score : course.enrollments[0].computed_current_score;
                        changer.value = courseGrade ? courseGrade : "";
                        let percent = makeElement("span", "bettercanvas-course-percent-sign", changerContainer, "%");

                        let weightSelections = makeElement("form", "bettercanvas-course-weights", courseContainer);
                        weightSelections.innerHTML = '<select name="weight-selection" class="bettercanvas-course-weight"><option value="dnc">Do not count</option><option value="regular">Regular/College</option><option value="honors">Honors</option><option value="ap">AP/IB</option></select>';
                        weightChanger = weightSelections.querySelector(".bettercanvas-course-weight");
                        weightChanger.value = customs.weight;

                        let credits = makeElement("div", "bettercanvas-course-credits", courseContainer);
                        credits.innerHTML = '<input class="bettercanvas-course-credit" value="1"></input><span class="bettercanvas-course-percent-sign">cr</span>';
                        let creditsChanger = credits.querySelector(".bettercanvas-course-credit");
                        creditsChanger.value = customs.credits;

                        changer.addEventListener('input', calculateGPA2);
                        weightChanger.addEventListener('change', () => {
                            calculateGPA2();
                            chrome.storage.local.get(["custom_cards"], storage => {
                                chrome.storage.local.set({ "custom_cards": { ...storage["custom_cards"], [course.id]: { ...storage["custom_cards"][course.id], "weight": weightSelections.querySelector(".bettercanvas-course-weight").value } } });
                            });
                        });
                        credits.querySelector(".bettercanvas-course-credit").addEventListener('input', () => {
                            calculateGPA2();
                            chrome.storage.local.get(["custom_cards"], storage => {
                                chrome.storage.local.set({ "custom_cards": { ...storage["custom_cards"], [course.id]: { ...storage["custom_cards"][course.id], "credits": credits.querySelector(".bettercanvas-course-credit").value } } });
                            });
                        });
                    }
                } else { // for users who don't have custom_cards yet 
                    let courseContainer = makeElement("div", "bettercanvas-gpa-course", document.querySelector(".bettercanvas-gpa-courses"));
                    courseContainer.innerHTML = '<div class="bettercanvas-gpa-course-left"></div><div class="bettercanvas-gpa-course-right"></div><div class="bettercanvas-gpa-letter-grade"></div>';
                    let courseName = makeElement("p", "bettercanvas-gpa-name", courseContainer);
                    courseName.textContent = course.course_code;
                    let changerContainer = makeElement("div", "bettercanvas-gpa-percent-container", courseContainer);
                    let changer = makeElement("input", "bettercanvas-course-percent", changerContainer);
                    let courseGrade = course.enrollments[0].has_grading_periods === true ? course.enrollments[0].current_period_computed_current_score : course.enrollments[0].computed_current_score;
                    changer.value = courseGrade ? courseGrade : "";
                    let percent = makeElement("span", "bettercanvas-course-percent-sign", changerContainer, "%");

                    let weightSelections = makeElement("form", "bettercanvas-course-weights", courseContainer);
                    weightSelections.innerHTML = '<select name="weight-selection" class="bettercanvas-course-weight"><option value="dnc">Do not count</option><option value="regular">Regular/College</option><option value="honors">Honors</option><option value="ap">AP/IB</option></select>';
                    weightChanger = weightSelections.querySelector(".bettercanvas-course-weight");
                    weightChanger.value = courseGrade ? "regular" : "dnc";

                    let credits = makeElement("div", "bettercanvas-course-credits", courseContainer);
                    credits.innerHTML = '<input class="bettercanvas-course-credit" value="1"></input><span class="bettercanvas-course-percent-sign">cr</span>';
                    let creditsChanger = credits.querySelector(".bettercanvas-course-credit");
                    creditsChanger.value = 1;

                    changer.addEventListener('input', calculateGPA2);
                    weightChanger.addEventListener('change', () => {
                        calculateGPA2();
                    });
                    credits.querySelector(".bettercanvas-course-credit").addEventListener('input', () => {
                        calculateGPA2();
                    });
                }
            });
            calculateGPA2();
        });
    } catch (e) {
        logError(e);
    }
}

function condenseCards() {
    if (options.condensed_cards !== true || document.querySelector("#bettercanvas-condense-cards")) return;
    let style = document.createElement('style');
    style.id = "bettercanvas-condense-cards";
    style.textContent = ".ic-DashboardCard__header_hero {height:60px!important}.ic-DashboardCard__header-subtitle, .ic-DashboardCard__header-term{display:none}";
    document.documentElement.prepend(style);
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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatDate(date, submissions, hr24) {
    let timeSince = (new Date().getTime() - date.getTime()) / 60000;
    let time = "min";
    let future = timeSince < 0;
    timeSince = Math.abs(timeSince);
    if (timeSince >= 60) {
        timeSince /= 60;
        time = "hr";
        if (timeSince >= 24) {
            timeSince /= 24;
            time = "day";
            if (timeSince >= 7) {
                timeSince /= 7;
                time = "week";
            }
        }
    }
    timeSince = Math.round(timeSince);
    let fromNow = timeSince + " " + time + (timeSince > 1 ? "s" : "");
    fromNow = future ? "in " + fromNow : fromNow + " ago";
    let dueSoon = false;
    if (future && submissions && submissions.submitted === false && (time === "hr" && timeSince <= 6 || time === "min")) {
        dueSoon = true;
    }
    return { "dueSoon": dueSoon, "date": months[date.getMonth()] + " " + date.getDate() + " at " + (date.getHours() - (hr24 ? "" : date.getHours() > 12 ? 12 : 0)) + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + (hr24 ? "" : date.getHours() >= 12 ? "pm" : "am") + " (" + fromNow + ")" };
}

const CSRFtoken = function () {
    return decodeURIComponent((document.cookie.match('(^|;) *_csrf_token=([^;]*)') || '')[2])
}

function cleanDue(date) {
    let newdate = new Date(date);
    return options.assignment_date_format ? (newdate.getDate()) + "/" + (newdate.getMonth() + 1) : (newdate.getMonth() + 1) + "/" + (newdate.getDate());
}

function logError(e) {
    chrome.storage.local.get(null, storage => {
        if (!storage.custom_domain || storage.custom_domain.includes("logerrors")) {
            console.error("Better Canvas - Error \n", e, storage);
        }
    });
}