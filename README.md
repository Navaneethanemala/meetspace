# 🏢 MeetSpace

> Meeting & Conference Room Management System — Built for construction company internal use.

---

## ✨ Features

- 📅 **Dashboard** — Today's meetings, pending RSVPs, quick stats
- 🗓️ **My Meetings** — View all meetings with filters (Today / Upcoming / Past)
- 🏠 **Book a Room** — Visual time-slot grid with conflict detection
- ➕ **Schedule Meeting** — Full form with attendee picker & NexMeet video code
- 👤 **My Profile** — Activity stats, action items, team directory
- 🎥 **NexMeet** — Built-in P2P video calling (WebRTC, no servers)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/meetspace.git

# 2. Go into the folder
cd meetspace

# 3. Install dependencies
npm install

# 4. Start the app
npm start
```

Opens at **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Name | Email | Password | Role |
|---|---|---|---|
| Rajesh Verma | rajesh@company.com | admin123 | Admin |
| Arjun Sharma | arjun@company.com | arjun123 | Employee |
| Priya Nair | priya@company.com | priya123 | Employee |
| Vikram Rao | vikram@company.com | vikram123 | Employee |
| Sneha Reddy | sneha@company.com | sneha123 | Employee |

---

## 🎥 Using NexMeet (Built-in Video Call)

1. Open any meeting → click **🎥 Join Call**
2. **Host**: Go to "New Meeting" tab → Start Meeting → share the 6-letter code
3. **Guest**: Paste the code in "Join Meeting" tab → Join
4. P2P video connects automatically

---

## 🗂️ Project Structure

```
meetspace/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← entire app (single file)
│   └── index.js        ← React entry point
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Built With

- **React 18** — UI framework
- **PeerJS + WebRTC** — P2P video calling (NexMeet)
- **CSS-in-JS** — All styles inline, zero external CSS files
- **Google Fonts** — Plus Jakarta Sans, Lora, Syne, DM Sans

---

## 📌 Note

This is a **frontend-only** demo app — all data lives in React state (resets on refresh).  
For production/MNC deployment, connect to a **PostgreSQL** database with a **Node.js + Express** backend.

---

*Built as an internship project.*
