/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./js/api.js
const api_domain = window.location.origin;
const api_current_page = window.location.pathname;
let api_assignments = null;
let api_grades = null;
let announcements = (/* unused pure expression or super */ null && ([]));
let api_options = {};
let timeCheck = null;
let api_cardAssignments;


;// ./js/features/cardassignments.js




function cardassignments_createCardAssignment(assignment) {
    let assignmentContainer = document.createElement("div");
    assignmentContainer.className = "bettercanvas-assignment-container";
    let assignmentName = makeElement("a", assignmentContainer, { "className": "bettercanvas-assignment-link", "textContent": assignment.plannable.title, "href": assignment.html_url });
    let assignmentDueAt = makeElement("span", assignmentContainer, { "className": "bettercanvas-assignment-dueat", "textContent": formatCardDue(new Date(assignment.plannable_date)) });
    if (assignment.overdue === true) assignmentDueAt.classList.add("bettercanvas-assignment-overdue");
    if (assignment?.submissions?.submitted === true) {
        assignmentContainer.classList.add("bettercanvas-completed");
    } else {
        if (options.assignment_states[assignment.plannable_id]?.["crs"] === true) {
            assignmentContainer.classList.add("bettercanvas-completed");
        }
    }
    assignmentDueAt.addEventListener('mouseup', function () {
        assignmentContainer.classList.toggle("bettercanvas-completed");
        const status = assignmentContainer.classList.contains("bettercanvas-completed");
        setAssignmentState(assignment.plannable_id, { "crs": status, "expire": assignment.plannable_date });
    });
    return assignmentContainer;
}

function cardassignments_loadCardAssignments() {
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
                        if (options.hide_completed_cards === true && assignment.submitted === true) return;
                        if ((options.card_overdues !== true && now >= assignment.due) || (options.card_overdues === true && assignment.submitted === true)) return;
                        if (assignment.type !== "assignment" && assignment.type !== "quiz" && assignment.type !== "discussion_topic") return;
                        if (assignment.override === true) return;
                        //assignment.el.querySelector(".bettercanvas-assignment-dueat").textContent = formatCardDue(assignment.due);
                        cardContainer.appendChild(assignment.el);
                        count++;
                    });
                }

                if (count === 0) {
                    let assignmentContainer = makeElement("div", cardContainer, { "className": "bettercanvas-assignment-container" });
                    let assignmentDivLink = makeElement("a", assignmentContainer, { "className": "bettercanvas-assignment-link", "textContent": "None" });
                }
            });
        } catch (e) {
            logError(e);
        }
    });
}

/*
export function loadCardAssignments2(c = null) {
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
*/

function setupCardAssignments() {
    if (options.assignments_due !== true) return;
    try {
        if (document.querySelectorAll('.ic-DashboardCard').length > 0 && document.querySelectorAll('.bettercanvas-card-container').length > 0) return;
        let cards = document.querySelectorAll('.ic-DashboardCard');
        cards.forEach(card => {
            let assignmentContainer = card.querySelector(".bettercanvas-card-assignment") || makeElement("div", card, { "className": "bettercanvas-card-assignment" });
            let assignmentsDueHeader = card.querySelector(".bettercanvas-card-header-container") || makeElement("div", assignmentContainer, { "className": "bettercanvas-card-header-container" });
            let assignmentsDueLabel = card.querySelector(".bettercanvas-card-header") || makeElement("h3", assignmentsDueHeader, { "className": "bettercanvas-card-header", "textContent": chrome.i18n.getMessage("due") });
            let cardContainer = card.querySelector(".bettercanvas-card-container") || makeElement("div", assignmentContainer, { "className": "bettercanvas-card-container" });
            let skeletonText = card.querySelector(".bettercanvas-skeleton-text") || makeElement("div", cardContainer, { "className": "bettercanvas-skeleton-text" });
        });
    } catch (e) {
        logError(e);
    }
}


;// ./js/util.js





//const apiurl = "http://localhost:3000";
const apiurl = "https://bettercanvas.diditupe.dev";

