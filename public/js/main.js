// ==========================================================
// WEBIFY INVENTORY MANAGEMENT SYSTEM - CLIENT CORE
// ==========================================================

// =========================
// API BASE URL CONFIGURATION
// =========================
const getApiBase = () => {
  if (window.API_BASE_URL) return window.API_BASE_URL;
  if (localStorage.getItem("CUSTOM_API_URL")) return localStorage.getItem("CUSTOM_API_URL");
  
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isLocalHost && window.location.port !== "5000" && window.location.port !== "") {
    return "http://localhost:5000/api";
  }
  return "/api";
};

const API_BASE = getApiBase();

// =========================
// PREMIUM TOAST NOTIFICATION
// =========================
const showToast = (message, type = "info") => {
  // Remove any existing active toasts
  document.querySelectorAll(".custom-toast").forEach(t => t.remove());

  const toast = document.createElement("div");
  toast.className = `custom-toast toast-${type}`;
  
  const icons = {
    success: "✓",
    danger: "✕",
    warning: "⚠",
    info: "ℹ"
  };

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1.1rem; line-height: 1;">${icons[type] || "ℹ"}</span>
    <span style="flex-grow: 1;">${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// =========================
// LOADING INDICATORS
// =========================
const showLoading = (elementId) => {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `
      <tr>
        <td colspan="10" class="text-center py-5">
          <div class="spinner-border text-primary" style="width: 2rem; height: 2rem;" role="status"></div>
          <p class="text-secondary mt-2 mb-0" style="font-size: 0.85rem;">Loading data...</p>
        </td>
      </tr>
    `;
  }
};

const hideLoading = (elementId) => {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = '';
};

// Animated Number Counter
const animateCounter = (elementId, targetValue, isCurrency = false) => {
  const el = document.getElementById(elementId);
  if (!el) return;

  const target = Number(targetValue) || 0;
  const duration = 800;
  const steps = 30;
  const stepTime = duration / steps;
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep++;
    const progress = currentStep / steps;
    // Ease out quad
    const factor = 1 - (1 - progress) * (1 - progress);
    const currentValue = Math.round(target * factor);

    if (isCurrency) {
      el.textContent = "₹" + currentValue.toLocaleString("en-IN");
    } else {
      el.textContent = currentValue.toLocaleString();
    }

    if (currentStep >= steps) {
      clearInterval(timer);
      if (isCurrency) {
        el.textContent = "₹" + target.toLocaleString("en-IN");
      } else {
        el.textContent = target.toLocaleString();
      }
    }
  }, stepTime);
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
      if (!window.location.pathname.includes("login")) {
        showToast("Session expired. Please log in again.", "warning");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1200);
      }
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = (data && data.message) ? data.message : `Request failed (${response.status})`;
      console.error(`API Error [${method} ${endpoint}]:`, errMsg);
      showToast(errMsg, "danger");
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Network Error [${method} ${endpoint}]:`, error);
    showToast("Unable to connect to server. Please check your connection.", "danger");
    return null;
  }
};

// =========================
// AUTHENTICATION GUARDS
// =========================
const requireAuth = () => {
  const token = localStorage.getItem("token");
  const isAuthPage = window.location.pathname.includes("login");

  if (!token && !isAuthPage) {
    window.location.href = "login.html";
  } else if (token && isAuthPage) {
    window.location.href = "dashboard.html";
  }
};

// =========================
// LOAD USER INFO
// =========================
const loadUserInfo = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return;
    const decoded = JSON.parse(atob(parts[1]));

    const user = await apiRequest(`/user/${decoded.id}`);
    
    if (user && user.name) {
      document.querySelectorAll(".userName").forEach(el => {
        el.textContent = user.name;
      });

      const initial = user.name.charAt(0).toUpperCase();
      document.querySelectorAll(".userAvatarInitial").forEach(el => {
        el.textContent = initial;
      });
    }
  } catch (error) {
    console.error("Failed to parse token/user:", error);
  }
};

// =========================
// LOGIN & SIGNUP
// =========================
const handleLogin = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing In...`;

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const data = await apiRequest("/login", "POST", { email, password });

  btn.disabled = false;
  btn.innerHTML = originalHtml;

  if (data && data.token) {
    localStorage.setItem("token", data.token);
    showToast("Welcome back! Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 600);
  }
};

