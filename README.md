# Study AI App

## Developed a Study AI application for students to manage all the resources at one place and guide them with the help of AI.

Study AI is an AI-powered learning platform designed to help students organize study materials, manage academic resources, and receive intelligent guidance through Artificial Intelligence. The application provides a centralized system where students can upload notes, access resources, manage study tasks, and interact with an AI assistant for doubt solving and learning support.

The main objective of this project is to simplify the learning process and improve student productivity by combining resource management and AI-based assistance into a single platform.

---

# Features

- AI-powered study assistant
- Upload and manage study materials
- Notes and resource organization
- Smart doubt solving and guidance
- User authentication and security
- Task and study management
- Clean and user-friendly interface
- Backend API integration
- Secure data handling

---

# Technologies Used

## Frontend
- React Native CLI
- JavaScript
- React Navigation
- Axios

## Backend
- Python
- FastAPI / Flask
- SQLAlchemy
- Alembic
- JWT Authentication

## Database
- SQLite / PostgreSQL

## AI Integration
- OpenAI API

---

# Project Structure

```bash
Study-AI-App/
│
├── frontend/              # React Native frontend
├── backend/               # Python backend
├── app/                   # Backend application files
├── routes/                # API routes
├── models/                # Database models
├── services/              # AI services
├── requirements.txt       # Python dependencies
├── package.json           # Node dependencies
└── README.md
```

---

# Installation and Setup

## Clone the Repository

```bash
git clone https://github.com/your-username/study-ai-app.git
cd study-ai-app
```

---

# Frontend Setup

```bash
cd frontend
npm install
npx react-native run-android
```

---

# Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
```

## Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Backend Server

```bash
python main.py
```

---

# Environment Variables

Create a `.env` file inside the backend folder and add the following:

```env
OPENAI_API_KEY=your_api_key
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
```

---

# Future Improvements

- Voice-based AI assistant
- AI-generated quizzes and tests
- Cloud storage integration
- Real-time collaboration
- Performance analytics dashboard
- Multi-language support

---

# Learning Outcomes

This project helped in learning and improving the following skills:

- Full Stack Development
- Mobile App Development
- API Integration
- AI Integration
- Database Management
- Authentication and Security
- Backend Development using Python
- React Native Application Development

---

# Author

## Garv Kharb
B.Tech CSE Student  
SGT University

---

# License

This project is created for educational and learning purposes.
