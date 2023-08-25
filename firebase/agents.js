import { readData, writeData, deleteData } from "./helpers.js";

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

  console.log(data)

  if (!agentId || !name || !phone || !email 
    || !contactPerson || !address || !accountName
    || !accountNumber || !bank || !ifsc
  ) {
    failMessage("Please provide all data"); return
  }

  // const date = new Date()
  const newAgent = {
    name, phone, email, contactPerson, address,
    billing: {
      accountName, accountNumber, bank, ifsc
    },
    // createdAt: date, updatedAt: date
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
          <td class="id align-middle white-space-nowrap py-2">{}</td>
          <td class="name align-middle white-space-nowrap py-2">
              <h5 class="mb-0 fs--1"><a href="agent.html?id={}">{}</a></h5>
          </td>
          <td class="email align-middle py-2"><a href="mailto:{}">{}</a></td>
          <td class="phone align-middle white-space-nowrap py-2">{}</td>
          <td class="address align-middle ps-5 py-2">{}</td>
          <td class="align-middle white-space-nowrap py-2 text-end">
            <div class="dropdown font-sans-serif position-static">
              <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal" type="button" id="customer-dropdown-0" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false"><span class="fas fa-ellipsis-h fs--1"></span></button>
              <div class="dropdown-menu dropdown-menu-end border py-0" aria-labelledby="customer-dropdown-0">
                <div class="py-2">
                  <a class="dropdown-item" href="agent.html?id={}">More Details</a>
                  <a class="dropdown-item" href="add_agent.html?id={}">Edit Agent</a>
                  <a class="dropdown-item text-danger" onclick="deleteAgent('{}')" style="cursor:pointer">Delete Agent</a>
                </div>
              </div>
            </div>
          </td>
        </tr>`

      Object.keys(agents).forEach(id => {
        const a = agents[id]
        const row = schema.format(id, id, a.name, a.email, a.email, a.phone, a.address, id, id, id)
        if (tableBody) tableBody.innerHTML += row
      });

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

function readAgentDetails() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get('id')
  if (!id) location.href = "agents.html"
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
window.deleteAgent = deleteAgent


/**
 * --------------------------------------------------
 * On load events
 * --------------------------------------------------
 */

window.onload = () => {
  const pageName = window.location.pathname.split('/').pop().split(".html")[0];
  switch (pageName) {
    case "agents": {
      listAllAgents();
      break;
    }
    case "agent": {
      readAgentDetails();
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