const handleSignup = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creating Account...`;

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  const data = await apiRequest("/signup", "POST", { name, email, password });

  btn.disabled = false;
  btn.innerHTML = originalHtml;

  if (data && data.token) {
    localStorage.setItem("token", data.token);
    showToast("Account created successfully!", "success");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 600);
  }
};

// =========================
// LOGOUT
// =========================
const logout = () => {
  localStorage.removeItem("token");
  showToast("Logged out successfully", "info");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 400);
};

// =========================
// DASHBOARD
// =========================
let dashboardRecentProducts = [];

const loadDashboard = async () => {
  if (!window.location.pathname.includes("dashboard")) return;

  showLoading("productsTable");

  const data = await apiRequest("/dashboard");

  if (!data || !data.summary) {
    hideLoading("productsTable");
    return;
  }

  // Animate summary KPI numbers
  animateCounter("plannedCost", data.summary.totalPlannedCost || 0, true);
  animateCounter("actualCost", data.summary.totalActualCost || 0, true);
  animateCounter("variance", data.summary.totalVariance || 0, true);
  animateCounter("criticalCount", data.summary.criticalItemCount || 0, false);

  dashboardRecentProducts = data.recentProducts || [];
  renderDashboardTable(dashboardRecentProducts);

  // Setup live search on dashboard recent products
  const searchInput = document.getElementById("dashboardSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      const filtered = dashboardRecentProducts.filter(p => 
        p.itemName.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term))
      );
      renderDashboardTable(filtered);
    });
  }
};

const renderDashboardTable = (products) => {
  const tableBody = document.getElementById("productsTable");
  if (!tableBody) return;

  if (products.length > 0) {
    tableBody.innerHTML = products.map(p => {
      const riskColor = p.riskCategory === "Critical" ? "danger" : 
                        p.riskCategory === "Warning" ? "warning" : "success";
      const varianceColor = p.variance > 0 ? "#ef4444" : "#10b981";
      const varianceSign = p.variance > 0 ? "+" : "";
      
      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #fff;">${p.itemName}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.sku || p.category || 'General'}</div>
          </td>
          <td>₹${Number(p.plannedAmount).toLocaleString("en-IN")}</td>
          <td>₹${Number(p.actualAmount).toLocaleString("en-IN")}</td>
          <td style="color: ${varianceColor}; font-weight: 700;">${varianceSign}₹${Number(p.variance).toLocaleString("en-IN")}</td>
          <td>
            <span class="badge bg-${riskColor}">
              <span class="status-dot" style="background: currentColor; width: 6px; height: 6px; box-shadow: none;"></span>
              ${p.riskCategory}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  } else {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-5 text-secondary">
          <div style="font-size: 2rem; margin-bottom: 8px;">📦</div>
          <div style="font-weight: 600;">No products found</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Add new products to view real-time planning data.</div>
        </td>
      </tr>
    `;
  }
};

