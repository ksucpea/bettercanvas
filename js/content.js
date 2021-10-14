let class_weights = [];
let class_done;
const domain = window.location.origin;
const current_page = window.location.pathname;

console.log(domain);
if(domain.match(/canvas|instructure|learn/g)) {
if (current_page === '/' || current_page === '') {
    let dashboardready = setInterval(function() {
        if (document.querySelectorAll('.ic-DashboardCard__header')[0]) {
            chrome.storage.local.get(['assignments_due'], function(result) { if (result.assignments_due !== false) setupAssigments() });
            chrome.storage.local.get(['gradient_cards'], function(result) { if (result.gradient_cards === true) changeGradientCards() });
            clearInterval(dashboardready);
        }
    }, 50);
}

if (current_page === '/grades') {
    chrome.storage.local.get(['gpa_calc'], function(result) { if (result.gpa_calc !== false) setupGPACalc() }); 
}

// work in progress idk if anyone even uses this 
if ((current_page.split('/')[1]) === 'courses' && (current_page.split('/')[3]) === 'assignments' || current_page.split('/')[1] === 'courses' && (current_page.split('/')[3]) === 'pages') {
    chrome.storage.local.get(['link_preview'], function(result) {
        if (result.link_preview != false) {
            let assignmentready = setInterval(function() {
                if (document.querySelector('#content')) {
                    let links = document.querySelector("#assignment_show") ? document.querySelectorAll("#assignment_show a") : document.querySelectorAll("#wiki_page_show a");
                    for (let i = 0; i < links.length; i++) {
                        let link = links[i].href;
                        let matches = link.match(/youtube|instructure/g);
                        let embedlink;
                        if (matches) {
                            switch (matches[0]) {
                                case "youtube":
                                    let cleaned = link.split('v=')[1];
                                    embedlink = "https://youtube.com/embed/" + cleaned;
                                    break;
                            }
                        } else {
                            embedlink = link;
                        }
                        if (!matches || matches[0] != 'instructure') {
                            let showembed = makeElement("button", "extension-linkpreview", links[i].parentElement, "show link preview");
                            showembed.addEventListener('click', function() {
                                if (!document.querySelector("#extension-embed-" + [i])) {
                                    var frame = document.createElement("iframe");
                                    frame.id = "extension-embed-" + [i];
                                    frame.src = embedlink;
                                    frame.width = 720;
                                    frame.height = 405;
                                    insertAfter(showembed, frame);
                                } else {
                                    document.querySelector("#extension-embed-" + [i]).classList.toggle("extension-embed-hidden");
                                }
                            });
                        }
                    }
                    clearInterval(assignmentready);
                }
            }, 20);
        }
    });
}
}

function setupAssigments() {
    chrome.storage.local.get(["assignments_done"], function (result) {
        class_done = Object.keys(result).length !== 0 ? result.assignments_done : [];
    });
    getData(domain + '/api/v1/dashboard/dashboard_cards').then(function (data) {
        for (let i = 0; i < data.length; i++) {
            let assignmentsContainer = makeElement("div", "extension-ac", document.querySelectorAll('.ic-DashboardCard')[i]);
            makeElement("h3", "extension-at", assignmentsContainer, 'Assignments Due');
            let skeleton = makeElement("div", "extension-skeleton", assignmentsContainer);
            makeElement("div", "extension-skeleton-text", skeleton);
            insertAssignments(data[i].id, assignmentsContainer);
        }
    });
}

