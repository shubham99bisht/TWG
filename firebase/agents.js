import { readData, writeData, searchReports, deleteData, fetchPaymentDetails } from "./helpers.js";

// Global Variables
let programs = {}, students = {}, universities = {}, agents = {}, currency = {}, studyStages = {}
let agent_summary = {}

async function fetchData() {
  programs = await readData("program_types")
  students = await readData("students")
  universities = await readData("universities")
  agents = await readData("agents")
  currency = await readData("currency_types")
  studyStages = await readData("study_stages")
}

/**
 * --------------------------------------------------
 * Download CSV
 * --------------------------------------------------
 */

let downloadData = {
  "payable": {}, "receivable": {}
}

function downloadCommissions(type, downloadName = 'data') {
  if (!Object.keys(downloadData).includes(type)) return;
  
  let data = downloadData[type];
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", blobUrl);
  link.setAttribute("download", downloadName + ".csv");

  link.click();

  URL.revokeObjectURL(blobUrl);
}
window.downloadCommissions = downloadCommissions

/**
 * --------------------------------------------------
 * Create new entry
 * --------------------------------------------------
 */

const addNewAgent = document.getElementById('agent-form')
if (addNewAgent) {
  addNewAgent.addEventListener('submit', event => {
    event.preventDefault();
    const formProps = new FormData(addNewAgent);
    const formData = Object.fromEntries(formProps);
    createAgent(formData)
  })
}

async function createAgent(data) {
  const agentId = document.getElementById('agentId').value
  const { name, phone, email, contactPerson, address,
    accountName, accountNumber, bank, ifsc
  } = data

  if (!agentId || !name || !phone || !email || !contactPerson || !address ) {
    failMessage("Please provide all data"); return
  }

  // const date = new Date()
  const newAgent = {
    name, phone, email, contactPerson, address,
    billing: {
      accountName, accountNumber, bank, ifsc
    }
  }

  const params = new URLSearchParams(document.location.search);
  if (!params.get('id')) {
    const oldAgent = await readData(`agents/${agentId}`)
    if (oldAgent) {
      failMessage("Agent Id already exists!"); return
    }
  }
  
  writeData(`agents/${agentId}`, newAgent)
    .then((result) => {
      if (result) {
        successMessage("Agent added successfully!")
          .then(() => location.href = "agents.html")
      } else {
        failMessage("Failed adding agent");
      }
    })
    .catch((error) => {
      failMessage("Error adding agent:", error);
    });
}
window.createAgent = createAgent


