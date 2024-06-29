import { readData, getDates, getRemainingCredits, readDateFilters } from './helpers.js';

const programsData = {};

window.addEventListener('load', async function () {
  await initialise();
});

async function initialise() {
  const [startOfYear, currentDate] = getDates();
  const datepickerInstance = flatpickr('#datepicker', {
    mode: 'range',
    dateFormat: 'M d Y',
    disableMobile: true,
    defaultDate: [startOfYear, currentDate],
  });

  await setProgramData();

  const searchBtn = document.getElementById('searchButton');
  searchBtn.addEventListener('click', async function () {
    const dateRange = readDateFilters(datepickerInstance);

    const inputParams = {
      filterStartDate: dateRange[0],
      filterEndDate: dateRange[1],
    };
    processingMessage('Fetching students records...');
    await listAllEnroll(inputParams);
    closeSwal();
  });
}

async function listAllEnroll(inputParams) {
  const tableBody = document.getElementById('table-payable-body');
  let { filterStartDate, filterEndDate } = inputParams;

  if (!tableBody) return;
  tableBody.innerHTML = '';

  const schema = `<tr class="btn-reveal-trigger" id="{}">
                <td class="align-middle student"><a href="student_details.html?id={}">{}</a></td>
                <td class="align-middle studentEmail">{}</td>
                <td class="align-middle program_type">{}</td>
                <td class="align-middle term_number">{}</td>
                <td class="align-middle term_start_date">{}</td>
                <td class="align-middle status">{}</td>
                <td class="align-middle remaining_credits">{}</td>
            </tr>`;

  let csvContent =
    'Student, Student Email,Program Type, Term #, Term State Date, Status, Remaining Credits\r\n';

  const csvRow = '{},{},{},{},{},{},{},{},{},{}\r\n';

  try {
    const students = await readData('students');
    for (let id in students) {
      const student = students[id];
      const { studentName, studentEmail, program_type, enrollmentStatus } =
        student;
      
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
          id,
          id,
          studentName,
          studentEmail,
          programsData[program_type],
          term_number,
          startDate,
          enrollmentStatus,
          remainingCredits
        );

        if (tableBody) tableBody.innerHTML += row;

        csvContent += csvRow.format(
          studentName,
          studentEmail,
          programsData[program_type],
          term_number,
          startDate,
          enrollmentStatus,
          remainingCredits
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

async function setProgramData() {
  try {
    const programs = await readData('program_types');
    for (let key in programs) {
      programsData[key] = programs[key]['name'];
    }
  } catch (error) {
    console.log(error);
  }
}
