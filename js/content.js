const domain = window.location.origin;
const current_page = window.location.pathname;
let numAssignmentsToDisplay = 5;
let assignments = null;
let grades = null;
let card_order = null;
let options = {};
let startHour, startMinute, endHour, endMinute, timeCheck = null;

isDomainCanvasPage();

function startExtension() {
    toggleDarkMode();
    const optionsList = ["assignments_due", "dashboard_grades", "gradient_cards", "auto_dark", "auto_dark_start", "auto_dark_end", 'num_assignments', 'assignments_done', "gpa_calc"];
    chrome.storage.local.get(optionsList, result => {
        options = { ...options, ...result };
        toggleAutoDarkMode();
        getAssignmentData();
        setupGPACalc();
        checkDashboardReady();
    });

    chrome.runtime.onMessage.addListener(function (request) {
        chrome.storage.local.get(["dark_mode", "auto_dark", "dark_css", "auto_dark_start", "auto_dark_end"], result => {
            options = { ...options, ...result };
            if (request.message === "darkmode") {
                toggleDarkMode();
            }
            if (request.message === "autodarkmode") {
                toggleAutoDarkMode();
            }
        })
    });

    console.log("*\nBetter Canvas is running on this page!\n(domain = " + domain + ")");
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

function checkDashboardReady() {
    if (current_page !== "/" && current_page !== "") return;

    const callback = (mutationList) => {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList' && mutation.target == document.querySelector("#DashboardCard_Container")) {
                setupCards();
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(document.querySelector('html'), { childList: true, subtree: true });
}

function getAssignmentData() {
    if(current_page === "/" && options.assignments_due === true || current_page === "" && options.assignments_due === true) {
        card_order = getData(`${domain}/api/v1/dashboard/dashboard_cards`);
        assignments = getData(`${domain}/api/v1/planner/items?start_date=${new Date().toISOString()}&per_page=50`);
    }
    if (current_page === "/grades" && options.gpa_calc === true || current_page === "/" && options.dashboard_grades === true || current_page === "" && options.dashboard_grades === true) {
        grades = getData(`${domain}/api/v1/courses?enrollment_state=active&include[]=total_scores&include[]=current_grading_period_scores`);
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

function insertGrades(grades, card_order) {
    if (document.querySelectorAll('.bettercanvas-card-container')[0].querySelector('.bettercanvas-card-grade')) return;
    let cards = document.querySelectorAll('.ic-DashboardCard');
    for (let i = 0; i < cards.length; i++) {
        let cardContainer = cards[i].querySelector('.bettercanvas-card-container');
        grades.forEach(grade => {
            if (card_order[i].id === grade.id) {
                let gradepercent = grade.enrollments[0].has_grading_periods === true ? grade.enrollments[0].current_period_computed_current_score : grade.enrollments[0].computed_current_score;
                let percent = (gradepercent ? gradepercent : "--") + "%";
                let assignmentsDueHeader = makeElement("a", "bettercanvas-card-grade", cardContainer.querySelector('.bettercanvas-card-header-container'), percent);
                assignmentsDueHeader.setAttribute("href", `${domain}/courses/${card_order[i].id}/grades`);
            }
        });
    }
}

function insertAssignments(assignments, card_order) {
    if (!document.querySelectorAll('.bettercanvas-card-container')[0].querySelector('.bettercanvas-skeleton-text')) return;
    let cards = document.querySelectorAll('.ic-DashboardCard');
    for (let i = 0; i < cards.length; i++) {
        let cardContainer = cards[i].querySelector('.bettercanvas-card-container');
        cardContainer.querySelector(".bettercanvas-skeleton-text").remove(); //remove loader
        let count = 0;
        assignments.forEach(function (assignment) {
            if (count < options.num_assignments && card_order[i].id === assignment.course_id) {
                if (assignment.plannable_type === "assignment" || assignment.plannable_type === "quiz") {
                    count++;
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
                        setAssignmentStatus(this.dataset.asgmtid, status, assignments_done);
                    });
                    assignmentName.setAttribute("href", `${domain}/courses/${card_order[i].id}/${assignment.plannable_type === "quiz" ? "quizzes" : "assignments"}/${assignment.plannable_id}`);
                }
            };
        });
        if (count === 0) {
            let assignmentContainer = makeElement("div", "bettercanvas-assignment-container", cardContainer);
            let assignmentDivLink = makeElement("a", "bettercanvas-assignment-link", assignmentContainer, "None");
        }
    }
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

function setupCards() {
    changeGradientCards();
    try {
        if (document.querySelectorAll('.ic-DashboardCard').length > 0 && document.querySelectorAll('.bettercanvas-card-container').length > 0) return;
        if (options.assignments_due === false) return;
        let cards = document.querySelectorAll('.ic-DashboardCard');
        for (let i = 0; i < cards.length; i++) {
            let cardContainer = makeElement("div", "bettercanvas-card-container", cards[i]);
            let assignmentsDueHeader = makeElement("div", "bettercanvas-card-header-container", cardContainer);
            let assignmentsDueLabel = makeElement("h3", "bettercanvas-card-header", assignmentsDueHeader, 'Due')
            let skeletonText = makeElement("div", "bettercanvas-skeleton-text", cardContainer);
        }
        card_order.then(order => {
            if (options.assignments_due === true) {
                assignments.then(data => insertAssignments(data, order));
            }
            if (options.dashboard_grades === true) {
                grades.then(data => insertGrades(data, order));
            }
        });
    } catch (e) {
    }
}

function cleanDue(date) {
    let newdate = new Date(date);
    return (newdate.getMonth() + 1) + "/" + (newdate.getDate());
}

function isDomainCanvasPage() {
    // reducing time it takes to start the dark mode
    chrome.storage.local.get(['custom_domain', 'dark_css', 'dark_mode'], result => {
        options = result;
        if (result.custom_domain && result.custom_domain !== "") {
            if (domain.includes(result.custom_domain)) startExtension();
        } else {
            if (domain.includes("canvas") || domain.includes("instructure") || domain.includes("learn") || domain.includes("school")) {
                startExtension();
            }
        }
    });
}

function changeGradientCards() {
    if (options.gradient_cards === false) return;
    let cardheads = document.querySelectorAll('.ic-DashboardCard__header_hero');
    let cardcss = document.createElement('style');
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

function calculateGPA2() {
    let qualityPoints = 0, numCredits = 0, weightedQualityPoints = 0;
    document.querySelectorAll('.bettercanvas-gpa-course').forEach(course => {
        const weight = course.querySelector('.bettercanvas-course-weight').value;
        if (weight != "dnc") {
            const grade = parseFloat(course.querySelector('.bettercanvas-course-percent').value);
            const credits = parseFloat(course.querySelector('.bettercanvas-course-credit').value);
            let gpa;
            if (grade >= 93) {
                gpa = 4.0;
            } else if (grade >= 90) {
                gpa = 3.7;
            } else if (grade >= 87) {
                gpa = 3.4;
            } else if (grade >= 83) {
                gpa = 3.0;
            } else if (grade >= 80) {
                gpa = 2.7;
            } else if (grade >= 77) {
                gpa = 2.3;
            } else if (grade >= 73) {
                gpa = 2;
            } else if (grade >= 70) {
                gpa = 1.7;
            } else if (grade >= 68) {
                gpa = 1.3;
            } else if (grade >= 63) {
                gpa = 1;
            } else if (grade >= 60) {
                gpa = .7;
            } else {
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
    });
    document.querySelector("#bettercanvas-gpa-unweighted").textContent = (qualityPoints / numCredits).toFixed(2);
    document.querySelector("#bettercanvas-gpa-weighted").textContent = (weightedQualityPoints / numCredits).toFixed(2);
}

function setupGPACalc() {
    if (options.gpa_calc === false || current_page !== "/grades") return;
    document.addEventListener("DOMContentLoaded", () => {
        let container = makeElement("div", "bettercanvas-gpa", document.querySelector("#content"));
        container.innerHTML = '<h2>GPA Calculator</h2><div class="bettercanvas-gpa-courses"></div><div class="bettercanvas-gpa-output"><h3>Unweighted: <span id="bettercanvas-gpa-unweighted"></span></h3><h3>Weighted: <span id="bettercanvas-gpa-weighted"></span></h3></div>';
        grades.then(result => {
            for (const course of result) {
                let courseContainer = makeElement("div", "bettercanvas-gpa-course", document.querySelector(".bettercanvas-gpa-courses"), course.course_code);
                let changer = makeElement("input", "bettercanvas-course-percent", courseContainer);
                let courseGrade = course.enrollments[0].has_grading_periods === true ? course.enrollments[0].current_period_computed_current_score : course.enrollments[0].computed_current_score;
                changer.value = courseGrade ? courseGrade : "";
                let percent = makeElement("span", "bettercanvas-course-percent-sign", courseContainer, "%");
                let weightSelections = makeElement("form", "bettercanvas-course-weights", courseContainer);
                weightSelections.innerHTML = '<select name="weight-selection" class="bettercanvas-course-weight"><option value="dnc">Do not count</option><option value="regular">Regular/College</option><option value="honors">Honors</option><option value="ap">AP/IB</option></select>';
                weightSelections.querySelectorAll("option")[changer.value === "" ? 0 : 1].selected = true;
                let creditsRadio = makeElement("div", "bettercanvas-course-credits", courseContainer);
                let creditInput = makeElement("span", "credits", creditsRadio);
                creditInput.innerHTML = 'Credits: <input class="bettercanvas-course-credit" value="1"></input>';
                changer.addEventListener('input', calculateGPA2);
                weightSelections.addEventListener('change', calculateGPA2);
                creditInput.addEventListener('input', calculateGPA2);
            }
            calculateGPA2();
        });
    });
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