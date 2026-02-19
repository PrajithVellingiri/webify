# 📦 Production Risk & Inventory Management System

A comprehensive web-based inventory management system with production risk analysis, real-time analytics, and automated reorder alerts.

---

## 🚀 Features Overview

### 🔐 **Authentication & Security**
- User registration and login system
- JWT-based authentication (7-day token expiry)
- Password encryption using bcrypt
- Protected routes with middleware
- Automatic session management
- User-specific data isolation

### 📊 **Dashboard**
- Real-time summary cards:
  - Total Planned Cost
  - Total Actual Cost
  - Total Variance
  - Critical Items Count
- Recent products table (last 10 items)
- Color-coded risk indicators
- Responsive layout

### ➕ **Product Management**
- **Add Products** with comprehensive details:
  - Item name
  - Production planning (planned quantity & rate)
  - Actual consumption (actual quantity & rate)
  - Inventory details (current stock, daily consumption, lead time, safety stock)
- **Update Products**:
  - Edit all product details
  - Real-time recalculation of metrics
  - Modal-based editing interface
- **Delete Products**:
  - Confirmation dialog
  - Instant removal from database
  - Loading states during operations

### 📈 **Analytics**
- **Bar Chart**: Planned vs Actual Cost comparison
- **Pie Chart**: Risk distribution (Critical, Warning, Safe)
- Interactive Chart.js visualizations
- Real-time data updates
- Responsive chart design

### 🔔 **Reorder Alerts**
- Automated risk assessment
- Color-coded alert cards:
  - 🔴 Critical (Risk > 70%)
  - 🟡 Warning (Risk 40-70%)
  - 🟢 Safe (Risk < 40%)
- Suggested reorder quantities
- Detailed reorder summary table
- Production stoppage warnings

### 🧮 **Automatic Calculations**
- **Cost Analysis**:
  - Planned Amount = Planned Qty × Planned Rate
  - Actual Amount = Actual Qty × Actual Rate
  - Variance = Actual Amount - Planned Amount
- **Inventory Metrics**:
  - Reorder Level = Daily Consumption × Lead Time + Safety Stock
  - Reorder Quantity = Max(0, Reorder Level - Current Stock)
- **Risk Assessment**:
  - Risk Score = ((Reorder Level - Current Stock) / Reorder Level) × 100
  - Risk Category based on score thresholds

---

## 🛠️ Technology Stack

### **Frontend**
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5.3.3 (responsive UI framework)
- Chart.js (data visualization)
- Custom CSS with modern design
- Fetch API for HTTP requests

### **Backend**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing
- express-rate-limit for API protection
- CORS enabled

### **Architecture**
- RESTful API design
- MVC pattern
- Middleware-based authentication
- Client-side routing
- Responsive single-page application

---

## 📁 Project Structure

```
Webify/
├── public/                    # Frontend files
│   ├── css/
│   │   └── enhanced-styles.css
│   ├── js/
│   │   └── main.js           # Main JavaScript logic
│   ├── dashboard.html
│   ├── add-product.html
│   ├── update-products.html
│   ├── analytics.html
│   ├── reorder.html
│   ├── login.html
│   └── signup.html
├── server/                    # Backend files
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── models/
│   │   ├── User.js           # User schema
│   │   └── Product.js        # Product schema
│   ├── routes/
│   │   ├── auth.js           # Auth endpoints
│   │   └── products.js       # Product endpoints
│   └── server.js             # Express server
├── .env                       # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### **Authentication**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/signup` | Register new user | No |
| POST | `/api/login` | User login | No |
| GET | `/api/user/:id` | Get user details | Yes |

### **Products**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/products` | Create product | Yes |
| GET | `/api/products` | Get all products | Yes |
| PUT | `/api/products/:id` | Update product | Yes |
| DELETE | `/api/products/:id` | Delete product | Yes |

### **Dashboard & Analytics**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard` | Dashboard summary | Yes |
| GET | `/api/summary` | Cost summary | Yes |

---

## 🎨 UI/UX Features

### **Design Elements**
- Clean, professional interface
- Blue gradient background
- White card-based layout
- Smooth hover effects on buttons
- Responsive sidebar navigation
- Color-coded risk indicators
- Loading states for all operations
- Toast notifications for feedback