function insertAssignments(courseId, card) {
    let needsPotentialsInserted = [];
        getData(domain + '/api/v1/courses/' + courseId + '/assignments?order_by=due_at&bucket=future').then(function(data) {
            if (data.length === 0) {
                let assignmentEmptyDiv = makeElement("div", "extension-al", card);
                let assignmentEmptyDue = makeElement("span", "extension-ed", assignmentEmptyDiv, "None");
            } else {
                data.forEach(function(assignment) {
                    let monthDue = "n";
                    let dayDue = "a";
                    if(assignment.due_at !== null) {
                        let datadate = new Date(assignment["due_at"]);
                        monthDue = datadate.getMonth() + 1;
                        dayDue = datadate.getDate();
                    }
                    let assignmentDiv = makeElement("div", "extension-assignment", card);
                    let assignmentDivLink = makeElement("a", "extension-al", assignmentDiv, assignment["name"]);
                    let assignmentDivDue = makeElement("span", "extension-aldue", assignmentDiv, monthDue + '/' + dayDue);
                    if(assignment["points_possible"] > 0) {
                        let gradePotentials = makeElement("div", "extension-grade-potentials", assignmentDiv);
                        needsPotentialsInserted.push({"element": gradePotentials, "assignment": assignment});
                    }
                    assignmentDivLink.setAttribute("href", domain + '/courses/' + courseId + '/assignments/' + assignment["id"]);
                    assignmentDivDue.setAttribute("data-aid", assignment["id"]);
                    class_done.forEach(function(done) {
                        if(done == assignment["id"]) assignmentDiv.classList.add("extension-completed");
                    });
                    assignmentDivDue.addEventListener('mouseup', function() {
                        assignmentDiv.classList.toggle('extension-completed');
                        let completestatus = assignmentDiv.classList.contains("extension-completed");
                        setAssignmentStatus(this.dataset.aid, completestatus);
                    });
                });
            }
        }).then(function() {
            card.querySelector(".extension-skeleton").remove();
            chrome.storage.local.get(['assignment_potentials'], function(result) { // assignment potential % insert
                if (result.assignment_potentials === true) {
                    insertAssignmentPotentials(courseId, needsPotentialsInserted);
                }
            });
        });
}

function insertAssignmentPotentials(courseId, needsPotentialsInserted) {
    let gradingPeriodId;
    getData(domain + '/api/v1/courses/'+courseId+'/grading_periods').then(function(data) {
        data.grading_periods.forEach(function(period) { // get current grading period id
            if(new Date(period.start_date).getTime() < new Date().getTime() && new Date(period.end_date).getTime() > new Date().getTime()) {
                gradingPeriodId = parseInt(period.id);
            }
        });
    }).then(function() {
        if(true === true) {
            let assignmentGroups = [];
            let totalGroupsWithPoints = 0;
            getData(domain + '/api/v1/courses/'+courseId+'/assignment_groups?include[]=assignments&include[]=submission&include[]=score_statistics').then(function(data) {
                data.forEach(function(group) {
                        assignmentGroups.push({"group_id": group.id, "weight": group.group_weight, "total_possible": 0, "total_score": 0});
                        let pointsAvailable = false;
                        group.assignments.forEach(function(assignment) {
                            if(assignment.submission.grading_period_id === gradingPeriodId && assignment.submission.score !== null) {
                                assignmentGroups[assignmentGroups.length - 1].total_possible += assignment.points_possible;
                                assignmentGroups[assignmentGroups.length - 1].total_score += assignment.submission.score;
                                pointsAvailable = true;
                            }
                        });
                        if(pointsAvailable === true) totalGroupsWithPoints++;
                });
            }).then(function() {
                needsPotentialsInserted.forEach(function(potential) {
                    let potentials = getGradeHit(potential.assignment, assignmentGroups, totalGroupsWithPoints);
                    makeElement("p", "extension-grade-hit", potential.element, "-" + potentials[0]+"%");
                    makeElement("p", "extension-grade-full", potential.element, "+"+potentials[1]+"%");
                });
            });
        }
    });
}

