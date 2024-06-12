import { readData, writeData } from "./helpers.js";

let universities = {}, programs = {}

// Initialise filters
async function fetchData() {
    universities = await readData("universities")
    programs = await readData("program_types")
}

function listAllEnroll() {
    const tableBody = document.getElementById("table-payable-body");
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
                <td class="align-middle result">{}</td>
                <td class="align-middle grade">{}</td>
                <td class="align-middle text-nowrap notes">{}</td>
            </tr>`;

            let csvContent = 'Student, Student Email,Program Type, University, Start Date, Module, Result, Grade, Notes\r\n';

            // student, univ, agent, program type, stage, fees, amount, due date, status, notes
            const csvRow = '{},{},{},{},{},{},{},{},{}\r\n'

            const promises = Object.keys(data).map(async id => {
                try {

                    const p = data[id];
                    const UniversityName = universities[p?.university].name;
                    const ProgramName = programs[p?.program_type].name;

                    p.learningPlan && p.learningPlan.forEach(plan => {
                        plan.modules && plan.modules.forEach(moduleData => {
                            const row = schema.format(id, id, p?.studentName, p?.studentEmail, ProgramName, UniversityName, plan?.startDate, plan?.name, moduleData?.result, moduleData?.grade, moduleData?.notes || '');
                            if (tableBody) tableBody.innerHTML += row;
                            csvContent += csvRow.format(id, id, p?.studentName, p?.studentEmail, ProgramName, UniversityName, plan?.startDate, plan?.name, moduleData?.result, moduleData?.grade, moduleData?.notes || '');
                        })
                    });

                } catch (e) {
                    console.log("ERRROR:", e)
                }
            });

            await Promise.all(promises)
            window.csvContent = csvContent
            listInit()
        })
        .catch(() => {
            console.error("Error reading program types:", error);
            if (tableBody)
                tableBody.innerHTML = `<tr class="text-center"><td colspan="10">No Receivable data found!</td></tr>`
        });
}

window.onload = async () => {
    await fetchData()
    listAllEnroll()
}