/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllAgents() {
  const tableBody = document.getElementById("table-agents-body");
  if (!tableBody) return
  tableBody.innerHTML = ''
  readData("agents")
    .then((agents) => {
      const schema = `
          <tr class="btn-reveal-trigger">
          <td class="name align-middle white-space-nowrap py-2">
            <h5 class="mb-0 fs--1"><a href="agent.html?id={}">{}</a></h5>
          </td>
          <td class="email align-middle py-2">{}</a></td>
          <td class="phone align-middle white-space-nowrap py-2">{}</td>
          <td class="payable align-middle text-center py-2">{}</td>
          <td class="receivable align-middle text-center py-2">{}</td>
          <td class="align-middle white-space-nowrap py-2 text-end">
            <div class="dropdown font-sans-serif position-static">
              <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal" type="button" id="customer-dropdown-0" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false"><span class="fas fa-ellipsis-h fs--1"></span></button>
              <div class="dropdown-menu dropdown-menu-end border py-0" aria-labelledby="customer-dropdown-0">
                <div class="py-2">
                  <a class="dropdown-item" href="agent.html?id={}">More Details</a>
                  <a class="dropdown-item text-warning" href="add_agent.html?id={}">Edit Agent</a>
                </div>
              </div>
            </div>
          </td>
        </tr>`

      let csvContent = 'ID,Name,Email,Phone,Payable,Receivable\r\n'
      const csvRow = '{},{},{},{},{},{}\r\n'  

      Object.keys(agents).forEach(id => {
        try {          
          const a = agents[id]
          let payable = agent_summary[id]?.payable || 0
          let receivable = agent_summary[id]?.receivable || 0;

          const row = schema.format(id, a.name, a.email, a.phone, payable, receivable, id, id, id)
          if (tableBody) tableBody.innerHTML += row

          const name =  a.name.includes(',') ? `"${a.name}"` : a.name
          csvContent += csvRow.format(id, name, a.email, a.phone, payable, receivable)
        } catch {}
      });

      window.csvContent = csvContent
      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="6">No Agent data found!</td></tr>`
    });
}
window.listAllAgents = listAllAgents


/**
 * --------------------------------------------------
 * Read Agent with id
 * --------------------------------------------------
 */

function readAgentDetails(id) {
  readData(`agents/${id}`)
    .then((result) => {
      if (!result) failMessage("Agent not found!");
      document.getElementById("agentId").innerHTML = id
      document.getElementById("update").href = `add_agent.html?id=${id}`
      document.getElementById("name").innerHTML = result?.name
      document.getElementById("phone").innerHTML = result?.phone
      document.getElementById("email").innerHTML = result?.email
      document.getElementById("contactPerson").innerHTML = result?.contactPerson
      document.getElementById("address").innerHTML = result?.address
      document.getElementById("accountName").innerHTML = result?.billing?.accountName
      document.getElementById("accountNumber").innerHTML = result?.billing?.accountNumber
      document.getElementById("bank").innerHTML = result?.billing?.bank
      document.getElementById("ifsc").innerHTML = result?.billing?.ifsc
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error fetching agent");
    });
}
window.readAgentDetails = readAgentDetails

async function readPaymentDetails(id) {
  const userRole = localStorage.getItem("userRole")
  const isAgent = userRole == 'Agent' ? true : false

  const data = await fetchPaymentDetails('agent', id)
  const payableBody = document.getElementById("table-payable-body");
  const receivableBody = document.getElementById("table-receivable-body");
  await updatePayables(payableBody, data["payable"], "payable")
  if (!isAgent) {
    await updatePayables(receivableBody, data["receivable"], "receivable")
  }
  listInit()
}
window.readPaymentDetails = readPaymentDetails

async function updatePayables(tableBody, payables, type) {
  tableBody.innerHTML = ''
  const schema = `<tr class="btn-reveal-trigger">
    <td class="align-middle white-space-nowrap student">{}<br><a href="student_details.html?id={}">Details</a></td>
    <td class="align-middle university">{}<br><a href="university_details.html?id={}">Details</a></td>
    <td class="align-middle stage">{}</td>
    <td class="align-middle text-nowrap fees">{}</td>
    <td class="align-middle text-nowrap amount">{}</td>
    <td class="align-middle text-nowrap duedate">{}</td>
    <td class="align-middle fs-0 white-space-nowrap status text-center">
      {}
    </td>
  </tr>`

  let csvContent = 'Student,University,Agent,Study Stage,Fees,Amount,Due Date,Status,Notes\r\n';
  // student, univ, agent, stage, fees, amount, due date, status, notes
  const csvRow = '{},{},{},{},{},{},{},{},{}\r\n'  

  const promises = Object.keys(payables).map(async id => {
    try {
      const p = payables[id]
      const AgentName = agents[p.agent].name
      const StudentName = students[p.student].studentName
      const UniversityName = universities[p?.university].name
  
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
  
      const row = schema.format(StudentName, p.student, UniversityName, p.university,
          stage.name, `${p.fees} ${currency[p.feesCurrency].name}`, amount, p.dueDate, status)
        if (tableBody) tableBody.innerHTML += row

      csvContent += csvRow.format(StudentName, UniversityName, AgentName, stage.name, `${p.fees} ${currency[p.feesCurrency].name}`, amount, p.dueDate, p?.status, p?.notes || '')
    } catch (e) { console.log(e); console.log(id) }
  });

  if (!Object.keys(payables).length) {
    tableBody.innerHTML = `<tr class="text-center"><td colspan="8">No payments data</td></tr>`
  }

  if (downloadData) {
    downloadData[type] = csvContent;
  }  

  await Promise.all(promises)
}

/**
 * --------------------------------------------------
 * Update Agent with id
 * --------------------------------------------------
 */

function prepareUpdateForm(id) {
  readData(`agents/${id}`)
    .then((result) => {
      if (!result) failMessage("Agent not found!");
      const agentIdInput = document.getElementById("agentId")
      agentIdInput.value = id; agentIdInput.disabled = true;
      document.getElementById("name").value = result?.name
      document.getElementById("phone").value = result?.phone
      document.getElementById("email").value = result?.email
      document.getElementById("contactPerson").value = result?.contactPerson
      document.getElementById("address").value = result?.address
      document.getElementById("accountName").value = result?.billing?.accountName
      document.getElementById("accountNumber").value = result?.billing?.accountNumber
      document.getElementById("bank").value = result?.billing?.bank
      document.getElementById("ifsc").value = result?.billing?.ifsc
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error fetching agent");
    });
}

/**
 * --------------------------------------------------
 * Delete Agent
 * --------------------------------------------------
 */

function deleteAgent(id) {
  if (confirm(`Confirm delete agent with id: ${id}`))
  deleteData(`agents/${id}`)
    .then((result) => {
      if (result) {
        successMessage("Agent deleted successfully!")
        .then(() => location.reload())
      }
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error deleting agent:", error);
    });
}
// window.deleteAgent = deleteAgent


/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = async () => {
  const pageName = window.location.pathname.split('/').pop().split(".html")[0];
  switch (pageName) {
    case "agents": {
      const payables = await searchReports({status: 'pending', reportType: 'payable'})
      const receivables = await searchReports({status: 'pending', reportType: 'receivable'})

      payables.map(tr => {
        const aid = tr.agent
        if (!agent_summary[aid]) {
          agent_summary[aid] = { payable: 0, receivable: 0 };
        }
        agent_summary[aid].payable += 1;
      })
      receivables.map(tr => {
        const aid = tr.agent
        if (!agent_summary[aid]) {
          agent_summary[aid] = { payable: 0, receivable: 0 };
        }
        agent_summary[aid].receivable += 1;
      })

      listAllAgents();
      break;
    }
    case "agent": {
      const params = new URLSearchParams(document.location.search);
      const id = params.get('id')
      if (!id) location.href = "agents.html"

      await fetchData()
      readAgentDetails(id);
      readPaymentDetails(id)
      break;
    }
    case "add_agent": {
      const params = new URLSearchParams(document.location.search);
      const id = params.get('id')
      if (id) prepareUpdateForm(id)
      // Don't do anything
      // onSubmit eventListener already added
    }
  }
}
