# Parking Spot Finder

Parking Spot Finder is a full-stack web application developed to help users locate nearby parking spaces, view route guidance, and reserve a parking slot in advance. The project is designed as a minor project/thesis-friendly system that demonstrates how location-aware web applications can reduce parking search time, traffic congestion, and user inconvenience in urban areas.

## Thesis-Ready Project Summary

### Project Title
Smart Parking Spot Finder and Booking System Using React, Node.js, Express, and MongoDB

### Abstract
Urban areas face serious parking problems due to the growing number of vehicles and the inefficient use of available parking spaces. Drivers often spend a significant amount of time searching for a suitable parking location, which increases fuel consumption, traffic congestion, and frustration. This project presents a Smart Parking Spot Finder and Booking System that helps users identify available nearby parking spots based on their current location and allows them to reserve a slot for a selected time period.

The system is implemented as a full-stack web application using React for the frontend, Express and Node.js for the backend, and MongoDB for persistent data storage. For local development and demonstration, the application also supports a mock-data mode when the database is unavailable. The system integrates geolocation and Google Maps services to display nearby parking spots, route information, estimated travel time, and turn-by-turn directions. Users can search for parking, book a slot, view their bookings, and cancel active reservations.

This project demonstrates the practical use of modern web technologies for solving a real-world urban mobility problem. It can serve as a foundation for future enhancements such as live sensor integration, payment gateway support, admin dashboards, and predictive parking analytics.

### Problem Statement
In crowded cities, finding an available parking space is a time-consuming and inefficient process. Drivers often circle around parking areas without knowing which slots are free, leading to wasted time, traffic congestion, fuel loss, and environmental pollution. A digital parking finder and reservation platform can improve parking management by guiding users to suitable parking spaces and allowing advance booking.

### Objectives
- To develop a web-based parking spot finder system for urban users.
- To detect or use the user's current location and fetch nearby parking spots.
- To provide route guidance and estimated travel details using Google Maps.
- To enable users to book parking slots for a selected time range.
- To allow users to view and cancel their bookings.
- To support both database mode and mock-data mode for easy demonstration.

### Scope of the Project
- User-side parking search interface
- Nearby parking spot discovery based on coordinates
- Parking slot booking and cancellation
- Booking history retrieval by phone number
- Google Maps based route preview and directions
- MongoDB-based persistence with fallback mock data

## Key Features

- Search nearby parking spaces using browser geolocation
- Display parking spot details such as description, price, and time limit
- Select a parking location from cards or directly from the map
- Book a parking slot using user name, phone number, start time, and end time
- Prevent overlapping bookings for the same parking spot
- View booking history using phone number
- Cancel an active booking
- Show route distance, duration, and turn-by-turn directions
- Continue working even when MongoDB is unavailable by using mock parking data

## Technology Stack

### Frontend
- React
- Vite
- React Router DOM
- Bootstrap
- Google Maps JavaScript API

### Backend
- Node.js
- Express.js
- Mongoose
- MongoDB
- CORS
- dotenv

## System Architecture

The application follows a client-server architecture:

1. The frontend collects user input such as name, phone number, location, and booking time.
2. The frontend calls backend REST APIs to fetch nearby parking spots and manage bookings.
3. The backend checks whether MongoDB is connected.
4. If MongoDB is available, booking and parking data can be processed using database models.
5. If MongoDB is not available, the backend falls back to predefined mock parking spots and in-memory booking storage.
6. The frontend renders route guidance and map visualization through Google Maps.

## Modules

### 1. User Interface Module
Provides pages for home, about, contact, and booking confirmation. Users can enter personal details, search for spots, and manage bookings.

### 2. Location and Search Module
Uses browser geolocation to obtain latitude and longitude, then requests nearby parking spots from the backend.

### 3. Parking Spot Management Module
Handles parking spot data including description, availability, location, price, and time limits.

### 4. Booking Management Module
Creates, lists, and cancels bookings. It validates input, checks time conflicts, and calculates total booking price.

### 5. Map and Navigation Module
Displays parking spots on Google Maps, supports travel mode selection, and shows route details such as duration and distance.

### 6. Data Persistence Module
Uses MongoDB via Mongoose models for persistent storage and a mock store for demo mode.

## Project Structure

```text
minor project_copy/
├── backend/
│   ├── data/
│   │   ├── mockBookingsStore.js
│   │   └── mockSpots.js
│   ├── models/
│   │   ├── Booking.js
│   │   └── ParkingSpot.js
│   ├── routes/
│   │   ├── bookingRoutes.js
│   │   ├── index.js
│   │   └── spotRoutes.js
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── AboutPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── MapPreview.jsx
│   │   ├── SlotPage.jsx
│   │   └── ...
│   └── package.json
├── .env
└── README.md
```

## Database Design

