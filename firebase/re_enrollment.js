import { readData, getDates } from './helpers.js';

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
    const dateRange = datepickerInstance.selectedDates.map(
      (date) => date.toISOString().split('T')[0]
    );

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

  if (filterStartDate) {
    filterStartDate = new Date(filterStartDate);
  }
  if (filterEndDate) {
    filterEndDate = new Date(filterEndDate);
  }

  if (filterStartDate == 'Invalid Date' || filterEndDate == 'Invalid Date') {
    failMessage('Invalid start/end date');
    return;
  }

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
      for (let key in learningPlans) {
        const learningPlan = learningPlans[key];
        const { name: term_number, startDate } = learningPlan;

        const startDate1 = new Date(startDate);
        if (startDate1 < filterStartDate || startDate1 > filterEndDate)
          continue;

        const row = schema.format(
          id,
          id,
          studentName,
          studentEmail,
          programsData[program_type],
          term_number,
          startDate,
          enrollmentStatus,
          20
        );

        if (tableBody) tableBody.innerHTML += row;

        csvContent += csvRow.format(
          studentName,
          studentEmail,
          programsData[program_type],
          term_number,
          startDate,
          enrollmentStatus,
          20
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
