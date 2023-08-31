import { readData } from "./helpers.js";

let students = {}, universities = {}, agents = {}
/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */
function listAllReceivables() {
  const tableBody = document.getElementById("table-payable-body");
  if (!tableBody) return
  tableBody.innerHTML = ''
  readData("receivable")
    .then(async (payables) => {
      const schema = `<tr class="btn-reveal-trigger">
        <td class="align-middle white-space-nowrap student"><a href="student_details.html?id={}">{}</a></td>
        <td class="align-middle white-space-nowrap university"><a href="university_details.html?id={}">{}</a></td>
        <td class="align-middle white-space-nowrap agent"><a href="agent.html?id={}">{}</a></td>
        <td class="align-middle stage">{}</td>
        <td class="align-middle amount">{}</td>
        <td class="align-middle text-nowrap duedate">{}</td>
        <td class="align-middle fs-0 white-space-nowrap status text-center">
          {}
        </td>
        <td class="align-middle white-space-nowrap text-end">
          <div class="dropstart font-sans-serif position-static d-inline-block">
            <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal float-end" type="button" id="dropdown-recent-purchase-table-1" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false" data-bs-reference="parent"><span class="fas fa-ellipsis-h fs--1"></span></button>
            <div class="dropdown-menu dropdown-menu-end border py-2" aria-labelledby="dropdown-recent-purchase-table-1"><a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#view-details">View</a><a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#view-details">Edit</a>
              <div class="dropdown-divider"></div><a class="dropdown-item text-warning"  data-bs-toggle="modal" data-bs-target="#update-status">Update Status</a>
            </div>
          </div>
        </td>
      </tr>`

      const promises = Object.keys(payables).map(async id => {
        const p = payables[id]
        const AgentName = agents[p.agent].name
        const StudentName = students[p.student].studentName
        const UniversityName = universities[p?.university].name

        const stage = paymentStages.find(s => s.value == p.stage)
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

        const row = schema.format(p.student, StudentName, p.university, UniversityName,
          p.agent, AgentName, stage.label, p.amount, p.dueDate, status)
        if (tableBody) tableBody.innerHTML += row
      });

      await Promise.all(promises)

      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="6">No Agent data found!</td></tr>`
    });
}
window.listAllReceivables = listAllReceivables


/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = async () => {
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
  listAllReceivables()
}
