'use strict';
var class_weights = [];
var class_done;
const domain = 'https://' + window.location.hostname;
const current_page = window.location.pathname;



if(domain.match(/canvas|instructure/g)) {
if (current_page === '/' || current_page === '') {
    let stop = 0;
    let dashboardready = setInterval(function() {
        if (document.querySelectorAll('.ic-DashboardCard__header')[0]) {
            chrome.storage.local.get(['gradient_cards'], function(result) {
                if (result.gradient_cards === true) {
                    let cardheads = document.querySelectorAll('.ic-DashboardCard__header_hero');
                    for (let i = 0; i < cardheads.length; i++) {
                        let colorone = cardheads[i].style.backgroundColor.split(',');
                        let r = parseInt(colorone[0].split('(')[1]);
                        let g = parseInt(colorone[1]);
                        let b = parseInt(colorone[2]);
                        let h = rgbToHsl(r, g, b)[0];
                        let s = rgbToHsl(r, g, b)[1];
                        let l = rgbToHsl(r, g, b)[2];
                        let newh = h > 180 ? h - ((h / 180) * 40) : ((1 + (180 / (h + 180))) * 28) + h;
                        cardheads[i].style.background = "linear-gradient(120deg, hsl(" + h + "deg," + s + "%," + l + "%) 5%, hsl(" + newh + "deg," + s + "%," + l + "%) 100%)";
                    }
                }
            });
            chrome.storage.local.get(['assignments_due'], function(result) {
                if (result.assignments_due !== false) {
                    getData(domain + '/api/v1/dashboard/dashboard_cards').then(function(data) {
                        for (let i = 0; i < data.length; i++) {
                            let assignmentsContainer = makeElement("div", "extension-ac", [["h3", "extension-at"]]);
                            assignmentsContainer.firstChild.textContent = 'Assignments Due';
                            document.querySelectorAll('.ic-DashboardCard')[i].appendChild(assignmentsContainer);
                            insertAssignments(data[i].id, assignmentsContainer);
                        }
                    });
                }
            });
            chrome.storage.local.get(["assignments_done"], function(result) {
                class_done = Object.keys(result).length !== 0 ? result.assignments_done : [];
            });
            clearInterval(dashboardready);
        }
        stop > 200 ? clearInterval(dashboardready) : stop++;
    }, 100);
}



if (current_page === '/grades') {
    chrome.storage.local.get(['gpa_calc'], function(result) {
        if (result.gpa_calc !== false) {
            let gpaDiv = makeElement("tr", "extension-calcgpa", [["td", "extension-gpa"]]);
            document.querySelector('.student_grades > tbody').appendChild(gpaDiv);
            let courseplace = document.querySelectorAll('td.course > a');
            getData(domain + '/api/v1/users/self/enrollments').then(function(data) {
                gpaCalcSetup(data);
                for (let i = 0; i < class_weights.length; i++) {
                    let location;
                    for (let e = 0; e < courseplace.length; e++) {
                        if (courseplace[e].getAttribute("href").split('/')[2] == class_weights[i].id) {
                            location = document.querySelectorAll('.grading_period_dropdown')[e];
                        }
                    }
                    insertWeightSelection(class_weights[i].id, location);
                }
                calculateGPA();
            });
        }
    });
}



if (current_page.match(/courses/g) && current_page.match(/grades/g)) {
    chrome.storage.local.get(['gpa_calc'], function(result) {
        if (result.gpa_calc != false) {
            let hypogpacalcDiv = makeElement("div", "hypogpacalc");
            let gpaDiv = makeElement("tr", "extension-calcgpa", [["td", "extension-gpa"]]);
            insertAfter(document.querySelector("#grade-summary-content"), hypogpacalcDiv);
            hypogpacalcDiv.appendChild(gpaDiv);
            let hypocalcformCollector = makeElement("div", "hypocalcform-collector");
            hypogpacalcDiv.appendChild(hypocalcformCollector);
            getData(domain + '/api/v1/users/self/enrollments').then(function(data) {
                gpaCalcSetup(data);
                for (let i = 0; i < class_weights.length; i++) {
                    getData(domain + '/api/v1/courses/' + class_weights[i].id).then(function(data) {
                        let hypodiv = makeElement("div", "hypodivcalc", [["span"]]);
                        hypodiv.firstChild.textContent = data.name;
                        document.querySelector('.hypocalcform-collector').appendChild(hypodiv);
                        let location = hypodiv.lastChild;
                        insertWeightSelection(class_weights[i].id, location);
                    });
                }
                calculateGPA();
            });
            document.querySelector('#grade_entry').addEventListener('change', function() {
                setTimeout(function() {
                    let newgrade = document.querySelector('.student_assignment.final_grade .grade').innerHTML.split('%')[0];
                    let thiscourseid = current_page.split('/')[2];
                    for (let i = 0; i < class_weights.length; i++) {
                        if(class_weights[i].id == thiscourseid) class_weights[i].score = parseFloat(newgrade);
                    }
                    calculateGPA();
                }, 50);
            });
        }
    });
}



if ((current_page.split('/')[1]) === 'courses' && (current_page.split('/')[3]) === 'assignments' || current_page.split('/')[1] === 'courses' && (current_page.split('/')[3]) === 'pages') {
    chrome.storage.local.get(['link_preview'], function(result) {
        if (result.link_preview != false) {
            let assignmentready = setInterval(function() {
                if (document.querySelector('#content')) {
                    let links = document.querySelector("#assignment_show") ? document.querySelectorAll("#assignment_show a") : document.querySelectorAll("#wiki_page_show a");
                    for (let i = 0; i < links.length; i++) {
                        let link = links[i].href;
                        let source = link.match(/youtube|instructure/g);
                        let embedlink;
                        if (source) {
                            switch (source[0]) {
                                case "youtube":
                                    let embed = "https://youtube.com/embed/";
                                    let afterembed = link.split('.com/')[1].split('&')[0].replace("watch?v=", "");
                                    embedlink = embed + afterembed;
                                    break;
                            }
                        } else {
                            embedlink = link;
                        }
                        if (!source || source[0] != 'instructure') {
                            let showembed = makeElement("button", "extension-linkpreview");
                            showembed.textContent = "show link";
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
                            insertAfter(links[i], showembed);
                        }
                    }
                    clearInterval(assignmentready);
                }
            }, 20);
        }
    });
}
}