// =========================
// ADD PRODUCT & LIVE PREVIEW
// =========================
const setupLiveProductCalc = () => {
  const form = document.getElementById("productForm");
  if (!form) return;

  const updatePreview = () => {
    const plannedQty = Number(document.getElementById("plannedQty")?.value) || 0;
    const plannedRate = Number(document.getElementById("plannedRate")?.value) || 0;
    const actualQty = Number(document.getElementById("actualQty")?.value) || 0;
    const actualRate = Number(document.getElementById("actualRate")?.value) || 0;
    const currentStock = Number(document.getElementById("currentStock")?.value) || 0;
    const dailyConsumption = Number(document.getElementById("dailyConsumption")?.value) || 0;
    const leadTime = Number(document.getElementById("leadTime")?.value) || 0;
    const safetyStock = Number(document.getElementById("safetyStock")?.value) || 0;

    const plannedAmount = plannedQty * plannedRate;
    const actualAmount = actualQty * actualRate;
    const variance = actualAmount - plannedAmount;
    const reorderLevel = (dailyConsumption * leadTime) + safetyStock;
    const reorderQty = Math.max(0, reorderLevel - currentStock);

    let riskScore = 0;
    if (reorderLevel > 0) {
      riskScore = ((reorderLevel - currentStock) / reorderLevel) * 100;
    }
    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskCategory = "Safe";
    let riskBadgeClass = "bg-success";
    if (riskScore > 70) {
      riskCategory = "Critical";
      riskBadgeClass = "bg-danger";
    } else if (riskScore >= 40) {
      riskCategory = "Warning";
      riskBadgeClass = "bg-warning";
    }

    const prevPlanned = document.getElementById("previewPlanned");
    const prevActual = document.getElementById("previewActual");
    const prevVariance = document.getElementById("previewVariance");
    const prevReorder = document.getElementById("previewReorder");
    const prevRisk = document.getElementById("previewRisk");

    if (prevPlanned) prevPlanned.textContent = "₹" + plannedAmount.toLocaleString("en-IN");
    if (prevActual) prevActual.textContent = "₹" + actualAmount.toLocaleString("en-IN");
    if (prevVariance) {
      prevVariance.textContent = (variance > 0 ? "+" : "") + "₹" + variance.toLocaleString("en-IN");
      prevVariance.style.color = variance > 0 ? "#ef4444" : "#10b981";
    }
    if (prevReorder) prevReorder.textContent = `${reorderQty} units (Level: ${reorderLevel})`;
    if (prevRisk) {
      prevRisk.innerHTML = `<span class="badge ${riskBadgeClass}">${riskCategory} (${Math.round(riskScore)}%)</span>`;
    }
  };

  form.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", updatePreview);
  });
};

const handleAddProduct = async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;

  const formData = {
    itemName: document.getElementById("itemName").value.trim(),
    category: document.getElementById("itemCategory") ? document.getElementById("itemCategory").value.trim() : "General",
    sku: document.getElementById("itemSku") ? document.getElementById("itemSku").value.trim() : "",
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

  submitBtn.disabled = false;
  submitBtn.innerHTML = originalHtml;

  if (data && data._id) {
    showToast("Product Created Successfully", "success");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 600);
  }
};

// =========================
// UPDATE PRODUCTS PAGE
// =========================
let cachedProducts = [];
let currentFilter = "all";

const loadUpdateProducts = async () => {
  if (!window.location.pathname.includes("update-products")) return;

  showLoading("productsTableBody");

  const response = await apiRequest("/products?limit=200");
  if (!response || !response.products) {
    hideLoading("productsTableBody");
    return;
  }

  cachedProducts = response.products;
  renderUpdateTable();
  setupUpdatePageListeners();
};

const setupUpdatePageListeners = () => {
  const searchInput = document.getElementById("updateSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => renderUpdateTable());
  }

  const filterSelect = document.getElementById("riskFilterSelect");
  if (filterSelect) {
    filterSelect.addEventListener("change", (e) => {
      currentFilter = e.target.value;
      renderUpdateTable();
    });
  }
};

const renderUpdateTable = () => {
  const tableBody = document.getElementById("productsTableBody");
  if (!tableBody) return;

  const searchTerm = (document.getElementById("updateSearchInput")?.value || "").toLowerCase().trim();

  const filtered = cachedProducts.filter(p => {
    const matchesSearch = 
      p.itemName.toLowerCase().includes(searchTerm) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm)) ||
      (p.category && p.category.toLowerCase().includes(searchTerm));

    const matchesRisk = currentFilter === "all" || p.riskCategory === currentFilter;

    return matchesSearch && matchesRisk;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-secondary">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div style="font-weight: 600;">No matching products</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Try adjusting your search query or filter.</div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(p => {
    const badgeClass = p.riskCategory === "Critical" ? "bg-danger" :
                       p.riskCategory === "Warning" ? "bg-warning" : "bg-success";
    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: #fff;">${p.itemName}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${p.sku || 'No SKU'} • ${p.category || 'General'}</div>
        </td>
        <td>₹${Number(p.plannedAmount).toLocaleString("en-IN")}</td>
        <td>₹${Number(p.actualAmount).toLocaleString("en-IN")}</td>
        <td>
          <span style="font-weight: 600;">${p.currentStock}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">/ Level ${p.reorderLevel}</span>
        </td>
        <td>
          <span class="badge ${badgeClass}">
            ${p.riskCategory} (${Math.round(p.riskScore)}%)
          </span>
        </td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-light" onclick="openEditModal('${p._id}')" id="editBtn-${p._id}">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="confirmDeleteProduct('${p._id}', '${p.itemName.replace(/'/g, "\\'")}')" id="delBtn-${p._id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
};

