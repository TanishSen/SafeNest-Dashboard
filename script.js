// BLE variables
const pairWithBandBtn = document.getElementById("pair-with-band-btn");
const blePairingStatus = document.getElementById("ble-pairing-status");
const blePairingDevices = document.getElementById("ble-pairing-devices");
let isPairing = false;

// Add a scroll event listener to handle scrolling effects
window.addEventListener("scroll", function () {
  const scrollPosition = window.scrollY;
  const topNav = document.querySelector(".top-nav");

  // Add shadow to navbar when scrolling
  if (scrollPosition > 10) {
    topNav.classList.add("shadow-md");
    topNav.style.boxShadow =
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
  } else {
    topNav.classList.remove("shadow-md");
    topNav.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.03)";
  }
});

// Add smooth scroll to links within the page
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId !== "#") {
      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  });
});

// Initialize Lucide Icons
lucide.createIcons();

// Initial Data
const initialPatients = [
  {
    id: "P001",
    name: "John Doe",
    bandStatus: "In Range",
    hub: "Hub 1",
    rfidVerified: "Yes",
    alert: "None",
    timestamp: "04/25/2025, 10:00 AM",
  },
  {
    id: "P002",
    name: "Jane Smith",
    bandStatus: "Out of Range",
    hub: "Hub 2",
    rfidVerified: "Yes",
    alert: "Out of Range",
    timestamp: "04/25/2025, 10:15 AM",
  },
  {
    id: "P003",
    name: "Alice Johnson",
    bandStatus: "Tampered",
    hub: "Hub 3",
    rfidVerified: "No",
    alert: "Tampered",
    timestamp: "04/25/2025, 10:30 AM",
  },
];

const hubData = [
  { name: "Hub 1", occupied: 18, capacity: 30, color: "#F97316" },
  { name: "Hub 2", occupied: 12, capacity: 20, color: "#FB923C" },
  { name: "Hub 3", occupied: 25, capacity: 40, color: "#C2410C" },
];

const growthData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  occupied: [20, 22, 25, 23, 27, 30],
  available: [10, 8, 5, 7, 3, 0],
};

// State
let patients = [...initialPatients];
let activePage = "Dashboard"; // Store active page state

// DOM Elements
const sidebar = document.getElementById("sidebar");
const toggleSidebarBtn = document.getElementById("toggle-sidebar");
const searchInput = document.getElementById("search-input");
const navLinks = document.querySelectorAll(".sidebar-nav a"); // Get all sidebar navigation links
const pageTitle = document.querySelector(".top-nav h2");
const patientTableBody = document.getElementById("patient-table-body");
const totalPatientsEl = document.getElementById("total-patients");
const visitorsTodayEl = document.getElementById("visitors-today");
const availableBedsEl = document.getElementById("available-beds");
const hubDetailsEl = document.getElementById("hub-details");
const openModalBtn = document.getElementById("open-modal-btn");
const modal = document.getElementById("add-patient-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelModalBtn = document.getElementById("cancel-modal-btn");
const addPatientForm = document.getElementById("add-patient-form");
const modalError = document.getElementById("modal-error");
const modalErrorText = modalError.querySelector("span");

// Sidebar Toggle
toggleSidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("expanded");
  const icon = toggleSidebarBtn.querySelector("i");
  icon.setAttribute(
    "data-lucide",
    sidebar.classList.contains("expanded") ? "arrow-left" : "arrow-right"
  );
  lucide.createIcons();
});

// Search Functionality
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm) ||
      patient.id.toLowerCase().includes(searchTerm) ||
      patient.hub.toLowerCase().includes(searchTerm)
  );
  renderPatientTable(filteredPatients);
});

// Stats Cards
function updateStats() {
  const totalPatients = patients.length;
  const visitorsToday = patients.filter(
    (p) => new Date(p.timestamp).toDateString() === new Date().toDateString()
  ).length;
  const totalCapacity = hubData.reduce((sum, hub) => sum + hub.capacity, 0);
  const totalOccupied = hubData.reduce((sum, hub) => sum + hub.occupied, 0);
  const availableBeds = totalCapacity - totalOccupied;

  totalPatientsEl.textContent = totalPatients;
  visitorsTodayEl.textContent = visitorsToday;
  availableBedsEl.textContent = availableBeds;
}