function makeElement(element, elclass, children = []) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    if(children) {
        for(let i = 0; i < children.length; i++) {
            let child = document.createElement(children[i][0]);
            if(children[i][1]) child.classList.add(children[i][1]);
            creation.appendChild(child);
        }
    }
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



function insertAssignments(id, card) {
    getData(domain + '/api/v1/courses/' + id + '/assignments?order_by=due_at&bucket=future').then(function(data) {
        if (data.length === 0) {
            let assignmentEmptyDiv = makeElement("div", "extension-al", [["span"]]);
            assignmentEmptyDiv.firstChild.textContent = 'None';
            card.appendChild(assignmentEmptyDiv);
        } else {
            for (let i = 0; i < data.length; i++) {
                if (data[i].due_at === null) {
                    var month = 'n';
                    var day = 'a';
                } else {
                    let datadate = new Date(data[i].due_at);
                    var month = datadate.getMonth() + 1;
                    var day = datadate.getDate();
                }
                let bigAssignmentDiv = makeElement("div", "extension-assignment", [["a", "extension-al"], ["span", "extension-aldue"]]);
                let duedateselector = bigAssignmentDiv.children[1];
                bigAssignmentDiv.firstChild.setAttribute("href", domain + '/courses/' + id + '/assignments/' + data[i].id);
                bigAssignmentDiv.firstChild.textContent = data[i].name;
                duedateselector.setAttribute("data-aid", data[i].id);
                duedateselector.textContent = month + '/' + day;
                if (class_done.length !== 0) {
                    for (let num = 0; num < class_done.length; num++) {
                        if (class_done[num] == data[i].id) duedateselector.classList.add("extension-completed");
                    }
                }
                card.appendChild(bigAssignmentDiv);
                duedateselector.addEventListener('mouseup', function() {
                    this.classList.toggle('extension-completed');
                    let completestatus = this.classList.contains('extension-completed');
                    setAssignmentStatus(this.dataset.aid, completestatus);
                });
            }
        }
    });
}



function insertWeightSelection(id, location) {
    let weightRadio = makeElement("div", "weightradio", [["form", "weightform"]]);
    weightRadio.firstChild.setAttribute("data-id", id);
    weightRadio.firstChild.innerHTML = '<input type="radio" name="weight" value="regular" checked> Regular<br><input type="radio" name="weight" value="honors"> Honors<br><input type="radio" name="weight" value="ap"> AP/IB';
    insertAfter(location, weightRadio);
    weightRadio.addEventListener('change', function(e) {
        for (let i = 0; i < class_weights.length; i++) {
            if (class_weights[i].id === parseInt(this.firstChild.getAttribute("data-id"))) {
                class_weights[i].weight = e.target.value;
                calculateGPA();
            }
        }
    });
}



function gpaCalcSetup(data) {
    for (let i = 0; i < data.length; i++) {
        let score = data[i].grades.current_score;
        if(score != null) {
            let weighted = {
                "score": score,
                "weight": 'regular',
                "id" : data[i].course_id
            }
            class_weights.push(weighted);
        }
    }
}



function calculateGPA() {
    let weights = 0;
    let unweighted = 0;
    for (let i = 0; i < class_weights.length; i++) {
        let weight = class_weights[i].weight === 'ap' ? 1 : (class_weights[i].weight === 'honors' ? .5 : 0);
        let score = class_weights[i].score;
        unweighted += score >= 89.5 ? 4 : (score < 89.5 && score >= 79.5  ? 3 : (score < 79.5 && score >= 69.5 ? 2 : (score < 69.5 && score >= 59.5 ? 1 : 0)));
        weights += weight;
    }
    let gpaDiv = document.querySelector('.extension-calcgpa');
    let finalgpaweighted = ((unweighted + weights) / class_weights.length).toFixed(2);
    let finalgpaunweighted = (unweighted / class_weights.length).toFixed(2);
    gpaDiv.firstChild.textContent = 'Unweighted GPA: ' + finalgpaunweighted + ' | Weighted GPA: ' + finalgpaweighted;
}



function setAssignmentStatus(id, status) {
    if(class_done.length > 50) class_done = [];
    if (status === true) {
        class_done.push(id);
    } else {
        let pos = class_done.indexOf(id);
        class_done.splice(pos, 1);
    }
    chrome.storage.local.set({
        assignments_done: class_done
    });
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
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}
