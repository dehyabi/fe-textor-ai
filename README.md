# Textor-AI

Textor-AI is a modern web application that converts audio recordings into accurate text transcriptions using advanced speech recognition technology. Built with Next.js, TypeScript, and Tailwind CSS, it offers a seamless and intuitive user experience for audio transcription needs.

Powered by [AssemblyAI](https://www.assemblyai.com/), a state-of-the-art AI speech recognition platform, Textor-AI delivers highly accurate transcriptions with support for multiple languages and audio formats.

## Features

- 🎙️ Real-time audio recording
- 🔄 Automatic audio format conversion (WebM to WAV)
- 📝 High-accuracy speech-to-text transcription using AssemblyAI
- 📱 Responsive and modern UI design
- ⚡ Fast and efficient processing
- 📊 Transcription history tracking
- 🔍 Status monitoring for transcription jobs
- 🌍 Multi-language support (powered by AssemblyAI)

## Tech Stack

### Frontend
- Next.js with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Heroicons for UI elements

### Backend
- Django (hosted on PythonAnywhere)
- RESTful API architecture
- AssemblyAI API integration

## Environment Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_AUTH_TOKEN=your_auth_token
ASSEMBLYAI_API_KEY=your_assemblyai_api_key  # Get your API key from assemblyai.com
```

4. Run the development server:
```bash
npm run dev
```

## API Endpoints

- `/api/transcribe/upload/` - Upload audio for transcription
- `/api/transcribe/` - Get transcription history
- `/api/transcribe/{id}/` - Check transcription status

## File Format Support

Supported through AssemblyAI's API:
- Audio formats: MP3, WAV, AAC, OGG, FLAC, M4A
- Maximum file size: 5MB
- Sample rates: 8kHz - 48kHz
- Channels: Mono/Stereo

## Usage

1. Click the record button to start recording audio
2. Stop recording when finished
3. Click transcribe to process the audio
4. View transcription results in the history modal

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [AssemblyAI](https://www.assemblyai.com/) - For providing the powerful speech-to-text API
- [Next.js](https://nextjs.org/) - For the React framework
- [Tailwind CSS](https://tailwindcss.com/) - For the utility-first CSS framework

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
