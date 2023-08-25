import { readData, writeDataWithNewId, updateData, deleteData, removeProgramFromUniversity } from "./helpers.js";

const addNewProgramModel = document.getElementById('add-new-modal')
const modalTitle = addNewProgramModel.querySelector('.modal-title')
const modalFooter = addNewProgramModel.querySelector('.modal-footer')

// Modal's form inputs
const nameInput = addNewProgramModel.querySelector('.modal-body #program-name')
const commissionTypeInput = addNewProgramModel.querySelector('.modal-body #commissionType');
const commissionInput = addNewProgramModel.querySelector('.modal-body #commission')
const duedateInput = addNewProgramModel.querySelector('.modal-body #duedate')

if (addNewProgramModel) {
  addNewProgramModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    // Extract info from data-bs-* attributes
    const name = row?.querySelector('.name')
    const commission = row?.querySelector('.commission')
    const commissionType = row?.querySelector('.commission_type')?.innerHTML.trim() || 'percentage'
    const duedate = row?.querySelector('.duedate')

    commissionTypeInput.value = commissionType
    toggleCommissionInput()

    // Update the modal's content.
    if (name) {
        modalTitle.textContent = `Update Program`
        nameInput.value = name.innerHTML.trim()
        commissionInput.value = commission.innerHTML.split("%")[0].trim()
        duedateInput.value = duedate.innerHTML.trim()
    } else {
        modalTitle.textContent = 'Add New Program'
        nameInput.value = ''
        commissionInput.value = ''
        duedateInput.value = ''
    }

    if (button.innerHTML == "Delete") {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-danger" onclick="deleteProgram('${row?.id}')">Confirm Delete</button>`
    } else if (!row?.id) {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="createProgram()">Save</button>`
    } else {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="updateProgram('${row?.id}')">Save</button>`
    }      
  })
}

window.onload = function() {
  listAllProgramTypes();
};

/**
 * --------------------------------------------------
 * Create new entry
 * --------------------------------------------------
 */

function createProgram() {
  const newProgramType = {
    name: nameInput.value,
    commission_type: commissionTypeInput.value,
    commission_rate: commissionInput.value,
    first_installment: duedateInput.value,
  };
  if (!newProgramType.name || !newProgramType.commission_type || !newProgramType.commission_rate || !newProgramType.first_installment) {
    failMessage("Please provide all details"); return
  }
  if ((newProgramType.commission_rate < 0) || (newProgramType.commission_type == 'percentage' && newProgramType.commission_rate > 100)) {
    failMessage("Invalid commission rate."); return
  }
  if (newProgramType.first_installment < 0) {
    failMessage("Invalid first installment date"); return
  }

  writeDataWithNewId(`program_types`, newProgramType)
    .then((result) => {
      if (result) {
        successMessage("Program type added successfully!")
        .then(() => location.reload())
      }
    })
    .catch((error) => {
      failMessage("Error adding program type:", error);
    });
}
window.createProgram = createProgram


/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllProgramTypes() {
  const tableBody = document.getElementById("table-program-body");
  tableBody.innerHTML = ''
  readData("program_types")
    .then((programTypes) => {
      const schema = `
        <tr id="{}">
          <td class="name">{}</td>
          <td class="commission_type"> {} </td>
          <td class="commission"> {} </td>
          <td class="duedate">{}</td>
          <td class="align-middle white-space-nowrap py-2 text-end">
            <div class="dropdown font-sans-serif position-static">
              <button class="btn btn-link text-600 btn-sm dropdown-toggle btn-reveal" type="button" id="customer-dropdown-1" data-bs-toggle="dropdown" data-boundary="window" aria-haspopup="true" aria-expanded="false"><span class="fas fa-ellipsis-h fs--1"></span></button>
              <div class="dropdown-menu dropdown-menu-end border py-0" aria-labelledby="customer-dropdown-1">
                <div class="py-2">
                  <a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#add-new-modal">Edit</a>
                  <a class="dropdown-item text-danger" data-bs-toggle="modal" data-bs-target="#add-new-modal">Delete</a></div>
              </div>
            </div>
          </td>
        </tr>`

      Object.keys(programTypes).forEach(pId => {
        const p = programTypes[pId]
        const row = schema.format(pId, p.name, p.commission_type, p.commission_rate, p.first_installment)
        if (tableBody) tableBody.innerHTML += row
      });
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr><td colspan="5">Error reading program types</td></tr>`
    });
}
window.listAllProgramTypes = listAllProgramTypes

/**
 * --------------------------------------------------
 * Update
 * --------------------------------------------------
 */

function updateProgram(pId) {
  const updatedProgramType = {
    name: nameInput.value,
    commission_type: commissionTypeInput.value,
    commission_rate: commissionInput.value,
    first_installment: duedateInput.value,
  };

  if (!updatedProgramType.name || !updatedProgramType.commission_type || !updatedProgramType.commission_rate || !updatedProgramType.first_installment) {
    failMessage("Please provide all details"); return
  }
  if ((updatedProgramType.commission_rate < 0) || (updatedProgramType.commission_type == 'percentage' && updatedProgramType.commission_rate > 100)) {
    failMessage("Invalid commission rate."); return
  }
  if (updatedProgramType.first_installment < 0) {
    failMessage("Invalid first installment date"); return
  }

  updateData(`program_types/${pId}`, updatedProgramType)
    .then((result) => {
      if (result) {
        successMessage("Program type updated successfully!")
        .then(() => location.reload())   
      }
    })
    .catch((error) => {
      failMessage("Error updating program type:", error);
    });
}
window.updateProgram = updateProgram

/**
 * --------------------------------------------------
 * Delete
 * --------------------------------------------------
 */

async function deleteProgram(pId) {
  if (!confirm(`Confirm delete agent with id: ${id}`)) return
  try {
    processingMessage()
    await removeProgramFromUniversity(pId)
    const result = await deleteData(`program_types/${pId}`)
    if (result) {
      successMessage("Program type deleted successfully!")
      .then(() => location.reload())
    }
  } catch (error) {
    failMessage("Error deleting program type:", error);
  }
}
window.deleteProgram = deleteProgram
