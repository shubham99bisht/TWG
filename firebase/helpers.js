import { ref, get, set, update, push, remove, child, query, 
  orderByChild, equalTo, startAt, startAfter, endAt, 
  endBefore, orderByKey, limitToFirst, limitToLast 
} from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
import { auth, db } from "./index.js";

const logsRef = ref(db, "logs");

// Function to log changes to the "logs" node
export async function logChange(target, action, changeData) {
  const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
  const logEntry = {
    userId,
    target,
    action,
    changeData,
    timestamp: new Date().toISOString(),
  };

  try {
    const newLogRef = push(logsRef); // Generate a new unique key for the log entry
    await set(newLogRef, logEntry);
    console.log("Change logged successfully!");
    return true;
  } catch (error) {
    console.error("Error logging change:", error);
    return false;
  }
}

// Function to read data from the database
export async function readData(dbPath) {
  const dbRef = ref(db, dbPath);
  try {
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error reading data:", error);
    return null;
  }
}

// Function to write data to the database
export async function writeData(dbPath, data) {
  const dbRef = ref(db, dbPath);
  try {
    await set(dbRef, data);
    await logChange(dbPath, "created", data); // Logging the creation
    console.log("Data written successfully!");
    return true;
  } catch (error) {
    console.error("Error writing data:", error);
    return false;
  }
}

export async function writeDataWithNewId(dbPath, data) {
  const baseRef = ref(db, dbPath);
  const dbRef = push(baseRef);
  try {
    await set(dbRef, data);
    await logChange(dbPath, "created", data); // Logging the creation
    console.log("Data written successfully!");
    return true;
  } catch (error) {
    console.error("Error writing data:", error);
    return false;
  }
}

// Function to update data in the database
export async function updateData(dbPath, data) {
  const dbRef = ref(db, dbPath);
  try {
    await update(dbRef, data);
    await logChange(dbPath, "updated", data); // Logging the update
    console.log("Data updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating data:", error);
    return false;
  }
}

// Function to delete data from the database
export async function deleteData(dbPath) {
  const dbRef = ref(db, dbPath);
  try {
    await remove(dbRef);
    await logChange(dbPath, "deleted", null); // Logging the deletion
    console.log("Data deleted successfully!");
    return true;
  } catch (error) {
    console.error("Error deleting data:", error);
    return false;
  }
}

// Function to delete item from an array
export async function deleteArrayData(dbPath, indexToRemove) {
  const dbRef = ref(db, dbPath);
  try {
    const snapshot = await get(dbRef)
    if (snapshot.exists()) {
      const array = snapshot.val();
      array.splice(indexToRemove, 1);  // Remove the element at the specified index
      await set(dbRef, array);
    } else {
      console.error("Data not found to delete");
      return false;
    }
    await logChange(`${dbPath}/${indexToRemove}`, "deleted", null); // Logging the deletion
    console.log("Data deleted successfully!");
    return true;
  } catch (error) {
    console.error("Error deleting data:", error);
    return false;
  }
}

/**
 * Custom Functions
*/

// Function to remove a program ID from universities' program_types
export async function removeProgramFromUniversity(pId) {
  const dbRef = ref(db, 'universities');
  try {
    const dataSnapshot = await get(dbRef);
    dataSnapshot.forEach(dataSnapshotChild => {
      const key = dataSnapshotChild.key;
      const list = dataSnapshotChild.child('program_types').val() || [];
      const updatedList = list.filter(item => item !== pId);
      set(child(dbRef, `${key}/program_types`), updatedList);
    });
    console.log(`Removed ${pId} from all universities`);
  } catch (error) {
    console.error('Error:', error);
    throw error
  }
}
window.removeProgramFromUniversity = removeProgramFromUniversity

export async function fetchPaymentDetails(type, id) {
  if (!['student', 'agent', 'university'].includes(type)) return

  const Rquery = query(ref(db, "receivable"), orderByChild(type), equalTo(id));
  const Pquery = query(ref(db, "payable"), orderByChild(type), equalTo(id));

  try {
    const Rsnapshot = await get(Rquery);
    const REntries = {};
    Rsnapshot.forEach((childSnapshot) => {
      REntries[childSnapshot.key] = childSnapshot.val()
    });

    const Psnapshot = await get(Pquery);
    const PEntries = {};
    Psnapshot.forEach((childSnapshot) => {
      PEntries[childSnapshot.key] = childSnapshot.val()
    });
    
    return {"receivable": REntries, "payable": PEntries}
  } catch (error) {
    throw error;
  }
}