### ParkingSpot Collection
- `location.lat`: latitude of parking spot
- `location.lng`: longitude of parking spot
- `description`: parking spot name/description
- `isAvailable`: availability status
- `price`: hourly price
- `timeLimit`: allowed parking duration
- `createdAt`: creation timestamp

### Booking Collection
- `parkingSpotId`: unique identifier of selected parking spot
- `parkingSpotDescription`: display name of parking spot
- `customerName`: user name
- `customerPhone`: user phone number
- `startTime`: booking start time
- `endTime`: booking end time
- `totalPrice`: calculated booking amount
- `status`: booked, cancelled, or completed
- `source`: mock or database
- `createdAt`: booking creation timestamp
- `updatedAt`: booking update timestamp

## API Endpoints

### Health Check
- `GET /api/health`

### Parking Spot APIs
- `GET /api/spots?lat=<latitude>&lng=<longitude>&radius=<value>`
- `POST /api/spots`

### Booking APIs
- `GET /api/bookings?phone=<phoneNumber>`
- `POST /api/bookings`
- `POST /api/bookings/book`
- `PATCH /api/bookings/:id/cancel`

## Setup and Installation

### Prerequisites
- Node.js installed
- MongoDB installed locally or a MongoDB connection string
- Google Maps API key for live map functionality

### Backend Setup
```bash
cd backend
npm install
npm start
```

The backend runs by default on port `5000`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend runs through Vite, typically on port `5173`.

## Environment Variables

### Root `.env`
```env
MONGO_URI=mongodb://127.0.0.1:27017/parkingfinder
PORT=5000
```

### Frontend `.env` example
Create `frontend/.env` and add:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## How the System Works

1. The user opens the web application.
2. The user enters name and phone number.
3. The user clicks `Find Free Parking`.
4. The browser requests the current location.
5. The frontend sends coordinates to the backend.
6. The backend returns nearby available parking spots.
7. The user selects a spot and chooses start and end time.
8. The system validates booking data and checks for overlapping reservations.
9. The booking is created and displayed on the confirmation page.
10. The user can later view or cancel bookings using the phone number.

## Current Implementation Notes

- Nearby parking uses coordinate-based filtering with a configurable radius.
- The frontend currently requests spot data in mock mode for easy local demonstration.
- If MongoDB is disconnected, the system still works using mock spot data and in-memory booking storage.
- Route guidance requires a valid Google Maps API key in `frontend/.env`.
- Contact page currently demonstrates a local form submission flow only.

## Advantages of the Project

- Reduces parking search time
- Improves user convenience
- Demonstrates practical full-stack development
- Supports real-world location-based services
- Can be extended into a smart city solution

## Limitations

- Real-time sensor-based parking updates are not integrated yet
- Payments and authentication are not implemented
- Admin dashboard is not available yet
- Mock booking storage is in-memory and resets when the backend restarts
- Distance filtering currently uses a simple coordinate comparison approach

## Future Enhancements

- Integrate IoT sensors for real-time parking availability
- Add user authentication and role management
- Add online payment gateway support
- Create admin dashboard for parking management
- Add booking notifications through SMS or email
- Improve distance calculations using map/geospatial libraries
- Add analytics and parking demand prediction
- Deploy the application on cloud infrastructure

## Suggested Thesis Chapters

You can use this project to write a thesis/report with the following structure:

### Chapter 1: Introduction
- Background of urban parking problems
- Need for a smart parking system
- Aim and objectives of the project

### Chapter 2: Literature Review
- Existing parking management systems
- Smart city and IoT-based parking solutions
- Web-based booking systems

### Chapter 3: System Analysis and Design
- Functional requirements
- Non-functional requirements
- Architecture diagram
- Database design
- Module design

### Chapter 4: Implementation
- Frontend development
- Backend development
- API development
- MongoDB integration
- Google Maps integration

### Chapter 5: Testing and Results
- Functional testing
- API testing
- Booking validation testing
- Output screenshots and observations

### Chapter 6: Conclusion and Future Scope
- Summary of achievements
- Benefits of the proposed system
- Future improvements

## Sample Conclusion for Thesis

The Smart Parking Spot Finder and Booking System successfully demonstrates how modern web technologies can be used to solve the common urban problem of parking management. The system provides a user-friendly interface for discovering nearby parking spaces, obtaining route assistance, and reserving parking slots. The integration of React, Express, MongoDB, and Google Maps makes the application practical, scalable, and easy to extend. Although the current implementation is a prototype with some limitations, it provides a strong foundation for future research and development in smart parking and intelligent transportation systems.

## Author Notes

This project is suitable for:
- Minor project report
- Final year project synopsis
- Thesis documentation
- Practical demonstration and viva presentation

If you want, this README can also be expanded into:
- a full thesis report
- synopsis content
- viva questions and answers
- PPT presentation points
