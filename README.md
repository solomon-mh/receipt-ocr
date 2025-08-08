# Receipt OCR App

A full-stack application for extracting and managing data from receipts using Optical Character Recognition (OCR).

---

## 📦 Folder Structure

```
receipt-ocr-app/
│
├── backend/ # Backend server (Node.js + Express)
│ ├── src/
│ │ ├── index.ts
│ ├── .env
│ ├── Dockerfile
│ ├── prisma/
│ ├── public/
│ ├── package.json
│ └── tsconfig.json
│
├── frontend/ # Frontend client (Next.js + Tailwind CSS)
│ ├── public/ # Static assets
│ ├── src/
│ │ ├── app/
│ │ ├── utils/ # Helpers
│ ├── .env
│ ├── Dockerfile
│ ├── package.json
│ └── tailwind.config.js
│
├── docker-compose.yml
├── sample-recipts/  # Samepl Receipt files i used
├── README.md # This file
└── .gitignore
```

---

## 🚀 Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL
- **OCR:** Tesseract.js for Optical Character Recognition
- **Authentication:** JWT (optional, for user accounts and sessions)
- **Containerization:** Docker & Docker Compose

---

## ⚙️ Setup & Run Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/receipt-ocr-app.git
   cd receipt-ocr-app
   ```

2. **Install dependencies:**

   root:

   ```bash
   npm install
   ```

   Backend:

   ```bash
   cd backend
   npm install
   ```

   Frontend:

   ```bash
   cd ../frontend
   npm install
   ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` in both backend and frontend folders
   - Update the variables accordingly

4. **Start from root (in a new terminal):**

   ```bash
   npm run dev
   ```

   ### **Optional if you want to run in separetely**

5. **Start the backend server:**

   ```bash
   cd backend
   npm run dev
   ```

6. **Start the frontend client (in a new terminal):**

   ```bash
   cd frontend
   npm run dev
   ```

## 🐳 Docker Setup

### Prerequisites

- Docker installed
- Docker Compose installed

### 1. Build and run with Docker Compose

```bash
docker-compose up --build

6. **Access the application:**
   - Open your browser and go to `http://localhost:3000`
```

## 🛠 SAMPLE RECEIPT FILES

**I have included two sample receipts files in the sample-receipts folder**

## 🛠 How to Extend the App

### 1. Add User Authentication and Receipt Ownership

- Implement user registration and login using JWT or OAuth
- Add a User model in the backend to represent users
- Modify receipts schema to associate receipts with user IDs
- Protect API routes to ensure users only access their own receipts
- Add login and registration forms to the frontend and manage authentication state

### 2. Add Receipt Categorization and Tagging

- Add a category field (e.g., groceries, dining, electronics) to the Receipt model
- Create a category management UI (dropdown, tags) on the frontend
- Update backend endpoints to handle categories during receipt creation and retrieval
- Enable filtering receipts by category in the UI

### 3. Export Data (CSV, PDF)

- Create backend endpoints to export receipts data in CSV or PDF format
- Add export buttons on the frontend to trigger downloads
- Use libraries like json2csv for CSV and pdfkit or similar for PDFs

### 4. Background OCR Processing (Advanced)

- Use job queues (e.g., Bull or RabbitMQ) to process OCR asynchronously
- Return immediate responses upon upload, with a status field indicating processing progress
- Notify frontend with updates (e.g., via WebSockets or polling)

### 5. Dockerize the App for Easy Deployment

- Create Dockerfiles for frontend and backend
- Use docker-compose.yml to orchestrate frontend, backend, and PostgreSQL containers
- Configure environment variables securely for production

---

## 🤝 Contributing

Feel free to open issues or submit pull requests with new features or bug fixes.t