export async function searchReports({ status, startDate, endDate, reportType }) {
  if (!reportType || !['payable', 'receivable'].includes(reportType)) return

  // Start with the base query
  let queryRef = ref(db, reportType);

  // Add filters
  if (status && status?.length == 1) {
    queryRef = query(queryRef, orderByChild('status'), equalTo(status[0]));
  } else if (endDate) {
    queryRef = query(queryRef, orderByChild('dueDate'), endAt(endDate));
  } else if (startDate) {
    queryRef = query(queryRef, orderByChild('dueDate'), startAt(startDate));
  }

  // Execute the query
  const snapshot = await get(queryRef);

  // Handle the snapshot data here
  const data = snapshot.val();

  // Perform additional filtering based on startDate and endDate
  let filteredData = Object.values(data).filter(item => item);

  if (status && status?.length != 1) {
    filteredData = filteredData.filter(item => status.includes(item.status));
  }

  if (startDate) {
    filteredData = filteredData.filter(item => item.dueDate >= startDate);
  }

  if (endDate) {
    filteredData = filteredData.filter(item => item.dueDate <= endDate);
  }

  return filteredData;
}

// Function to fetch paginated data
export async function fetchPaginatedData(dbPath, pageSize, startAtKey='', endAtKey='') {
  let queryRef = ref(db, dbPath)
  queryRef = query(queryRef, orderByKey());

  if (startAtKey) {
    queryRef = query(queryRef, startAfter(startAtKey));
    queryRef = query(queryRef, limitToFirst(pageSize));
  } else if (endAtKey) {
    queryRef = query(queryRef, endBefore(endAtKey));
    queryRef = query(queryRef, limitToLast(pageSize));
  } else {
    queryRef = query(queryRef, limitToLast(pageSize));
  }

  const snapshot = await get(queryRef)
  const data = snapshot.val();
  const startKey = Object.keys(data)[0];
  const endKey = Object.keys(data).pop();
  return { data, startKey, endKey };
}


// Generates dates for Report default search  ['Jan 01 2023', 'Nov 10 2023'] 
export function getDates() {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const currentDate = new Date();
  
  // Format dates
  const formatDate = date => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = date.getDate().toString().padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${day} ${year}`;
  };
  
  return [formatDate(startOfYear), formatDate(currentDate)];
}

// Function to read flagged students
export async function readFlaggedStudents() {
  const dbRef = ref(db, 'students');
  const flaggedStudentsQuery = query(dbRef, orderByChild('flagged'), equalTo(true))
  try {
    const snapshot = await get(flaggedStudentsQuery);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error reading data:", error);
    return null;
  }
}

export function getRemainingCredits(
  feePayable = {},
  learningPlan = {},
  totalFeePayable = 0,
  totalModules = 0
) {
  let totalPaid = 0,
    remainingCredits = 0,
    modulesCount = 0;
  totalFeePayable = Number(totalFeePayable);
  totalModules = Number(totalModules);

  for (let key in learningPlan) {
    const modules = learningPlan[key]?.['modules'];
    for (let moduleKey in modules) {
      if (modules?.[moduleKey]?.['name']) modulesCount++;
    }
  }

  for (let key in feePayable) {
    totalPaid += parseFloat(feePayable[key]?.['amount']) || 0;
  }

  remainingCredits =
    totalPaid - (totalFeePayable / totalModules) * modulesCount;

  if (isNaN(remainingCredits)) return "-";

  return remainingCredits.toFixed(2);
}


export function readDateFilters(datepickerInstance) {
  return datepickerInstance.selectedDates.map((date) => {
    let month = date.getMonth() + 1;
    if (month < 10) month = '0' + month;
    let dateVal = date.getDate();
    if (dateVal < 10) dateVal = '0' + dateVal;
    return `${date.getFullYear()}-${month}-${dateVal}`;
  });
}
