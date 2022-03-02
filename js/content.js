const domain = window.location.origin;
const current_page = window.location.pathname;
let class_weights = [];
let numAssignmentsToDisplay = 5;
let assignments = null;
let grades = null;
let card_order = null;

isDomainCanvasPage();

function startExtension() {
    console.log("*\nBetter Canvas is running on this page!\n(domain = " + domain + ")");

    if (current_page === '/' || current_page === '') {

        markAllAsRead();

        chrome.storage.local.get(['assignments_due', 'dashboard_grades', 'gradient_cards'], function (result) {
            getNecessaryItemsFromAPI(result);
            if (result.assignments_due === true || result.gradient_cards === true) window.onload = forceIntoCard(result);
        });
    }

    if (current_page === '/grades') {
        chrome.storage.local.get(['gpa_calc'], function (result) { if (result.gpa_calc !== false) setupGPACalc() });
    }
}

function markAllAsRead() {
    getData(`${domain}/api/v1/planner/items`).then((resp) => {
        console.log(resp);
        resp.forEach((item) => {
            console.log(item.planner_override === null);
            if(item.planner_override === null) markAsRead(item);
        });
    });
}

async function markAsRead(item) {

    const response = await fetch(`${domain}/api/v1/planner/overrides`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'same-origin', // include, *same-origin, omit
        body: JSON.stringify({
            marked_complete: true,
            plannable_type: "announcement",
            plannable_id: item.plannable_id,
            user_id: 1008347
        }), // body data type must match "Content-Type" header
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          }
    });
}

function forceIntoCard() {
    const check = setInterval(() => {
        if (!document.querySelectorAll('.ic-DashboardCard')[0].querySelector('.bettercanvas-card-container')) setupAssignmentSkeleton(); // if the card doesn't exist make it and restart
    }, 500);

    setTimeout(() => {
        clearInterval(check);
    }, 10000);
}

function getNecessaryItemsFromAPI(options) {
    if (options.assignments_due === true) {
        getData(`${domain}/api/v1/dashboard/dashboard_cards`).then((response) => {
            card_order = response;
        });
        let date = new Date();
        getData(`${domain}/api/v1/planner/items?start_date=${date.toISOString()}&per_page=50`).then((response) => {
            assignments = response;
        });
        if (options.dashboard_grades === true) {
            getData(`${domain}/api/v1/courses?enrollment_state=active&include[]=total_scores&include[]=current_grading_period_scores`).then((response) => {
                grades = response;
            });
        }
    }
}

function beginInsertion(cardContainers, options) {
    if (!cardContainers[0]) return;
    if (options.assignments_due === true) {
        let checkReady = setInterval(() => {
            if (card_order !== null && assignments !== null) {
                clearInterval(checkReady);
                insertAssignmentsIntoCards(assignments, card_order, parseInt(options.num_assignments));
            }
        }, 100);
    }
    if (options.dashboard_grades === true) {
        let checkReady = setInterval(() => {
            if (card_order !== null && grades !== null & assignments !== null) {
                clearInterval(checkReady);
                insertGradesIntoCards(grades, card_order);
            }
        }, 100);
    }
}

function insertGradesIntoCards(grades, card_order) {
    if (document.querySelectorAll('.bettercanvas-card-container')[0].querySelector('.bettercanvas-card-grade')) return;
    let cards = document.querySelectorAll('.ic-DashboardCard');
    for (let i = 0; i < cards.length; i++) {
        let cardContainer = cards[i].querySelector('.bettercanvas-card-container');
        grades.forEach(function (grade) {
            if (card_order[i].id === grade.id) {
                let gradePercent = grade.enrollments[0].current_period_computed_current_score ? grade.enrollments[0].current_period_computed_current_score + "%" : "";
                let assignmentsDueHeader = makeElement("a", "bettercanvas-card-grade", cardContainer.querySelector('.bettercanvas-card-header-container'), gradePercent);
                assignmentsDueHeader.setAttribute("href", `${domain}/courses/${card_order[i].id}/grades`);
            }
        });
    }
}

function insertAssignmentsIntoCards(assignments, card_order, maxAssignments) {
    if (!document.querySelectorAll('.bettercanvas-card-container')[0].querySelector('.bettercanvas-skeleton-text')) return;
    let cards = document.querySelectorAll('.ic-DashboardCard');
    for (let i = 0; i < cards.length; i++) {
        let cardContainer = cards[i].querySelector('.bettercanvas-card-container');
        cardContainer.querySelector(".bettercanvas-skeleton-text").remove(); //remove loader
        let count = 0;
        assignments.forEach(function (assignment) {
            if (count < maxAssignments && card_order[i].id === assignment.course_id && assignment.plannable_type === "assignment") {
                count++;
                let assignmentContainer = makeElement("a", "bettercanvas-assignment-container", cardContainer);
                let assignmentName = makeElement("p", "bettercanvas-assignment-link", assignmentContainer, assignment.plannable.title)
                let assignmentDueAt = makeElement("div", "bettercanvas-assignment-dueat", assignmentContainer, cleanDue(assignment.plannable_date));
                assignmentContainer.setAttribute("href", `${domain}/courses/${card_order[i].id}/assignments/${assignment.plannable_id}`);
            };
        });
        if (count === 0) {
            let assignmentDivLink = makeElement("a", "bettercanvas-assignment-container", cardContainer, "None");
        }
    }
}

