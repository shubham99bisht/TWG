import { readData, writeDataWithNewId, updateData, deleteData } from "./helpers.js";

let program_types = {}

const optionSchema = `
  <div class="form-check">
    <input class="form-check-input" id="{}" type="checkbox" {}/>
    <label class="form-check-label" for="{}">{}</label>
  </div>`

/**
 * --------------------------------------------------
 * Common Actions Modal
 * --------------------------------------------------
 */

const addNewModel = document.getElementById('add-new-modal')
const modalTitle = addNewModel.querySelector('.modal-title')
const modalFooter = addNewModel.querySelector('.modal-footer')

// Modal's form inputs
const nameInput = addNewModel.querySelector('.modal-body #university-name')
const programTypeInput = addNewModel.querySelector('.modal-body #program-type')

if (addNewModel) {
  addNewModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    // Extract info from data-bs-* attributes
    const name = row?.querySelector('.name')
    const programIds = row?.getAttribute('data-program-types');

    if (button.innerHTML == "Delete") {
        modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-danger" onclick="deleteUniversity('${row?.id}')">Confirm Delete</button>`
    } else if (!row?.id) {
        modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="createUniversity()">Save</button>`
    } else {
        modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="updateUniversity('${row?.id}')">Save</button>`
    }

    if (name) {
        modalTitle.textContent = `Update University`
        nameInput.value = name.innerHTML
        programTypeInput.innerHTML = '<label for="program-type">Program Type</label>'
        for (const pId in program_types) {
          if (program_types.hasOwnProperty(pId)) {
            const isChecked = programIds.includes(pId) ? "checked" : ""
            const newOpt = optionSchema.format(pId, isChecked, pId, program_types[pId].name)
            programTypeInput.innerHTML += newOpt;
          }
        }
    } else {
        modalTitle.textContent = 'Add New University'
        nameInput.value = ''
        setDefaultProgramTypes()
    }
  })
}

/**
 * --------------------------------------------------
 * Load Program Types
 * --------------------------------------------------
 */

function setDefaultProgramTypes() {
  programTypeInput.innerHTML = '<label for="program-type">Program Type</label>'
  for (const pId in program_types) {
    if (program_types.hasOwnProperty(pId)) {
      const newOpt = optionSchema.format(pId, "", pId, program_types[pId].name)
      programTypeInput.innerHTML += newOpt;
    }
  }
}

function getAllCheckedBoxes() {
  // Find the checkbox within the current form-check
  const checkedCheckboxIds = [];
  const formCheckElements = document.querySelectorAll('.form-check');
  formCheckElements.forEach(formCheck => {
    const checkbox = formCheck.querySelector('.form-check-input');
    if (checkbox.checked) {
      checkedCheckboxIds.push(checkbox.id);
    }
  });
  return checkedCheckboxIds
}

async function loadProgramTypes() {
  program_types = await readData("program_types")
  setDefaultProgramTypes()
}

window.onload = async function() {
  await loadProgramTypes();
  listAll();
};

/**
 * --------------------------------------------------
 * Create new entry
 * --------------------------------------------------
 */

function createUniversity() {
  const newUniversity = {
    name: nameInput.value,
    program_types: getAllCheckedBoxes()
  };

  writeDataWithNewId(`universities`, newUniversity)
    .then((result) => {
      if (result) {
        successMessage("University added successfully!")
        .then(() => location.reload())
      }
    })
    .catch((error) => {
      failMessage("Error adding program type:", error);
    });
}
window.createUniversity = createUniversity


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
      const schema = `
        <tr id="{}" data-program-types="{}">
          <td class="name">{}</td>
          <td class="program-type">{}</td>
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

      Object.keys(university).forEach(uId => {
        const u = university[uId]
        const programIds = u.program_types.join(",")
        const programs = u.program_types.map(pId => program_types[pId].name)
        const row = schema.format(uId, programIds, u.name, programs.join("<br>"))
        if (tableBody) tableBody.innerHTML += row
      });
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading Universities:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr class="text-center"><td colspan="3">Error reading Universities</td></tr>`
    });
}
window.listAll = listAll

/**
 * --------------------------------------------------
 * Update
 * --------------------------------------------------
 */

function updateUniversity(uId) {
  const newUniversity = {
    name: nameInput.value,
    program_types: getAllCheckedBoxes()
  };

  updateData(`universities/${uId}`, newUniversity)
    .then((result) => {
      if (result) {
        successMessage("University updated successfully!")
        .then(() => location.reload())   
      }
    })
    .catch((error) => {
      failMessage("Error updating program type:", error);
    });
}
window.updateUniversity = updateUniversity

/**
 * --------------------------------------------------
 * Delete
 * --------------------------------------------------
 */

function deleteUniversity(uId) {
  deleteData(`universities/${uId}`)
    .then((result) => {
      if (result) {
        successMessage("University deleted successfully!")
        .then(() => location.reload())
      }
    })
    .catch((error) => {
      console.log(error)
      failMessage("Error deleting program type:", error);
    });
}
window.deleteUniversity = deleteUniversity
