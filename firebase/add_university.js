import { readData, writeDataWithNewId } from "./helpers.js";

let program_types = {}

window.onload = async function () {
  // Load Program Types
  program_types = await readData("program_types")

  // Enable adding programs
  const addProgramBtn = document.getElementById("addProgram")
  addProgramBtn.disabled = false
};

// Remove Payment Stage
function removePaymentStage(event) {
  const button = event.target;
  const row = button.closest('tr');
  const nextRow = row.nextElementSibling;
  row.remove(); nextRow.remove();
}
window.removePaymentStage = removePaymentStage;

// Add Payment Stage
function addPaymentStage(event) {
  const paymentStage1 = `
        <td rowspan="2" class="text-center align-middle">
          <select class="form-select form-select-sm payment_stage" required="required">
              <option hidden disabled selected value="">Select Payment stage</option>
          </select>
        </td>
        <td>Payable</td>
        <td>
          <select class="form-select form-select-sm commission_type" required="required">
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
          </select>
        </td>
        <td><input class="form-control form-control-sm" type="number" required="required"/></td>
        <td><input class="form-control form-control-sm" type="number" required="required"/></td>
        <td rowspan="2" class="text-center align-middle"><button class="btn btn-link btn-sm" type="button" onclick="removePaymentStage(event)"><span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span></button></td>`

  const paymentStage2 = `
        <td>Receivable</td>
        <td>
          <select class="form-select form-select-sm commission_type" required="required">
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
          </select>
        </td>
        <td><input class="form-control form-control-sm" type="number" required="required"/></td>
        <td><input class="form-control form-control-sm" type="number" required="required"/></td>`
  const button = event.target;

  const tablePair = button.closest('.programType');
  if (tablePair) {
    const table = tablePair.querySelector('table');
    if (table) {
      const newRow = table.insertRow();
      newRow.innerHTML += paymentStage1
      const newRow2 = table.insertRow();
      newRow2.innerHTML += paymentStage2

      const newSelect = newRow.querySelector(".payment_stage")
      paymentStages.forEach(function (optionData) {
        const option = document.createElement('option');
        option.value = optionData.value;
        option.textContent = optionData.label;
        newSelect.appendChild(option);
      });
    }
  }
}
window.addPaymentStage = addPaymentStage;

// Remove Program Type
function removeProgramType(event) {
  const button = event.target;
  const programType = button.closest(".programType")
  programType.remove()
}
window.removeProgramType = removeProgramType

// Add Program Type
function addProgramType(event) {
  const programType = `
    <div class="position-absolute end-0 top-0 mt-2 me-3 z-index-1">
      <button class="btn btn-link btn-sm p-0" type="button" onclick="removeProgramType(event)">
        <span class="fas fa-times-circle text-danger" data-fa-transform="shrink-1"></span>
      </button>
    </div>

    <div class="form-group">
      <label class="col-2 control-label">Program Type</label>
      <div class="col-10">
          <select class="form-control program_type" name="program_type" required="required">
            <option hidden disabled selected value="">Select a Program Type</option>
          </select>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered mt-3 bg-white dark__bg-1100">
        <thead>
          <tr class="fs--1">
            <th>Payment Stage</th>
            <th>Payment Type</th>
            <th>Commission Type</th>
            <th>Commission Rate</th>
            <th>Installment Days</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>

    <div class="text-end">
      <button class="btn btn-falcon-default btn-sm mt-2" type="button" onclick="addPaymentStage(event)"><span class="fas fa-plus fs--2 me-1" data-fa-transform="up-1"></span>More Payment Stages </button>
    </div>
    `

  const button = event.target;

  // Create a new div element and add classes to it
  const newDiv = document.createElement('div');
  newDiv.classList.add('border', 'rounded-1', 'position-relative', 'bg-white', 'dark__bg-1100', 'p-3', 'mb-3', 'programType');
  newDiv.innerHTML = programType

  const newSelect = newDiv.querySelector(".program_type")
  Object.keys(program_types).forEach(function (optionData) {
    const option = document.createElement('option');
    option.value = optionData;
    option.textContent = program_types[optionData].name;
    newSelect.appendChild(option);
  });

  button.parentNode.insertBefore(newDiv, button);
}
window.addProgramType = addProgramType

// Submit Form
const universityForm = document.getElementById('UniversityForm')
universityForm.addEventListener('submit', function (event) {
  event.preventDefault()
  processingMessage()
  try {
    const inputsAndSelects = universityForm.querySelectorAll('input, select');
  
    const data = {
      name: inputsAndSelects[0].value,
      poc: inputsAndSelects[1].value || '-',
      email: inputsAndSelects[2].value || '-',
      billing: {
        accountName: inputsAndSelects[3].value,
        accountNumber: inputsAndSelects[4].value,
        bank: inputsAndSelects[5].value,
        ifsc: inputsAndSelects[6].value,
      },
      programTypes: []
    };
  
    let currentProgramType = null;
  
    for (let i = 7; i < inputsAndSelects.length; i++) {
      const element = inputsAndSelects[i];
  
      if (element.classList.contains('program_type')) {
        currentProgramType = { type: element.value, paymentStages: [] };
        data.programTypes.push(currentProgramType);
      } else if (element.classList.contains('payment_stage')) {
        const paymentStage = { stage: element.value, commissions: [] };
        currentProgramType.paymentStages.push(paymentStage);
      } else if (currentProgramType) {
        if (element.classList.contains('commission_type')) {
          const commissionType = element.value;
          const commissionInput = inputsAndSelects[i + 1];
          const commissionValue = commissionInput.value;
          const installmentDays = inputsAndSelects[i + 2].value;
  
          if (commissionType === 'percentage' && (commissionValue < 0 || commissionValue > 100)) {
            alert('Percentage commission value must be between 0 and 100');
            return;
          }

          if (installmentDays < 0) {
            alert('Please provide positive installment days');
            return;
          }
  
          // 0: Payable, 1: Receivable
          currentProgramType.paymentStages[currentProgramType.paymentStages.length - 1].commissions.push({
            type: commissionType,
            value: commissionValue,
            installmentDays
          });
  
          // Skip the next iteration as it's already processed
          i+=2;
        }
      }
    }
  
    writeDataWithNewId('universities', data).then(() => {
      successMessage(`University added sucessfully!`).then(() => location.href = "universities.html")
    }).catch(e => failMessage(`Failed to save university: ${e}`))
  } catch (e) {
    failMessage(`Failed to save university: ${e}`)
  }
});
