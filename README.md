# Textor-AI: Modern Speech-to-Text Transcription

Textor-AI is a modern web application that converts audio recordings into accurate text transcriptions using advanced speech recognition technology. Built with Next.js 14, TypeScript, and Tailwind CSS, it offers a seamless and intuitive user experience for audio transcription needs.

A powerful Speech-to-Text API built with Django REST Framework and AssemblyAI. Textor-AI provides enterprise-grade transcription capabilities with advanced features like multi-language support, real-time status tracking, and comprehensive transcription management.

Transform your voice and audio into text effortlessly using AssemblyAI's powerful speech recognition. Record directly or upload audio files, and let our AI handle the rest. Supports multiple formats and provides instant transcriptions.

## 🚀 Demo Links
- **Live Demo**: [https://textor-ai-dehyabi.vercel.app/](https://textor-ai-dehyabi.vercel.app/)
- **Frontend Repository**: [https://github.com/dehyabi/fe-textor-ai](https://github.com/dehyabi/fe-textor-ai)
- **Backend Repository**: [https://github.com/dehyabi/textor-ai](https://github.com/dehyabi/textor-ai)

## 📸 Screenshots
![Modern Interface](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qh5nat7zn1c1huzfxkt2.png)
![Transcription Process](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nmrmosxphhro57t9idk4.png)
![Results View](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mq0361vtjtdekv0rqrog.png)
![History Modal](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/meso773iq2w5g55z3hbj.png)

## 🛠️ Technical Stack

### Frontend
- **Next.js 14**: Latest React framework for production-grade applications
- **TypeScript**: For type-safe code and better development experience
- **TailwindCSS**: For responsive and beautiful styling
- **Framer Motion**: For fluid animations and transitions
- **Web Audio API**: For robust audio processing
- **Axios**: For handling HTTP requests
- **Vercel**: Cloud hosting platform for frontend deployment

### Backend
- **Django**: Python web framework for building robust backend services
- **Django REST Framework**: For creating RESTful APIs
- **AssemblyAI Integration**: Implemented in Django views for audio processing
- **MySQL**: Database for storing transcription data
- **PythonAnywhere**: Cloud hosting platform for Django backend deployment

## ✨ Features

- 🎙️ In-browser audio recording
- 📁 Drag-and-drop file upload
- 🔄 Multiple audio format support
- 🌙 Dark mode design
- 📊 Real-time transcription progress
- 📱 Responsive design
- 📜 Transcription history
- 🔒 Secure file handling

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- MySQL
- AssemblyAI API Key

### Frontend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/dehyabi/fe-textor-ai.git
   cd fe-textor-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=your_backend_url
   NEXT_PUBLIC_AUTH_TOKEN=your_auth_token
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/dehyabi/textor-ai.git
   cd textor-ai
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   .\venv\Scripts\activate  # Windows
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```env
   ASSEMBLYAI_API_KEY=your_api_key
   DATABASE_URL=your_mysql_url
   ```

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Start the server:
   ```bash
   python manage.py runserver
   ```

## 📝 API Endpoints

- `POST /api/transcribe/upload/`: Upload audio file for transcription
- `GET /api/transcribe/{transcript_id}/`: Check transcription status
- `GET /api/transcribe/`: Get transcription history

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [AssemblyAI](https://www.assemblyai.com/) for their excellent speech-to-text API
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Django](https://www.djangoproject.com/) community for the robust backend framework
