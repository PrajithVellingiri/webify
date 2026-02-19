// =========================
// TOAST NOTIFICATION
// =========================
const showToast = (message, type = "info") => {
  const toast = document.createElement("div");
  toast.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
  toast.style.zIndex = "9999";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// =========================
// API BASE
// =========================
const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : "/api";

// =========================
// LOADING SPINNER
// =========================
const showLoading = (elementId) => {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
};

const hideLoading = (elementId) => {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = '';
};

// =========================
// API REQUEST WRAPPER
// =========================
const apiRequest = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Server error" }));
      console.error(`HTTP error! status: ${response.status}`, errorData);
      showToast(errorData.message || `Error: ${response.status}`, "danger");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API Request failed:", error);
    showToast("Network error. Please check your connection.", "danger");
    return null;
  }
};

// =========================
// AUTH CHECK
// =========================
const requireAuth = () => {
  const token = localStorage.getItem("token");
  if (
    !token &&
    !window.location.pathname.includes("login") &&
    !window.location.pathname.includes("signup")
  ) {
    window.location.href = "login.html";
  }
};

// =========================
// GET USER INFO
// =========================
const loadUserInfo = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const user = await apiRequest(`/user/${decoded.id}`);
    
    if (user && user.name) {
      document.querySelectorAll(".userName").forEach(el => {
        el.textContent = `Welcome ${user.name}`;
      });
    }
  } catch (error) {
    console.error("Failed to load user info:", error);
  }
};

// =========================
// LOGIN
// =========================
const handleLogin = async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const data = await apiRequest("/login", "POST", { email, password });

  if (data && data.token) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    showToast(data?.message || "Login failed", "danger");
  }
};

// =========================
// SIGNUP
// =========================
const handleSignup = async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const data = await apiRequest("/signup", "POST", {
    name,
    email,
    password,
  });

  if (data && data.token) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    showToast(data?.message || "Signup failed", "danger");
  }
};

// =========================
// DASHBOARD LOAD
// =========================
const loadDashboard = async () => {
  if (!window.location.pathname.includes("dashboard")) return;

  showLoading("productsTable");
  
  const data = await apiRequest("/dashboard");

  if (!data) {
    hideLoading("productsTable");
    return;
  }

  // Update summary
  document.getElementById("plannedCost").innerText = "₹" + (data.summary.totalPlannedCost || 0);
  document.getElementById("actualCost").innerText = "₹" + (data.summary.totalActualCost || 0);
  document.getElementById("variance").innerText = "₹" + (data.summary.totalVariance || 0);
  document.getElementById("criticalCount").innerText = data.summary.criticalItemCount || 0;

  // Update products table
  const tableBody = document.getElementById("productsTable");
  
  if (data.recentProducts && data.recentProducts.length > 0) {
    tableBody.innerHTML = data.recentProducts.map(p => {
      const riskColor = p.riskCategory === "Critical" ? "danger" : 
                        p.riskCategory === "Warning" ? "warning" : "success";
      return `
        <tr>
          <td>${p.itemName}</td>
          <td>₹${p.plannedAmount}</td>
          <td>₹${p.actualAmount}</td>
          <td style="color: ${p.variance > 0 ? '#dc3545' : '#198754'}">₹${p.variance}</td>
          <td><span class="badge bg-${riskColor}">${p.riskCategory}</span></td>
        </tr>
      `;
    }).join("");
  } else {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No products added yet</td></tr>';
  }
};

// =========================
// ADD PRODUCT
// =========================
const handleAddProduct = async (e) => {
  e.preventDefault();

  const formData = {
    itemName: document.getElementById("itemName").value,
    plannedQty: Number(document.getElementById("plannedQty").value),
    plannedRate: Number(document.getElementById("plannedRate").value),
    actualQty: Number(document.getElementById("actualQty").value),
    actualRate: Number(document.getElementById("actualRate").value),
    currentStock: Number(document.getElementById("currentStock").value),
    dailyConsumption: Number(document.getElementById("dailyConsumption").value),
    leadTime: Number(document.getElementById("leadTime").value),
    safetyStock: Number(document.getElementById("safetyStock").value),
  };

  const data = await apiRequest("/products", "POST", formData);

  if (data && data._id) {
    showToast("Product Added Successfully", "success");
    window.location.href = "dashboard.html";
  } else {
    showToast(data?.message || "Error adding product", "danger");
  }
};

// =========================
// LOGOUT
// =========================
const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
};

