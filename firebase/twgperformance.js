import { readData, writeData, getDates } from "./helpers.js";

let universities = {}, programs = {}
const twgDatasChoices = new Choices(document.getElementById("twgProgramDropdown"),
    {
        removeItems: true,
        removeItemButton: true
    }
);

const twgUniversity = new Choices(document.getElementById("twgUniversityDropdown"),
    {
        removeItems: true,
        removeItemButton: true
    }
);

const twgModule = new Choices(document.getElementById("twgModuleDropdown"),
    {
        removeItems: true,
        removeItemButton: true
    }
);

async function initialise() {

    const temp = Object.keys(programs).map(stageId => {
        let twgData = programs[stageId]
        if (twgData) {
            return {
                value: stageId,
                label: twgData.name
            }
        }
    });
    twgDatasChoices.setChoices(temp)

    const temp2 = Object.keys(universities).map(stageId => {
        let studyStage = universities[stageId]
        if (studyStage) {
            return {
                value: stageId,
                label: studyStage?.name
            }
        }
    });
    twgUniversity.setChoices(temp2)

    const allModules = [];
    Object.keys(programs).forEach(key => {
        const modules = programs[key].modules;
        modules && modules.forEach(module => {
            allModules.push({
                label: module,
                value: module
            });
        });
    });
    twgModule.setChoices(allModules)

    const [startOfYear, currentDate] = getDates();
    const datepickerInstance = flatpickr("#datepicker", {
        mode: 'range', dateFormat: 'M d Y', 'disableMobile':true,
        'defaultDate': [startOfYear, currentDate] 
    });

    document.getElementById('searchButton').addEventListener('click', function () {
        let twgDatas = []
        let twgUniversity = [];
        let twgModule = [];

        for(let i = 0; i < twgModuleDropdown.options.length; i++) {
          const value = twgModuleDropdown.options[i]?.value;
          twgModule.push(value)
        }

        for(let i = 0; i < twgProgramDropdown.options.length; i++) {
            const value = twgProgramDropdown.options[i]?.value;
            twgDatas.push(value)
        }

        for(let i = 0; i < twgUniversityDropdown.options.length; i++) {
            const value = twgUniversityDropdown.options[i]?.value;
            twgUniversity.push(value)
        }

        const dateRange = datepickerInstance.selectedDates.map(date => date.toISOString().split('T')[0]);
    
        const inputParams = {
            twgDatas, twgUniversity, twgModule, startDate: dateRange[0], endDate: dateRange[1]
        }
        listAllEnroll(inputParams)
      });  
}

// Initialise filters
async function fetchData() {
    universities = await readData("universities")
    programs = await readData("program_types")
}

function listAllEnroll(inputParams) {
    const tableBody = document.getElementById("table-payable-body");
    const { twgDatas, twgUniversity, twgModule, startDate, endDate } = inputParams;
    if (!tableBody) return
    tableBody.innerHTML = ''

    readData(`students`)
        .then(async (data) => {
            const schema = `<tr class="btn-reveal-trigger" id="{}">
                <td class="align-middle student"><a href="student_details.html?id={}">{}</a></td>
                <td class="align-middle studentEmail">{}</td>
                <td class="align-middle program_type">{}</td>
                <td class="align-middle university">{}</td>
                <td class="align-middle startDate">{}</td>
                <td class="align-middle name">{}</td>
                <td class="align-middle term">{}</td>
                <td class="align-middle overallGradeTWG">{}</td>
                <td class="align-middle status">{}</td>
                <td class="align-middle result">{}</td>
                <td class="align-middle grade">{}</td>
                <td class="align-middle text-nowrap notes">{}</td>
            </tr>`;

            let csvContent = 'Student, Student Email,Program Type, University, Start Date, Module, Term, Overall Grade, Status, Result, Grade, Notes\r\n';

            // student, univ, agent, program type, stage, fees, amount, due date, status, notes
            const csvRow = '{},{},{},{},{},{},{},{},{},{},{},{}\r\n'

            const transformedData = [];
        
            Object.values(data).forEach(user => {
                if (user.learningPlan && user.learningPlan.length > 0) {
                    user.learningPlan.forEach(plan => {
                        const termName = plan['name'];
                        if (plan.modules && plan.modules.length > 0) {
                            plan.modules.forEach(item => {
                                const transformedUser = { termName, ...user, ...plan, ...item, };
                                delete transformedUser.learningPlan;
                                transformedData.push(transformedUser);
                            })
                        }
                    });
                }
            });

            const filteredData = transformedData.filter(user => {
                if (twgDatas && twgDatas.length && !twgDatas.includes(user.program_type)) {
                    return false;
                }
                if (twgUniversity && twgUniversity.length && !twgUniversity.includes(user.university)) {
                    return false;
                }
                if (twgModule && twgModule.length && !twgModule.includes(user.name)) {
                    return false;
                }
                if (startDate && !(user.startDate >= startDate)) {
                    return false;
                }

                if (endDate && !(user.startDate <= endDate)) {
                    return false;
                }
                return true;
            })

            const promises = Object.keys(filteredData).map(async id => {
                try {
                    const p = filteredData[id];
                    const studentId = p['studentId'];
                    const UniversityName = universities[p?.university].name;
                    const ProgramName = programs[p?.program_type].name;
                    const row = schema.format(studentId, studentId, p?.studentName, p?.studentEmail, ProgramName, UniversityName, p?.startDate, p?.name, p?.termName, p?.overallGrade || '', p?.enrollmentStatus, p?.result, p?.grade, p?.notes || '');
                    if (tableBody) tableBody.innerHTML += row;
                    csvContent += csvRow.format(studentId, studentId, p?.studentName, p?.studentEmail, ProgramName, UniversityName, p?.startDate, p?.name, p?.termName, p?.overallGrade || '', p?.result, p?.grade, p?.enrollmentStatus, p?.notes || '');
                } catch (e) {
                    console.log("ERRROR:", e)
                }
            });

            await Promise.all(promises)
            window.csvContent = csvContent
            listInit()
        })
        .catch((error) => {
            console.error("Error reading program types:", error);
            if (tableBody)
                tableBody.innerHTML = `<tr class="text-center"><td colspan="10">No Receivable data found!</td></tr>`
        });
}

window.onload = async () => {
    await fetchData()
    //listAllEnroll()
    initialise()
}
