import { readData, writeDataWithNewId, updateData } from "./helpers.js";

const addNewStageModel = document.getElementById('add-new-modal')
const modalTitle = addNewStageModel.querySelector('.modal-title')
const modalFooter = addNewStageModel.querySelector('.modal-footer')

// Modal's form inputs
const nameInput = addNewStageModel.querySelector('.modal-body #stage-name')

if (addNewStageModel) {
  addNewStageModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    // Extract info from data-bs-* attributes
    const name = row?.querySelector('.name')

    // Update the modal's content.
    if (name) {
      modalTitle.textContent = `Update Stage`
      nameInput.value = name.innerHTML.trim()
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-warning" onclick="updateStage('${row?.id}')">Update</button>`
    } else {
      modalTitle.textContent = 'Add New Stage'
      nameInput.value = ''
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="createStage()">Save</button>`
    }   
  })
}

window.onload = function() {
  listAllStageTypes();
};

/**
 * --------------------------------------------------
 * Create new entry
 * --------------------------------------------------
 */

function createStage() {
  const newStageType = {
    name: nameInput.value
  };
  if (!newStageType.name) {
    failMessage("Please provide valid stage name"); return
  }

  writeDataWithNewId(`study_stages`, newStageType)
    .then((result) => {
      if (result) {
        successMessage("Stage type added successfully!")
        .then(() => location.reload())
      } else {
        failMessage("Can't update Study Stages");
      }
    })
    .catch((error) => {
      failMessage("Error adding stage type:", error);
    });
}
window.createStage = createStage


/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllStageTypes() {
  const tableBody = document.getElementById("table-stages-body");
  tableBody.innerHTML = ''
  const schema = `
    <tr id="{}">
      <td class="name">{}</td>
      <td class="align-middle white-space-nowrap py-2 text-end">
        <a data-bs-toggle="modal" data-bs-target="#add-new-modal" style="cursor:pointer">
          <i class="fas fa-edit"></i>
        </a>
      </td>
    </tr>`  
  readData("study_stages")
    .then((stages) => {
      Object.keys(stages).forEach(pId => {
        try {
          const p = stages[pId]
          const row = schema.format(pId, p.name, pId)
          if (tableBody) tableBody.innerHTML += row
        } catch {}
      });
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading stage types:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr><td colspan="2">Error reading stage types</td></tr>`
    });
}
window.listAllStageTypes = listAllStageTypes

/**
 * --------------------------------------------------
 * Update
 * --------------------------------------------------
 */

function updateStage(pId) {
  const updatedStageType = {
    name: nameInput.value
  };

  if (!updatedStageType.name) {
    failMessage("Please provide valid stage name"); return
  }

  updateData(`study_stages/${pId}`, updatedStageType)
    .then((result) => {
      if (result) {
        successMessage("Stage type updated successfully!")
        .then(() => location.reload())   
      } else {
        failMessage("Can't update Study Stages");
      }
    })
    .catch((error) => {
      failMessage("Error updating stage type:", error);
    });
}
window.updateStage = updateStage
