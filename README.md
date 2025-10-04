# SunoBot: Your Bilingual AI Health & Life Assistant

SunoBot is a powerful and intuitive Next.js application designed to be a personal assistant for daily life, with a special focus on health management. It features a bilingual (English/Urdu) voice-first interface, making it accessible and easy to use for a wide range of users. The app is powered by Google's latest AI models through Genkit and leverages Firebase for backend services.

## Core Features

### 1. Conversational AI Chat

The central feature of SunoBot is a sophisticated conversational AI assistant.

- **Bilingual Voice Interface**: Users can interact with the AI by tapping and holding a microphone button. It can understand and respond in both **English** and **Urdu**.
- **Text & Speech Output**: Every AI response is provided as both text and a spoken voice, ensuring information is delivered clearly.
- **Context-Aware Conversations**: The AI remembers the last few messages, allowing for natural, follow-up questions.
- **Helper Packs**: For new conversations, users are presented with "Helper Packs" (Recipes, Health Tips, Kids Stories, etc.) which act as quick-start prompts to engage with the AI.
- **Persistent Bookmarking**: Users can bookmark any AI response. These favorites are saved to their profile and can be viewed anytime, even after refreshing the app.
- **Share Functionality**: Easily share any AI-generated answer through native device sharing or by copying it to the clipboard.

### 2. Live Vision: Real-Time Visual Analysis

This feature transforms the app into a visual assistant, similar to Gemini Vision.

- **Real-Time Object & Scene Recognition**: Users can point their camera at anything, and the AI will continuously analyze the live video feed.
- **Spoken Urdu Descriptions**: The AI describes what it sees out loud in natural-sounding Urdu, providing a hands-free, audio-first experience.
- **Interactive Visual Q&A**: Users can ask questions about what the camera is seeing (e.g., "What is this object?" or "Can you read the sign?"). The AI will understand the question in the context of the image and provide a spoken answer.

### 3. Prescription & Lab Report Analysis

SunoBot simplifies health management by understanding medical documents.

- **Image Upload**: Users can upload a photo of a doctor's prescription or a lab test report.
- **AI-Powered OCR & Parsing**: The app uses advanced AI to perform Optical Character Recognition (OCR) and intelligently parse the contents.
- **Automated Reminders from Prescriptions**: If a prescription is detected, the AI extracts medicine names, dosages, and timings. It then presents these as structured reminders and allows the user to save them to the "Reminders" section with a single tap. It intelligently handles timings (e.g., "3 times a day" becomes 8am, 2pm, 8pm).
- **Simple Summaries for Lab Reports**: For lab reports, the AI provides a simple, easy-to-understand summary in Urdu or English (e.g., "Your blood sugar is higher than normal").
-**Spoken Summaries**: The analysis result is also read aloud for accessibility.
- **Safety Disclaimer**: Every medical analysis is accompanied by a mandatory disclaimer advising users to consult a real doctor.

### 4. Medicine Reminders

A robust feature to help users manage their medication schedule.

- **Manual & Voice-Powered Entry**: Users can either type in reminder details or use their voice to set a reminder (e.g., "Remind me to take Panadol at 8pm daily"). The AI parses the voice command and fills out the form.
- **Flexible Scheduling**: Set reminders for a specific time, with options for a specific date or to repeat daily.
- **Browser Notifications**: If permission is granted, the app schedules and sends browser notifications when it's time to take a medicine.
- **Active Reminders List**: A clean list displays all currently active reminders, which can be easily deleted.

### 5. User & Profile Management

The app is built on Firebase, providing secure and persistent user data.

- **Authentication**: Supports both email/password registration and anonymous guest access.
- **Persistent User Data**: User profiles, settings, chat history, and bookmarks are all securely stored in Firestore and linked to the user's account.
- **Guest Experience**: Anonymous users can try the app's features and are given an easy option to log out and sign up to save their data.
- **Settings Page**:
    - **Appearance**: Choose between light, dark, or system theme.
    - **Language & Voice**: Set the preferred app language (English/Urdu) and voice gender.
    - **Data Management**: A "Clear Chat History" option allows users to permanently delete their entire conversation history.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: React, TypeScript, ShadCN UI, Tailwind CSS
- **Generative AI**: Google AI (via Genkit)
- **Backend & Database**: Firebase (Authentication, Firestore)
