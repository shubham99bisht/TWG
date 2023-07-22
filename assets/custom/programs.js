const addNewProgramModel = document.getElementById('add-new-modal')
const modalTitle = addNewProgramModel.querySelector('.modal-title')
const modalFooter = addNewProgramModel.querySelector('.modal-footer')

if (addNewProgramModel) {
  addNewProgramModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    // Extract info from data-bs-* attributes
    const name = row?.querySelector('.program-name')
    const commission = row?.querySelector('.commission')
    const duedate = row?.querySelector('.duedate')

    // Update the modal's content.
    const nameInput = addNewProgramModel.querySelector('.modal-body #program-name')
    const commissionInput = addNewProgramModel.querySelector('.modal-body #commission')
    const duedateInput = addNewProgramModel.querySelector('.modal-body #duedate')

    if (name) {
        modalTitle.textContent = `Update Program`
        nameInput.value = name.innerHTML
        commissionInput.value = commission.innerHTML
        duedateInput.value = duedate.innerHTML
    } else {
        modalTitle.textContent = 'Add New Program'
        nameInput.value = ''
        commissionInput.value = ''
        duedateInput.value = ''
    }

    if (button.innerHTML == "Delete") {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-danger" onclick="deleteProgram(${row?.id})">Confirm Delete</button>`
    } else {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="saveProgram(${row?.id})">Save</button>`
    }    
  })
}

function deleteProgram(id) { console.log("Deleted", id) }
function saveProgram(id) { console.log("Saved", id) }
