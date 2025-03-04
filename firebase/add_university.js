import { readData, writeDataWithNewId } from "./helpers.js";

let program_types = {}, currencies = {}, studyStages = {}
let currency_options = ''

window.onload = async function () {
  // Load Program Types
  program_types = await readData("program_types")
  currencies = await readData("currency_types")
  studyStages = await readData("study_stages")

  Object.keys(currencies).forEach(key => {
    currency_options += `<option value='${key}'>${currencies[key]?.name}</option>`
  })

  // Enable adding programs
  const addProgramBtn = document.getElementById("addProgram")
  addProgramBtn.disabled = false
};

// Remove Study Stage
function removestudyStage(event) {
  const button = event.target;
  const row = button.closest('tr');
  const nextRow = row.nextElementSibling;
  row.remove(); nextRow.remove();
}
window.removestudyStage = removestudyStage;

// Add Study Stage
function addstudyStage(event) {
  const studyStage1 = `
        <td rowspan="2" class="text-center align-middle">
          <select class="form-select form-select-sm study_stage" required="required">
              <option hidden disabled selected value="">Select Study Stage</option>
          </select>
        </td>
        <td>Payable</td>
        <td>
          <select class="form-select form-select-sm commission_type mb-1" required="required" onchange="commissionTypeChange(event)">
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
            <option value="na">NA</option>
          </select>
          <select class="form-select form-select-sm currency">
            ${currency_options}
          </select>
        </td>
        <td><input class="form-control form-control-sm rate" type="number" step="0.01" required="required"/></td>
        <td><input class="form-control form-control-sm days" type="number" required="required"/></td>
        <td rowspan="2" class="text-center align-middle"><button class="btn btn-link btn-sm" type="button" onclick="removestudyStage(event)"><span class="fas fa-trash-alt text-danger" data-fa-transform="shrink-2"></span></button></td>`

  const studyStage2 = `
        <td>Receivable</td>
        <td>
          <select class="form-select form-select-sm commission_type mb-1" required="required" onchange="commissionTypeChange(event)">
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
            <option value="na">NA</option>
          </select>
          <select class="form-select form-select-sm currency">
            ${currency_options}
          </select>
        </td>
        <td><input class="form-control form-control-sm rate" type="number" step="0.01" required="required"/></td>
        <td><input class="form-control form-control-sm days" type="number" required="required"/></td>`
  const button = event.target;

  const tablePair = button.closest('.programType');
  if (tablePair) {
    const table = tablePair.querySelector('table');
    if (table) {
      const newRow = table.insertRow();
      newRow.classList.add('align-middle')
      newRow.innerHTML += studyStage1
      const newRow2 = table.insertRow();
      newRow2.classList.add('align-middle')
      newRow2.innerHTML += studyStage2

      const newSelect = newRow.querySelector(".study_stage")
      Object.keys(studyStages).forEach(function (key) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = studyStages[key].name;
        newSelect.appendChild(option);
      });
    }
  }
}
window.addstudyStage = addstudyStage;

function commissionTypeChange(event) {
  const select = event.target
  const row = select.closest('tr')
  const currency = row.querySelector('.currency')
  const rate = row.querySelector('.rate')
  const days = row.querySelector('.days')

  if (select.value == 'fixed') {
    currency.required = true
    currency.disabled = false
    currency.hidden = false
    rate.disabled = false
    days.disabled = false
  } else if (select.value == 'percentage') {
    currency.required = false
    currency.disabled = true
    currency.hidden = true
    rate.disabled = false
    days.disabled = false
  } else {
    currency.required = false
    currency.disabled = true
    currency.hidden = true
    rate.disabled = true
    days.disabled = true
  }
}
window.commissionTypeChange = commissionTypeChange

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
            <th>Study Stage</th>
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
      <button class="btn btn-falcon-default btn-sm mt-2" type="button" onclick="addstudyStage(event)"><span class="fas fa-plus fs--2 me-1" data-fa-transform="up-1"></span>More Study Stages </button>
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

// Degree Inputs
const degreesInputDiv = document.getElementById('degreesInput');

function addNewDegree() {
  const input = document.createElement('input');
  input.setAttribute('class', 'form-control mb-2 degreeInput');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Degree Name');
  degreesInputDiv.appendChild(input);   
}
window.addNewDegree = addNewDegree;