function hexToRgb(hex) {
    let match = (/#(.{2})(.{2})(.{2})/).exec(hex);
    if (match) {
        return { "r": parseInt(match[1], 16), "g": parseInt(match[2], 16), "b": parseInt(match[3], 16) };
    }
}

function getGrades() {
    if (options.gpa_calc === true || options.dashboard_grades === true) {
        grades = getData(`${domain}/api/v1/courses?${/*enrollment_state=active&*/""}include[]=concluded&include[]=total_scores&include[]=computed_current_score&include[]=current_grading_period_scores&per_page=100`);
    }
}

function getColors() {
    if (options.tab_icons || options.todo_colors) {
        let colors = getData(`${domain}/api/v1/users/self/colors`);
        colors.then(data => {
            let cards = options.custom_cards_3;
            Object.keys(cards).forEach(key => {
                cards[key] = { ...cards[key], "color": data["custom_colors"]["course_" + key] ? data["custom_colors"]["course_" + key] : null };
            });
            chrome.storage.sync.set({ "custom_cards_3": cards });
        });
    }
}

function changeFavicon() {
    if (options.tab_icons !== true) return;
    let match = current_page.match(/courses\/(?<id>\d*)/);
    if (match && match.groups.id && options.custom_cards_3[match.groups.id]?.color) {
        document.querySelector('link[rel="icon"').href = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="white" width="128px" height="128px" viewBox="-192 -192 2304.00 2304.00" stroke="white"><g stroke-width="0"><rect x="-192" y="-192" width="2304.00" height="2304.00" rx="0" fill="${options.custom_cards_3[match.groups.id].color.replace("#", "%23")}" strokewidth="0"/></g><g stroke-linecap="round" stroke-linejoin="round"/><g> <path d="M958.568 277.97C1100.42 277.97 1216.48 171.94 1233.67 34.3881 1146.27 12.8955 1054.57 0 958.568 0 864.001 0 770.867 12.8955 683.464 34.3881 700.658 171.94 816.718 277.97 958.568 277.97ZM35.8207 682.031C173.373 699.225 279.403 815.285 279.403 957.136 279.403 1098.99 173.373 1215.05 35.8207 1232.24 12.8953 1144.84 1.43262 1051.7 1.43262 957.136 1.43262 862.569 12.8953 769.434 35.8207 682.031ZM528.713 957.142C528.713 1005.41 489.581 1044.55 441.31 1044.55 393.038 1044.55 353.907 1005.41 353.907 957.142 353.907 908.871 393.038 869.74 441.31 869.74 489.581 869.74 528.713 908.871 528.713 957.142ZM1642.03 957.136C1642.03 1098.99 1748.06 1215.05 1885.61 1232.24 1908.54 1144.84 1920 1051.7 1920 957.136 1920 862.569 1908.54 769.434 1885.61 682.031 1748.06 699.225 1642.03 815.285 1642.03 957.136ZM1567.51 957.142C1567.51 1005.41 1528.38 1044.55 1480.11 1044.55 1431.84 1044.55 1392.71 1005.41 1392.71 957.142 1392.71 908.871 1431.84 869.74 1480.11 869.74 1528.38 869.74 1567.51 908.871 1567.51 957.142ZM958.568 1640.6C816.718 1640.6 700.658 1746.63 683.464 1884.18 770.867 1907.11 864.001 1918.57 958.568 1918.57 1053.14 1918.57 1146.27 1907.11 1233.67 1884.18 1216.48 1746.63 1100.42 1640.6 958.568 1640.6ZM1045.98 1480.11C1045.98 1528.38 1006.85 1567.51 958.575 1567.51 910.304 1567.51 871.172 1528.38 871.172 1480.11 871.172 1431.84 910.304 1392.71 958.575 1392.71 1006.85 1392.71 1045.98 1431.84 1045.98 1480.11ZM1045.98 439.877C1045.98 488.148 1006.85 527.28 958.575 527.28 910.304 527.28 871.172 488.148 871.172 439.877 871.172 391.606 910.304 352.474 958.575 352.474 1006.85 352.474 1045.98 391.606 1045.98 439.877ZM1441.44 1439.99C1341.15 1540.29 1333.98 1697.91 1418.52 1806.8 1579 1712.23 1713.68 1577.55 1806.82 1418.5 1699.35 1332.53 1541.74 1339.7 1441.44 1439.99ZM1414.21 1325.37C1414.21 1373.64 1375.08 1412.77 1326.8 1412.77 1278.53 1412.77 1239.4 1373.64 1239.4 1325.37 1239.4 1277.1 1278.53 1237.97 1326.8 1237.97 1375.08 1237.97 1414.21 1277.1 1414.21 1325.37ZM478.577 477.145C578.875 376.846 586.039 219.234 501.502 110.339 341.024 204.906 206.338 339.592 113.203 498.637 220.666 584.607 378.278 576.01 478.577 477.145ZM679.155 590.32C679.155 638.591 640.024 677.723 591.752 677.723 543.481 677.723 504.349 638.591 504.349 590.32 504.349 542.048 543.481 502.917 591.752 502.917 640.024 502.917 679.155 542.048 679.155 590.32ZM1440 475.712C1540.3 576.01 1697.91 583.174 1806.8 498.637 1712.24 338.159 1577.55 203.473 1418.51 110.339 1332.54 217.801 1341.13 375.413 1440 475.712ZM1414.21 590.32C1414.21 638.591 1375.08 677.723 1326.8 677.723 1278.53 677.723 1239.4 638.591 1239.4 590.32 1239.4 542.048 1278.53 502.917 1326.8 502.917 1375.08 502.917 1414.21 542.048 1414.21 590.32ZM477.145 1438.58C376.846 1338.28 219.234 1331.12 110.339 1415.65 204.906 1576.13 339.593 1710.82 498.637 1805.39 584.607 1696.49 577.443 1538.88 477.145 1438.58ZM679.155 1325.37C679.155 1373.64 640.024 1412.77 591.752 1412.77 543.481 1412.77 504.349 1373.64 504.349 1325.37 504.349 1277.1 543.481 1237.97 591.752 1237.97 640.024 1237.97 679.155 1277.1 679.155 1325.37Z"/></g></svg>`;
    }
}

async function addAssignmentsToRecap(data) {
    /*
    if (data === null) return;
    const items = await data;
    const storage = await chrome.storage.sync.get(["recap_assignments", "recap_announcements"]);
    const assignments = [...new Set(items.filter(item => item.plannable_type !== "announcement").map(item => item.plannable_id).concat(storage["recap_assignments"] || []))];
    const announcements = [...new Set(items.filter(item => item.plannable_type === "announcement").map(item => item.plannable_id).concat(storage["recap_announcements"] || []))];
    console.log(assignments, announcements);
    console.log(items);

    if (storage["recap_assignments"].length === assignments.length && storage["recap_announcements"].length === announcements.length) return;

    await chrome.storage.sync.set({ "recap_assignments": assignments, "recap_announcements": announcements });
    */
}


function getAssignments() {
    if (options.assignments_due === true || options.better_todo === true) {
        let weekAgo = new Date(new Date() - 604800000);
        //let weekAgo = new Date(new Date() - (604800000 * 10));
        assignments = getData(`${domain}/api/v1/planner/items?start_date=${weekAgo.toISOString()}&per_page=75`);
        cardAssignments = preloadAssignmentEls();
        addAssignmentsToRecap(assignments);
    }
}

function getApiData() {
    if (current_page === "/" || current_page === "") {
        getAssignments();
        getGrades();
        getColors();
    }
}


function util_makeElement(element, location, options) {
    let creation = document.createElement(element);
    Object.keys(options).forEach(key => {
        creation[key] = options[key];
    });
    location.appendChild(creation);
    return creation
}

function initElement(element, location, options, initFn) {
    let creation = document.createElement(element);
    Object.keys(options).forEach(key => {
        creation[key] = options[key];
    });
    location.appendChild(creation);
    initFn(creation);
    return creation
}


function makeElement2(element, elclass, location, text) {
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
    try {
        let pat = /^rgb\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/;
        let exec = pat.exec(rgb);
        return "#" + parseInt(exec[1]).toString(16).padStart(2, "0") + parseInt(exec[2]).toString(16).padStart(2, "0") + parseInt(exec[3]).toString(16).padStart(2, "0");
    } catch (e) {
        console.warn(e);
    }
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

const months = (/* unused pure expression or super */ null && (["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]));
function formatTodoDate(date, submissions, hr24) {
    let { time, ms } = getRelativeDate(date);
    let fromNow = ms < 0 ? "in " + time : time + " ago";
    let dueSoon = false;
    if (submissions && submissions.submitted === false && ms >= -21600000) {
        dueSoon = true;
    }
    return { "dueSoon": dueSoon, "date": months[date.getMonth()] + " " + date.getDate() + " at " + (date.getHours() - (hr24 ? "" : date.getHours() > 12 ? 12 : 0)) + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes() + (hr24 ? "" : date.getHours() >= 12 ? "pm" : "am"), "fromnow": " (" + fromNow + ")" };
}

function util_formatCardDue(date) {
    let due = new Date(date);
    if (options.relative_dues === true) {
        let relative = getRelativeDate(due, true);
        return relative.ms > 0 ? relative.time + " ago" : "in " + relative.time;
    }
    return options.assignment_date_format ? (due.getDate()) + "/" + (due.getMonth() + 1) : (due.getMonth() + 1) + "/" + (due.getDate());
}

function util_logError(e) {
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

function combineAssignments(data) {
    let combined = data;
    try {
        options["custom_assignments_overflow"].forEach(overflow => {
            combined = combined.concat(options[overflow]);
        });
    } catch (e) {
        util_logError(e);
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


function util_setAssignmentState(id, updates) {
    let states = options.assignment_states;
    let length = JSON.stringify(states).length;
    // remove the oldest states if the size is approaching the storage limit
    if (length > 7400) {
        let keys = Object.keys(states).sort((a, b) => states[b].expire - states[a].expire);
        keys.splice(-5);
        let newStates = {};
        keys.forEach(key => {
            newStates[key] = states[key];
        });
        states = newStates;
    }
    states[id] = states[id] ? { ...states[id], ...updates } : updates;
    chrome.storage.sync.set({ assignment_states: states }).then(() => { cardAssignments = preloadAssignmentEls(); loadBetterTodo(); loadCardAssignments(); });
}

async function checkAssignmentSubmission() {
    try {
        console.log("submitting...");
        const storage = await chrome.storage.sync.get("recap_closestAssignment");
        const closest = storage["recap_closestAssignment"] || { "id": null, "remaining": Infinity };
        const now = Date.now();
        const due = new Date(document.querySelector("time")?.getAttribute("datetime")).getTime();
        console.log(due - now);
        if (now !== due && due - now < closest["remaining"]) {
            const re = /\/assignments\/(\d*)[^\d]*/;
            const match = window.location.pathname.match(re);
            const id = match ? parseInt(match[1]) : null;
            console.log(match, id);
            await chrome.storage.sync.set({ "recap_closestAssignment": { "id": id, "remaining": due - now } });
        }
    } catch (e) {
        console.log(e);
    }
}

async function setupCheckAssignmentSubmission(retries) {
    if (!window.location.pathname.includes("/assignments/") || retries > 10) return;
    const button = document.getElementById("submit-button");
    if (!button) {
        setTimeout(() => {
            setupCheckAssignmentSubmission(retries + 1);
        }, 1000);
        return;
    }

    button.addEventListener("click", checkAssignmentSubmission);
}

let tooltipTimeout;

function showTooltip(text, e) {
    const tooltip = document.getElementById("bettercanvas-tooltip") || util_makeElement("div", document.body, { "id": "bettercanvas-tooltip" });
    tooltip.textContent = text;
    tooltip.style.display = "block";
    moveTooltip(e);
}

function moveTooltip(e) {
    const tooltip = document.getElementById("bettercanvas-tooltip");
    if (!tooltip) return;

    tooltip.style = `display:block;left: ${e.clientX}px;top:${e.clientY}px;transform:translate(${window.innerWidth / 2 > e.clientX ? "0" : "-80%"},30px)`;
    //tooltip.style.left = e.clientX + "px";
    //tooltip.style.top = e.clientY + "px";
}

function closeTooltip() {
    const tooltip = document.getElementById("bettercanvas-tooltip");
    if (!tooltip) return;
    tooltip.style.display = "none";
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
}

function setupTooltip(el, text) {
    el.onmouseenter = (e) => showTooltip(text, e);
    el.onmousemove = (e) => moveTooltip(e);
    el.onmouseleave = closeTooltip;
}




;// ./js/apps/util.js
async function loadcss() {
    const storage = await chrome.storage.sync.get(["dark_mode", "dark_preset", "reminders"]);
    if (storage["dark_mode"] !== true) return;
    const vars = ":root {" + Object.keys(storage["dark_preset"]).reduce((a, v) => a + `--${v}:${storage["dark_preset"][v]};`, "") + "}";
    const style = document.createElement("style");
    style.id = "darkcss";
    style.textContent = vars;
    document.head.appendChild(style);
}


;// ./js/apps/deals.js



loadcss();
showPopup();

async function api(method, endpoint, body = null, headers = {}) {

    const payload = {
        "method": method,
        "headers": {
            "Content-Type": "application/json",
            ...headers
        },
    }

    if (body) payload["body"] = JSON.stringify(body);
    const res = await fetch(`${apiurl}/api${endpoint}`, payload);
    const data = await res.json();

    return { "data": data, "status": res.status };
}

async function showPopup() {
    const storage = await chrome.storage.sync.get("perks_popup");
    if (storage["perks_popup"] !== false) return;

    document.getElementById("perks-popup-container").style.display = "flex";

    document.getElementById("perks-popup-exit").onclick = () => {
        chrome.storage.sync.set({ "perks_popup": true });
        document.getElementById("perks-popup-container").style.display = "none";
    }
}

let filters = [];

document.addEventListener("DOMContentLoaded", async () => {
    displayDeals([]);

    document.querySelectorAll(".filter-option input").forEach(input => {
        input.addEventListener("change", (e) => {
            if (e.target.checked) {
                filters.push(e.target.value);
            } else {
                filters = filters.filter(i => i !== e.target.value);
            }
            page = 1;
            document.getElementById("load-more-deals").style.display = "block";
            document.getElementById("clear-filters").style.display =filters.length > 0 ? "block": "none";
            displayDeals(filters);
        })
    })

    document.getElementById("deal-modal").addEventListener("click", (e) => {
        if (e.target.id === "deal-modal") document.getElementById("deal-modal").classList.remove("active");
    })

    
});

let page = 1;

const cache = {}

const starSvg = `<svg  xmlns="http://www.w3.org/2000/svg"  width="18"  height="18"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-star"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" /></svg>`;

async function displayDeals() {
    const filterQuery = filters.length > 0 ? filters.join(",") : "None";

    if (!cache[filterQuery] || page > cache[filterQuery].length) {
        const result = await api("get", `/deals?page=${page + "&filter=" + filterQuery}`);
        if (result.data.errors !== false) return;
        cache[filterQuery] = cache[filterQuery] ? [...cache[filterQuery], result.data.message] : [result.data.message];
        if (result.data.message.length === 0) {
            document.getElementById("load-more-deals").style.display = "none";
        }
    }

    page = cache[filterQuery].length;

    const container = document.getElementById("deals-container");
    container.textContent = "";

    const combined = cache[filterQuery].reduce((a, v) => a.concat(v), []);

    combined.forEach(deal => {
        if (filters.length > 0 && !filters.some(filter => deal.category.includes(filter))) return;
        
        const el = util_makeElement("div", container, { "className": "deal" });
        const imageContainer = util_makeElement("div", el, { "className": "deal-img-container"});
        const image = util_makeElement("img", imageContainer, { "src": deal.img, "className": "deal-img" })
        const content = util_makeElement("div", el, { "style": "padding: 20px"});
        const title = util_makeElement("h2", content, { "textContent": deal.name, "className": "deal-title" });
        const description = util_makeElement("p", content, { "textContent": deal.purpose, "className": "deal-description"});
        const dealText = util_makeElement("p", content, { "textContent": "Deal: " + deal.description, "className": "deal-text" });
        const tags = util_makeElement("div", content, { "className": "deal-tags" });
        deal.category.forEach(category => {
            const tag = util_makeElement("div", tags, { "textContent": category, "className": "deal-tag", "innerHTML": category === "Featured" ? starSvg : "" }); 
            const tagText = util_makeElement("span", tag, { "textContent": category });
        })

        el.onclick = () => {
            const modal = document.getElementById("deal-modal");
            const instructions = deal.instructions.split(/\d+\.\s+/).filter(item => item.length > 0);
            document.getElementById("deal-modal-title").textContent = deal.name;
            document.getElementById("deal-modal-img").src = deal.img;
            document.getElementById("deal-modal-description").textContent = deal.description;
            document.getElementById("deal-modal-instructions").textContent = "";
            instructions.forEach((inst, count) => {
                const p = util_makeElement("p", document.getElementById("deal-modal-instructions"), { "textContent": (count + 1) + ". " + inst })
            })
            document.getElementById("deal-modal-terms").textContent = deal.terms;
            document.getElementById("deal-modal-link").href = deal.link;
            const modalTags = document.getElementById("deal-modal-tags");
            modalTags.textContent = "";
            deal.category.forEach(category => {
                const tag = util_makeElement("div", modalTags, { "textContent": category, "className": "deal-tag", "innerHTML": category === "Featured" ? starSvg : "" }); 
                const tagText = util_makeElement("span", tag, { "textContent": category });
            })
            modal.classList.add("active");
        }
    })

    setupTooltip(document.getElementById("deals-spark"), "This is a BetterCanvas page!");

    document.getElementById("deal-modal-exit").onclick = () => {
        document.getElementById("deal-modal").classList.remove("active");
    }

    document.getElementById("clear-filters").onclick = () => {
        document.querySelectorAll(".filter-option input").forEach(input => {
            input.checked = false;
        });
        document.getElementById("clear-filters").style.display = "none";
        filters = [];
        displayDeals();
    }
}

document.getElementById("load-more-deals").onclick = () => {
    page++;
    displayDeals();
}
/******/ })()
;