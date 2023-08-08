import { readData, writeDataWithNewId, updateData, deleteData } from "./helpers.js";

const addNewProgramModel = document.getElementById('add-new-modal')
const modalTitle = addNewProgramModel.querySelector('.modal-title')
const modalFooter = addNewProgramModel.querySelector('.modal-footer')

// Modal's form inputs
const nameInput = addNewProgramModel.querySelector('.modal-body #program-name')
const commissionInput = addNewProgramModel.querySelector('.modal-body #commission')
const duedateInput = addNewProgramModel.querySelector('.modal-body #duedate')

const addNewUniversityModel = document.getElementById('add-new-modal')
if (addNewUniversityModel) {
  addNewUniversityModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    // Extract info from data-bs-* attributes
    const name = row?.querySelector('.name')
    const program = row?.querySelector('.program-type')

    // Update the modal's content.
    const modalTitle = addNewUniversityModel.querySelector('.modal-title')
    const modalFooter = addNewUniversityModel.querySelector('.modal-footer')
    const nameInput = addNewUniversityModel.querySelector('.modal-body #university-name')
    

    if (button.innerHTML == "Delete") {
        modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-danger" onclick="deleteUniv(${row?.id})">Confirm Delete</button>`
    } else {
        modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="saveUniv(${row?.id})">Save</button>`
    }

    if (name) {
        modalTitle.textContent = `Update University`
        nameInput.value = name.innerHTML
    } else {
        modalTitle.textContent = 'Add New University'
        nameInput.value = ''
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
    commission_rate: commissionInput.value,
    first_installment: duedateInput.value,
  };

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
window.updateProgram = createProgram


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
      console.log("Program types:", programTypes);

      const schema = `
        <tr id="{}">
          <td class="name">{}</td>
          <td class="commission"> {}% </td>
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
        const row = schema.format(pId, p.name, p.commission_rate, p.first_installment)
        if (tableBody) tableBody.innerHTML += row
      });
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr><td colspan="4">rror reading program types</td></tr>`
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
    commission_rate: commissionInput.value,
    first_installment: duedateInput.value,
  };

  updateData(`program_types/${pId}`, updatedProgramType)
    .then((result) => {
      if (result) {
        successMessage("Program type updated successfully!")
        .then(() => location.reload())   
      }
    })
    .catch((error) => {
      alert("Error updating program type:", error);
    });
}
window.updateProgram = updateProgram

/**
 * --------------------------------------------------
 * Delete
 * --------------------------------------------------
 */

function deleteProgram(pId) {
  deleteData(`program_types/${pId}`)
    .then((result) => {
      if (result) {
        successMessage("Program type deleted successfully!")
        .then(() => location.reload())
      }
    })
    .catch((error) => {
      failMessage("Error deleting program type:", error);
    });
}
window.deleteProgram = deleteProgram
