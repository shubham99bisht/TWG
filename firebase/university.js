import { readData, fetchPaymentDetails } from "./helpers.js";

// Global Variables
let programs = {}, students = {}, universities = {}, agents = {}

async function fetchData() {
  programs = await readData("program_types")
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
}

/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAll() {
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ''
  readData("universities")
    .then((university) => {
      console.log(university)
      Object.keys(university).forEach(uid => {
        const data = university[uid]
        data.programTypes.forEach(programType => {
          const programName = programs[programType.type]?.name
          programType.paymentStages.forEach(paymentStage => {
            const newRow = tableBody.insertRow();
            newRow.innerHTML = `
              <td><a href="university_details.html?id=${uid}">${data.name}</a></td>
              <td>${programName}</td>
              <td>${paymentStage.stage}</td>
              <td>
                ${paymentStage.commissions[0].value}${paymentStage.commissions[0].type == 'percentage' ? '%' : ''}
                <br> ${paymentStage.commissions[0].installmentDays} days
              </td>
              <td>
                ${paymentStage.commissions[1].value}${paymentStage.commissions[1].type == 'percentage' ? '%' : ''}
                <br> ${paymentStage.commissions[1].installmentDays} days
              </td>`;
          });
        });
      })
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading Universities:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr class="text-center"><td colspan="3">Error reading Universities</td></tr>`
    });
}
window.listAll = listAll

function listOne(id) {  
  const tableBody = document.getElementById("table-body");
  tableBody.innerHTML = ''

  readData(`universities/${id}`)
    .then((data) => {
      console.log(data)
      document.getElementById("agentId").innerHTML = id
      document.getElementById("name").innerHTML = data?.name
      document.getElementById("accountName").innerHTML = data?.billing?.accountName
      document.getElementById("accountNumber").innerHTML = data?.billing?.accountNumber
      document.getElementById("bank").innerHTML = data?.billing?.bank
      document.getElementById("ifsc").innerHTML = data?.billing?.ifsc
      data.programTypes.forEach(programType => {
        const programName = programs[programType.type]?.name
        programType.paymentStages.forEach(paymentStage => {
          const newRow = tableBody.insertRow();
          newRow.innerHTML = `
            <td>${data.name}</td>
            <td>${programName}</td>
            <td>${paymentStage.stage}</td>
            <td>
              ${paymentStage.commissions[0].value}${paymentStage.commissions[0].type == 'percentage' ? '%' : ''}
              <br> ${paymentStage.commissions[0].installmentDays} days
            </td>
            <td>
              ${paymentStage.commissions[1].value}${paymentStage.commissions[1].type == 'percentage' ? '%' : ''}
              <br> ${paymentStage.commissions[1].installmentDays} days
            </td>`;
        });
      });
    })
    .catch((error) => {
      console.error("Error reading Universities:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr class="text-center"><td colspan="3">Error reading Universities</td></tr>`
    });
}
window.listOne = listOne

async function readPaymentDetails(id) {
  const data = await fetchPaymentDetails('university', id)
  const payableBody = document.getElementById("table-payable-body");
  const receivableBody = document.getElementById("table-receivable-body");
  await updatePayables(payableBody, data["Payable"])
  await updatePayables(receivableBody, data["Receivable"])
  listInit()
}
window.readPaymentDetails = readPaymentDetails

async function updatePayables(tableBody, payables) {
  tableBody.innerHTML = ''
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

  if (!Object.keys(payables).length) {
    tableBody.innerHTML = `<tr class="text-center"><td colspan="8">No payments data</td></tr>`
  }

  await Promise.all(promises)
}

/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = async function() {
  await fetchData()
  const pageName = window.location.pathname.split('/').pop().split(".html")[0];
  switch (pageName) {
    case 'universities': {
      listAll(); break;
    }
    case 'university_details': {
      const params = new URLSearchParams(document.location.search);
      const id = params.get('id')
      if (!id) location.href = "universities.html"
      listOne(id); 
      await readPaymentDetails(id);
      listInit()
      break;
    }
  }
};
