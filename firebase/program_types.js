import { readData, writeData, updateData, deleteData } from "./helpers.js";

// Get all program types
function getAllProgramTypes() {
  readData("program_types")
    .then((programTypes) => {
      console.log("Program types:", programTypes);
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
    });
}

getAllProgramTypes()

// Get program type by id
function getProgramTypeById(id) {
  readData("program_types")
    .then((programTypes) => {
      console.log("Program types:", programTypes);
    })
    .catch((error) => {
      console.error("Error reading program types:", error);
    });
}


// Create a new program type
// const newProgramType = {
//   name: "Internal Program 3",
//   commission_rate: 20,
//   first_installment: 90,
// };

// writeData("program_types", newProgramType)
//   .then((result) => {
//     if (result) {
//       console.log("Program type created successfully!");
//     }
//   })
//   .catch((error) => {
//     console.error("Error creating program type:", error);
//   });



// // Update an existing program type (assuming "id" is the program type ID)
// const programTypeId = "id";
// const updatedProgramType = {
//   name: "Updated Program 1",
//   commission_rate: 25,
//   first_installment: 90,
// };

// updateData(`program_types/${programTypeId}`, updatedProgramType)
//   .then((result) => {
//     if (result) {
//       console.log("Program type updated successfully!");
//     }
//   })
//   .catch((error) => {
//     console.error("Error updating program type:", error);
//   });

// // Delete an existing program type (assuming "id2" is the program type ID)
// const programTypeIdToDelete = "id2";

// deleteData(`program_types/${programTypeIdToDelete}`)
//   .then((result) => {
//     if (result) {
//       console.log("Program type deleted successfully!");
//     }
//   })
//   .catch((error) => {
//     console.error("Error deleting program type:", error);
//   });
