## What I Built

Textor-AI is a modern web application that converts audio recordings into accurate text transcriptions using advanced speech recognition technology. Built with Next.js 14, TypeScript, and Tailwind CSS, it offers a seamless and intuitive user experience for audio transcription needs.

A powerful Speech-to-Text API built with Django REST Framework and AssemblyAI. Textor-AI provides enterprise-grade transcription capabilities with advanced features like multi-language support, real-time status tracking, and comprehensive transcription management.

Transform your voice and audio into text effortlessly using AssemblyAI's powerful speech recognition. Record directly or upload audio files, and let our AI handle the rest. Supports multiple formats and provides instant transcriptions.

## Demo Links
- **Live Demo**: [https://textor-ai-dehyabi.vercel.app/](https://textor-ai-dehyabi.vercel.app/)
- **Frontend Repository**: [https://github.com/dehyabi/fe-textor-ai](https://github.com/dehyabi/fe-textor-ai)
- **Backend Repository**: [https://github.com/dehyabi/textor-ai](https://github.com/dehyabi/textor-ai)

## Screenshots
![Modern Interface](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qh5nat7zn1c1huzfxkt2.png)
![Transcription Process](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nmrmosxphhro57t9idk4.png)
![Results View](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mq0361vtjtdekv0rqrog.png)
![History Modal](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/meso773iq2w5g55z3hbj.png)

## The Journey

In the ever-evolving landscape of web development, I recently embarked on an exciting project to build Textor-AI, a modern audio transcription application powered by AssemblyAI. This journey not only enhanced my technical skills but also provided valuable insights into the intersection of AI technology and user experience design.

## Project Overview

Textor-AI was born from the desire to create a seamless, user-friendly solution for converting speech to text. The application features a modern Next.js frontend and a robust Django backend, allowing users to upload audio files and receive accurate transcriptions. The tech stack was carefully chosen to ensure scalability, performance, and production readiness.

## Technical Stack

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

## Implementation Details

### Audio Processing and Recording
- Implemented browser's native MediaRecorder API
- Built custom audio visualization system
- Handled cross-browser compatibility
- Managed microphone permissions effectively
- Created format conversion system using Web Audio API

### API Integration
1. **AssemblyAI Integration**
   - Implemented AssemblyAI API calls in Django views
   - Handled file uploads and transcription requests
   - Managed API responses and error handling
   - Stored transcription results in MySQL database

2. **API Endpoints**
   - `/api/transcribe/upload/`: Handles audio file uploads
   - `/api/transcribe/{transcript_id}/`: Checks transcription status for specific ID
   - `/api/transcribe/`: Retrieves transcription history

### User Interface
- Minimalist, futuristic interface design
- Dark mode implementation
- Smooth animations with Framer Motion
- Real-time transcription progress tracking
- Responsive design for all devices

### Deployment Architecture
- Frontend deployed on Vercel
- Backend hosted on PythonAnywhere cloud platform
- SSL/HTTPS enabled for secure communication
- Automated backup and monitoring
- Load balancing configuration

## Technical Challenges and Solutions

1. **Audio Processing**
   - Challenge: Browser compatibility with different formats
   - Solution: Sophisticated format conversion system using Web Audio API
   - Implemented efficient error management
   - Optimized audio quality maintenance

2. **File Management**
   - Challenge: Large audio files affecting performance
   - Solution: Client-side file size validation (max 5MB)
   - Implemented compression using Next.js API routes
   - Added proper error handling and retry mechanisms

3. **Real-time Updates**
   - Challenge: Managing async transcription processes
   - Solution: Custom progress tracking system
   - Implemented proper status tracking
   - Created engaging user feedback system

## Performance Optimization
- Implemented lazy loading for components
- Utilized Next.js server-side rendering
- Optimized image and audio processing
- Implemented code splitting
- Designed efficient state management
- Optimized API calls with caching
- Added retry logic for failed requests

## Learning Outcomes
- Deep understanding of audio processing in web browsers
- Expertise in Next.js 14 and TypeScript
- Experience with Django backend development
- Knowledge of AssemblyAI API integration
- Skills in modern UI/UX design
- Proficiency in performance optimization

## Future Improvements
1. **Features**
   - Speaker diarization
   - Real-time transcription
   - Multiple language support
   - Progressive Web App capabilities
   - Batch processing
   - Export functionality

2. **Technical**
   - WebSocket implementation
   - Enhanced caching system
   - Further performance optimization
   - Advanced security features
   - Load balancing improvements

## Conclusion
Building Textor-AI with Next.js 14, Django, and AssemblyAI has been a valuable learning experience. The combination of these technologies provides a robust foundation for building scalable speech-to-text applications. The Django backend, deployed on PythonAnywhere, proved particularly effective for handling the AssemblyAI integration, while Next.js delivered a smooth and responsive frontend experience with improved performance through server-side rendering.

## Resources
- [AssemblyAI Documentation](https://www.assemblyai.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Django Documentation](https://docs.djangoproject.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
