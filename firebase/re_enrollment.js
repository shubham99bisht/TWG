import { readData, getDates, getRemainingCredits, readDateFilters } from './helpers.js';

let universities = {}, programs = {}, studyStages = {};

const twgProgramChoices = new Choices(document.getElementById("twgProgramDropdown"),
  {
    removeItems: true,
    removeItemButton: true
  }
);

async function initialise() {
  let choices = Object.keys(programs).map(pId => {return { value: pId, label: programs[pId].name }});
  twgProgramChoices.setChoices(choices)

  const [startOfYear, currentDate] = getDates();
  const datepickerInstance = flatpickr("#datepicker", {
    mode: 'range', dateFormat: 'M d Y', 'disableMobile': true,
    'defaultDate': [startOfYear, currentDate]
  });

  document.getElementById('searchButton').addEventListener('click', async function () {
    let enrollStatus = []
    let twgProgram = [];

    let source = sourceDropdown?.value || ''

    for (let i = 0; i < enrollStatusDropdown.options.length; i++) {
      const value = enrollStatusDropdown.options[i]?.value;
      enrollStatus.push(value)
    }

    for (let i = 0; i < twgProgramDropdown.options.length; i++) {
      const value = twgProgramDropdown.options[i]?.value;
      twgProgram.push(value)
    }
    const dateRange = readDateFilters(datepickerInstance);

    const inputParams = {
      enrollStatus, twgProgram, startDate: dateRange[0], endDate: dateRange[1], source
    };
    processingMessage('Fetching students records...');
    await listAllEnroll(inputParams);
    closeSwal();
  });
}

async function listAllEnroll(inputParams) {
  const tableBody = document.getElementById('table-payable-body');
  const { enrollStatus, source, twgProgram, startDate: filterStartDate, endDate: filterEndDate } = inputParams;

  console.log(inputParams)

  if (!tableBody) return
  tableBody.innerHTML = '';

  const schema = `<tr class="btn-reveal-trigger" id="{}">
                <td class="align-middle student"><a href="student_details.html?id={}">{}</a></td>
                <td class="align-middle studentEmail">{}</td>
                <td class="align-middle source">{}</td>
                <td class="align-middle program_type">{}</td>
                <td class="align-middle term_number">{}</td>
                <td class="align-middle term_start_date">{}</td>
                <td class="align-middle status">{}</td>
                <td class="align-middle remaining_credits">{}</td>
            </tr>`;

  let csvContent = 'Student,Student Email,Source,Program Type, Term #, Term State Date, Status, Remaining Credits\r\n';

  const csvRow = '{},{},{},{},{},{},{},{}\r\n';

  try {
    const students = await readData('students');
    for (let id in students) {
      const student = students[id];
      const { studentName, studentEmail, program_type, enrollmentStatus } = student;

      if (
        (source && source != student?.source) || 
        (twgProgram && twgProgram.length  && !twgProgram.includes(program_type)) ||
        (enrollStatus && enrollStatus.length && !enrollStatus.includes(enrollmentStatus))
      ) continue;
      
      const learningPlans = student?.learningPlan || {};
      const feePayable = student?.feePayable || {};
      const totalFeePayable = Number(student?.totalFeePayable) || 0;
      const totalModules = Number(student?.totalModules) || 0;
      
      const remainingCredits = getRemainingCredits(feePayable, learningPlans, totalFeePayable, totalModules)

      for (let key in learningPlans) {
        const learningPlan = learningPlans[key];
        const { name: term_number, startDate } = learningPlan;

        if (
          (filterStartDate && startDate < filterStartDate) ||
          (filterEndDate && startDate > filterEndDate)
        ) {
          continue;
        }

        const row = schema.format(
          id, id,
          studentName,studentEmail,student?.source,programs[program_type]?.name || '',
          term_number,startDate,enrollmentStatus,remainingCredits
        );

        if (tableBody) tableBody.innerHTML += row;

        csvContent += csvRow.format(
          studentName,studentEmail,student?.source,programs[program_type]?.name || '',
          term_number,startDate,enrollmentStatus,remainingCredits
        );
      }
    }

    window.csvContent = csvContent;
    listInit();
  } catch (error) {
    console.error('Error reading students:', error);
    if (tableBody)
      tableBody.innerHTML = `<tr class="text-center"><td colspan="10">No Enrollment data found!</td></tr>`;
  }
}

async function fetchData() {
  universities = await readData("universities")
  programs = await readData("program_types")
  studyStages = await readData("study_stages")
}

window.onload = async () => {
  await fetchData()
  initialise()
}
