import { readData, getDates, getRemainingCredits, readDateFilters } from "./helpers.js";

let universities = {}, programs = {}, studyStages = {};
const twgDatasChoices = new Choices(document.getElementById("twgProgramDropdown"),
  {
    removeItems: true,
    removeItemButton: true
  }
);

const studyStagesChoices = new Choices(document.getElementById("enrollStageDropdown"),
  {
    removeItems: true,
    removeItemButton: true
  }
);

async function initialise() {
  const temp = Object.keys(programs).map(stageId => {
    let twgData = programs[stageId]
    if (twgData) {
      return {
        value: stageId,
        label: twgData.name
      }
    }
  });
  twgDatasChoices.setChoices(temp)

  const temp2 = Object.keys(studyStages).map(stageId => {
    let studyStage = studyStages[stageId]
    if (studyStage) {
      return {
        value: stageId,
        label: studyStages?.[stageId]?.name
      }
    }
  });
  studyStagesChoices.setChoices(temp2)

  const [startOfYear, currentDate] = getDates();
  const datepickerInstance = flatpickr("#datepicker", {
    mode: 'range', dateFormat: 'M d Y', 'disableMobile': true,
    'defaultDate': [startOfYear, currentDate]
  });

  document.getElementById('searchButton').addEventListener('click', function () {
    let enrollStatus = []
    let studyStageStatus = [];
    let twgProgram = [];
    let studyStage = [];
    let source = sourceDropdown?.value || ''

    for (let i = 0; i < enrollStatusDropdown.options.length; i++) {
      const value = enrollStatusDropdown.options[i]?.value;
      enrollStatus.push(value)
    }

    for (let i = 0; i < studyStageStatusDropdown.options.length; i++) {
      const value = studyStageStatusDropdown.options[i]?.value;
      studyStageStatus.push(value)
    }

    for (let i = 0; i < twgProgramDropdown.options.length; i++) {
      const value = twgProgramDropdown.options[i]?.value;
      twgProgram.push(value)
    }

    for (let i = 0; i < enrollStageDropdown.options.length; i++) {
      const value = enrollStageDropdown.options[i]?.value;
      studyStage.push(value)
    }

    const dateRange = readDateFilters(datepickerInstance);

    const inputParams = {
      enrollStatus, studyStageStatus, twgProgram, studyStage, startDate: dateRange[0], endDate: dateRange[1], source
    }
    listAllEnroll(inputParams)
  });
}

function listAllEnroll(inputParams) {
  const tableBody = document.getElementById("table-payable-body");
  const { enrollStatus, studyStageStatus, twgProgram, studyStage, startDate, endDate, source } = inputParams;
  if (!tableBody) return
  tableBody.innerHTML = ''

  const schema = `<tr class="btn-reveal-trigger" id="{}">
    <td class="align-middle student"><a href="student_details.html?id={}">{}</a></td>
    <td class="align-middle studentEmail">{}</td>
    <td class="align-middle program_type">{}</td>
    <td class="align-middle university">{}</td>
    <td class="align-middle universityDegree">{}</td>
    <td class="align-middle studyStage">{}</td>
    <td class="align-middle enrollmentStatus">{}</td>
    <td class="align-middle startDate">{}</td>
    <td class="align-middle status">{}</td>
    <td class="align-middle remaining-credits">{}</td>
    <td class="align-middle text-nowrap notes">{}</td>
  </tr>`;

  readData(`students`)
    .then(async (data) => {
      let csvContent = 'Student, Student Email,Program Type, University, Degree, Study Stage, Status, Start Date, Status, Remaining Credits, Notes\r\n';
      const csvRow = '{},{},{},{},{},{},{},{},{},{},{}\r\n'

      const transformedData = [];
      Object.values(data).forEach(user => {
        if (user.studyPlan && user.studyPlan.length > 0) {
          user.studyPlan.forEach(plan => {
            const transformedUser = { ...user, ...plan };
            delete transformedUser.studyPlan;
            transformedData.push(transformedUser);
          });
        }
      });

      const filteredData = transformedData.filter(user => {
        if (
          (enrollStatus && enrollStatus.length && !enrollStatus.includes(user.enrollmentStatus)) ||
          (studyStageStatus && studyStageStatus.length && !studyStageStatus.includes(user.status)) ||
          (twgProgram && twgProgram.length && !twgProgram.includes(user.program_type)) ||
          (studyStage && studyStage.length && !studyStage.includes(user.studyStage)) ||
          (startDate && !(user.startDate >= startDate)) ||
          (endDate && !(user.startDate <= endDate)) ||
          (source && user.source != source)
        ) { return false } 
        return true;
      })

      const promises = filteredData && Object.keys(filteredData).map(async id => {
        try {
          const p = filteredData[id];
          const studentId = p['studentId'];
          const UniversityName = universities[p?.university].name;
          const ProgramName = programs[p?.program_type].name;

          const remCredits = getRemainingCredits(
            p?.feePayable,
            p?.learningPlan,
            p?.totalFeePayable,
            p?.totalModules
          );

          const row = schema.format(studentId, studentId, p.studentName, p.studentEmail, ProgramName,
            UniversityName, p.universityDegree, studyStages?.[p?.studyStage]?.name || '',
            p.enrollmentStatus, p.startDate, p.status, remCredits, p?.notes || ''
          );
          if (tableBody) tableBody.innerHTML += row;
          csvContent += csvRow.format(p.studentName, p.studentEmail, ProgramName, UniversityName, p.universityDegree, studyStages?.[p?.studyStage]?.name || '', p.enrollmentStatus, p.startDate, p.status, remCredits, p?.notes || '');
        } catch (e) {
          console.log("ERRROR:", e)
        }
      });

      await Promise.all(promises)
      window.csvContent = csvContent
      listInit()
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
      if (tableBody)
        tableBody.innerHTML = `<tr class="text-center"><td colspan="10">No Enrollment data found!</td></tr>`
    });
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