const openEditModal = (productId) => {
  const product = cachedProducts.find(p => p._id === productId);
  if (!product) return;

  document.getElementById("editProductId").value = product._id;
  document.getElementById("editItemName").value = product.itemName;
  if (document.getElementById("editCategory")) document.getElementById("editCategory").value = product.category || "General";
  if (document.getElementById("editSku")) document.getElementById("editSku").value = product.sku || "";
  document.getElementById("editPlannedQty").value = product.plannedQty;
  document.getElementById("editPlannedRate").value = product.plannedRate;
  document.getElementById("editActualQty").value = product.actualQty;
  document.getElementById("editActualRate").value = product.actualRate;
  document.getElementById("editCurrentStock").value = product.currentStock;
  document.getElementById("editDailyConsumption").value = product.dailyConsumption;
  document.getElementById("editLeadTime").value = product.leadTime;
  document.getElementById("editSafetyStock").value = product.safetyStock;

  if (typeof bootstrap !== 'undefined') {
    const modalEl = document.getElementById("editModal");
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
  }
};

const handleUpdateProduct = async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Updating...`;

  const productId = document.getElementById("editProductId").value;

  const formData = {
    itemName: document.getElementById("editItemName").value.trim(),
    category: document.getElementById("editCategory") ? document.getElementById("editCategory").value.trim() : "General",
    sku: document.getElementById("editSku") ? document.getElementById("editSku").value.trim() : "",
    plannedQty: Number(document.getElementById("editPlannedQty").value),
    plannedRate: Number(document.getElementById("editPlannedRate").value),
    actualQty: Number(document.getElementById("editActualQty").value),
    actualRate: Number(document.getElementById("editActualRate").value),
    currentStock: Number(document.getElementById("editCurrentStock").value),
    dailyConsumption: Number(document.getElementById("editDailyConsumption").value),
    leadTime: Number(document.getElementById("editLeadTime").value),
    safetyStock: Number(document.getElementById("editSafetyStock").value),
  };

  const data = await apiRequest(`/products/${productId}`, "PUT", formData);

  submitBtn.disabled = false;
  submitBtn.innerHTML = originalText;

  if (data && data._id) {
    showToast("Product Updated Successfully", "success");
    if (typeof bootstrap !== 'undefined') {
      const modalInstance = bootstrap.Modal.getInstance(document.getElementById("editModal"));
      if (modalInstance) modalInstance.hide();
    }
    loadUpdateProducts();
  }
};

let pendingDeleteId = null;

const confirmDeleteProduct = (productId, productName) => {
  pendingDeleteId = productId;
  const modalNameEl = document.getElementById("deleteProductName");
  if (modalNameEl) modalNameEl.textContent = productName;

  const modalEl = document.getElementById("deleteConfirmModal");
  if (modalEl && typeof bootstrap !== 'undefined') {
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
  } else {
    // Fallback if modal not present
    if (confirm(`Are you sure you want to delete "${productName}"?`)) {
      executeDelete(productId);
    }
  }
};

const executeDelete = async (productId = null) => {
  const idToDelete = productId || pendingDeleteId;
  if (!idToDelete) return;

  const confirmBtn = document.getElementById("confirmDeleteBtn");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Deleting...`;
  }

  const data = await apiRequest(`/products/${idToDelete}`, "DELETE");

  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `Delete Product`;
  }

  if (typeof bootstrap !== 'undefined') {
    const modalEl = document.getElementById("deleteConfirmModal");
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }
  }

  if (data) {
    showToast("Product deleted successfully", "success");
    loadUpdateProducts();
  }
};