### **User Experience**
- Intuitive navigation
- Form validation
- Confirmation dialogs for destructive actions
- Real-time data updates
- Responsive design (mobile-friendly)
- Fast page transitions
- Error handling with user-friendly messages

### **Accessibility**
- Semantic HTML
- ARIA labels
- Keyboard navigation support
- High contrast colors
- Readable font sizes

---

## 🔒 Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Tokens**: Secure, stateless authentication
- **Rate Limiting**: 
  - 100 requests per 15 minutes (general)
  - 5 login attempts per 15 minutes
- **Input Validation**: Server-side validation for all inputs
- **User Isolation**: Users can only access their own data
- **CORS Protection**: Configured for secure cross-origin requests
- **MongoDB Injection Prevention**: Mongoose schema validation

---

## 📊 Data Models

### **User Model**
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date
}
```

### **Product Model**
```javascript
{
  userId: ObjectId (required),
  itemName: String (required),
  plannedQty: Number,
  plannedRate: Number,
  actualQty: Number,
  actualRate: Number,
  currentStock: Number,
  dailyConsumption: Number,
  leadTime: Number,
  safetyStock: Number,
  plannedAmount: Number (calculated),
  actualAmount: Number (calculated),
  variance: Number (calculated),
  reorderLevel: Number (calculated),
  reorderQty: Number (calculated),
  riskScore: Number (calculated),
  riskCategory: String (calculated),
  createdAt: Date
}
```

---

## 🚦 Getting Started

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### **Installation**

1. Clone the repository:
```bash
git clone <repository-url>
cd Webify
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. Start the server:
```bash
npm start
```

5. Open browser:
```
http://localhost:5000
```

---

## 📱 Pages Overview

### **1. Login/Signup**
- User authentication
- Form validation
- Secure password handling

### **2. Dashboard**
- Summary cards with key metrics
- Recent products table
- Quick navigation

### **3. Add Product**
- Comprehensive product form
- Organized sections
- Real-time validation

### **4. Update Products**
- Product list with actions
- Edit modal for updates
- Delete with confirmation

### **5. Analytics**
- Visual data representation
- Bar chart for cost comparison
- Pie chart for risk distribution

### **6. Reorder Alerts**
- Risk-based alerts
- Suggested reorder quantities
- Detailed summary table

---

## 🎯 Key Functionalities

### **Automated Risk Assessment**
- Calculates risk score based on inventory levels
- Categorizes products (Safe, Warning, Critical)
- Provides reorder recommendations
- Prevents production stoppages

### **Cost Variance Analysis**
- Tracks planned vs actual costs
- Identifies cost overruns
- Helps in budget management
- Provides financial insights

### **Real-time Updates**
- Instant data refresh
- Live calculations
- Dynamic chart updates
- Responsive UI changes

### **Data Caching**
- Frontend product caching
- Reduced API calls
- Faster page loads
- Better performance

---

## 🔧 Configuration

### **Rate Limiting**
- General API: 100 requests / 15 minutes
- Auth endpoints: 5 attempts / 15 minutes

### **JWT Token**
- Expiry: 7 days
- Algorithm: HS256
- Stored in localStorage

### **Pagination**
- Default limit: 50 products
- Configurable via query params

---

## 🐛 Error Handling

- Comprehensive try-catch blocks
- User-friendly error messages
- Toast notifications for errors
- Console logging for debugging
- Graceful fallbacks

---

## 📈 Performance Optimizations

- Product caching on frontend
- Efficient database queries
- Minimal API calls
- Lazy loading of charts
- Optimized CSS animations

---

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

---

## 📝 Future Enhancements

- [ ] Export data to CSV/Excel
- [ ] Email notifications for critical alerts
- [ ] Multi-user roles (Admin, Manager, Viewer)
- [ ] Advanced filtering and search
- [ ] Historical data tracking
- [ ] Predictive analytics
- [ ] Mobile app version
- [ ] Dark mode theme

---

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Support

For issues or questions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

## 🙏 Acknowledgments

- Bootstrap for UI framework
- Chart.js for visualizations
- MongoDB for database
- Express.js for backend framework
- All contributors and testers

---

**Built with ❤️ for efficient inventory management**