function getGradeHit(assignment, assignmentGroups, totalGroupsWithPoints) {
    let scoreOriginal = scoreZero = scoreFull = 0;
    let courseIsWeighted = isWeighted(assignmentGroups);
        assignmentGroups.forEach(function(group) {
            if(group.total_possible > 0 && totalGroupsWithPoints > 0) {
                if(group.weight > 0 || courseIsWeighted === false) {
                    let calc = group.total_score / group.total_possible;
                    let zeroCalc = group.group_id === assignment.assignment_group_id ? group.total_score / (group.total_possible + assignment.points_possible) : calc;
                    let fullCalc = group.group_id === assignment.assignment_group_id ? (group.total_score + assignment.points_possible) / (group.total_possible + assignment.points_possible) : calc;
                    let useThisWeight = courseIsWeighted === true ? group.weight : (100 * (1/totalGroupsWithPoints));
                    scoreOriginal += (calc * (useThisWeight/100));
                    scoreZero += (zeroCalc * (useThisWeight/100)); 
                    scoreFull += (fullCalc * (useThisWeight/100));
                }
            }
        });
    return !isNaN(scoreZero) ? [(100 * (scoreOriginal - scoreZero)).toFixed(2),(100 * (scoreFull - scoreOriginal)).toFixed(2)] : [0,0];
}

function isWeighted(assignmentGroups) {
    let weighted = false;
    assignmentGroups.forEach(function(group) {
        if(group.weight > 0) {
            weighted = true;
        }
    });
    return weighted
}

function setAssignmentStatus(id, status) {
    if(class_done.length > 50) class_done = [];
    if (status === true) {
        class_done.push(id);
    } else {
        let pos = class_done.indexOf(id);
        class_done.splice(pos, 1);
    }
    chrome.storage.local.set({ assignments_done: class_done });
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
        cardcss.textContent += ".ic-DashboardCard:nth-of-type("+(i+1)+") .ic-DashboardCard__header_hero{background: linear-gradient(115deg, hsl(" + h + "deg," + s + "%," + l + "%) 5%, hsl(" + newh + "deg," + s + "%," + l + "%) 100%)!important}";
    }
}

function calculateGPA() {
    let weights = 0;
    let unweighted = 0;
    class_weights.forEach(function(course) {
        let weight = course["weight"] === 'ap' ? 1 : (course["weight"] === 'honors' ? .5 : 0);
        let score = course["score"];
        unweighted += score >= 89.5 ? 4 : (score < 89.5 && score >= 79.5  ? 3 : (score < 79.5 && score >= 69.5 ? 2 : (score < 69.5 && score >= 59.5 ? 1 : null)));
        weights += weight;
    }); 
    let gpaDiv = document.querySelector('.extension-calcgpa');
    let finalgpaweighted = ((unweighted + weights) / class_weights.length).toFixed(2);
    let finalgpaunweighted = (unweighted / class_weights.length).toFixed(2);
    gpaDiv.firstChild.textContent = 'Unweighted GPA: ' + finalgpaunweighted + ' | Weighted GPA: ' + finalgpaweighted;
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
            let weighted = { "score": score, "weight": 'regular', "class": i }
            class_weights.push(weighted);
            calculateGPA();
        }
    }
}

function makeChangeable(element, percent, number) {
    element.textContent = "";
    let changer = makeElement('input', 'percent', element);
    makeElement('span', 'gpachanger-percentage', element, '%');
    changer.value =  percent.replace('%', '');
    element.classList.remove('percent');
    changer.addEventListener('change', function() {
        class_weights.forEach(function(course) {
            if(course["class"] === number) course["score"] = changer.value;
            calculateGPA();
        });
    });
}

function createGPASelector(number) {
    let weightRadio = makeElement("div", "weightradio", document.querySelectorAll('.course_details tr')[number]);
    let weightSelections = makeElement("form", "weightform", weightRadio);
    weightSelections.setAttribute("data-class", number);
    weightSelections.innerHTML = '<input type="radio" name="weight" value="regular" checked> Regular<br><input type="radio" name="weight" value="honors"> Honors<br><input type="radio" name="weight" value="ap"> AP/IB';
    weightRadio.addEventListener('change', function(e) {
        class_weights.forEach(function(course) {
            if(course["class"] === parseInt(weightSelections.getAttribute("data-class"))) course["weight"] = e.target.value;
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