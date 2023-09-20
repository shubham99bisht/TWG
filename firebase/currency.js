import { readData, writeDataWithNewId, updateData, deleteData } from "./helpers.js";

const addNewCurrencyModel = document.getElementById('add-new-modal')
const modalTitle = addNewCurrencyModel.querySelector('.modal-title')
const modalFooter = addNewCurrencyModel.querySelector('.modal-footer')

// Modal's form inputs
const nameInput = addNewCurrencyModel.querySelector('.modal-body #currency-name')

let currency = {}

if (addNewCurrencyModel) {
  addNewCurrencyModel.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget
    const row = button.closest('tr')
    // Extract info from data-bs-* attributes
    const name = row?.querySelector('.name')

    // Update the modal's content.
    if (name) {
      modalTitle.textContent = `Update Currency`
      nameInput.value = name.innerHTML.trim()
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-warning" onclick="updateCurrency('${row?.id}')">Update</button>`
    } else {
      modalTitle.textContent = 'Add New Currency'
      nameInput.value = ''
      modalFooter.innerHTML = `
        <button class="btn btn-secondary me-2" type="button" data-bs-dismiss="modal">Cancel</button>
        <button class="btn btn-primary" onclick="createCurrency()">Save</button>`
    }   
  })
}

window.onload = function() {
  listAllCurrencyTypes();
};

/**
 * --------------------------------------------------
 * Create new entry
 * --------------------------------------------------
 */

function createCurrency() {
  const newCurrencyType = {
    name: nameInput.value
  };
  if (!newCurrencyType.name) {
    failMessage("Please provide valid currency name"); return
  }

  writeDataWithNewId(`currency_types`, newCurrencyType)
    .then((result) => {
      if (result) {
        successMessage("Currency type added successfully!")
        .then(() => location.reload())
      }
    })
    .catch((error) => {
      failMessage("Error adding currency type:", error);
    });
}
window.createCurrency = createCurrency


/**
 * --------------------------------------------------
 * Read All
 * --------------------------------------------------
 */

function listAllCurrencyTypes() {
  const tableBody = document.getElementById("table-currency-body");
  tableBody.innerHTML = ''
  readData("currency_types")
    .then((currencyTypes) => {
      currency = currencyTypes
      const schema = `
        <tr id="{}">
          <td class="name">{}</td>
          <td class="align-middle white-space-nowrap py-2 text-end">
            <a data-bs-toggle="modal" data-bs-target="#add-new-modal" style="cursor:pointer">
              <i class="fas fa-edit"></i>
            </a>
          </td>
        </tr>`

      Object.keys(currencyTypes).forEach(pId => {
        try {
          const p = currencyTypes[pId]
          const row = schema.format(pId, p.name, pId)
          if (tableBody) tableBody.innerHTML += row
        } catch {}
      });
      
      listInit()
    })
    .catch((error) => {
      console.error("Error reading currency types:", error);
      if (tableBody) 
        tableBody.innerHTML = `<tr><td colspan="2">Error reading currency types</td></tr>`
    });
}
window.listAllCurrencyTypes = listAllCurrencyTypes

/**
 * --------------------------------------------------
 * Update
 * --------------------------------------------------
 */

function updateCurrency(pId) {
  const updatedCurrencyType = {
    name: nameInput.value
  };

  if (!updatedCurrencyType.name) {
    failMessage("Please provide valid currency name"); return
  }

  updateData(`currency_types/${pId}`, updatedCurrencyType)
    .then((result) => {
      if (result) {
        successMessage("Currency type updated successfully!")
        .then(() => location.reload())   
      }
    })
    .catch((error) => {
      failMessage("Error updating currency type:", error);
    });
}
window.updateCurrency = updateCurrency