// Degree Bulk Input
const bulkDegreeModal = document.getElementById("degreesBulkUpload")
if (bulkDegreeModal) {
  bulkDegreeModal.addEventListener('show.bs.modal', event => {
    const degreesInputDiv = document.getElementById("degreesInput")
    const inputs = degreesInputDiv.querySelectorAll('input')
    let degreesList = ""

    for (let i = 0; i < inputs.length; i++) {
      const element = inputs[i];

      // Degrees
      if (element.classList.contains('degreeInput')) {
        let degreeName = element.value
        console.log(degreeName)
        if (degreeName) degreesList += `${degreeName}\n`
      }
    }    
    bulkDegreesInput.value = degreesList
  })
}

function processBulkUpload() {
  const inputText = document.getElementById('bulkDegreesInput').value;
  const lines = inputText.split('\n');

  degreesInputDiv.innerHTML = ''
  lines.forEach(l => {
    if (!l || !l.length) return
    const input = document.createElement('input');
    input.setAttribute('class', 'form-control mb-2 degreeInput');
    input.setAttribute('type', 'text');
    input.setAttribute('value', l);
    degreesInputDiv.appendChild(input);  
  })
}
window.processBulkUpload = processBulkUpload


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
      contract: inputsAndSelects[3].value || '-',
      contractDate: inputsAndSelects[4].value || '-',
      accounts: {
        email1: inputsAndSelects[5].value || '-',
        usage1: inputsAndSelects[6].value || '-',
        email2: inputsAndSelects[7].value || '-',
        usage2: inputsAndSelects[8].value || '-',
        email3: inputsAndSelects[9].value || '-',
        usage3: inputsAndSelects[10].value || '-',
        email4: inputsAndSelects[11].value || '-',
        usage4: inputsAndSelects[12].value || '-',
        email5: inputsAndSelects[13].value || '-',
        usage5: inputsAndSelects[14].value || '-',
      },
      programTypes: [],
      degrees: []
    };
  
    let currentProgramType = null;
  
    for (let i = 13; i < inputsAndSelects.length; i++) {
      const element = inputsAndSelects[i];

      // Degrees
      if (element.classList.contains('degreeInput')) {
        let degreeName = element.value
        console.log(degreeName)
        if (degreeName)
          data.degrees.push(degreeName);
      }

      // Program Types
      else if (element.classList.contains('program_type')) {
        currentProgramType = { type: element.value, studyStages: [] };
        data.programTypes.push(currentProgramType);
      } else if (element.classList.contains('study_stage')) {
        const studyStage = { stage: element.value, commissions: [] };
        currentProgramType.studyStages.push(studyStage);
      } else if (currentProgramType) {
        if (element.classList.contains('commission_type')) {
          const commissionType = element.value;
          const currencyValue = inputsAndSelects[i + 1].value;
          const commissionValue = inputsAndSelects[i + 2].value;
          const installmentDays = inputsAndSelects[i + 3].value;

          let data = {
            type: commissionType,
            value: commissionValue,
            installmentDays
          }

          switch (commissionType) {
            case 'fixed': {
              data['currency'] = currencyValue
              break;
            }
            case 'percentage': {
              if (commissionValue < 0 || commissionValue > 100) {
                failMessage('Percentage commission value must be between 0 and 100');
                return;
              }
              break;
            }
            case 'na': {
              data = { type: commissionType, installmentDays: 0 }
              break;
            }
          }

          if (installmentDays < 0) {
            alert('Please provide positive installment days');
            return;
          }
  
          // 0: Payable, 1: Receivable
          currentProgramType.studyStages[currentProgramType.studyStages.length - 1].commissions.push(data);
  
          // Skip the next iteration as it's already processed
          i+=3;
        }
      }
    }

    // Validate program types and stages
    if (data.programTypes && data.programTypes.length) {
      let types = []
      for (let i=0; i < data.programTypes.length; i++) {
        let p = data.programTypes[i]
        if (types.includes(p.type)) {
          failMessage(`Program Types can't be repeated`); return
        } else { types.push(p.type) }

        if (p?.studyStages?.length) {
          let stages = []
          for (let j=0; j< p?.studyStages.length; j++) {
            let s = p?.studyStages[j]
            if (stages.includes(s.stage)) {
              failMessage(`Program Stages can't be repeated`); return
            } else { stages.push(s.stage) }
          }
        } else {
          failMessage(`Program Stages can't be empty`); return
        }
      }
    } else {
      failMessage(`Program Types can't be empty`); return
    }

    writeDataWithNewId('universities', data).then((success) => {
      if (success)
      successMessage(`University added sucessfully!`).then(() => location.href = "universities.html")
      else throw "Permission denied"
    }).catch(e => failMessage(`Failed to save university: ${e}`))
  } catch (e) {
    failMessage(`Failed to save university: ${e}`)
    console.log(e)
  }
});