// Patient Table
function renderPatientTable(patientList) {
  patientTableBody.innerHTML = "";

  if (patientList.length === 0) {
    // Show empty state if no patients
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="6" class="py-8 text-center text-gray-500">
        <div class="flex flex-col items-center justify-center gap-2">
          <i data-lucide="user-x" class="w-8 h-8 text-gray-400 mb-2"></i>
          <p>No patients found</p>
          <p class="text-sm text-gray-400">Try adding a new patient or adjusting your search</p>
        </div>
      </td>
    `;
    patientTableBody.appendChild(emptyRow);
    lucide.createIcons();
    return;
  }

  patientList.forEach((patient, index) => {
    const row = document.createElement("tr");
    row.className = `hover:bg-gray-50 transition-all duration-200 ${
      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
    }`;

    // Get time difference for timestamp highlighting
    const isRecent = isRecentTimestamp(patient.timestamp);

    row.innerHTML = `
      <td class="py-4 px-4">
        <div class="patient-info flex items-center">
          <div class="avatar w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center font-semibold mr-3">
            ${patient.name.charAt(0)}
          </div>
          <div class="details">
            <p class="font-medium text-gray-800">${patient.name}</p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">${patient.id}</span>
              ${
                isRecent
                  ? '<span class="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full">New</span>'
                  : ""
              }
            </div>
          </div>
        </div>
      </td>
      <td class="py-4 px-4">
        <span class="status px-3 py-1 rounded-full text-xs font-medium ${
          patient.bandStatus === "In Range"
            ? "bg-green-100 text-green-600"
            : patient.bandStatus === "Out of Range"
            ? "bg-yellow-100 text-yellow-600"
            : "bg-red-100 text-red-600"
        }">
          <i data-lucide="${
            patient.bandStatus === "In Range"
              ? "check-circle"
              : patient.bandStatus === "Out of Range"
              ? "alert-triangle"
              : "alert-circle"
          }" class="w-3 h-3 mr-1 inline-block"></i>
          ${patient.bandStatus}
        </span>
      </td>
      <td class="py-4 px-4 text-gray-800">${patient.hub}</td>
      <td class="py-4 px-4">
        <div class="rfid-verified flex items-center gap-2 text-sm ${
          patient.rfidVerified === "Yes" ? "text-green-600" : "text-red-600"
        }">
          <i data-lucide="${
            patient.rfidVerified === "Yes" ? "check" : "x"
          }-circle"></i>
          ${patient.rfidVerified}
        </div>
      </td>
      <td class="py-4 px-4">
        <div class="alert flex items-center gap-2 text-sm ${
          patient.alert === "None" ? "text-gray-600" : "text-red-600"
        }">
          <i data-lucide="${
            patient.alert === "None" ? "check-circle" : "alert-circle"
          }"></i>
          ${patient.alert}
        </div>
      </td>
      <td class="py-4 px-4">
        <div class="actions flex gap-3 justify-end">
          <button class="edit p-2 rounded-lg hover:bg-orange-50 hover:text-orange-500 transition-all duration-200" 
                 data-tooltip="Edit patient" data-id="${patient.id}">
            <i data-lucide="edit"></i>
          </button>
          <button class="delete p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all duration-200" 
                 data-tooltip="Delete patient" data-id="${patient.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    `;
    patientTableBody.appendChild(row);
  });

  // Re-initialize Lucide Icons
  lucide.createIcons();

  // Add event listeners for edit and delete buttons
  document.querySelectorAll(".delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const patientName = patients.find((p) => p.id === id)?.name || "Unknown";

      // Enhanced confirmation using notification system
      if (confirm(`Are you sure you want to remove ${patientName}?`)) {
        patients = patients.filter((patient) => patient.id !== id);
        renderPatientTable(patients);
        updateStats();
        renderHubDetails();
        updateHubCapacityChart();
        showNotification(
          `Patient ${patientName} removed successfully`,
          "success"
        );
      }
    });
  });

  document.querySelectorAll(".edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const patientName = patients.find((p) => p.id === id)?.name || "Unknown";
      showNotification(
        `Edit functionality for ${patientName} can be implemented here`,
        "info"
      );
    });
  });
}

