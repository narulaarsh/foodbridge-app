# FoodBridge 🍎🤝🚛

FoodBridge is a role-based food rescue platform designed to combat food waste and hunger. It connects food **Donors** (restaurants, grocery stores, individuals) who have surplus edible food with **Volunteers** who can claim and physically transport that food to those in need. The platform is overseen by an **Admin** dashboard for tracking system-wide metrics and user management.

**🌍 Try it live right now (No downloads required):**  
🚀 **[Access the Live FoodBridge Website](https://foodbridge-app-theta.vercel.app)** 

## Features
* **Donors** can easily pinpoint their exact location and post details about the surplus food they have available (quantity, expiry time, instructions).
* **Volunteers** get a real-time interactive Map displaying all active donations nearby. They can claim a pickup, receive a secure verified OTP code, and navigate directly to the donor using Google Maps.
* **Admins** have a high-level overview of global platform metrics, including total users, active donations, and total kilos of food successfully rescued.
* **Automated Testing:** The platform includes a rigorous 15-case Selenium automation suite covering all core UI/UX interaction paths.

## Built With
* [Next.js](https://nextjs.org/) (App Router & React)
* Tailwind CSS for styling
* [Neon PostgreSQL](https://neon.tech/) for Serverless Database Storage
* [Prisma ORM](https://www.prisma.io/)
* Selenium & Pytest for extensive automated testing
* Leaflet for interactive Map implementations
* Deployed seamlessly on [Vercel](https://vercel.com/)

---

## Running Locally

If you'd like to run the code on your own machine, follow these steps:

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed. You will also need a `.env` file configured with a `DATABASE_URL` pointing to your PostgreSQL instance.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Database Migration
Sync the Prisma schema with your database to structure all tables:
```bash
npx prisma db push
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 5. Running Automated Tests
The Selenium UI tests are entirely contained in the `/tests` folder. 
```bash
pip install -r tests/requirements.txt  # (assuming selenium and pytest are defined)
python3 -m pytest tests/test_foodbridge.py --html=tests/selenium_report.html
```
