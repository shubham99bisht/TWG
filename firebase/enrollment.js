import { readData } from "./helpers.js";

let universities = {}, programs = {}, studyStages = {};


async function fetchData() {
    universities = await readData("universities")
    programs = await readData("program_types")
    studyStages = await readData("study_stages")
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
                <td class="align-middle universityDegree">{}</td>
                <td class="align-middle studyStage">{}</td>
                <td class="align-middle enrollmentStatus">{}</td>
                <td class="align-middle startDate">{}</td>
                <td class="align-middle status">{}</td>
                <td class="align-middle text-nowrap notes">{}</td>
            </tr>`;

            let csvContent = 'Student, Student Email,Program Type, University, Degree, Study Stage, Status, Start Date, Status, Notes\r\n';

            // student, email, program type, university, university degree, status, start date, status, notes
            const csvRow = '{},{},{},{},{},{},{},{},{},{}\r\n'

            const promises = Object.keys(data).map(async id => {
                try {
                    const p = data[id];
                    const UniversityName = universities[p?.university].name;
                    const ProgramName = programs[p?.program_type].name;
                    p.studyPlan && p.studyPlan.forEach(function (plan) {
                        const row = schema.format(id, id, p.studentName, p.studentEmail, ProgramName, 
                            UniversityName, p.universityDegree, studyStages?.[plan?.studyStage]?.name || '',
                            p.enrollmentStatus, plan.startDate, plan.status, plan?.notes || ''
                        );
                        if (tableBody) tableBody.innerHTML += row;
                        csvContent += csvRow.format(p.studentName, p.studentEmail, ProgramName, UniversityName, p.universityDegree, studyStages?.[p?.studyStage]?.name || '', p.enrollmentStatus, plan.startDate, plan.status, plan?.notes || '');
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