function setupAssignmentSkeleton() {
    if (document.querySelectorAll('.ic-DashboardCard')[0].querySelector('.bettercanvas-card-container')) return;
    chrome.storage.local.get(['assignments_due', 'dashboard_grades', 'gradient_cards', 'num_assignments'], function (result) {
        if (result.gradient_cards === true) changeGradientCards();
        if (result.assignments_due === true) {
            let cards = document.querySelectorAll('.ic-DashboardCard');
            let cardContainers = [];
            for (let i = 0; i < cards.length; i++) {
                let cardContainer = makeElement("div", "bettercanvas-card-container", cards[i]);
                let assignmentsDueHeader = makeElement("div", "bettercanvas-card-header-container", cardContainer);
                let assignmentsDueLabel = makeElement("h3", "bettercanvas-card-header", assignmentsDueHeader, 'Assignments Due')
                let skeletonText = makeElement("div", "bettercanvas-skeleton-text", cardContainer);
                cardContainers.push(cardContainer);
            }
            beginInsertion(cardContainers, result);
        }
    });
}

function cleanDue(date) {
    let newdate = new Date(date);
    return (newdate.getMonth() + 1) + "/" + (newdate.getDate());
}

function isDomainCanvasPage() {
    if (domain.includes("canvas") || domain.includes("instructure") || domain.includes("learn") || domain.includes("school")) {
        startExtension();
        return;
    } else {
        chrome.storage.local.get(['custom_domain'], function (result) {
            if (domain.includes(result.custom_domain) && result.custom_domain != "") startExtension();
        });
    }
}

function changeGradientCards() {
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

function calculateGPA() {
    let weights = 0;
    let unweighted = 0;
    let numCredits = 0;
    class_weights.forEach(function (course) {
        if (course["weight"] != "dnc") {
            let qualityPoints;
            let score = course["score"];
            let courseCredits = parseInt(course["credits"]);
            numCredits += courseCredits;
            if (course["weight"] === "college") {
                qualityPoints = score >= 97 ? 4.3 : (score < 97 && score >= 93 ? 4 : (score < 93 && score >= 90 ? 3.7 : (score < 90 && score >= 87 ? 3.3 : (score < 87 && score >= 83 ? 3 : (score < 83 && score >= 80 ? 2.7 : (score < 80 && score >= 77 ? 2.3 : (score < 77 && score >= 73 ? 2 : (score < 73 && score >= 70 ? 1.7 : (score < 70 && score >= 67 ? 1.3 : (score < 67 && score >= 63 ? 1 : (score < 63 && score >= 60 ? .7 : 0)))))))))));
            } else {
                qualityPoints = score >= 89.5 ? 4 : (score < 89.5 && score >= 79.5 ? 3 : (score < 79.5 && score >= 69.5 ? 2 : (score < 69.5 && score >= 59.5 ? 1 : 0)));
                let weight = course["weight"] === 'ap' ? 1 : (course["weight"] === 'honors' ? .5 : 0);
                weights += weight * courseCredits;
            }
            unweighted += qualityPoints * courseCredits;
        }
    });
    let gpaDiv = document.querySelector('.extension-calcgpa');
    let finalgpaweighted = ((unweighted + weights) / numCredits).toFixed(2);
    let finalgpaunweighted = (unweighted / numCredits).toFixed(2);
    gpaDiv.firstChild.textContent = 'Unweighted GPA: ' + finalgpaunweighted + ' | Weighted GPA (HS): ' + finalgpaweighted;
}

function setupGPACalc() {
    let gpaDiv = makeElement("tr", "extension-calcgpa", document.querySelector('.student_grades > tbody'));
    let gpa = makeElement("tr", "extension-gpa", gpaDiv);
    let percents = document.querySelectorAll('.percent');
    for (let i = 0; i < percents.length; i++) {
        let percent = percents[i].textContent.replace(/\s+/g, "");
        if (percent.includes('%')) {
            makeChangeable(percents[i], percent, i);
            createGPASelector(i);
            let score = percent.replace('%', "");
            let weighted = { "score": score, "weight": 'regular', "class": i, "credits": 1 }
            class_weights.push(weighted);
            calculateGPA();
        }
    }
}

function makeChangeable(element, percent, number) {
    element.textContent = "";
    let changer = makeElement('input', 'percent', element);
    makeElement('span', 'gpachanger-percentage', element, '%');
    changer.value = percent.replace('%', '');
    element.classList.remove('percent');
    changer.addEventListener('change', function () {
        class_weights.forEach(function (course) {
            if (course["class"] === number) course["score"] = changer.value;
            calculateGPA();
        });
    });
}

function createGPASelector(number) {
    let gpaOptions = makeElement("div", "extension-gpaOptions", document.querySelectorAll('.course_details tr')[number]);
    let weightRadio = makeElement("div", "weightradio", gpaOptions);
    let creditsRadio = makeElement("div", "creditsradio", gpaOptions);
    let weightSelections = makeElement("form", "weightform", weightRadio);
    let creditInput = makeElement("span", "credits", creditsRadio);
    weightSelections.setAttribute("data-class", number);
    weightSelections.innerHTML = '<select name="weight-selection" id="weight-selection"><option value="dnc">Do not count</option><option value="college">College</option><option value="regular" selected>Regular</option><option value="honors">Honors</option><option value="ap">AP/IB</option></select>'
    creditInput.innerHTML = 'Credits: <input id="credit-selection" value="1"></input>';
    creditInput.querySelector("#credit-selection").setAttribute("data-class", number);
    weightRadio.addEventListener('change', function (e) {
        class_weights.forEach(function (course) {
            if (course["class"] === parseInt(weightSelections.getAttribute("data-class"))) course["weight"] = e.target.value;
            calculateGPA();
        });
    });
    creditInput.querySelector("#credit-selection").addEventListener('change', function (e) {
        let courseNum = parseInt(this.getAttribute("data-class"));
        class_weights.forEach(function (course) {
            if (course["class"] === courseNum) course["credits"] = e.target.value;
            calculateGPA();
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

function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
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