// Helper function to check if timestamp is recent (within last 24 hours)
function isRecentTimestamp(timestamp) {
  const now = new Date();
  const timestampDate = new Date(timestamp);
  const diffHours = Math.abs(now - timestampDate) / 36e5; // Convert ms to hours
  return diffHours < 24;
}

// Hub Capacity Chart
let hubCapacityChart;
function updateHubCapacityChart() {
  const ctx = document.getElementById("hub-capacity-chart").getContext("2d");
  const totalOccupied = hubData.reduce((sum, hub) => sum + hub.occupied, 0);
  const totalCapacity = hubData.reduce((sum, hub) => sum + hub.capacity, 0);
  const available = totalCapacity - totalOccupied;

  if (hubCapacityChart) hubCapacityChart.destroy();

  hubCapacityChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Occupied", "Available"],
      datasets: [
        {
          data: [totalOccupied, available],
          backgroundColor: ["#F97316", "#E5E7EB"],
          borderWidth: 0,
          hoverOffset: 20,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 14, family: "'Inter', sans-serif" },
            color: "#1F2937",
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "#1F2937",
          titleFont: { family: "'Inter', sans-serif" },
          bodyFont: { family: "'Inter', sans-serif" },
          padding: 12,
          cornerRadius: 8,
        },
      },
      animation: {
        animateRotate: true,
        animateScale: true,
      },
    },
  });
}

// Bar Chart
function renderBarChart() {
  const ctx = document.getElementById("bar-chart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: growthData.labels,
      datasets: [
        {
          label: "Occupied",
          data: growthData.occupied,
          backgroundColor: "#F97316",
          borderRadius: 4,
        },
        {
          label: "Available",
          data: growthData.available,
          backgroundColor: "#E5E7EB",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: "#6B7280", font: { family: "'Inter', sans-serif" } },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: "#E5E7EB" },
          ticks: { color: "#6B7280", font: { family: "'Inter', sans-serif" } },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 14, family: "'Inter', sans-serif" },
            color: "#1F2937",
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "#1F2937",
          titleFont: { family: "'Inter', sans-serif" },
          bodyFont: { family: "'Inter', sans-serif" },
          padding: 12,
          cornerRadius: 8,
        },
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  });
}

// Hub Details
function renderHubDetails() {
  hubDetailsEl.innerHTML = "";
  hubData.forEach((hub) => {
    const patientsInHub = patients.filter((p) => p.hub === hub.name).length;
    const percentage = (hub.occupied / hub.capacity) * 100;
    const item = document.createElement("div");
    item.className =
      "hub-item p-4 bg-white rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300";
    item.innerHTML = `
      <div class="header flex justify-between items-center mb-4">
        <div class="title flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span class="dot w-2 h-2 rounded-full" style="background-color: ${hub.color}"></span>
          ${hub.name}
        </div>
        <span class="text-xs text-orange-500 font-medium">${hub.occupied}/${hub.capacity}</span>
      </div>
      <div class="stats grid grid-cols-3 gap-4 text-sm text-gray-600">
        <div>
          <span class="block text-xs">Total Capacity</span>
          <span class="font-medium text-gray-800">${hub.capacity}</span>
        </div>
        <div>
          <span class="block text-xs">Occupied</span>
          <span class="font-medium text-gray-800">${hub.occupied}</span>
        </div>
        <div>
          <span class="block text-xs">Patients</span>
          <span class="font-medium text-gray-800">${patientsInHub}</span>
        </div>
      </div>
      <div class="progress-bar h-1 bg-gray-100 rounded-full mt-4 overflow-hidden">
        <div class="fill h-full bg-orange-400 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
      </div>
    `;
    hubDetailsEl.appendChild(item);
  });
}

// Modal Functionality
openModalBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  document.getElementById("name").focus();
  checkBluetoothAvailability(); // Check Bluetooth availability when modal opens
});

closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
});

function closeModal() {
  modal.classList.add("hidden");
  addPatientForm.reset();
  modalError.classList.add("hidden");
}

addPatientForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const age = Number(document.getElementById("age").value);
  const guardianName = document.getElementById("guardianName").value;
  const rfidUid = document.getElementById("rfidUid").value;
  const bandUid = document.getElementById("bandUid").value;
  const hub = document.getElementById("hub").value;

  // Validation
  if (
    !name ||
    !age ||
    !guardianName ||
    !rfidUid ||
    !bandUid ||
    isNaN(age) ||
    age < 0 ||
    age > 120
  ) {
    modalError.classList.remove("hidden");
    modalErrorText.textContent =
      "All fields are required. Age must be a number between 0 and 120.";
    return;
  }

  // Add new patient
  const id = `P${String(patients.length + 1).padStart(3, "0")}`;
  const timestamp = new Date().toLocaleString();
  const newPatient = {
    id,
    name,
    bandStatus: "In Range",
    hub,
    rfidVerified: "Yes",
    alert: "None",
    timestamp,
  };

  patients.push(newPatient);
  renderPatientTable(patients);
  updateStats();
  renderHubDetails();
  updateHubCapacityChart();
  closeModal();
});

// Initialize the Dashboard
renderPatientTable(patients);
updateStats();
updateHubCapacityChart();
renderBarChart();
renderHubDetails();

// Dynamic Sidebar Navigation
function initSidebarNavigation() {
  // Set initial active state based on the current page
  updateActivePage(activePage);

  // Add click event listeners to all nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Get the page name from the link text
      const pageName = link.querySelector("span").textContent;

      // Update active page and UI
      updateActivePage(pageName);

      // Show notification for page change
      showNotification(`Navigating to ${pageName}`);

      // Here you would typically load the relevant page content
      // This is a placeholder for actual page navigation
      if (pageName !== "Dashboard") {
        // Hide main dashboard content when not on Dashboard page
        document.querySelector(".main-section").classList.add("hidden");
      } else {
        // Show dashboard content when on Dashboard page
        document.querySelector(".main-section").classList.remove("hidden");
      }
    });
  });

  // Add hover effect for collapsed sidebar
  sidebar.addEventListener("mouseenter", () => {
    if (!sidebar.classList.contains("expanded")) {
      sidebar.classList.add("temp-expanded");
    }
  });

  sidebar.addEventListener("mouseleave", () => {
    sidebar.classList.remove("temp-expanded");
  });
}

