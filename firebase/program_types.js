import { readData, writeDataWithNewId, updateData, deleteData, removeProgramFromUniversity } from "./helpers.js";

const addNewProgramModel = document.getElementById('add-new-modal')
const modalTitle = addNewProgramModel.querySelector('.modal-title')
const modalFooter = addNewProgramModel.querySelector('.modal-footer')

// Modal's form inputs
const nameInput = addNewProgramModel.querySelector('.modal-body #program-name')
const modulesInput = addNewProgramModel.querySelector('#modulesInput')

let programs = {}

/**
 * --------------------------------------------------
 * Modal
 * --------------------------------------------------
 */

if (addNewProgramModel) {
  addNewProgramModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    const program = programs[row?.id]

    modulesInput.innerHTML = `<label class="form-label mb-0">Modules</label><div class="form-text mb-3">Empty modules will be deleted automatically.</div>`

    // Update the modal's content.
    if (program) {
      modalTitle.textContent = `Update Program`
      nameInput.value = program['name'].trim()

      program['modules']?.forEach(text => {
        const input = document.createElement('input');
        input.setAttribute('class', 'form-control mb-2');
        input.setAttribute('type', 'text');
        input.setAttribute('value', text);
        input.setAttribute('required', 'required');
        modulesInput.appendChild(input);
      });

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

function addNewModule() {
  const input = document.createElement('input');
  input.setAttribute('class', 'form-control mb-2');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Module Name');
  input.setAttribute('required', 'required');
  modulesInput.appendChild(input);  
}
window.addNewModule = addNewModule

function readAllModules() {
  const inputs = modulesInput.querySelectorAll('input[type="text"]') || [];
  const values = [];
  
  inputs?.forEach(input => {
    if (input.value) values.push(input.value);
  });
  
  return values;
}

/**
 * --------------------------------------------------
 * Create new entry
 * --------------------------------------------------
 */

function createProgram() {
  const newProgramType = {
    name: nameInput.value,
    modules: readAllModules()
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
          <td class="modules">{}</td>
          <td class="align-middle white-space-nowrap py-2 text-end">
            <a data-bs-toggle="modal" data-bs-target="#add-new-modal" style="cursor:pointer">
              <i class="fas fa-edit"></i>
            </a>
          </td>
        </tr>`

      let csvContent = 'Program Name,Module Count\r\n';

      Object.keys(programTypes).forEach(pId => {
        try {
          const p = programTypes[pId]
          const row = schema.format(pId, p.name, p?.modules?.length || 0, pId)
          csvContent += `${p.name},${p?.modules?.length || 0}\r\n`
          if (tableBody) tableBody.innerHTML += row
        } catch {}
      });
      
      window.csvContent = csvContent
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
    name: nameInput.value,
    modules: readAllModules()
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



window.onload = function() {
  listAllProgramTypes();
};