// =========================
// INIT
// =========================
const currentPage = window.location.pathname;

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  loadUserInfo();
  
  // Only load relevant page data
  if (currentPage.includes("dashboard")) {
    loadDashboard();
  } else if (currentPage.includes("analytics")) {
    loadAnalytics();
  } else if (currentPage.includes("reorder")) {
    loadReorder();
  } else if (currentPage.includes("update-products")) {
    loadUpdateProducts();
  }

  document
    .getElementById("loginForm")
    ?.addEventListener("submit", handleLogin);

  document
    .getElementById("signupForm")
    ?.addEventListener("submit", handleSignup);

  document
    .getElementById("productForm")
    ?.addEventListener("submit", handleAddProduct);

  document
    .getElementById("editForm")
    ?.addEventListener("submit", handleUpdateProduct);

  document.querySelectorAll("#logoutBtn, .logoutBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
});

// =========================
// ANALYTICS PAGE
// =========================
let barChartInstance = null;
let pieChartInstance = null;

const loadAnalytics = async () => {
  if (!window.location.pathname.includes("analytics")) return;

  const response = await apiRequest("/products?limit=100");
  if (!response || !response.products || response.products.length === 0) return;
  
  const products = response.products;

  // Bar Chart - Planned vs Actual
  const barCtx = document.getElementById("barChart");
  if (barCtx) {
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: products.map(p => p.itemName),
        datasets: [
          {
            label: "Planned Cost",
            data: products.map(p => p.plannedAmount),
            backgroundColor: "#0d6efd"
          },
          {
            label: "Actual Cost",
            data: products.map(p => p.actualAmount),
            backgroundColor: "#dc3545"
          }
        ]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // Pie Chart - Risk Distribution
  const pieCtx = document.getElementById("pieChart");
  if (pieCtx) {
    const critical = products.filter(p => p.riskCategory === "Critical").length;
    const warning = products.filter(p => p.riskCategory === "Warning").length;
    const safe = products.filter(p => p.riskCategory === "Safe").length;

    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(pieCtx, {
      type: "pie",
      data: {
        labels: ["Critical", "Warning", "Safe"],
        datasets: [{
          data: [critical, warning, safe],
          backgroundColor: ["#dc3545", "#ffc107", "#198754"]
        }]
      },
      options: { responsive: true }
    });
  }
};

// =========================
// REORDER PAGE
// =========================
const loadReorder = async () => {
  if (!window.location.pathname.includes("reorder")) return;

  const response = await apiRequest("/products?limit=100");
  if (!response || !response.products || response.products.length === 0) return;
  
  const products = response.products;

  const alertsContainer = document.getElementById("alertsContainer");
  const reorderTableBody = document.getElementById("reorderTableBody");

  if (alertsContainer) {
    alertsContainer.innerHTML = products.map(p => {
      const bgClass = p.riskCategory === "Critical" ? "bg-danger" :
                      p.riskCategory === "Warning" ? "bg-warning text-dark" : "bg-success";
      const icon = p.riskCategory === "Critical" ? "🔴" :
                   p.riskCategory === "Warning" ? "🟡" : "🟢";
      
      return `
        <div class="col-md-6">
          <div class="alert-card ${bgClass}">
            <h5>${icon} ${p.riskCategory} Alert</h5>
            <p><strong>Item:</strong> ${p.itemName}</p>
            <p><strong>Risk Level:</strong> ${Math.round(p.riskScore)}%</p>
            <p><strong>Suggested Reorder Quantity:</strong> ${p.reorderQty} units</p>
            ${p.riskCategory === "Critical" ? "<p>⚠ Production may stop soon!</p>" : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  if (reorderTableBody) {
    reorderTableBody.innerHTML = products.map(p => {
      const badgeClass = p.riskCategory === "Critical" ? "bg-danger" :
                         p.riskCategory === "Warning" ? "bg-warning text-dark" : "bg-success";
      const textClass = p.riskCategory === "Critical" ? "text-danger" :
                        p.riskCategory === "Warning" ? "text-warning" : "text-success";
      
      return `
        <tr>
          <td>${p.itemName}</td>
          <td>${p.currentStock}</td>
          <td>${p.reorderLevel}</td>
          <td>${p.reorderQty}</td>
          <td class="${textClass}">${Math.round(p.riskScore)}%</td>
          <td><span class="badge ${badgeClass}">${p.riskCategory}</span></td>
        </tr>
      `;
    }).join("");
  }
};

// =========================
// UPDATE PRODUCTS PAGE
// =========================
let cachedProducts = [];

const loadUpdateProducts = async () => {
  if (!window.location.pathname.includes("update-products")) return;

  const response = await apiRequest("/products?limit=100");
  if (!response || !response.products) return;
  
  cachedProducts = response.products;
  const tableBody = document.getElementById("productsTableBody");

  if (tableBody) {
    if (cachedProducts.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
      return;
    }

    tableBody.innerHTML = cachedProducts.map(p => {
      const badgeClass = p.riskCategory === "Critical" ? "bg-danger" :
                         p.riskCategory === "Warning" ? "bg-warning text-dark" : "bg-success";
      return `
        <tr>
          <td>${p.itemName}</td>
          <td>₹${p.plannedAmount}</td>
          <td>₹${p.actualAmount}</td>
          <td>${p.currentStock}</td>
          <td><span class="badge ${badgeClass}">${p.riskCategory}</span></td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="openEditModal('${p._id}')" id="editBtn-${p._id}">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p._id}')" id="delBtn-${p._id}">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }
};

const openEditModal = (productId) => {
  const product = cachedProducts.find(p => p._id === productId);
  if (!product) return;

  document.getElementById("editProductId").value = product._id;
  document.getElementById("editItemName").value = product.itemName;
  document.getElementById("editPlannedQty").value = product.plannedQty;
  document.getElementById("editPlannedRate").value = product.plannedRate;
  document.getElementById("editActualQty").value = product.actualQty;
  document.getElementById("editActualRate").value = product.actualRate;
  document.getElementById("editCurrentStock").value = product.currentStock;
  document.getElementById("editDailyConsumption").value = product.dailyConsumption;
  document.getElementById("editLeadTime").value = product.leadTime;
  document.getElementById("editSafetyStock").value = product.safetyStock;

  if (typeof bootstrap !== 'undefined') {
    const modal = new bootstrap.Modal(document.getElementById("editModal"));
    modal.show();
  }
};

const handleUpdateProduct = async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Updating...";

  const productId = document.getElementById("editProductId").value;
  
  console.log("Updating product:", productId);

  const formData = {
    itemName: document.getElementById("editItemName").value,
    plannedQty: Number(document.getElementById("editPlannedQty").value),
    plannedRate: Number(document.getElementById("editPlannedRate").value),
    actualQty: Number(document.getElementById("editActualQty").value),
    actualRate: Number(document.getElementById("editActualRate").value),
    currentStock: Number(document.getElementById("editCurrentStock").value),
    dailyConsumption: Number(document.getElementById("editDailyConsumption").value),
    leadTime: Number(document.getElementById("editLeadTime").value),
    safetyStock: Number(document.getElementById("editSafetyStock").value),
  };

  console.log("Form data:", formData);

  const data = await apiRequest(`/products/${productId}`, "PUT", formData);

  submitBtn.disabled = false;
  submitBtn.textContent = originalText;

  if (data && data._id) {
    showToast("Product Updated Successfully", "success");
    if (typeof bootstrap !== 'undefined') {
      const modalInstance = bootstrap.Modal.getInstance(document.getElementById("editModal"));
      if (modalInstance) modalInstance.hide();
    }
    loadUpdateProducts();
  } else {
    console.error("Update failed, response:", data);
  }
};

const deleteProduct = async (productId) => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  console.log("Deleting product:", productId);

  const editBtn = document.getElementById(`editBtn-${productId}`);
  const delBtn = document.getElementById(`delBtn-${productId}`);
  
  if (editBtn) editBtn.disabled = true;
  if (delBtn) {
    delBtn.disabled = true;
    delBtn.textContent = "Deleting...";
  }

  const data = await apiRequest(`/products/${productId}`, "DELETE");

  console.log("Delete response:", data);

  if (data) {
    showToast("Product Deleted Successfully", "success");
    loadUpdateProducts();
  } else {
    console.error("Delete failed");
    if (editBtn) editBtn.disabled = false;
    if (delBtn) {
      delBtn.disabled = false;
      delBtn.textContent = "Delete";
    }
  }
};

// =========================
// CSV DOWNLOAD FUNCTIONALITY
// =========================
const downloadCSV = async () => {
  const response = await apiRequest("/products?limit=1000");
  if (!response || !response.products || response.products.length === 0) {
    showToast("No products to download", "warning");
    return;
  }

  const products = response.products;

  // CSV Headers
  const headers = [
    "Item Name",
    "Planned Qty",
    "Planned Rate",
    "Planned Amount",
    "Actual Qty",
    "Actual Rate",
    "Actual Amount",
    "Variance",
    "Current Stock",
    "Daily Consumption",
    "Lead Time",
    "Safety Stock",
    "Reorder Level",
    "Reorder Qty",
    "Risk Score",
    "Risk Category",
    "Created Date"
  ];

  // CSV Rows
  const rows = products.map(p => [
    p.itemName,
    p.plannedQty,
    p.plannedRate,
    p.plannedAmount,
    p.actualQty,
    p.actualRate,
    p.actualAmount,
    p.variance,
    p.currentStock,
    p.dailyConsumption,
    p.leadTime,
    p.safetyStock,
    p.reorderLevel,
    p.reorderQty,
    Math.round(p.riskScore),
    p.riskCategory,
    new Date(p.createdAt).toLocaleDateString()
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `PNP_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV Downloaded Successfully", "success");
};

window.openEditModal = openEditModal;
window.deleteProduct = deleteProduct;
window.downloadCSV = downloadCSV;
