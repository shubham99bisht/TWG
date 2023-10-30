import { readData, writeDataWithNewId, updateData, deleteData, removeProgramFromUniversity } from "./helpers.js";

const addNewProgramModel = document.getElementById('add-new-modal')
const modalTitle = addNewProgramModel.querySelector('.modal-title')
const modalFooter = addNewProgramModel.querySelector('.modal-footer')

// Modal's form inputs
const nameInput = addNewProgramModel.querySelector('.modal-body #program-name')

let programs = {}

if (addNewProgramModel) {
  addNewProgramModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    // Extract info from data-bs-* attributes
    const name = row?.querySelector('.name')

    // Update the modal's content.
    if (name) {
      modalTitle.textContent = `Update Program`
      nameInput.value = name.innerHTML.trim()
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-warning" onclick="updateProgram('${row?.id}')">Update</button>`
    } else {
      modalTitle.textContent = 'Add New Program'
      nameInput.value = ''
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="createProgram()">Save</button>`
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
    name: nameInput.value
  };
  if (!newProgramType.name) {
    failMessage("Please provide valid program name"); return
  }

  writeDataWithNewId(`program_types`, newProgramType)
    .then((result) => {
      if (result) {
        successMessage("Program type added successfully!")
        .then(() => location.reload())
      } else {
        failMessage("Can't update program types");
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
      programs = programTypes
      const schema = `
        <tr id="{}">
          <td class="name">{}</td>
          <td class="align-middle white-space-nowrap py-2 text-end">
            <a data-bs-toggle="modal" data-bs-target="#add-new-modal" style="cursor:pointer">
              <i class="fas fa-edit"></i>
            </a>
          </td>
        </tr>`

      Object.keys(programTypes).forEach(pId => {
        try {
          const p = programTypes[pId]
          const row = schema.format(pId, p.name, pId)
          if (tableBody) tableBody.innerHTML += row
        } catch {}
      });
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr><td colspan="2">Error reading program types</td></tr>`
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
    name: nameInput.value
  };

  if (!updatedProgramType.name) {
    failMessage("Please provide valid program name"); return
  }

  updateData(`program_types/${pId}`, updatedProgramType)
    .then((result) => {
      if (result) {
        successMessage("Program type updated successfully!")
        .then(() => location.reload())   
      } else {
        failMessage("Can't update program types");
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
  if (!confirm(`Confirm delete program "${programs[pId]?.name}"?`)) return
  try {
    processingMessage()
    await removeProgramFromUniversity(pId)
    const result = await deleteData(`program_types/${pId}`)
    if (result) {
      successMessage("Program type deleted successfully!")
      .then(() => location.reload())
    } else {
      failMessage("Failed deleting program type");
    }
  } catch (error) {
    failMessage("Error deleting program type:", error);
  }
}
window.deleteProgram = deleteProgram
