import { ref, get, set, update, push, remove, child, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
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
