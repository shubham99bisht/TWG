import { getDates, readData, searchReports } from "./helpers.js";

let students = {}, universities = {}, agents = {}, programs = {}, studyStages = {}, currency = {}

const CommissionType = 'payable'

// Initialise filters
function initialise() {
  const [startOfYear, currentDate] = getDates();
  // Initialize Datepicker
  const datepickerInstance = flatpickr("#datepicker", {
    mode: 'range', dateFormat: 'M d Y', 'disableMobile':true,
    'defaultDate': [startOfYear, currentDate] 
  });

  document.getElementById('searchButton').addEventListener('click', function () {
    let status = [];
    for(let i = 0; i < statusDropdown.options.length; i++) {
      const value = statusDropdown.options[i]?.value;
      status.push(value)
    }
    const dateRange = datepickerInstance.selectedDates.map(date => date.toISOString().split('T')[0]);

    const inputParams = {
      status, startDate: dateRange[0], endDate: dateRange[1]
    }
    listAllPayables(inputParams)
  });  
}

/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllPayables(inputParams) {
  const tableBody = document.getElementById("table-payable-body");
  if (!tableBody) return
  tableBody.innerHTML = ''
  searchReports({...inputParams, reportType: `${CommissionType}`})
    .then(async (payables) => {
      const schema = `<tr class="btn-reveal-trigger" id="{}">
        <td class="align-middle student"><a href="student_details.html?id={}">{}</a></td>
        <td class="align-middle university"><a href="university_details.html?id={}">{}</a></td>
        <td class="align-middle agent"><a href="agent.html?id={}">{}</a></td>
        <td class="align-middle program_type">{}</td>
        <td class="align-middle stage">{}</td>
        <td class="align-middle text-nowrap fees">{}</td>
        <td class="align-middle text-nowrap amount">{}</td>
        <td class="align-middle text-nowrap duedate">{}</td>
        <td class="align-middle fs-0 white-space-nowrap status text-center">
        {}
        </td>
        <td class="align-middle text-nowrap notes">{}</td>
      </tr>`

      let csvContent = 'Student,University,Agent,Program Type,Study Stage,Fees,Amount,Due Date,Status,Notes\r\n';
      // student, univ, agent, program type, stage, fees, amount, due date, status, notes
      const csvRow = '{},{},{},{},{},{},{},{},{},{}\r\n'

      const promises = Object.keys(payables).map(async id => {
        try {
          const p = payables[id]
          const AgentName = agents && agents[p.agent]?.name || ''
          const StudentName = students[p.student].studentName
          const UniversityName = universities[p?.university].name
          const ProgramName = programs[p?.program_type].name
  
          const stage = studyStages[p.stage]
          let status = ''
          switch (p?.status) {
            case 'confirmed': {
              status = '<span class="badge badge rounded-pill badge-soft-success">Confirmed<span class="ms-1 fas fa-check" data-fa-transform="shrink-2"></span></span>'
              break
            }
            case 'invoiced': {
              status = '<span class="badge badge rounded-pill badge-soft-warning">Invoiced<span class="ms-1 fas fa-check" data-fa-transform="shrink-2"></span></span>'
              break
            }
            case 'paid': {
              status = '<span class="badge badge rounded-pill badge-soft-success">Paid<span class="ms-1 fas fa-check" data-fa-transform="shrink-2"></span></span>'
              break
            }
            case 'na': {
              status = '<span class="badge badge rounded-pill badge-soft-secondary">N/A<span class="ms-1 fas fa-ban" data-fa-transform="shrink-2"></span></span>'
              break
            }
            case 'pending': 
            default: {
              status = '<span class="badge badge rounded-pill badge-soft-warning">Pending<span class="ms-1 fas fa-stream" data-fa-transform="shrink-2"></span></span>'
              break
            }
          }

          let amount = 'N/A'
          if (p.amount && p.currency) {
            amount = `${p.amount} ${currency[p.currency].name}`
          } else if (p.amount) {
            amount = `${p.amount}%`
          }          
  
          const row = schema.format(id, p.student, StudentName, p.university, UniversityName,
            p.agent, AgentName, ProgramName, stage.name, `${p.fees} ${currency[p.feesCurrency].name}`, amount, p.dueDate, status, p?.notes || '')
          if (tableBody) tableBody.innerHTML += row

          csvContent += csvRow.format(StudentName, UniversityName,  AgentName, ProgramName, stage.name, `${p.fees} ${currency[p.feesCurrency].name}`, amount, p.dueDate, p?.status, p?.notes || '')
        } catch {}
      });

      await Promise.all(promises)

      window.csvContent = csvContent
      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="10">No Payables found!</td></tr>`
    });
}
window.listAllPayables = listAllPayables

/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = async () => {
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
  programs = await readData("program_types")
  studyStages = await readData("study_stages")
  currency = await readData("currency_types")
  initialise()
}
