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

function deleteUniv(id) { console.log("Deleted", id) }
function saveUniv(id) { console.log("Saved", id) }