// Update the active page in the sidebar
function updateActivePage(pageName) {
  // Update active state
  activePage = pageName;

  // Update page title
  pageTitle.textContent = pageName;

  // Update sidebar navigation active state
  navLinks.forEach((link) => {
    const linkPage = link.querySelector("span").textContent;

    if (linkPage === pageName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Notifications system
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification fixed bottom-6 right-6 bg-white p-4 rounded-xl shadow-lg 
                           flex items-center gap-3 z-50 transform translate-y-0 opacity-100 transition-all duration-300`;

  // Set icon and color based on type
  let iconName, bgColor, textColor;
  switch (type) {
    case "success":
      iconName = "check-circle";
      bgColor = "bg-green-50";
      textColor = "text-green-600";
      break;
    case "error":
      iconName = "alert-circle";
      bgColor = "bg-red-50";
      textColor = "text-red-600";
      break;
    case "warning":
      iconName = "alert-triangle";
      bgColor = "bg-yellow-50";
      textColor = "text-yellow-600";
      break;
    default:
      iconName = "info";
      bgColor = "bg-orange-50";
      textColor = "text-orange-500";
  }

  // Add styles
  notification.classList.add(bgColor, textColor);

  // Set content
  notification.innerHTML = `
    <i data-lucide="${iconName}" class="h-5 w-5"></i>
    <span class="font-medium">${message}</span>
  `;

  // Append to document
  document.body.appendChild(notification);

  // Initialize icon
  lucide.createIcons();

  // Auto-remove after delay
  setTimeout(() => {
    notification.classList.add("opacity-0", "translate-y-10");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize sidebar navigation
initSidebarNavigation();

// BLE Functionality
// Remove the floating scan button functionality and keep only the modal
const bleDevicesModal = document.getElementById("ble-devices-modal");
const closeBleModalBtn = document.getElementById("close-ble-modal-btn");
const closeBleListBtn = document.getElementById("close-ble-list-btn");
const refreshBleBtn = document.getElementById("refresh-ble-btn");
const bleStatus = document.getElementById("ble-status");
const bleDevicesList = document.getElementById("ble-devices-list");

let connectedDevices = []; // Track connected BLE devices
let isScanning = false;

// Close BLE modal
function closeBleModal() {
  bleDevicesModal.classList.add("hidden");
  bleStatus.innerHTML = "";
}

// Event Listeners for BLE modal
closeBleModalBtn.addEventListener("click", closeBleModal);
closeBleListBtn.addEventListener("click", closeBleModal);

// Close modal if clicking outside
bleDevicesModal.addEventListener("click", (e) => {
  if (e.target === bleDevicesModal) {
    closeBleModal();
  }
});

// Check if Web Bluetooth API is available
function checkBluetoothAvailability() {
  if (!navigator.bluetooth) {
    blePairingStatus.innerHTML =
      '<div class="text-red-500">Web Bluetooth API is not available in your browser.</div>';
    pairWithBandBtn.disabled = true;
    pairWithBandBtn.classList.add("opacity-50", "cursor-not-allowed");
    return false;
  }
  return true;
}

// Scan for BLE devices for pairing
async function scanForBandPairing() {
  if (!checkBluetoothAvailability()) return;

  if (isPairing) {
    blePairingStatus.innerHTML =
      '<div class="text-yellow-500">Already scanning...</div>';
    return;
  }

  try {
    isPairing = true;
    blePairingStatus.innerHTML =
      '<div class="text-blue-500"><i data-lucide="loader" class="inline w-4 h-4 mr-1 animate-spin"></i> Scanning for BLE bands...</div>';
    lucide.createIcons();
    blePairingDevices.innerHTML = "";

    // Request Bluetooth device with optional services
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [], // Add specific services if needed
    });

    if (device) {
      // Create device element
      const deviceElement = document.createElement("div");
      deviceElement.className =
        "device p-3 bg-blue-50 rounded-lg flex justify-between items-center";

      const deviceName = device.name || "Unknown Band";
      const deviceId = device.id;

      deviceElement.innerHTML = `
        <div>
          <div class="font-medium">${deviceName}</div>
          <div class="text-xs text-gray-500">${deviceId}</div>
        </div>
        <button class="select-band-btn px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
          Select
        </button>
      `;

      // Add click event to select this device
      deviceElement
        .querySelector(".select-band-btn")
        .addEventListener("click", () => {
          document.getElementById("bandUid").value = deviceName;
          blePairingStatus.innerHTML = `<div class="text-green-500">Selected band: ${deviceName}</div>`;
          blePairingDevices.innerHTML = "";

          // Try to establish connection for monitoring disconnects
          connectToBand(device, deviceName)
            .then(() => {
              console.log("Band connected successfully");
            })
            .catch((err) => {
              console.error("Error connecting to band:", err);
            });
        });

      blePairingDevices.appendChild(deviceElement);
      blePairingStatus.innerHTML =
        '<div class="text-green-500">Select a band to pair</div>';
    }

    lucide.createIcons();
  } catch (error) {
    console.error("Bluetooth Error:", error);
    blePairingStatus.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
  } finally {
    isPairing = false;
  }
}

// Connect to a band for monitoring
async function connectToBand(device, deviceName) {
  try {
    // Connect to GATT server (needed to establish connection)
    const server = await device.gatt.connect();

    // Add to connected devices list
    connectedDevices.push({
      device: device,
      name: deviceName,
      server: server,
      timestamp: new Date(),
    });

    // Set up disconnect event listener
    device.addEventListener("gattserverdisconnected", () => {
      handleDeviceDisconnection(device, deviceName);
    });

    return server;
  } catch (error) {
    console.error(`Error connecting to ${deviceName}:`, error);
    throw error;
  }
}

// Handle device disconnection
function handleDeviceDisconnection(device, deviceName) {
  // Remove from connected devices list
  connectedDevices = connectedDevices.filter((d) => d.device.id !== device.id);

  // Show emergency alert
  showEmergencyDisconnectionAlert(deviceName);

  // Update patient status if this is a patient's device
  const patientWithDevice = patients.find((p) => p.bandUid === deviceName);
  if (patientWithDevice) {
    patientWithDevice.bandStatus = "Out of Range";
    patientWithDevice.alert = "Emergency: Disconnected";
    renderPatientTable(patients);
  }
}

// Show emergency disconnection alert
function showEmergencyDisconnectionAlert(deviceName) {
  // Play alert sound
  playAlertSound();

  // Create emergency alert div - simplified approach with direct body insertion
  const alertId = `alert-${Date.now()}`;
  const alertDiv = document.createElement("div");
  alertDiv.id = alertId;
  alertDiv.style.position = "fixed";
  alertDiv.style.top = "0";
  alertDiv.style.left = "0";
  alertDiv.style.width = "100%";
  alertDiv.style.backgroundColor = "#dc2626"; // Red color
  alertDiv.style.color = "white";
  alertDiv.style.padding = "1rem";
  alertDiv.style.display = "flex";
  alertDiv.style.justifyContent = "space-between";
  alertDiv.style.alignItems = "center";
  alertDiv.style.zIndex = "9999";
  alertDiv.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  alertDiv.style.transform = "translateY(-100%)";
  alertDiv.style.transition = "transform 0.5s ease";

  alertDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <div style="background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; padding: 0.5rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <div>
        <h3 style="font-weight: bold; font-size: 1.25rem;">EMERGENCY ALERT</h3>
        <p>Device "${deviceName}" unexpectedly disconnected!</p>
      </div>
    </div>
    <button style="background: none; border: none; color: white; cursor: pointer; padding: 0.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;" 
            onclick="document.getElementById('${alertId}').style.transform = 'translateY(-100%)'; setTimeout(() => document.getElementById('${alertId}').remove(), 500);">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Append alert to body
  document.body.appendChild(alertDiv);

  // Trigger animation after a small delay to ensure the element is in the DOM
  setTimeout(() => {
    alertDiv.style.transform = "translateY(0)";
  }, 10);

  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    if (document.getElementById(alertId)) {
      document.getElementById(alertId).style.transform = "translateY(-100%)";
      setTimeout(() => {
        if (document.getElementById(alertId)) {
          document.getElementById(alertId).remove();
        }
      }, 500);
    }
  }, 15000);
}

// Play alert sound
function playAlertSound() {
  const audio = new Audio(
    "data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
  );
  audio.play();
}

// Add CSS for animations
function addAnimationStyles() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes pulseRed {
      0% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
    }
  `;
  document.head.appendChild(style);
}

// Open BLE modal
function openBleModal() {
  bleDevicesModal.classList.remove("hidden");
  checkBluetoothAvailability();
}

// Close BLE modal
function closeBleModal() {
  bleDevicesModal.classList.add("hidden");
  bleStatus.innerHTML = "";
}

// Event Listeners for BLE
pairWithBandBtn.addEventListener("click", scanForBandPairing);
closeBleModalBtn.addEventListener("click", closeBleModal);
closeBleListBtn.addEventListener("click", closeBleModal);
refreshBleBtn.addEventListener("click", scanForBandPairing);

// Close modal if clicking outside
bleDevicesModal.addEventListener("click", (e) => {
  if (e.target === bleDevicesModal) {
    closeBleModal();
  }
});

// Patient Detail View
let currentPatientId = null;

// Render patient details page
function renderPatientDetailPage(patientId) {
  // Store current patient ID
  currentPatientId = patientId;

  // Find the patient
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    showNotification("Patient not found", "error");
    return;
  }

  // Get the main section
  const mainSection = document.querySelector(".main-section");
  if (!mainSection) return;

  // Save the current scroll position
  const scrollPosition = window.scrollY;

  // Store the original content to restore later
  if (!mainSection.originalContent) {
    mainSection.originalContent = mainSection.innerHTML;
  }

  // Generate readable timestamp
  const timestamp = new Date(patient.timestamp);
  const formattedDate = timestamp.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Create the back navigation link
  const backLink = document.createElement("div");
  backLink.className =
    "mb-6 flex items-center gap-2 text-orange-500 hover:underline cursor-pointer";
  backLink.innerHTML = `
    <i data-lucide="arrow-left" class="w-4 h-4"></i>
    <span>Back to Patients</span>
  `;
  backLink.onclick = () => {
    // If we came from Patients page, go back there
    if (activePage === "Patients") {
      renderPatientsPage();
    } else {
      // Otherwise restore original content
      if (mainSection.originalContent) {
        mainSection.innerHTML = mainSection.originalContent;
        mainSection.originalContent = null;

        // Re-initialize the dashboard content
        renderDashboardContent();
      }
    }

    // Clear current patient ID
    currentPatientId = null;
  };

  // Status badge style based on band status
  let statusClass, statusIcon;
  if (patient.bandStatus === "In Range") {
    statusClass = "bg-green-100 text-green-600";
    statusIcon = "check-circle";
  } else if (patient.bandStatus === "Out of Range") {
    statusClass = "bg-yellow-100 text-yellow-600";
    statusIcon = "alert-triangle";
  } else {
    statusClass = "bg-red-100 text-red-600";
    statusIcon = "alert-circle";
  }

  // RFID verification status
  const rfidClass =
    patient.rfidVerified === "Yes" ? "text-green-600" : "text-red-600";
  const rfidIcon = patient.rfidVerified === "Yes" ? "check-circle" : "x-circle";

  // Alert status
  const alertClass =
    patient.alert === "None" ? "text-gray-600" : "text-red-600";
  const alertIcon = patient.alert === "None" ? "check-circle" : "alert-circle";

  // Check if this is baby-01A
  const isBaby01A =
    patient.id.toLowerCase().includes("baby-01a") ||
    patient.name.toLowerCase().includes("baby-01a");
  const emergencyMessage =
    patient.bandStatus === "Out of Range" && isBaby01A
      ? '<span class="inline-block mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">baby-01A in emergency</span>'
      : "";

  // Patient detail HTML
  mainSection.innerHTML = `
    ${backLink.outerHTML}
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Patient info card -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center gap-4">
              <div class="avatar w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xl font-semibold">
                ${patient.name.charAt(0)}
              </div>
              <div>
                <h2 class="text-2xl font-semibold text-gray-800">${
                  patient.name
                }</h2>
                <p class="text-gray-500">${patient.id}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button id="edit-patient-btn" class="p-2 rounded-lg bg-orange-50 text-orange-500 hover:bg-orange-100">
                <i data-lucide="edit"></i>
              </button>
              <button id="delete-patient-btn" class="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
          
          <div class="mb-6">
            <div class="status-badge ${statusClass} inline-block px-3 py-1 rounded-full text-sm">
              <i data-lucide="${statusIcon}" class="w-4 h-4 mr-1 inline-block"></i>
              ${patient.bandStatus}
            </div>
            ${emergencyMessage}
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-500">Age</p>
                <p class="font-medium text-gray-800">${
                  patient.age || "N/A"
                } years</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Guardian</p>
                <p class="font-medium text-gray-800">${
                  patient.guardianName || "N/A"
                }</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Hub</p>
                <p class="font-medium text-gray-800">${patient.hub}</p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-500">RFID UID</p>
                <p class="font-medium text-gray-800 font-mono">${
                  patient.rfidUid || "N/A"
                }</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Band UID</p>
                <p class="font-medium text-gray-800 font-mono">${
                  patient.bandUid || "N/A"
                }</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Registered</p>
                <p class="font-medium text-gray-800">${formattedDate} at ${formattedTime}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Status History Card -->
        <div class="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Status History</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              <div class="flex-1">
                <p class="font-medium text-gray-800">In Range</p>
                <p class="text-sm text-gray-500">Initial registration</p>
              </div>
              <div class="text-sm text-gray-500">${formattedDate} · ${formattedTime}</div>
            </div>
            
            ${
              patient.bandStatus !== "In Range"
                ? `
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-2 h-2 rounded-full bg-${
                patient.bandStatus === "Out of Range" ? "yellow" : "red"
              }-500"></div>
              <div class="flex-1">
                <p class="font-medium text-gray-800">${patient.bandStatus}</p>
                <p class="text-sm text-gray-500">Status changed</p>
              </div>
              <div class="text-sm text-gray-500">Now</div>
            </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
      
      <!-- Status cards -->
      <div class="space-y-6">
        <!-- RFID Status -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">RFID Verification</h3>
            <i data-lucide="${rfidIcon}" class="w-5 h-5 ${rfidClass}"></i>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-${
              patient.rfidVerified === "Yes" ? "green" : "red"
            }-100 ${rfidClass} flex items-center justify-center">
              <i data-lucide="${rfidIcon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">${patient.rfidVerified}</p>
              <p class="text-sm text-gray-500">Verification status</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-2">
            ${
              patient.rfidVerified === "Yes"
                ? "RFID verification passed. Patient identity confirmed."
                : "RFID verification failed. Please check patient identity."
            }
          </p>
        </div>
        
        <!-- Alert Status -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Alert Status</h3>
            <i data-lucide="${alertIcon}" class="w-5 h-5 ${alertClass}"></i>
          </div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-${
              patient.alert === "None" ? "gray" : "red"
            }-100 ${alertClass} flex items-center justify-center">
              <i data-lucide="${alertIcon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1">
              <p class="font-medium text-gray-800">${
                patient.alert === "None" ? "No Alerts" : patient.alert
              }</p>
              <p class="text-sm text-gray-500">${
                patient.alert === "None"
                  ? "All systems normal"
                  : "Attention required"
              }</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 mt-2">
            ${
              patient.alert === "None"
                ? "No active alerts. The patient is safe and all systems are functioning properly."
                : `Alert: ${patient.alert}. Immediate attention required.`
            }
          </p>
        </div>
        
        <!-- Actions -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
          <div class="space-y-3">
            <button class="w-full py-2 px-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-all flex items-center justify-center gap-2" id="locate-patient-btn">
              <i data-lucide="map-pin"></i>
              <span>Locate Patient</span>
            </button>
            <button class="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium" id="add-tag-btn">
              <i data-lucide="tag"></i>
              <span>Add Tag</span>
            </button>
            <button class="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-all flex items-center justify-center gap-2" id="print-report-btn">
              <i data-lucide="printer"></i>
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize icons
  lucide.createIcons();

  // Add event listeners
  document.getElementById("edit-patient-btn").addEventListener("click", () => {
    openEditModal(patient);
  });

  document
    .getElementById("delete-patient-btn")
    .addEventListener("click", () => {
      if (confirm(`Are you sure you want to remove ${patient.name}?`)) {
        patients = patients.filter((p) => p.id !== patient.id);
        saveToLocalStorage();
        showNotification(
          `Patient ${patient.name} removed successfully`,
          "success"
        );

        // Go back to patient list
        backLink.click();
      }
    });

  document
    .getElementById("locate-patient-btn")
    .addEventListener("click", () => {
      showNotification(`Locating patient ${patient.name}...`, "info");

      // Simulate locating after a delay
      setTimeout(() => {
        showNotification(
          `Patient ${patient.name} located in ${patient.hub}`,
          "success"
        );
      }, 1500);
    });

  document.getElementById("add-tag-btn").addEventListener("click", () => {
    showNotification(`Adding tag for patient ${patient.name}...`, "info");

    // Simulate tag addition
    setTimeout(() => {
      showNotification(`Tag added successfully for ${patient.name}`, "success");
    }, 1000);
  });

  document.getElementById("print-report-btn").addEventListener("click", () => {
    showNotification("Preparing patient report...", "info");

    // Simulate printing delay
    setTimeout(() => {
      showNotification("Patient report ready for printing", "success");
    }, 1000);
  });
}

// Add view functionality to patients in table
function enhancePatientTable() {
  // Add view button to each patient row
  document.querySelectorAll(".patient-info").forEach((info) => {
    // Find the parent row
    const row = info.closest("tr");
    if (!row) return;

    // Make row clickable
    row.style.cursor = "pointer";

    // Add click event to view patient
    row.addEventListener("click", (e) => {
      // Ignore clicks on action buttons
      if (e.target.closest(".actions")) {
        return;
      }

      // Get patient ID from the row
      const patientIdElement = row.querySelector(
        ".details .text-xs.text-gray-500"
      );
      if (patientIdElement) {
        const patientId = patientIdElement.textContent;
        renderPatientDetailPage(patientId);
      }
    });
  });
}

// Override the renderPatientTable function to enhance it
const originalRenderPatientTable = renderPatientTable;
renderPatientTable = function (patientList) {
  // Call the original function
  originalRenderPatientTable(patientList);

  // Enhance the table
  enhancePatientTable();
};