// =========================
// REORDER & RISK ALERTS
// =========================
const loadReorder = async () => {
  if (!window.location.pathname.includes("reorder")) return;

  const response = await apiRequest("/products?limit=200");
  if (!response || !response.products || response.products.length === 0) {
    const alertsContainer = document.getElementById("alertsContainer");
    if (alertsContainer) {
      alertsContainer.innerHTML = `
        <div class="col-12 text-center py-5 text-secondary">
          <div style="font-size: 2rem; margin-bottom: 8px;">🟢</div>
          <div style="font-weight: 600;">No products in inventory</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">Add products to trigger automated reorder alerts.</div>
        </div>
      `;
    }
    return;
  }

  const products = response.products;
  const alertsContainer = document.getElementById("alertsContainer");
  const reorderTableBody = document.getElementById("reorderTableBody");

  // Sort critical first
  const sorted = [...products].sort((a, b) => b.riskScore - a.riskScore);

  if (alertsContainer) {
    alertsContainer.innerHTML = sorted.map(p => {
      const bgClass = p.riskCategory === "Critical" ? "bg-danger" :
                      p.riskCategory === "Warning" ? "bg-warning" : "bg-success";
      const icon = p.riskCategory === "Critical" ? "🔴" :
                   p.riskCategory === "Warning" ? "🟡" : "🟢";
      
      return `
        <div class="col-lg-4 col-md-6">
          <div class="alert-card ${bgClass}">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="mb-0" style="color: #fff;">${icon} ${p.riskCategory} Alert</h5>
              <span class="badge" style="background: rgba(255,255,255,0.15); color: #fff;">${Math.round(p.riskScore)}% Risk</span>
            </div>
            <p><strong>Item:</strong> ${p.itemName} <span style="font-size: 0.75rem; opacity: 0.8;">(${p.category || 'General'})</span></p>
            <p><strong>Current Stock:</strong> ${p.currentStock} units</p>
            <p><strong>Reorder Level:</strong> ${p.reorderLevel} units</p>
            <div class="mt-3 pt-2" style="border-top: 1px solid rgba(255,255,255,0.15);">
              <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.8);">Suggested Reorder:</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: #fff;">${p.reorderQty} units</div>
            </div>
            ${p.riskCategory === "Critical" ? '<div class="mt-2 text-danger" style="font-size: 0.8rem; font-weight: 700;">⚠ High risk of stockout & production delay!</div>' : ''}
          </div>
        </div>
      `;
    }).join("");
  }

  if (reorderTableBody) {
    reorderTableBody.innerHTML = sorted.map(p => {
      const badgeClass = p.riskCategory === "Critical" ? "bg-danger" :
                         p.riskCategory === "Warning" ? "bg-warning" : "bg-success";
      const textClass = p.riskCategory === "Critical" ? "text-danger" :
                        p.riskCategory === "Warning" ? "text-warning" : "text-success";

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #fff;">${p.itemName}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.sku || 'No SKU'}</div>
          </td>
          <td>${p.currentStock}</td>
          <td>${p.reorderLevel}</td>
          <td style="font-weight: 700; color: #06b6d4;">${p.reorderQty}</td>
          <td class="${textClass}" style="font-weight: 700;">${Math.round(p.riskScore)}%</td>
          <td><span class="badge ${badgeClass}">${p.riskCategory}</span></td>
        </tr>
      `;
    }).join("");
  }
};

// =========================
// ANALYTICS & CHARTS
// =========================
let barChartInstance = null;
let pieChartInstance = null;

const loadAnalytics = async () => {
  if (!window.location.pathname.includes("analytics")) return;

  const response = await apiRequest("/products?limit=100");
  if (!response || !response.products || response.products.length === 0) {
    const barCard = document.getElementById("barChart")?.parentElement;
    if (barCard) {
      barCard.innerHTML = `<div class="text-center py-5 text-secondary">No product data available yet. Add products to view analytics.</div>`;
    }
    return;
  }

  const products = response.products;

  // Chart Global styling for dark theme
  if (typeof Chart !== 'undefined') {
    Chart.defaults.color = "#9ca3af";
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.borderColor = "rgba(255, 255, 255, 0.08)";
  }

  // Bar Chart - Planned vs Actual
  const barCanvas = document.getElementById("barChart");
  if (barCanvas) {
    const ctx = barCanvas.getContext("2d");
    if (barChartInstance) barChartInstance.destroy();

    // Limit to top 8 items for clean visual representation
    const topProducts = products.slice(0, 8);

    barChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: topProducts.map(p => p.itemName),
        datasets: [
          {
            label: "Planned Cost (₹)",
            data: topProducts.map(p => p.plannedAmount),
            backgroundColor: "rgba(59, 130, 246, 0.75)",
            borderColor: "#3b82f6",
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: "Actual Cost (₹)",
            data: topProducts.map(p => p.actualAmount),
            backgroundColor: "rgba(239, 68, 68, 0.75)",
            borderColor: "#ef4444",
            borderWidth: 1,
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#f3f4f6', boxWidth: 14, font: { weight: '600' } }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ₹${Number(context.raw).toLocaleString('en-IN')}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
              callback: (value) => '₹' + value.toLocaleString('en-IN')
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // Doughnut Chart - Risk Distribution
  const pieCanvas = document.getElementById("pieChart");
  if (pieCanvas) {
    const ctx = pieCanvas.getContext("2d");
    const critical = products.filter(p => p.riskCategory === "Critical").length;
    const warning = products.filter(p => p.riskCategory === "Warning").length;
    const safe = products.filter(p => p.riskCategory === "Safe").length;

    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Critical", "Warning", "Safe"],
        datasets: [{
          data: [critical, warning, safe],
          backgroundColor: [
            "rgba(239, 68, 68, 0.85)",
            "rgba(245, 158, 11, 0.85)",
            "rgba(16, 185, 129, 0.85)"
          ],
          borderColor: "rgba(17, 24, 39, 0.95)",
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#f3f4f6', boxWidth: 14, padding: 20 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12
          }
        },
        cutout: '65%'
      }
    });
  }
};

// =========================
// CSV DOWNLOAD
// =========================
const downloadCSV = async () => {
  const response = await apiRequest("/products?limit=1000");
  if (!response || !response.products || response.products.length === 0) {
    showToast("No products to export", "warning");
    return;
  }

  const products = response.products;

  const headers = [
    "Item Name",
    "Category",
    "SKU",
    "Planned Qty",
    "Planned Rate",
    "Planned Amount (INR)",
    "Actual Qty",
    "Actual Rate",
    "Actual Amount (INR)",
    "Variance (INR)",
    "Current Stock",
    "Daily Consumption",
    "Lead Time (Days)",
    "Safety Stock",
    "Reorder Level",
    "Reorder Qty",
    "Risk Score (%)",
    "Risk Category",
    "Created Date"
  ];

  const rows = products.map(p => [
    `"${(p.itemName || '').replace(/"/g, '""')}"`,
    `"${(p.category || 'General').replace(/"/g, '""')}"`,
    `"${(p.sku || '').replace(/"/g, '""')}"`,
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
    `"${p.riskCategory}"`,
    `"${new Date(p.createdAt).toLocaleDateString()}"`
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `Webify_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Inventory CSV Exported Successfully", "success");
};

// =========================
// MOBILE DRAWER NAVIGATION
// =========================
const setupMobileNav = () => {
  const toggleBtn = document.querySelector(".mobile-toggle");
  const sidebar = document.querySelector(".sidebar");
  let overlay = document.querySelector(".sidebar-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    });
  }
};

// =========================
// INITIALIZATION
// =========================
document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  loadUserInfo();
  setupMobileNav();

  const currentPage = window.location.pathname;

  if (currentPage.includes("dashboard")) {
    loadDashboard();
  } else if (currentPage.includes("analytics")) {
    loadAnalytics();
  } else if (currentPage.includes("reorder")) {
    loadReorder();
  } else if (currentPage.includes("update-products")) {
    loadUpdateProducts();
  } else if (currentPage.includes("add-product")) {
    setupLiveProductCalc();
  }

  // Active navigation link highlighting
  document.querySelectorAll(".sidebar a").forEach(link => {
    const href = link.getAttribute("href");
    if (href && currentPage.includes(href)) {
      link.classList.add("active");
    }
  });

  // Event Listeners
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("signupForm")?.addEventListener("submit", handleSignup);
  document.getElementById("productForm")?.addEventListener("submit", handleAddProduct);
  document.getElementById("editForm")?.addEventListener("submit", handleUpdateProduct);
  document.getElementById("confirmDeleteBtn")?.addEventListener("click", () => executeDelete());

  document.querySelectorAll("#logoutBtn, .logoutBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  });
});

// Global exports for HTML onclick handlers
window.openEditModal = openEditModal;
window.confirmDeleteProduct = confirmDeleteProduct;
window.executeDelete = executeDelete;
window.downloadCSV = downloadCSV;
window.logout = logout;
